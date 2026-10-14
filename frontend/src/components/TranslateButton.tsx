import { Languages, LoaderCircle } from "lucide-react";
import "./TranslateButton.css";

interface TranslateButtonProps {
    isLoading: boolean;
    onClick: () => void;
    disabled?: boolean;
    // Shown under the button text, e.g. a keyboard shortcut
    hint?: string;
}

function TranslateButton({
    isLoading,
    onClick,
    disabled = false,
    hint,
}: TranslateButtonProps) {
    return (
        <button
            className="translate-button"
            onClick={onClick}
            disabled={isLoading || disabled}
        >
            {isLoading ? (
                <LoaderCircle size={18} className="translate-spinner" />
            ) : (
                <Languages size={18} />
            )}
            {isLoading ? "Translating..." : "Translate"}
            {hint && !isLoading && (
                <kbd className="translate-button-hint">{hint}</kbd>
            )}
        </button>
    );
}

export default TranslateButton;
