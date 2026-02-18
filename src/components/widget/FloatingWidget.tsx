import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import kiwiLogo from "../../assets/logo.svg";

export default function FloatingWidget() {
    const [isHovered, setIsHovered] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDragging = useRef(false);
    const isPopupHovered = useRef(false);

    const hidePopup = () => {
        if (isDragging.current || isPopupHovered.current) return;

        if (hideTimer.current) clearTimeout(hideTimer.current);

        hideTimer.current = setTimeout(async () => {
            if (!isDragging.current && !isPopupHovered.current) {
                setIsHovered(false);
                try {
                    const popup = await WebviewWindow.getByLabel("popup");
                    if (popup) {
                        await popup.hide();
                    }
                } catch { }
            }
        }, 600);
    };

    useEffect(() => {
        let unlistenEnter: (() => void) | null = null;
        let unlistenLeave: (() => void) | null = null;
        let unlistenDragStart: (() => void) | null = null;
        let unlistenDragEnd: (() => void) | null = null;

        const setup = async () => {
            unlistenEnter = await listen("popup-mouseenter", () => {
                isPopupHovered.current = true;
                if (hideTimer.current) clearTimeout(hideTimer.current);
                setIsHovered(true);
            });

            unlistenLeave = await listen("popup-mouseleave", () => {
                isPopupHovered.current = false;
                hidePopup();
            });

            unlistenDragStart = await listen("popup-dragstart", () => {
                isDragging.current = true;
                if (hideTimer.current) clearTimeout(hideTimer.current);
            });

            unlistenDragEnd = await listen("popup-dragend", () => {
                isDragging.current = false;
                hidePopup();
            });
        };

        setup();

        return () => {
            if (unlistenEnter) unlistenEnter();
            if (unlistenLeave) unlistenLeave();
            if (unlistenDragStart) unlistenDragStart();
            if (unlistenDragEnd) unlistenDragEnd();
        };
    }, []);

    useEffect(() => {
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
        const root = document.getElementById("root");
        if (root) root.style.background = "transparent";
    }, []);

    const handleWidgetDrag = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const win = getCurrentWindow();
            await win.startDragging();
        } catch { }
    };

    const showPopup = async () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setIsHovered(true);

        try {
            const popup = await WebviewWindow.getByLabel("popup");
            if (popup) {
                const widgetWin = getCurrentWindow();
                const widgetPos = await widgetWin.outerPosition();
                const scaleFactor = await widgetWin.scaleFactor();

                const x = widgetPos.x - Math.floor(240 * scaleFactor);
                const y = widgetPos.y - Math.floor(410 * scaleFactor);

                await popup.setPosition(new PhysicalPosition(x, y));
                await popup.show();
                await popup.setFocus();
            }
        } catch (err) {
            console.error("Failed to show popup:", err);
        }
    };

    const handleMouseEnter = () => {
        showPopup();
    };

    const handleMouseLeave = () => {
        hidePopup();
    };

    useEffect(() => {
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, []);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
            }}
        >
            {/* Floating widget button */}
            <motion.div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleWidgetDrag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-grab active:cursor-grabbing flex items-center justify-center transition-all duration-300"
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: "14px", // iOS-like squircle
                    background: "rgba(20, 20, 20, 0.4)", // Dark transparent bg
                    backdropFilter: "blur(12px)", // Glass effect
                    border: "1px solid rgba(255, 255, 255, 0.1)", // Subtle border
                    boxShadow: isHovered
                        ? "0 8px 32px rgba(0, 0, 0, 0.3)" // Enhanced shadow on hover
                        : "0 4px 16px rgba(0, 0, 0, 0.2)",
                }}
            >
                <div className="flex items-center justify-center w-full h-full p-2.5">
                    <img
                        src={kiwiLogo}
                        alt="nimShot"
                        className="w-full h-full object-contain pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
