use base64::{engine::general_purpose, Engine as _};
use chrono::Local;

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use uuid::Uuid;
use xcap::Monitor;

/// Get the screenshots directory, creating it if needed
fn get_screenshots_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let screenshots_dir = app_data.join("screenshots");
    std::fs::create_dir_all(&screenshots_dir)
        .map_err(|e| format!("Failed to create screenshots dir: {}", e))?;
    Ok(screenshots_dir)
}

/// Capture all monitors and save to a temporary file, returning the path
#[tauri::command]
pub async fn capture_fullscreen(app: AppHandle) -> Result<String, String> {
    // Capture primary monitor
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;
    let monitor = monitors
        .first()
        .ok_or_else(|| "No monitors found".to_string())?;

    let img = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Get temp/cache directory
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    // Ensure the directory exists
    if !app_data.exists() {
        std::fs::create_dir_all(&app_data)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }

    let temp_path = app_data.join("temp_capture.png");

    // Save directly to file
    img.save(&temp_path)
        .map_err(|e| format!("Failed to save temp screenshot: {}", e))?;

    Ok(temp_path.to_string_lossy().to_string())
}

/// Capture a region from the temporary fullscreen file
#[tauri::command]
pub async fn capture_region(
    app: AppHandle,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    fullscreen_path: String,
) -> Result<String, String> {
    // Load image from the provided path
    let img = image::open(&fullscreen_path)
        .map_err(|e| format!("Failed to load temp screenshot: {}", e))?;

    // Crop to region
    let cropped = img.crop_imm(x as u32, y as u32, width, height);

    // Generate filename with timestamp
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let id = Uuid::new_v4().to_string();
    let filename = format!("screenshot_{}_{}.png", timestamp, &id[..8]);

    // Save to screenshots directory
    let screenshots_dir = get_screenshots_dir(&app)?;
    let filepath = screenshots_dir.join(&filename);

    cropped
        .save(&filepath)
        .map_err(|e| format!("Failed to save screenshot: {}", e))?;

    // Return the metadata as JSON
    let meta = serde_json::json!({
        "id": id,
        "filename": filename,
        "path": filepath.to_string_lossy().to_string(),
        "created_at": Local::now().to_rfc3339(),
        "width": width,
        "height": height,
        "file_size": std::fs::metadata(&filepath).map(|m| m.len()).unwrap_or(0),
    });

    Ok(meta.to_string())
}

/// Save a base64-encoded PNG image to the screenshots folder
#[tauri::command]
pub async fn save_base64_screenshot(app: AppHandle, base64_data: String) -> Result<String, String> {
    let img_bytes = general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let img =
        image::load_from_memory(&img_bytes).map_err(|e| format!("Failed to load image: {}", e))?;

    let (width, height) = (img.width(), img.height());
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let id = Uuid::new_v4().to_string();
    let filename = format!("screenshot_{}_{}.png", timestamp, &id[..8]);

    let screenshots_dir = get_screenshots_dir(&app)?;
    let filepath = screenshots_dir.join(&filename);

    img.save(&filepath)
        .map_err(|e| format!("Failed to save screenshot: {}", e))?;

    let meta = serde_json::json!({
        "id": id,
        "filename": filename,
        "path": filepath.to_string_lossy().to_string(),
        "created_at": Local::now().to_rfc3339(),
        "width": width,
        "height": height,
        "file_size": std::fs::metadata(&filepath).map(|m| m.len()).unwrap_or(0),
    });

    Ok(meta.to_string())
}
