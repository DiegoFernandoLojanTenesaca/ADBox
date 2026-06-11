/** Puente con el backend Rust: cada función envuelve un comando Tauri. */

import { invoke } from "@tauri-apps/api/core";
import type { AdbOutput, Device } from "./types";

/** Ruta de adb que el backend está usando. */
export const getPath = () => invoke<string>("adb_get_path");

/** Fija manualmente la ruta de adb (lanza si el binario no responde). */
export const setPath = (path: string) => invoke<string>("adb_set_path", { path });

/** Versión de adb (sirve para comprobar que está disponible). */
export const version = () => invoke<AdbOutput>("adb_version");

/** Lista de dispositivos conectados (USB + Wi-Fi). */
export const devices = () => invoke<Device[]>("adb_devices");

/** Ejecuta `adb [-s serial] <args...>`. */
export const run = (serial: string | null, args: string[]) =>
  invoke<AdbOutput>("adb_run", { serial, args });

/** Ejecuta `adb [-s serial] shell <command>`. */
export const shell = (serial: string | null, command: string) =>
  invoke<AdbOutput>("adb_shell", { serial, command });

/** Inicia logcat en streaming; devuelve el id del stream. */
export const logcatStart = (serial: string | null, args: string[]) =>
  invoke<number>("adb_logcat_start", { serial, args });

/** Detiene un stream de logcat por id. */
export const logcatStop = (id: number) => invoke<void>("adb_logcat_stop", { id });

/** Descarga e instala ADB automáticamente (platform-tools de Google). */
export const installAdb = () => invoke<string>("adb_install");
