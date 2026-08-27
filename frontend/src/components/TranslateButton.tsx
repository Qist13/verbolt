import "./TranslateButton.css";

interface TranslateButtonProps {
    isLoading: boolean;
    onClick: () => void;
}

function TranslateButton({ isLoading, onClick }: TranslateButtonProps) {
    return (
        <button onClick={onClick} disabled={isLoading}>
            {isLoading ? "Translating..." : "Translate"}
        </button>
    );
}

export default TranslateButton;
