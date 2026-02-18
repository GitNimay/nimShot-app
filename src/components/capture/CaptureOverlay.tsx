import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { captureRegion } from "../../lib/tauri-commands";
import { X, Check, Crop } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Point {
    x: number;
    y: number;
}

interface Selection {
    start: Point;
    end: Point;
}

export default function CaptureOverlay() {
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fullscreenPreview, setFullscreenPreview] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initial setup
    useEffect(() => {
        // Listen for screenshot path from main process
        const unlistenPromise = listen<string>("screenshot-path", async (event) => {
            const { convertFileSrc } = await import("@tauri-apps/api/core");
            const assetUrl = convertFileSrc(event.payload);
            setFullscreenPreview(assetUrl);
            // Store the raw path for captureRegion
            if (canvasRef.current) {
                canvasRef.current.dataset.rawPath = event.payload;
            }
            // Reset state for new screenshot
            setSelection(null);
            setIsDragging(false);
        });

        // Set full screen layout
        document.body.style.overflow = "hidden";
        document.body.style.background = "transparent";

        // Signal main process that we are ready to receive data
        setTimeout(async () => {
            const { emit } = await import("@tauri-apps/api/event");
            await emit("capture-window-ready");
        }, 100);

        return () => {
            unlistenPromise.then((f) => f());
        };
    }, []);

    // Draw canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !fullscreenPreview) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Load image
        const img = new Image();
        img.src = fullscreenPreview;
        img.onload = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // 1. Draw dimmed background
            ctx.filter = "blur(0px) brightness(0.6)"; // Dim everything
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.filter = "none";

            // Show window now that image is drawn (prevent white flash)
            const win = getCurrentWindow();
            win.show();
            win.setFocus();

            // 2. Draw clear selection
            if (selection) {
                const { x, y, w, h } = getRect(selection);

                // Clear the dimming for the selection
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw clear image
                ctx.restore();

                // Draw border
                ctx.strokeStyle = "#DA7756";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);

                // Add glow to border
                ctx.shadowColor = "#DA7756";
                ctx.shadowBlur = 10;
                ctx.strokeRect(x, y, w, h);
                ctx.shadowBlur = 0;
            }
        };
    }, [fullscreenPreview, selection]);

    const getRect = (sel: Selection) => {
        const x = Math.min(sel.start.x, sel.end.x);
        const y = Math.min(sel.start.y, sel.end.y);
        const w = Math.abs(sel.end.x - sel.start.x);
        const h = Math.abs(sel.end.y - sel.start.y);
        return { x, y, w, h };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Prevent starting drag if clicking on toolbar
        if ((e.target as HTMLElement).closest("button")) return;

        setSelection({
            start: { x: e.clientX, y: e.clientY },
            end: { x: e.clientX, y: e.clientY },
        });
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !selection) return;
        setSelection({
            ...selection,
            end: { x: e.clientX, y: e.clientY },
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleAutoCapture = useCallback(async () => {
        if (!selection || !canvasRef.current?.dataset.rawPath) return;
        const rect = getRect(selection);
        if (rect.w < 10 || rect.h < 10) return; // Ignore tiny selections

        const rawPath = canvasRef.current.dataset.rawPath;

        try {
            await captureRegion(
                Math.round(rect.x),
                Math.round(rect.y),
                Math.round(rect.w),
                Math.round(rect.h),
                rawPath
            );
            // Hide window after capture (reuse)
            const win = getCurrentWindow();
            await win.hide();
            // Restore main window
            const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
            const main = await WebviewWindow.getByLabel("main");
            if (main) main.show();
        } catch (err) {
            console.error("Capture failed:", err);
            const win = getCurrentWindow();
            await win.hide();
        }
    }, [selection]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const win = getCurrentWindow();
                await win.hide();
                // Restore main window
                const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
                const main = await WebviewWindow.getByLabel("main");
                if (main) main.show();
            }
            if (e.key === "Enter" && selection) {
                await handleAutoCapture();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selection, handleAutoCapture]);

    const rect = selection ? getRect(selection) : null;

    return (
        <div
            className="fixed inset-0 cursor-crosshair select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
            />

            {/* Helper Text (Initial State) */}
            {!selection && !isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center gap-3 shadow-2xl"
                    >
                        <Crop size={18} className="text-[#DA7756]" />
                        <span className="text-sm font-medium">Click and drag to capture</span>
                    </motion.div>
                </div>
            )}

            {/* Selection Toolbar */}
            <AnimatePresence>
                {rect && !isDragging && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute flex items-center gap-2 p-1.5 rounded-full bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 pointer-events-auto"
                        style={{
                            left: Math.max(10, Math.min(window.innerWidth - 120, rect.x + rect.w / 2 - 60)),
                            top: Math.max(10, rect.y + rect.h + 16 > window.innerHeight ? rect.y - 60 : rect.y + rect.h + 16),
                        }}
                    >
                        <button
                            onClick={() => setSelection(null)}
                            className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors text-red-400"
                            title="Cancel (Esc)"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <div className="px-2 font-mono text-xs text-white/70 select-none">
                            {Math.round(rect.w)}×{Math.round(rect.h)}
                        </div>

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        <button
                            onClick={handleAutoCapture}
                            className="p-2.5 rounded-full bg-[#DA7756] hover:bg-[#c46243] text-white shadow-lg shadow-[#DA7756]/20 transition-all hover:scale-105 active:scale-95"
                            title="Capture (Enter)"
                        >
                            <Check size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Magnifier / Crosshair (during drag) */}
            {isDragging && selection && (
                <div
                    className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full pb-4"
                    style={{ left: selection.end.x, top: selection.end.y }}
                >
                    <div className="px-2 py-1 bg-[#DA7756] text-white text-xs font-mono rounded shadow-lg">
                        {Math.abs(selection.end.x - selection.start.x)}×{Math.abs(selection.end.y - selection.start.y)}
                    </div>
                </div>
            )}
        </div>
    );
}
