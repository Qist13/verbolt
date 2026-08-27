import axios from "axios";
import { useState, useEffect } from "react";

function App() {
    const [inputText, setInputText] = useState("");
    const [sourceLanguage, setSourceLanguage] = useState("auto");
    const [targetLanguage, setTargetLanguage] = useState("ja");
    const [translatedText, setTranslatedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [languages, setLanguages] = useState<Record<string, string>>({});

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

    return (
        <div>
            <h1>Verbolt</h1>

            <select
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

            <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
            >
                {Object.entries(languages).map(([name, code]) => (
                    <option key={code} value={code}>
                        {name[0].toUpperCase() + name.slice(1)}
                    </option>
                ))}
            </select>

            <div>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate"
                    rows={4}
                />
                <textarea
                    value={translatedText}
                    readOnly
                    rows={4}
                    placeholder="Translated text"
                />
            </div>

            <button onClick={handleTranslate} disabled={isLoading}>
                {isLoading ? "Translating..." : "Translate"}
            </button>

            {errorMessage && <p>{errorMessage}</p>}
        </div>
    );
}

export default App;
