import axios from "axios";
import { useState } from "react";

function App() {
    const [inputText, setInputText] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("ja");
    const [translatedText, setTranslatedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleTranslate = async () => {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await axios.post(
                "http://localhost:8000/translate",
                {
                    text: inputText,
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

            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to translate"
                rows={4}
            />

            <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
            >
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ja">Japanese</option>
                <option value="de">German</option>
            </select>

            <button onClick={handleTranslate} disabled={isLoading}>
                {isLoading ? "Translating..." : "Translate"}
            </button>

            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

            {translatedText && (
                <div>
                    <h3>Translation:</h3>
                    <p>{translatedText}</p>
                </div>
            )}
        </div>
    );
}

export default App;
