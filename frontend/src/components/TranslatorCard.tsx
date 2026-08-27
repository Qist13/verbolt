import { useState } from "react";
import { translateText } from "../api";
import LanguageSelector from "./LanguageSelector";
import TranslationInput from "./TranslationInput";
import TranslationOutput from "./TranslationOutput";
import TranslateButton from "./TranslateButton";
import ErrorMessage from "./ErrorMessage";
import "./TranslatorCard.css";

interface TranslatorCardProps {
    languages: Record<string, string>;
}

function TranslatorCard({ languages }: TranslatorCardProps) {
    const [inputText, setInputText] = useState("");
    const [sourceLanguage, setSourceLanguage] = useState("auto");
    const [targetLanguage, setTargetLanguage] = useState("ja");
    const [translatedText, setTranslatedText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleTranslate = async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const result = await translateText(
                inputText,
                sourceLanguage,
                targetLanguage,
            );
            setTranslatedText(result.translated_text);
        } catch (error) {
            setErrorMessage("Translation failed. Please try again.");
            console.error("Translation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwapLanguages = () => {
        const oldSource = sourceLanguage === "auto" ? "en" : sourceLanguage;
        setSourceLanguage(targetLanguage);
        setTargetLanguage(oldSource);
        setInputText(translatedText);
        setTranslatedText(inputText);
    };

    const handleClearInput = () => {
        setInputText("");
        setTranslatedText("");
    };

    return (
        <div className="translator-card">
            <LanguageSelector
                languages={languages}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceChange={setSourceLanguage}
                onTargetChange={setTargetLanguage}
                onSwap={handleSwapLanguages}
            />

            <div className="textarea-row">
                <TranslationInput
                    value={inputText}
                    onChange={setInputText}
                    onClear={handleClearInput}
                    maxLength={2000}
                    isLoading={isLoading}
                />
                <TranslationOutput value={translatedText} />
            </div>

            <TranslateButton isLoading={isLoading} onClick={handleTranslate} />
            <ErrorMessage message={errorMessage} />
        </div>
    );
}

export default TranslatorCard;
