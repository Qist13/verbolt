import axios from "axios";
import { useState } from "react";

function App() {
    const [inputText, setInputText] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("ja");
    const [translatedText, setTranslatedText] = useState("");

    const handleTranslate = async () => {
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
            console.error("Error translating text:", error);
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

            <button onClick={handleTranslate}>Translate</button>

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
