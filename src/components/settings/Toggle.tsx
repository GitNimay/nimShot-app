import { motion } from "framer-motion";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function Toggle({ checked, onChange }: ToggleProps) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/50 ${checked ? "bg-accent" : "bg-bg-quaternary"
                }`}
        >
            <motion.div
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ x: checked ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    );
}
