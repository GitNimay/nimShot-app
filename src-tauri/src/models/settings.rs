use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub hotkey: String,
    pub autostart: bool,
    pub widget_position: WidgetPosition,
    pub screenshot_folder: String,
    pub max_storage_mb: u64,
    pub theme: String,
    pub first_launch: bool,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WidgetPosition {
    pub x: f64,
    pub y: f64,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            hotkey: "Ctrl+Alt+S".to_string(),
            autostart: true,
            widget_position: WidgetPosition { x: 50.0, y: 500.0 },
            screenshot_folder: String::new(), // will be set in runtime
            max_storage_mb: 1000,
            theme: "dark".to_string(),
            first_launch: true,
        }
    }
}
