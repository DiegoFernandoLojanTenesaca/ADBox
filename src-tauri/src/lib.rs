mod adb;

use adb::AdbState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AdbState::new())
        .invoke_handler(tauri::generate_handler![
            adb::adb_get_path,
            adb::adb_set_path,
            adb::adb_version,
            adb::adb_devices,
            adb::adb_run,
            adb::adb_shell,
            adb::adb_logcat_start,
            adb::adb_logcat_stop,
            adb::adb_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
