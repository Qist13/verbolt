import "./ThemeToggle.css";

interface ThemeToggleProps {
    isDarkMode: boolean;
    onToggle: () => void;
}

function ThemeToggle({ isDarkMode, onToggle }: ThemeToggleProps) {
    return (
        <button className="theme-toggle" onClick={onToggle}>
            {isDarkMode ? "☀️" : "🌙"}
        </button>
    );
}

export default ThemeToggle;
