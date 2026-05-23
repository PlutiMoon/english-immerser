mod commands;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let doc_dir = app
                .path()
                .document_dir()
                .expect("failed to resolve document directory");
            let data_root = doc_dir.join("English Immerser");
            std::fs::create_dir_all(data_root.join("diary"))
                .expect("failed to create diary dir");
            std::fs::create_dir_all(data_root.join("writing"))
                .expect("failed to create writing dir");
            std::fs::create_dir_all(data_root.join("recordings"))
                .expect("failed to create recordings dir");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::fetch_rss, commands::download_audio, commands::open_folder, commands::open_cache_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
