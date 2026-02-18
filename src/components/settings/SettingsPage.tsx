import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Keyboard,
    Monitor,
    FolderOpen,
    Sun,
    Moon,
    Power,
    X,
    Check,
    Settings as SettingsIcon,
    Info,
    ChevronRight,
    Github,
    Globe
} from "lucide-react";
import Toggle from "./Toggle";

interface SettingsPageProps {
    onClose: () => void;
}

type SettingsTab = "general" | "appearance" | "storage" | "about";

const tabContent: Record<SettingsTab, { title: string; description: string }> = {
    general: {
        title: "General",
        description: "Core preferences for shortcuts and startup behavior.",
    },
    appearance: {
        title: "Appearance",
        description: "Choose the interface theme for work in any environment.",
    },
    storage: {
        title: "Storage",
        description: "Control where captures are saved and accessed.",
    },
    about: {
        title: "About",
        description: "Version details and project resources.",
    },
};

export default function SettingsPage({ onClose }: SettingsPageProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [hotkey, _setHotkey] = useState("Ctrl+Alt+S");
    const [autostart, setAutostart] = useState(true);
    const [theme, setTheme] = useState<"dark" | "light">(() => {
        return (localStorage.getItem("theme") as "dark" | "light") || "dark";
    });

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const tabs = [
        { id: "general", label: "General", icon: SettingsIcon },
        { id: "appearance", label: "Appearance", icon: Monitor },
        { id: "storage", label: "Storage", icon: FolderOpen },
        { id: "about", label: "About", icon: Info },
    ];

    const activeCopy = tabContent[activeTab];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex h-[min(84vh,700px)] w-[min(94vw,960px)] overflow-hidden rounded-2xl border border-bg-quaternary/60 bg-bg-primary text-text-primary shadow-2xl"
        >
            {/* Sidebar */}
            <aside className="flex w-56 shrink-0 flex-col border-r border-bg-quaternary/45 bg-bg-secondary/70 p-4">
                <div className="mb-6 px-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-text-secondary">
                        <span className="rounded-md bg-accent/15 p-1.5 text-accent">
                            <SettingsIcon size={14} />
                        </span>
                        Settings
                    </h2>
                </div>

                <div className="flex-1 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as SettingsTab)}
                                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                                    ? "bg-bg-tertiary text-text-primary"
                                    : "text-text-secondary hover:bg-bg-tertiary/70 hover:text-text-primary"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeSettingsTab"
                                        className="absolute inset-0 rounded-xl border border-accent/35 bg-accent/10"
                                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                                    />
                                )}
                                <Icon size={16} className={`relative z-10 ${isActive ? "text-accent" : "text-text-tertiary"}`} />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-bg-quaternary/60 bg-bg-secondary px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:border-accent/35 hover:text-text-primary"
                >
                    <X size={15} />
                    Close
                </button>
            </aside>

            {/* Content Area */}
            <section className="flex min-w-0 flex-1 flex-col bg-bg-primary">
                <div className="border-b border-bg-quaternary/45 px-8 py-6">
                    <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{activeCopy.title}</h1>
                    <p className="mt-2 text-sm text-text-tertiary">{activeCopy.description}</p>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-8 py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="space-y-4"
                        >
                            {activeTab === "general" && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-bg-quaternary/50 bg-bg-secondary/55 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex gap-3">
                                                <span className="rounded-xl bg-accent/15 p-2.5 text-accent">
                                                    <Keyboard size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary">Capture Shortcut</p>
                                                    <p className="mt-1 text-sm text-text-tertiary">Global hotkey for screenshot capture.</p>
                                                </div>
                                            </div>
                                            <span className="rounded-lg border border-bg-quaternary/70 bg-bg-primary px-3 py-1.5 font-mono text-xs text-text-secondary">
                                                {hotkey}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-bg-quaternary/50 bg-bg-secondary/55 p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex gap-3">
                                                <span className="rounded-xl bg-success/15 p-2.5 text-success">
                                                    <Power size={18} />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary">Run on Startup</p>
                                                    <p className="mt-1 text-sm text-text-tertiary">Launch automatically when Windows starts.</p>
                                                </div>
                                            </div>
                                            <Toggle checked={autostart} onChange={setAutostart} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "appearance" && (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <button
                                        onClick={() => setTheme("dark")}
                                        className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${theme === "dark"
                                            ? "border-accent/55 bg-bg-secondary shadow-lg shadow-accent/10"
                                            : "border-bg-quaternary/60 bg-bg-secondary/55 hover:border-accent/30"
                                            }`}
                                    >
                                        <div className="mb-4 aspect-video rounded-xl border border-[#3A3A3A] bg-[#1A1A1A] p-3">
                                            <div className="flex h-full items-center gap-2 rounded-lg border border-[#3A3A3A] bg-[#252525] px-3">
                                                <span className="h-3 w-3 rounded-full bg-[#B4B4B4]" />
                                                <span className="h-1.5 w-16 rounded-full bg-[#B4B4B4]" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Moon size={15} className="text-text-secondary" />
                                            Dark mode
                                        </div>
                                        <p className="mt-1 text-xs text-text-tertiary">Best for low-light and extended sessions.</p>
                                        {theme === "dark" && (
                                            <span className="absolute right-3 top-3 rounded-full bg-accent p-1 text-white">
                                                <Check size={11} strokeWidth={3} />
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setTheme("light")}
                                        className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${theme === "light"
                                            ? "border-accent/55 bg-bg-secondary shadow-lg shadow-accent/10"
                                            : "border-bg-quaternary/60 bg-bg-secondary/55 hover:border-accent/30"
                                            }`}
                                    >
                                        <div className="mb-4 aspect-video rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] p-3">
                                            <div className="flex h-full items-center gap-2 rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] px-3">
                                                <span className="h-3 w-3 rounded-full bg-[#737373]" />
                                                <span className="h-1.5 w-16 rounded-full bg-[#737373]" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Sun size={15} className="text-text-secondary" />
                                            Light mode
                                        </div>
                                        <p className="mt-1 text-xs text-text-tertiary">Best for bright spaces and high contrast.</p>
                                        {theme === "light" && (
                                            <span className="absolute right-3 top-3 rounded-full bg-accent p-1 text-white">
                                                <Check size={11} strokeWidth={3} />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {activeTab === "storage" && (
                                <div className="rounded-2xl border border-bg-quaternary/50 bg-bg-secondary/55 p-5">
                                    <div className="mb-5 flex items-center gap-3">
                                        <span className="rounded-xl bg-info/15 p-2.5 text-info">
                                            <FolderOpen size={18} />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">Save Location</p>
                                            <p className="mt-1 text-sm text-text-tertiary">Choose where screenshots are stored.</p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-bg-quaternary/60 bg-bg-primary p-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 truncate px-3 py-2 font-mono text-xs text-text-secondary">
                                                %AppData%/nimShot/screenshots
                                            </div>
                                            <button className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-bg-tertiary hover:text-text-primary">
                                                Change
                                            </button>
                                            <button className="rounded-lg border border-bg-quaternary/60 bg-bg-tertiary px-3 py-2 text-xs font-medium text-text-primary transition hover:border-accent/35">
                                                Open
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "about" && (
                                <div className="flex flex-col items-center py-3 text-center">
                                    <div className="mb-4 rounded-2xl border border-accent/35 bg-gradient-to-br from-accent to-accent-active p-6 text-white shadow-xl shadow-accent/20">
                                        <span className="text-3xl font-bold tracking-tight">nS</span>
                                    </div>

                                    <h2 className="text-2xl font-semibold text-text-primary">nimShot</h2>
                                    <p className="mt-1 text-sm text-text-tertiary">Version 0.1.0 Beta</p>

                                    <div className="mt-6 w-full max-w-sm space-y-2">
                                        <button className="flex w-full items-center justify-between rounded-xl border border-bg-quaternary/60 bg-bg-secondary/65 px-4 py-3 text-sm text-text-primary transition hover:border-accent/35">
                                            <span className="flex items-center gap-2.5">
                                                <Github size={16} />
                                                GitHub Repository
                                            </span>
                                            <ChevronRight size={14} className="text-text-tertiary" />
                                        </button>
                                        <button className="flex w-full items-center justify-between rounded-xl border border-bg-quaternary/60 bg-bg-secondary/65 px-4 py-3 text-sm text-text-primary transition hover:border-accent/35">
                                            <span className="flex items-center gap-2.5">
                                                <Globe size={16} />
                                                Website
                                            </span>
                                            <ChevronRight size={14} className="text-text-tertiary" />
                                        </button>
                                    </div>

                                    <p className="mt-6 text-xs text-text-tertiary">Made by Nims</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>
        </motion.div>
    );
}
