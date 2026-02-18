import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";

import CaptureOverlay from "./components/capture/CaptureOverlay";
import FloatingWidget from "./components/widget/FloatingWidget";
import PopupPanel from "./components/widget/PopupPanel";
import GalleryView from "./components/gallery/GalleryView";

import "./styles/globals.css";



/** Open the fullscreen capture overlay window */
async function openCaptureWindow() {
  // 1. Capture the screen BEFORE showing the overlay
  //    This ensures we capture the clean state
  const { captureFullscreen } = await import("./lib/tauri-commands");

  // Hide main window briefly for the screenshot if it's visible/focused
  const mainWin = getCurrentWindow();
  await mainWin.hide();
  await new Promise((r) => setTimeout(r, 200)); // Small delay for OS animation

  const screenshotPath = await captureFullscreen();

  // Check if capture window already exists
  const existing = await WebviewWindow.getByLabel("capture");
  if (existing) {
    // Reuse existing window
    await existing.emit("screenshot-path", screenshotPath);
    // Showing is handled by the overlay after image load, but we can ensure it's unminimized
    await existing.unminimize();
    // We don't show() here, the overlay will show itself when ready to avoid flash
    return;
  }

  try {
    // 4. Open the capture window (Hidden initially)
    const captureWin = new WebviewWindow("capture", {
      url: "/",
      title: "nimShot Capture",
      fullscreen: true,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focus: true,
      visible: false, // Start hidden to prevent white flash
    });

    // 5. When capture window signals it's ready, send the screenshot path via event
    const unlistenReady = await listen("capture-window-ready", async () => {
      await captureWin.emit("screenshot-path", screenshotPath);
      unlistenReady();
    });

    captureWin.once("tauri://error", async (e) => {
      console.error("Failed to create capture window:", e);
      unlistenReady();
      await mainWin.show();
    });

    captureWin.once("tauri://destroyed", async () => {
      await mainWin.show();
    });

  } catch (err) {
    console.error("Capture flow failed:", err);
    await mainWin.show();
  }
}

function MainApp() {
  // Listen for capture trigger from Rust (global shortcut / tray menu)
  useEffect(() => {
    const unlisten = listen("trigger-capture", () => {
      openCaptureWindow();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="h-full w-full bg-transparent overflow-hidden">
      <GalleryView />
    </div>
  );
}

export default function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const win = getCurrentWindow();
      setWindowLabel(win.label);
    };
    init();
  }, []);

  if (windowLabel === null) {
    return null; // Render nothing while checking label
  }

  // Route based on window label
  if (windowLabel === "capture") {
    return <CaptureOverlay />;
  }

  if (windowLabel === "widget") {
    return <FloatingWidget />;
  }

  if (windowLabel === "popup") {
    return <PopupPanel />;
  }

  // Default: main window
  return <MainApp />;
}
