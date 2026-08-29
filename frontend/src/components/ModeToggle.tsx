import "./ModeToggle.css";

export type TranslationMode = "text" | "morse" | "image" | "voice";

interface ModeToggleProps {
    activeMode: TranslationMode;
    onModeChange: (mode: TranslationMode) => void;
}

const MODES: { id: TranslationMode; label: string; comingSoon: boolean }[] = [
    { id: "text", label: "Text", comingSoon: false },
    { id: "morse", label: "Morse", comingSoon: false },
    { id: "image", label: "Image", comingSoon: false },
    { id: "voice", label: "Voice", comingSoon: true },
    { id: "video", label: "Video", comingSoon: true },
];

function ModeToggle({ activeMode, onModeChange }: ModeToggleProps) {
    return (
        <div className="mode-toggle">
            {MODES.map((mode) => (
                <button
                    key={mode.id}
                    className={`mode-button ${activeMode === mode.id ? "active" : ""}`}
                    onClick={() => !mode.comingSoon && onModeChange(mode.id)}
                    disabled={mode.comingSoon}
                >
                    {mode.label}
                    {mode.comingSoon && (
                        <span className="coming-soon-badge">Soon</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default ModeToggle;
