import { X } from "lucide-react";
import "./TranslationInput.css";

interface TranslationInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    maxLength: number;
    isLoading: boolean;
    // Called on Ctrl/Cmd+Enter
    onSubmit?: () => void;
    placeholder?: string;
}

function TranslationInput({
    value,
    onChange,
    onClear,
    maxLength,
    isLoading,
    onSubmit,
    placeholder = "Enter text to translate",
}: TranslationInputProps) {
    return (
        <div className="textarea-wrapper">
            <textarea
                className="translator-textarea"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (
                        onSubmit &&
                        e.key === "Enter" &&
                        (e.ctrlKey || e.metaKey)
                    ) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
                placeholder={placeholder}
                aria-label="Text to translate"
                rows={6}
                maxLength={maxLength}
            />
            {value && (
                <button
                    className="clear-button"
                    disabled={isLoading}
                    onClick={onClear}
                    aria-label="Clear text"
                >
                    <X size={16} />
                </button>
            )}
            <div className="char-counter">
                {value.length} / {maxLength}
            </div>
        </div>
    );
}

export default TranslationInput;
