import axios from "axios";
import { useState, useEffect } from "react";
import { Copy } from "lucide-react";

function App() {
    const [inputText, setInputText] = useState("");
    const [sourceLanguage, setSourceLanguage] = useState("auto");
    const [targetLanguage, setTargetLanguage] = useState("ja");
    const [translatedText, setTranslatedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [languages, setLanguages] = useState<Record<string, string>>({});
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);

    useEffect(() => {
        axios
            .get("http://localhost:8000/languages")
            .then((response) => setLanguages(response.data.languages))
            .catch((error) =>
                console.error("Failed to load languages:", error),
            );
    }, []);

    const handleTranslate = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await axios.post(
                "http://localhost:8000/translate",
                {
                    text: inputText,
                    source_language: sourceLanguage,
                    target_language: targetLanguage,
                },
            );

            setTranslatedText(response.data.translated_text);
        } catch (error) {
            setErrorMessage("Failed to translate text. Please try again.");
            console.error("Error translating text:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwapLanguages = () => {
        const newTargetLanguage =
            sourceLanguage === "auto" ? "en" : sourceLanguage;

        setSourceLanguage(targetLanguage);
        setTargetLanguage(newTargetLanguage);

        setInputText(translatedText);
        setTranslatedText(inputText);
    };

    const handleClearInput = () => {
        setInputText("");
        setTranslatedText("");
    };

    const handleCopyTranslation = () => {
        navigator.clipboard.writeText(translatedText);
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 1500);
    };

    return (
        <div className="app-container">
            <h1>Verbolt</h1>

            <div className="language-row">
                <select
                    className="language-select"
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
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
                    onClick={handleSwapLanguages}
                    disabled={isLoading}
                    aria-label="Swap languages"
                >
                    ⇄
                </button>

                <select
                    className="language-select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                >
                    {Object.entries(languages).map(([name, code]) => (
                        <option key={code} value={code}>
                            {name[0].toUpperCase() + name.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="textarea-row">
                <div className="textarea-wrapper">
                    <textarea
                        className="translator-textarea"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter text to translate"
                        rows={6}
                        maxLength={2000}
                    />
                    {inputText && (
                        <button
                            className="clear-button"
                            disabled={isLoading}
                            onClick={handleClearInput}
                            aria-label="Clear text"
                        >
                            ✕
                        </button>
                    )}
                    <div className="char-counter">
                        {inputText.length} / 2000
                    </div>
                </div>
                <div className="textarea-wrapper">
                    <textarea
                        className="translator-textarea"
                        value={translatedText}
                        readOnly
                        rows={6}
                        placeholder="Translation will appear here"
                    />
                    {translatedText && (
                        <button
                            className="copy-button"
                            onClick={handleCopyTranslation}
                            aria-label="Copy translation"
                        >
                            <Copy size={14} />
                        </button>
                    )}
                    {showCopiedMessage && (
                        <div className="copied-tooltip">Copied!</div>
                    )}
                </div>
            </div>

            <button onClick={handleTranslate} disabled={isLoading}>
                {isLoading ? "Translating..." : "Translate"}
            </button>

            {errorMessage && <p className="error-text">{errorMessage}</p>}
        </div>
    );
}

export default App;
