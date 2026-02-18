import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask, message } from "@tauri-apps/plugin-dialog";

export interface UpdateInfo {
  available: boolean;
  version?: string;
  date?: string;
  body?: string;
}

export async function checkForUpdates(silent = true): Promise<UpdateInfo | null> {
  try {
    const update = await check();

    if (!update) {
      if (!silent) {
        await message("You're already running the latest version of nimShot!", {
          title: "No Updates Available",
          kind: "info",
        });
      }
      return { available: false };
    }

    return {
      available: true,
      version: update.version,
      date: update.date,
      body: update.body,
    };
  } catch (error) {
    console.error("Failed to check for updates:", error);
    if (!silent) {
      await message("Failed to check for updates. Please try again later.", {
        title: "Update Check Failed",
        kind: "error",
      });
    }
    return null;
  }
}

export async function downloadAndInstallUpdate(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const update = await check();

    if (!update) {
      return false;
    }

    const yes = await ask(
      `Update ${update.version} is available!\n\n${update.body || "Do you want to install it now?"}`,
      {
        title: "Update Available",
        kind: "info",
        okLabel: "Download & Install",
        cancelLabel: "Later",
      }
    );

    if (!yes) {
      return false;
    }

    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength || 0;
          onProgress?.(0);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            onProgress?.(Math.round((downloaded / contentLength) * 100));
          }
          break;
        case "Finished":
          onProgress?.(100);
          break;
      }
    });

    const restart = await ask(
      "Update downloaded successfully! Restart nimShot to complete the installation?",
      {
        title: "Restart Required",
        kind: "info",
        okLabel: "Restart Now",
        cancelLabel: "Later",
      }
    );

    if (restart) {
      await relaunch();
    }

    return true;
  } catch (error) {
    console.error("Failed to download update:", error);
    await message("Failed to download update. Please try again later.", {
      title: "Update Failed",
      kind: "error",
    });
    return false;
  }
}

export async function autoCheckForUpdates(): Promise<void> {
  const update = await checkForUpdates(true);

  if (update?.available) {
    await downloadAndInstallUpdate();
  }
}
