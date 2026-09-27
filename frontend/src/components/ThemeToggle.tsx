import { Moon, Sun } from "lucide-react";
import "./ThemeToggle.css";

interface ThemeToggleProps {
    isDarkMode: boolean;
    onToggle: () => void;
}

function ThemeToggle({ isDarkMode, onToggle }: ThemeToggleProps) {
    return (
        <button
            className="theme-toggle"
            onClick={onToggle}
            aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
            }
        >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}

export default ThemeToggle;
