import { useState } from "react";
import { translateText } from "../api";

import LanguageSelector from "./LanguageSelector";
import TranslationInput from "./TranslationInput";
import TranslationOutput from "./TranslationOutput";
import TranslateButton from "./TranslateButton";
import ErrorMessage from "./ErrorMessage";

import useLanguagePair from "../hooks/useLanguagePair";

import "./TextTranslatorCard.css";

interface TranslatorCardProps {
    languages: Record<string, string>;
}

function TranslatorCard({ languages }: TranslatorCardProps) {
    const [inputText, setInputText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    } = useLanguagePair();
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

    const handleClearInput = () => {
        setInputText("");
        setTranslatedText("");
        setErrorMessage("");
    };

    return (
        <div className="translator-card">
            <LanguageSelector
                sourceLanguages={languages}
                targetLanguages={languages}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceChange={setSourceLanguage}
                onTargetChange={setTargetLanguage}
                onSwap={swapLanguages}
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
