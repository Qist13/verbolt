import "./LanguageSelector.css";

interface LanguageSelectorProps {
    languages: Record<string, string>;
    sourceLanguage: string;
    targetLanguage: string;
    onSourceChange: (value: string) => void;
    onTargetChange: (value: string) => void;
    onSwap: () => void;
}

function LanguageSelector({
    languages,
    sourceLanguage,
    targetLanguage,
    onSourceChange,
    onTargetChange,
    onSwap,
}: LanguageSelectorProps) {
    return (
        <div className="language-row">
            <select
                className="language-select"
                value={sourceLanguage}
                onChange={(e) => onSourceChange(e.target.value)}
            >
                <option value="auto">Auto-detect</option>
                {Object.entries(languages).map(([name, code]) => (
                    <option key={code} value={code}>
                        {name[0].toUpperCase() + name.slice(1)}
                    </option>
                ))}
            </select>

            <button
                className="swap-button"
                onClick={onSwap}
                aria-label="Swap languages"
            >
                ⇄
            </button>

            <select
                className="language-select"
                value={targetLanguage}
                onChange={(e) => onTargetChange(e.target.value)}
            >
                {Object.entries(languages).map(([name, code]) => (
                    <option key={code} value={code}>
                        {name[0].toUpperCase() + name.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default LanguageSelector;
