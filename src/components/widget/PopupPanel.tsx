import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock } from "lucide-react";
import {
    getRecentScreenshots,
    getScreenshotThumbnail,
    deleteScreenshot,
    type ScreenshotMeta,
} from "../../lib/tauri-commands";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { emit } from "@tauri-apps/api/event";

interface ThumbnailData {
    meta: ScreenshotMeta;
    thumbnail: string;
}

export default function PopupPanel() {
    const [screenshots, setScreenshots] = useState<ThumbnailData[]>([]);
    const [loading, setLoading] = useState(true);

    const loadScreenshots = async () => {
        try {
            setLoading(true);
            const metas = await getRecentScreenshots(5);
            const withThumbnails = await Promise.all(
                metas.map(async (meta) => {
                    try {
                        const thumbnail = await getScreenshotThumbnail(meta.path);
                        return { meta, thumbnail };
                    } catch {
                        return { meta, thumbnail: "" };
                    }
                })
            );
            setScreenshots(withThumbnails);
        } catch (err) {
            console.error("Failed to load screenshots:", err);
        } finally {
            setLoading(false);
        }
    };

    // Force transparent background for the popup window
    useEffect(() => {
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
        const root = document.getElementById("root");
        if (root) root.style.background = "transparent";

        loadScreenshots();
        // Refresh every 5s
        const interval = setInterval(loadScreenshots, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (filename: string) => {
        try {
            await deleteScreenshot(filename);
            setScreenshots((prev) =>
                prev.filter((s) => s.meta.filename !== filename)
            );
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "Just now";
            if (mins < 60) return `${mins}m ago`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `${hours}h ago`;
            return date.toLocaleDateString();
        } catch {
            return "";
        }
    };

    const handleMouseEnter = async () => {
        try {
            await emit("popup-mouseenter");
        } catch { }
    };

    const handleMouseLeave = async () => {
        try {
            await emit("popup-mouseleave");
        } catch { }
    };

    const handleNativeDragStart = async (e: React.MouseEvent, path: string, thumbnail: string) => {
        e.preventDefault();
        try {
            await emit("popup-dragstart");
            await startDrag({
                item: [path],
                icon: thumbnail || "",
            });
            await emit("popup-dragend");
        } catch (err) {
            console.error("Drag failed:", err);
            await emit("popup-dragend");
        }
    };

    return (
        <div
            className="w-full h-full flex flex-col overflow-hidden rounded-xl"
            style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-quaternary)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--bg-quaternary)",
                color: "var(--text-primary)",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: "1px solid var(--bg-quaternary)" }}
            >
                <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-tight">
                        Recent Screenshots
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">
                        {screenshots.length} items
                    </span>
                </div>
            </div>

            {/* Screenshots list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div
                            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: "#DA7756", borderTopColor: "transparent" }}
                        />
                    </div>
                )}

                {!loading && screenshots.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-50">
                        <div className="text-sm">
                            No screenshots yet
                        </div>
                        <div className="text-xs">
                            Press Hotkey to take one
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {screenshots.map(({ meta, thumbnail }, index) => (
                        <motion.div
                            key={meta.filename}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all"
                            style={{
                                background: "var(--bg-primary)",
                                border: "1px solid var(--bg-quaternary)"
                            }}
                            onMouseDown={(e) => handleNativeDragStart(e, meta.path, thumbnail)}
                            whileHover={{ scale: 1.02, backgroundColor: "var(--bg-tertiary)" }}
                        >
                            <div className="flex items-center gap-3 p-2 w-full h-full">
                                {/* Thumbnail */}
                                <div
                                    className="w-16 h-12 rounded-md overflow-hidden flex-shrink-0 bg-cover bg-center border border-white/5"
                                    style={{
                                        backgroundImage: thumbnail
                                            ? `url(${thumbnail})`
                                            : undefined,
                                        backgroundColor: thumbnail ? undefined : "var(--bg-secondary)",
                                    }}
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-mono opacity-90 truncate">
                                        {meta.width}×{meta.height}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] mt-0.5 opacity-60">
                                        <Clock size={10} />
                                        {formatTime(meta.created_at)}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(meta.filename);
                                        }}
                                        className="p-1.5 rounded-md transition-colors hover:bg-red-500/10 hover:text-red-500"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
