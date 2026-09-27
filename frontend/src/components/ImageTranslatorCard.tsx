import { useState } from "react";
import { Download } from "lucide-react";
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
    "zh-Hans",
    "zh",
    "ko",
];

function ImageTranslatorCard({ languages }: ImageTranslatorCardProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [results, setResults] = useState<ImageTranslationResult[]>([]);
    const [translatedImage, setTranslatedImage] = useState<string | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(
        null,
    );
    const [showOriginal, setShowOriginal] = useState(false);
    const {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    } = useLanguagePair("en");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const sourceLanguages = Object.fromEntries(
        Object.entries(languages).filter(([, code]) =>
            OCR_SUPPORTED_CODES.includes(code),
        ),
    );

    const handleImageSelect = (file: File) => {
        if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        setOriginalImageUrl(URL.createObjectURL(file));
        setSelectedImage(file);
        setResults([]);
        setTranslatedImage(null);
        setErrorMessage("");
    };

    const handleTranslate = async () => {
        if (!selectedImage) {
            setErrorMessage("Please select an image first.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setResults([]);
        setTranslatedImage(null);
        setShowOriginal(false);
        try {
            const response = await translateImage(
                selectedImage,
                sourceLanguage,
                targetLanguage,
            );

            if (response.results.length === 0) {
                setErrorMessage(
                    "No translatable text was detected in this image. Try a clearer image or a different source language.",
                );
            } else {
                setResults(response.results);
                setTranslatedImage(response.translated_image);
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

            <ImageUpload onImageSelect={handleImageSelect} />

            <TranslateButton isLoading={isLoading} onClick={handleTranslate} />
            <ErrorMessage message={errorMessage} />

            {translatedImage && (
                <div className="image-result-preview">
                    <div className="image-result-toolbar">
                        <div className="image-view-toggle">
                            <button
                                className={!showOriginal ? "active" : ""}
                                onClick={() => setShowOriginal(false)}
                            >
                                Translated
                            </button>
                            <button
                                className={showOriginal ? "active" : ""}
                                onClick={() => setShowOriginal(true)}
                            >
                                Original
                            </button>
                        </div>
                        <a
                            className="image-download-button"
                            href={translatedImage}
                            download={`translated-${targetLanguage}.${translatedImage.startsWith("data:image/png") ? "png" : "jpg"}`}
                        >
                            <Download size={16} />
                            Download
                        </a>
                    </div>
                    <img
                        className="image-result-image"
                        src={
                            showOriginal && originalImageUrl
                                ? originalImageUrl
                                : translatedImage
                        }
                        alt={
                            showOriginal
                                ? "Original image"
                                : "Image with translated text"
                        }
                    />
                </div>
            )}

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
