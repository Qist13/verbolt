import { useState } from "react";
import { Copy } from "lucide-react";
import "./TranslationOutput.css";

interface TranslationOutputProps {
    value: string;
}

function TranslationOutput({ value }: TranslationOutputProps) {
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 1500);
    };

    return (
        <div className="textarea-wrapper">
            <textarea
                className="translator-textarea"
                value={value}
                readOnly
                rows={6}
                placeholder="Translation will appear here"
            />
            {value && (
                <button
                    className="copy-button"
                    onClick={handleCopy}
                    aria-label="Copy translation"
                >
                    <Copy size={14} />
                </button>
            )}
            {showCopiedMessage && <div className="copied-tooltip">Copied!</div>}
        </div>
    );
}

export default TranslationOutput;
