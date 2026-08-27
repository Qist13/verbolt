import "./TranslationInput.css";

interface TranslationInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    maxLength: number;
    isLoading: boolean;
}

function TranslationInput({
    value,
    onChange,
    onClear,
    maxLength,
    isLoading,
}: TranslationInputProps) {
    return (
        <div className="textarea-wrapper">
            <textarea
                className="translator-textarea"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter text to translate"
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
                    ✕
                </button>
            )}
            <div className="char-counter">
                {value.length} / {maxLength}
            </div>
        </div>
    );
}

export default TranslationInput;
