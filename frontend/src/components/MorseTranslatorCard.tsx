import { useState } from "react";

import TranslationInput from "./TranslationInput";
import TranslationOutput from "./TranslationOutput";
import TranslateButton from "./TranslateButton";
import ErrorMessage from "./ErrorMessage";

import { encodeToMorse, decodeFromMorse } from "../utils/morseCode";

import "./MorseTranslatorCard.css";

function MorseTranslatorCard() {
    const [inputText, setInputText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [currentMode, setCurrentMode] = useState<"Encode" | "Decode">(
        "Decode",
    );
    const [errorMessage, setErrorMessage] = useState("");

    const handleEncode = () => {
        setTranslatedText(encodeToMorse(inputText));
    };

    const handleDecode = () => {
        setTranslatedText(decodeFromMorse(inputText));
    };

    const handleClearInput = () => {
        setInputText("");
        setTranslatedText("");
        setErrorMessage("");
    };

    return (
        <div className="translator-card">
            <select
                className="morse-mode-select"
                value={currentMode}
                onChange={(e) =>
                    setCurrentMode(e.target.value as "Encode" | "Decode")
                }
            >
                <option value={"Decode"}>Decode</option>
                <option value={"Encode"}>Encode</option>
            </select>

            <div className="morse-textarea-row">
                <TranslationInput
                    value={inputText}
                    onChange={setInputText}
                    onClear={handleClearInput}
                    maxLength={2000}
                    isLoading={false}
                />
                <TranslationOutput value={translatedText} />
            </div>

            <TranslateButton
                isLoading={false}
                onClick={currentMode === "Encode" ? handleEncode : handleDecode}
            />
            <ErrorMessage message={errorMessage} />
        </div>
    );
}

export default MorseTranslatorCard;
