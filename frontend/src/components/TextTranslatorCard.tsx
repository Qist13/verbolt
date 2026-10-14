import { useState } from "react";
import { getErrorMessage, translateText } from "../api";

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

const isMac = navigator.platform.toUpperCase().includes("MAC");

function TranslatorCard({ languages }: TranslatorCardProps) {
    const [inputText, setInputText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState<string | null>(
        null,
    );
    const {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    } = useLanguagePair("text");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const canTranslate = inputText.trim().length > 0;

    const languageName = (code: string) => {
        const name = Object.entries(languages).find(([, c]) => c === code)?.[0];
        return name ? name[0].toUpperCase() + name.slice(1) : code;
    };

    const handleTranslate = async () => {
        if (!canTranslate || isLoading) return;

        setIsLoading(true);
        setErrorMessage("");

        try {
            const result = await translateText(
                inputText,
                sourceLanguage,
                targetLanguage,
            );
            setTranslatedText(result.translated_text);
            setDetectedLanguage(result.detected_language);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Translation failed. Please try again."),
            );
            console.error("Translation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSourceChange = (code: string) => {
        setSourceLanguage(code);
        setDetectedLanguage(null);
    };

    const handleSwap = () => {
        swapLanguages(detectedLanguage);
        // Carry the translation over so it can be translated back
        setInputText(translatedText);
        setTranslatedText(inputText);
        setDetectedLanguage(null);
    };

    const handleClearInput = () => {
        setInputText("");
        setTranslatedText("");
        setDetectedLanguage(null);
        setErrorMessage("");
    };

    return (
        <div className="translator-card">
            <LanguageSelector
                sourceLanguages={languages}
                targetLanguages={languages}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceChange={handleSourceChange}
                onTargetChange={setTargetLanguage}
                onSwap={handleSwap}
                swapDisabled={sourceLanguage === "auto" && !detectedLanguage}
            />

            {sourceLanguage === "auto" && detectedLanguage && (
                <p className="detected-language">
                    Detected: <strong>{languageName(detectedLanguage)}</strong>
                </p>
            )}

            <div className="textarea-row">
                <TranslationInput
                    value={inputText}
                    onChange={setInputText}
                    onClear={handleClearInput}
                    onSubmit={handleTranslate}
                    maxLength={2000}
                    isLoading={isLoading}
                />
                <TranslationOutput
                    value={translatedText}
                    isLoading={isLoading}
                />
            </div>

            <TranslateButton
                isLoading={isLoading}
                onClick={handleTranslate}
                disabled={!canTranslate}
                hint={isMac ? "⌘ Enter" : "Ctrl Enter"}
            />
            <ErrorMessage message={errorMessage} />
        </div>
    );
}

export default TranslatorCard;
