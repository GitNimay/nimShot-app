use crate::models::screenshot::ScreenshotMeta;
use base64::{engine::general_purpose, Engine as _};
use image::ImageFormat;
use std::io::Cursor;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the screenshots directory
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

/// Get recent screenshots metadata, sorted by newest first
#[tauri::command]
pub async fn get_recent_screenshots(
    app: AppHandle,
    count: usize,
) -> Result<Vec<ScreenshotMeta>, String> {
    let screenshots_dir = get_screenshots_dir(&app)?;

    let mut entries: Vec<_> = std::fs::read_dir(&screenshots_dir)
        .map_err(|e| format!("Failed to read screenshots dir: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .map(|ext| ext == "png")
                .unwrap_or(false)
        })
        .collect();

    // Sort by modification time, newest first
    entries.sort_by(|a, b| {
        let a_time = a.metadata().and_then(|m| m.modified()).ok();
        let b_time = b.metadata().and_then(|m| m.modified()).ok();
        b_time.cmp(&a_time)
    });

    // Take only the requested count
    let results: Vec<ScreenshotMeta> = entries
        .into_iter()
        .take(count)
        .filter_map(|entry| {
            let path = entry.path();
            let metadata = entry.metadata().ok()?;
            let filename = path.file_name()?.to_string_lossy().to_string();

            // Try to read image dimensions
            let (width, height) = image::image_dimensions(&path).unwrap_or((0, 0));

            // Extract ID from filename or generate one
            let id = filename
                .strip_prefix("screenshot_")
                .and_then(|s| s.strip_suffix(".png"))
                .and_then(|s| s.split('_').last())
                .unwrap_or(&filename)
                .to_string();

            let created_at = metadata
                .modified()
                .ok()
                .map(|t| {
                    let datetime: chrono::DateTime<chrono::Local> = t.into();
                    datetime.to_rfc3339()
                })
                .unwrap_or_default();

            Some(ScreenshotMeta {
                id,
                filename,
                path: path.to_string_lossy().to_string(),
                created_at,
                width,
                height,
                file_size: metadata.len(),
            })
        })
        .collect();

    Ok(results)
}

/// Delete a screenshot by its filename
#[tauri::command]
pub async fn delete_screenshot(app: AppHandle, filename: String) -> Result<(), String> {
    let screenshots_dir = get_screenshots_dir(&app)?;
    let filepath = screenshots_dir.join(&filename);

    if filepath.exists() {
        std::fs::remove_file(&filepath)
            .map_err(|e| format!("Failed to delete screenshot: {}", e))?;
    }

    Ok(())
}

/// Get a screenshot as base64 thumbnail (resized to max 600px width for sharp gallery display)
#[tauri::command]
pub async fn get_screenshot_thumbnail(_app: AppHandle, path: String) -> Result<String, String> {
    let img = image::open(&path).map_err(|e| format!("Failed to open image: {}", e))?;

    // Resize to thumbnail (max 600px wide, maintains aspect ratio)
    let thumbnail = img.thumbnail(600, 600);

    let mut buf = Cursor::new(Vec::new());
    thumbnail
        .write_to(&mut buf, ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    let base64 = general_purpose::STANDARD.encode(buf.into_inner());
    Ok(format!("data:image/jpeg;base64,{}", base64))
}

/// Get full screenshot path
#[tauri::command]
pub async fn get_screenshot_path(app: AppHandle, filename: String) -> Result<String, String> {
    let screenshots_dir = get_screenshots_dir(&app)?;
    let filepath = screenshots_dir.join(&filename);
    Ok(filepath.to_string_lossy().to_string())
}
