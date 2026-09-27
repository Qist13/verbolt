import { Languages, LoaderCircle } from "lucide-react";
import "./TranslateButton.css";

interface TranslateButtonProps {
    isLoading: boolean;
    onClick: () => void;
}

function TranslateButton({ isLoading, onClick }: TranslateButtonProps) {
    return (
        <button
            className="translate-button"
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <LoaderCircle size={18} className="translate-spinner" />
            ) : (
                <Languages size={18} />
            )}
            {isLoading ? "Translating..." : "Translate"}
        </button>
    );
}

export default TranslateButton;
