//! Wrapper de `adb` (Android Debug Bridge).
//!
//! Toda la comunicación con el dispositivo pasa por aquí. El frontend nunca
//! ejecuta procesos: invoca estos comandos Tauri, que envuelven el binario
//! `adb` detectado en el sistema. Mantener este módulo como única superficie
//! de ejecución hace la herramienta auditable (es open source) y portable.

use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

/// Oculta la ventana de consola que Windows abriría por cada invocación de adb.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Estado global del backend: ruta a `adb` y procesos de streaming vivos.
pub struct AdbState {
    /// Ruta (o nombre en PATH) del binario adb en uso.
    path: Mutex<String>,
    /// Procesos de larga duración (logcat, etc.) indexados por id de stream.
    streams: Mutex<HashMap<u32, Child>>,
    next_id: AtomicU32,
}

impl AdbState {
    pub fn new() -> Self {
        Self {
            path: Mutex::new(detect_adb()),
            streams: Mutex::new(HashMap::new()),
            next_id: AtomicU32::new(1),
        }
    }

    fn bin(&self) -> String {
        self.path.lock().unwrap().clone()
    }
}

impl Default for AdbState {
    fn default() -> Self {
        Self::new()
    }
}

/// Un dispositivo tal como lo reporta `adb devices -l`.
#[derive(Serialize, Clone)]
pub struct Device {
    pub serial: String,
    /// device | unauthorized | offline | recovery | sideload | bootloader …
    pub state: String,
    pub model: Option<String>,
    pub product: Option<String>,
    pub transport_id: Option<String>,
    /// "tcp" si el serial parece host:puerto (ADB por Wi-Fi), "usb" si no.
    pub connection: String,
}

/// Resultado de ejecutar un comando adb. Es lo que la UI muestra en la consola.
#[derive(Serialize, Clone)]
pub struct AdbOutput {
    pub success: bool,
    pub code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    /// Comando legible que se ejecutó (para mostrar en la consola).
    pub command: String,
}

/// Localiza el binario adb: primero el PATH, luego ubicaciones habituales por SO.
fn detect_adb() -> String {
    // 1) ¿Funciona "adb" directamente (está en el PATH)?
    if probe(&PathBuf::from("adb")) {
        return "adb".to_string();
    }

    // 2) Ubicaciones comunes según el sistema operativo.
    let candidates: Vec<PathBuf> = if cfg!(windows) {
        let local = std::env::var("LOCALAPPDATA").unwrap_or_default();
        let user = std::env::var("USERPROFILE").unwrap_or_default();
        vec![
            PathBuf::from(format!("{local}\\Android\\Sdk\\platform-tools\\adb.exe")),
            PathBuf::from(format!("{user}\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe")),
            PathBuf::from("C:\\platform-tools\\adb.exe"),
            PathBuf::from("C:\\adb\\adb.exe"),
        ]
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        vec![
            PathBuf::from("/usr/bin/adb"),
            PathBuf::from("/usr/local/bin/adb"),
            PathBuf::from("/opt/homebrew/bin/adb"),
            PathBuf::from(format!("{home}/Android/Sdk/platform-tools/adb")),
            PathBuf::from(format!("{home}/Library/Android/sdk/platform-tools/adb")),
        ]
    };

    for c in candidates {
        if c.exists() && probe(&c) {
            return c.to_string_lossy().to_string();
        }
    }

    // 3) No se encontró: devolvemos "adb" igualmente para que el error sea claro
    //    cuando el usuario intente usarlo, y pueda fijar la ruta manualmente.
    "adb".to_string()
}

/// Ejecuta `<bin> version` para confirmar que el binario responde.
fn probe(bin: &PathBuf) -> bool {
    let mut cmd = Command::new(bin);
    cmd.arg("version");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd.stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Construye un `Command` de adb con el serial opcional y los args dados.
fn adb_command(bin: &str, serial: Option<&str>, args: &[String]) -> Command {
    let mut cmd = Command::new(bin);
    if let Some(s) = serial {
        cmd.arg("-s").arg(s);
    }
    cmd.args(args);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Texto legible del comando para mostrar en la consola de la UI.
fn display_command(serial: Option<&str>, args: &[String]) -> String {
    let prefix = serial.map(|s| format!("-s {s} ")).unwrap_or_default();
    format!("adb {prefix}{}", args.join(" "))
}

/// Ejecuta adb de forma bloqueante y captura toda la salida.
fn run_blocking(bin: &str, serial: Option<&str>, args: &[String]) -> AdbOutput {
    let command = display_command(serial, args);
    let mut cmd = adb_command(bin, serial, args);
    match cmd.output() {
        Ok(out) => AdbOutput {
            success: out.status.success(),
            code: out.status.code(),
            stdout: String::from_utf8_lossy(&out.stdout).trim_end().to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).trim_end().to_string(),
            command,
        },
        Err(e) => AdbOutput {
            success: false,
            code: None,
            stdout: String::new(),
            stderr: format!("No se pudo ejecutar adb: {e}"),
            command,
        },
    }
}

// ───────────────────────────── Comandos Tauri ─────────────────────────────

/// Devuelve la ruta de adb que el backend está usando.
#[tauri::command]
pub fn adb_get_path(state: State<'_, AdbState>) -> String {
    state.bin()
}

/// Fija manualmente la ruta de adb (p. ej. si no está en el PATH).
#[tauri::command]
pub fn adb_set_path(state: State<'_, AdbState>, path: String) -> Result<String, String> {
    if !probe(&PathBuf::from(&path)) {
        return Err(format!("«{path}» no responde a `adb version`."));
    }
    *state.path.lock().unwrap() = path.clone();
    Ok(path)
}

/// Comprueba que adb está disponible y devuelve su versión.
#[tauri::command]
pub async fn adb_version(state: State<'_, AdbState>) -> Result<AdbOutput, String> {
    let bin = state.bin();
    tauri::async_runtime::spawn_blocking(move || {
        run_blocking(&bin, None, &["version".to_string()])
    })
    .await
    .map_err(|e| e.to_string())
}

/// Lista los dispositivos conectados (USB y Wi-Fi).
#[tauri::command]
pub async fn adb_devices(state: State<'_, AdbState>) -> Result<Vec<Device>, String> {
    let bin = state.bin();
    let out = tauri::async_runtime::spawn_blocking(move || {
        run_blocking(&bin, None, &["devices".to_string(), "-l".to_string()])
    })
    .await
    .map_err(|e| e.to_string())?;

    if !out.success {
        return Err(out.stderr);
    }
    Ok(parse_devices(&out.stdout))
}

/// Convierte la salida de `adb devices -l` en una lista estructurada.
fn parse_devices(stdout: &str) -> Vec<Device> {
    let mut devices = Vec::new();
    for line in stdout.lines().skip(1) {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let mut parts = line.split_whitespace();
        let serial = match parts.next() {
            Some(s) => s.to_string(),
            None => continue,
        };
        let state = parts.next().unwrap_or("unknown").to_string();

        // El resto son pares clave:valor (model:X product:Y transport_id:Z …).
        let mut model = None;
        let mut product = None;
        let mut transport_id = None;
        for kv in parts {
            if let Some((k, v)) = kv.split_once(':') {
                match k {
                    "model" => model = Some(v.replace('_', " ")),
                    "product" => product = Some(v.to_string()),
                    "transport_id" => transport_id = Some(v.to_string()),
                    _ => {}
                }
            }
        }

        let connection = if serial.contains(':') { "tcp" } else { "usb" }.to_string();
        devices.push(Device {
            serial,
            state,
            model,
            product,
            transport_id,
            connection,
        });
    }
    devices
}

/// Primitiva genérica: ejecuta `adb [-s serial] <args...>`.
///
/// El catálogo de acciones del frontend se compone sobre esta función y sobre
/// [`adb_shell`]. Es la base de todo lo que la app puede hacer.
#[tauri::command]
pub async fn adb_run(
    state: State<'_, AdbState>,
    serial: Option<String>,
    args: Vec<String>,
) -> Result<AdbOutput, String> {
    let bin = state.bin();
    tauri::async_runtime::spawn_blocking(move || {
        run_blocking(&bin, serial.as_deref(), &args)
    })
    .await
    .map_err(|e| e.to_string())
}

/// Ejecuta un comando dentro de `adb shell`.
#[tauri::command]
pub async fn adb_shell(
    state: State<'_, AdbState>,
    serial: Option<String>,
    command: String,
) -> Result<AdbOutput, String> {
    let bin = state.bin();
    tauri::async_runtime::spawn_blocking(move || {
        run_blocking(&bin, serial.as_deref(), &["shell".to_string(), command])
    })
    .await
    .map_err(|e| e.to_string())
}

/// Línea de logcat emitida al frontend vía evento `logcat-line`.
#[derive(Serialize, Clone)]
struct LogLine {
    id: u32,
    line: String,
}

/// Inicia un logcat en streaming. Cada línea se emite como evento `logcat-line`;
/// al terminar el proceso se emite `logcat-end`. Devuelve el id del stream para
/// poder detenerlo con [`adb_logcat_stop`].
#[tauri::command]
pub fn adb_logcat_start(
    app: AppHandle,
    state: State<'_, AdbState>,
    serial: Option<String>,
    args: Vec<String>,
) -> Result<u32, String> {
    let bin = state.bin();
    let mut full_args = vec!["logcat".to_string()];
    full_args.extend(args);

    let mut cmd = adb_command(&bin, serial.as_deref(), &full_args);
    cmd.stdout(Stdio::piped()).stderr(Stdio::null());

    let mut child = cmd.spawn().map_err(|e| format!("No se pudo iniciar logcat: {e}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "No se pudo capturar la salida de logcat".to_string())?;

    let id = state.next_id.fetch_add(1, Ordering::SeqCst);
    let app_thread = app.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().map_while(Result::ok) {
            let _ = app_thread.emit("logcat-line", LogLine { id, line });
        }
        let _ = app_thread.emit("logcat-end", id);
    });

    state.streams.lock().unwrap().insert(id, child);
    Ok(id)
}

/// Detiene un stream de logcat iniciado con [`adb_logcat_start`].
#[tauri::command]
pub fn adb_logcat_stop(state: State<'_, AdbState>, id: u32) {
    if let Some(mut child) = state.streams.lock().unwrap().remove(&id) {
        let _ = child.kill();
    }
}

// ─────────────────────────── Instalación de ADB ───────────────────────────

/// URL del paquete oficial `platform-tools` de Google para este sistema.
fn platform_tools_url() -> &'static str {
    if cfg!(target_os = "windows") {
        "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
    } else if cfg!(target_os = "macos") {
        "https://dl.google.com/android/repository/platform-tools-latest-darwin.zip"
    } else {
        "https://dl.google.com/android/repository/platform-tools-latest-linux.zip"
    }
}

/// Descarga y extrae platform-tools en `data_dir`, devolviendo la ruta de adb.
fn install_platform_tools(data_dir: &Path) -> Result<String, String> {
    std::fs::create_dir_all(data_dir).map_err(|e| format!("No se pudo crear la carpeta: {e}"))?;

    // 1) Descargar el ZIP oficial de Google.
    let resp = ureq::get(platform_tools_url())
        .call()
        .map_err(|e| format!("Fallo al descargar platform-tools: {e}"))?;
    let mut bytes = Vec::new();
    resp.into_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Fallo al leer la descarga: {e}"))?;

    // 2) Extraer (sobrescribe una instalación previa).
    let reader = std::io::Cursor::new(bytes);
    let mut archive =
        zip::ZipArchive::new(reader).map_err(|e| format!("ZIP inválido: {e}"))?;
    archive
        .extract(data_dir)
        .map_err(|e| format!("Fallo al extraer: {e}"))?;

    // 3) Localizar el binario adb dentro de platform-tools/.
    let adb_name = if cfg!(windows) { "adb.exe" } else { "adb" };
    let adb_path = data_dir.join("platform-tools").join(adb_name);
    if !adb_path.exists() {
        return Err("No se encontró adb tras la extracción.".to_string());
    }

    // 4) Marcar como ejecutable en sistemas Unix.
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&adb_path)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&adb_path, perms).map_err(|e| e.to_string())?;
    }

    Ok(adb_path.to_string_lossy().to_string())
}

/// Descarga e instala ADB automáticamente (platform-tools de Google) en la
/// carpeta de datos de la app, y lo deja como adb activo. Devuelve su ruta.
#[tauri::command]
pub async fn adb_install(app: AppHandle, state: State<'_, AdbState>) -> Result<String, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("No se pudo resolver la carpeta de datos: {e}"))?;

    let bin = tauri::async_runtime::spawn_blocking(move || install_platform_tools(&data_dir))
        .await
        .map_err(|e| e.to_string())??;

    // Verificar que responde y fijarlo como adb activo.
    if !probe(&PathBuf::from(&bin)) {
        return Err("ADB se instaló pero no responde a `adb version`.".to_string());
    }
    *state.path.lock().unwrap() = bin.clone();
    Ok(bin)
}
