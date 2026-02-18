import { invoke } from "@tauri-apps/api/core";

export interface ScreenshotMeta {
    id: string;
    filename: string;
    path: string;
    created_at: string;
    width: number;
    height: number;
    file_size: number;
}

export async function captureFullscreen(): Promise<string> {
    return invoke<string>("capture_fullscreen");
}

export async function captureRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    fullscreenPath: string
): Promise<string> {
    return invoke<string>("capture_region", {
        x,
        y,
        width,
        height,
        fullscreenPath,
    });
}

export async function saveBase64Screenshot(
    base64Data: string
): Promise<string> {
    return invoke<string>("save_base64_screenshot", { base64Data });
}

export async function getRecentScreenshots(
    count: number = 5
): Promise<ScreenshotMeta[]> {
    return invoke<ScreenshotMeta[]>("get_recent_screenshots", { count });
}

export async function deleteScreenshot(filename: string): Promise<void> {
    return invoke("delete_screenshot", { filename });
}

export async function getScreenshotThumbnail(
    path: string
): Promise<string> {
    return invoke<string>("get_screenshot_thumbnail", { path });
}

export async function getScreenshotPath(filename: string): Promise<string> {
    return invoke<string>("get_screenshot_path", { filename });
}


