mod commands;
mod models;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let _ = handle_capture_shortcut(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_drag::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::capture::capture_fullscreen,
            commands::capture::capture_region,
            commands::capture::save_base64_screenshot,
            commands::screenshots::get_recent_screenshots,
            commands::screenshots::delete_screenshot,
            commands::screenshots::get_screenshot_thumbnail,
            commands::screenshots::get_screenshot_path,
        ])
        .setup(|app| {
            // Create system tray
            let quit = MenuItem::with_id(app, "quit", "Quit nimShot", true, None::<&str>)?;
            let capture =
                MenuItem::with_id(app, "capture", "Capture Screenshot", true, None::<&str>)?;
            let gallery = MenuItem::with_id(app, "gallery", "Open Gallery", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&capture, &gallery, &quit])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .tooltip("nimShot - Screenshot Tool")
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "capture" => {
                        let _ = handle_capture_shortcut(app);
                    }
                    "gallery" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            // Register global shortcut
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            app.global_shortcut().register("Ctrl+Alt+S")?;

            // Create screenshots directory
            let app_data = app.path().app_data_dir()?;
            std::fs::create_dir_all(app_data.join("screenshots"))?;

            // Create the floating widget window — always visible, always on top
            // Create the floating widget window — always visible, always on top
            let widget_win =
                tauri::WebviewWindowBuilder::new(app, "widget", tauri::WebviewUrl::App("/".into()))
                    .title("nimShot Widget")
                    .inner_size(70.0, 70.0)
                    .resizable(false)
                    .decorations(false)
                    .transparent(true)
                    .always_on_top(true)
                    .skip_taskbar(true)
                    .shadow(false)
                    .visible(true)
                    .build()?;

            // Position widget at bottom-right
            if let Ok(Some(monitor)) = widget_win.primary_monitor() {
                let screen_size = monitor.size();
                let scale = monitor.scale_factor();
                let screen_w = (screen_size.width as f64 / scale) as i32;
                let screen_h = (screen_size.height as f64 / scale) as i32;
                let _ =
                    widget_win.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                        x: (screen_w as f64 * scale) as i32 - (100.0 * scale) as i32,
                        y: (screen_h as f64 * scale) as i32 - (100.0 * scale) as i32,
                    }));
            }

            // Create the popup window (hidden initially)
            tauri::WebviewWindowBuilder::new(app, "popup", tauri::WebviewUrl::App("/".into()))
                .title("nimShot Popup")
                .inner_size(300.0, 400.0)
                .resizable(false)
                .decorations(false)
                .transparent(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .shadow(false)
                .visible(false)
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Handle capture shortcut - emit event to frontend
fn handle_capture_shortcut(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Emit capture event to trigger capture flow in frontend
    use tauri::Emitter;
    app.emit("trigger-capture", ())?;
    Ok(())
}
