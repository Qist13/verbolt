import { ArrowLeftRight } from "lucide-react";
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
    // Defaults to disabled while the source is "auto"
    swapDisabled?: boolean;
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
    swapDisabled = sourceLanguage === "auto",
}: LanguageSelectorProps) {
    return (
        <div className="language-row">
            <select
                className="language-select"
                aria-label="Source language"
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
                onClick={() => onSwap()}
                disabled={swapDisabled}
                aria-label="Swap languages"
            >
                <ArrowLeftRight size={16} />
            </button>

            <select
                className="language-select"
                aria-label="Target language"
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
