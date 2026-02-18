import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trash2,
    Clock,
    Search,
    RefreshCw,
    X,
    Settings,
    ExternalLink,
    Image as ImageIcon
} from "lucide-react";
import {
    getRecentScreenshots,
    getScreenshotThumbnail,
    deleteScreenshot,
    type ScreenshotMeta,
} from "../../lib/tauri-commands";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { convertFileSrc } from "@tauri-apps/api/core";
import SettingsPage from "../settings/SettingsPage";
import kiwiLogo from "../../assets/logo.svg";

interface ScreenshotWithThumb {
    meta: ScreenshotMeta;
    thumbnail: string;
}

export default function GalleryView() {
    const [screenshots, setScreenshots] = useState<ScreenshotWithThumb[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [previewMeta, setPreviewMeta] = useState<ScreenshotMeta | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Load Data
    const loadScreenshots = async () => {
        try {
            setLoading(true);
            const metas = await getRecentScreenshots(100);
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

    useEffect(() => {
        loadScreenshots();
    }, []);

    // Auto-refresh on focus
    useEffect(() => {
        const handleFocus = () => loadScreenshots();
        window.addEventListener("focus", handleFocus);
        const win = getCurrentWindow();
        const unlistenPromise = win.onFocusChanged(({ payload: focused }) => {
            if (focused) loadScreenshots();
        });

        return () => {
            window.removeEventListener("focus", handleFocus);
            unlistenPromise.then((fn) => fn());
        };
    }, []);

    // Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (previewMeta) setPreviewMeta(null);
                else if (showSettings) setShowSettings(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewMeta, showSettings]);

    const handleDelete = async (filename: string) => {
        try {
            await deleteScreenshot(filename);
            setScreenshots((prev) => prev.filter((s) => s.meta.filename !== filename));
            if (previewMeta?.filename === filename) setPreviewMeta(null);
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                month: "short", day: "numeric"
            });
        } catch { return ""; }
    };

    const filtered = screenshots.filter((s) =>
        s.meta.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative h-full flex flex-col overflow-hidden bg-bg-primary text-text-primary">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-44 right-[-140px] h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
                <div className="absolute bottom-[-170px] left-[-110px] h-96 w-96 rounded-full bg-bg-tertiary/70 blur-3xl" />
            </div>

            {/* --- Header --- */}
            <div className="relative z-10 sticky top-0 border-b border-bg-quaternary/50 bg-bg-primary/88 backdrop-blur-xl">
                <div className="flex flex-col gap-4 px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 select-none">
                            <img src={kiwiLogo} alt="nimShot" className="h-8 w-8" />
                            <div className="leading-tight">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-text-tertiary">nimShot</p>
                                <p className="text-lg font-semibold tracking-tight text-text-primary">Gallery</p>
                            </div>
                        </div>

                        <div className="w-full max-w-xl">
                            <label className="relative block">
                                <Search
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                                />
                                <input
                                    type="text"
                                    placeholder="Search screenshots"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 w-full rounded-xl border border-bg-quaternary/60 bg-bg-secondary/90 pl-10 pr-3 text-sm text-text-primary outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20 placeholder:text-text-tertiary"
                                />
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadScreenshots}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-bg-quaternary/60 bg-bg-secondary/85 text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                                title="Refresh"
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-bg-quaternary/60 bg-bg-secondary/85 text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <span>{filtered.length} screenshot{filtered.length === 1 ? "" : "s"}</span>
                        <span className="hidden sm:inline">Drag a card to copy its file reference</span>
                    </div>
                </div>
            </div>

            {/* --- Content Grid --- */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 custom-scrollbar">
                {loading && (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-text-tertiary">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        <span className="text-sm">Loading gallery...</span>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="flex h-[60vh] select-none flex-col items-center justify-center gap-3">
                        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-2xl border border-bg-quaternary/50 bg-bg-secondary/70">
                            <ImageIcon size={32} className="text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-secondary">No screenshots found</h3>
                        <p className="max-w-xs text-center text-sm text-text-tertiary">
                            {searchQuery ? "Try a different search term." : "Capture a screenshot and it will appear here."}
                        </p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 pb-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        <AnimatePresence mode="popLayout">
                            {filtered.map(({ meta, thumbnail }) => (
                                <motion.div
                                    key={meta.filename}
                                    layout
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    whileHover={{ y: -3 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-xl border border-bg-quaternary/45 bg-bg-secondary/90 shadow-[0_14px_35px_-24px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-accent/45"
                                    onClick={() => setPreviewMeta(meta)}
                                    draggable
                                    onDragStartCapture={(e) => {
                                        e.dataTransfer.effectAllowed = "copy";
                                        const fileUri = "file:///" + meta.path.replace(/\\/g, "/");
                                        e.dataTransfer.setData("text/plain", meta.path);
                                        e.dataTransfer.setData("text/uri-list", fileUri);
                                        const img = new Image();
                                        img.src = thumbnail;
                                        e.dataTransfer.setDragImage(img, 0, 0);
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div
                                        className="absolute inset-0 bg-bg-tertiary bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                                        style={{ backgroundImage: `url(${thumbnail})` }}
                                    />

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                    {/* Info Badge (Top Left) */}
                                    <div className="absolute left-3 top-3 opacity-0 transition-opacity duration-300 delay-75 group-hover:opacity-100">
                                        <span className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md">
                                            {meta.width} x {meta.height}
                                        </span>
                                    </div>

                                    {/* Actions Bar (Bottom) */}
                                    <div className="absolute bottom-0 left-0 right-0 translate-y-4 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/35 px-2 py-1.5 backdrop-blur-md">
                                            <div className="flex items-center gap-1.5 text-white/90">
                                                <Clock size={12} className="text-accent" />
                                                <span className="text-[10px] font-medium tracking-wide">
                                                    {formatDate(meta.created_at)}
                                                </span>
                                            </div>

                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
                                                            await revealItemInDir(meta.path);
                                                        } catch (err) { console.error(err); }
                                                    }}
                                                    className="rounded-md border border-white/15 bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
                                                    title="Show in Folder"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(meta.filename);
                                                    }}
                                                    className="rounded-md border border-white/15 bg-white/10 p-1.5 text-white transition-colors hover:bg-red-500/80"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* --- Settings Modal --- */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 12 }}
                            className="w-[min(94vw,980px)] overflow-hidden rounded-2xl border border-bg-quaternary/60 bg-bg-primary shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SettingsPage onClose={() => setShowSettings(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Image Preview Overlay --- */}
            <AnimatePresence>
                {previewMeta && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col bg-bg-primary/92 backdrop-blur-xl"
                        onClick={() => setPreviewMeta(null)}
                    >
                        {/* Preview Header */}
                        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-bg-primary via-bg-primary/60 to-transparent px-6 py-4">
                            <div className="pointer-events-auto">
                                <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-mono text-sm text-white/90 backdrop-blur-md">
                                    {previewMeta.filename}
                                </span>
                            </div>

                            <button
                                onClick={() => setPreviewMeta(null)}
                                className="pointer-events-auto rounded-full border border-white/10 bg-black/30 p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-1 items-center justify-center p-8">
                            <motion.img
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                src={convertFileSrc(previewMeta.path)}
                                alt="Preview"
                                className="max-h-full max-w-full rounded-lg object-contain drop-shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
