import { useState } from "react";
import { translateImage } from "../api";
import type { ImageTranslationResult } from "../api";
import LanguageSelector from "./LanguageSelector";
import ImageUpload from "./ImageUpload";
import TranslateButton from "./TranslateButton";
import ErrorMessage from "./ErrorMessage";
import useLanguagePair from "../hooks/useLanguagePair";

import "./ImageTranslatorCard.css";

interface ImageTranslatorCardProps {
    languages: Record<string, string>;
}

const OCR_SUPPORTED_CODES = [
    "en",
    "es",
    "fr",
    "de",
    "it",
    "pt",
    "ja",
    "zh-CN",
    "ko",
];

function ImageTranslatorCard({ languages }: ImageTranslatorCardProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [results, setResults] = useState<ImageTranslationResult[]>([]);
    const {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    } = useLanguagePair();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const sourceLanguages = Object.fromEntries(
        Object.entries(languages).filter(([, code]) =>
            OCR_SUPPORTED_CODES.includes(code),
        ),
    );

    const handleTranslate = async () => {
        if (!selectedImage) {
            setErrorMessage("Please select an image first.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setResults([]);
        try {
            const translationResults = await translateImage(
                selectedImage,
                sourceLanguage,
                targetLanguage,
            );

            if (translationResults.length === 0) {
                setErrorMessage(
                    "No translatable text was detected in this image. Try a clearer image or a different source language.",
                );
            } else {
                setResults(translationResults);
            }
        } catch (error) {
            setErrorMessage("Image translation failed. Please try again.");
            console.error("Image translation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="translator-card">
            <LanguageSelector
                sourceLanguages={sourceLanguages}
                targetLanguages={languages}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceChange={setSourceLanguage}
                onTargetChange={setTargetLanguage}
                onSwap={swapLanguages}
                allowAutoDetect={false}
            />

            <ImageUpload onImageSelect={setSelectedImage} />

            <TranslateButton isLoading={isLoading} onClick={handleTranslate} />
            <ErrorMessage message={errorMessage} />

            {results.length > 0 && (
                <div className="image-results-list">
                    {results.map((result, index) => (
                        <div key={index} className="image-result-row">
                            <div className="image-result-text-group">
                                <p className="image-result-original">
                                    {result.original_text}
                                </p>
                            </div>
                            <span className="image-result-arrow">→</span>
                            <div className="image-result-text-group">
                                <p className="image-result-translated">
                                    {result.translated_text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ImageTranslatorCard;
