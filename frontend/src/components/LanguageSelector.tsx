import "./LanguageSelector.css";

interface LanguageSelectorProps {
    sourceLanguages: Record<string, string>;
    targetLanguages: Record<string, string>;
    sourceLanguage: string;
    targetLanguage: string;
    onSourceChange: (value: string) => void;
    onTargetChange: (value: string) => void;
    onSwap: () => void;
    allowAutoDetect?: boolean;
}

function LanguageSelector({
    sourceLanguages,
    targetLanguages,
    sourceLanguage,
    targetLanguage,
    onSourceChange,
    onTargetChange,
    onSwap,
    allowAutoDetect = true,
}: LanguageSelectorProps) {
    return (
        <div className="language-row">
            <select
                className="language-select"
                value={sourceLanguage}
                onChange={(e) => onSourceChange(e.target.value)}
            >
                {allowAutoDetect && <option value="auto">Auto-detect</option>}
                {Object.entries(sourceLanguages).map(([name, code]) => (
                    <option key={code} value={code}>
                        {name[0].toUpperCase() + name.slice(1)}
                    </option>
                ))}
            </select>

            <button
                className="swap-button"
                onClick={onSwap}
                disabled={sourceLanguage === "auto"}
                aria-label="Swap languages"
            >
                ⇄
            </button>

            <select
                className="language-select"
                value={targetLanguage}
                onChange={(e) => onTargetChange(e.target.value)}
            >
                {Object.entries(targetLanguages).map(([name, code]) => (
                    <option key={code} value={code}>
                        {name[0].toUpperCase() + name.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default LanguageSelector;
