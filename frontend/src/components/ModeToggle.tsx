import "./ModeToggle.css";

export type TranslationMode = "text" | "morse" | "image" | "file" | "speech";

interface ModeToggleProps {
    activeMode: TranslationMode;
    onModeChange: (mode: TranslationMode) => void;
}

const MODES: { id: TranslationMode; label: string }[] = [
    { id: "text", label: "Text" },
    { id: "morse", label: "Morse" },
    { id: "image", label: "Image" },
    { id: "file", label: "File" },
    { id: "speech", label: "Audio & Video" },
];

function ModeToggle({ activeMode, onModeChange }: ModeToggleProps) {
    return (
        <div className="mode-toggle">
            {MODES.map((mode) => (
                <button
                    key={mode.id}
                    className={`mode-button ${activeMode === mode.id ? "active" : ""}`}
                    onClick={() => onModeChange(mode.id)}
                >
                    {mode.label}
                </button>
            ))}
        </div>
    );
}

export default ModeToggle;
