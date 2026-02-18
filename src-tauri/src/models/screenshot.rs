use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotMeta {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub created_at: String,
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
}
