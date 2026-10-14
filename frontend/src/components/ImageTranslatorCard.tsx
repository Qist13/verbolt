import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { getErrorMessage, translateImage } from "../api";
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

// Languages the backend can read with OCR and draw with its fonts
const IMAGE_LANGUAGE_CODES = [
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

// After this long, explain why the request is slow
const SLOW_REQUEST_MS = 6000;

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
    } = useLanguagePair("image", "en");
    const [isLoading, setIsLoading] = useState(false);
    const [isSlow, setIsSlow] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [copied, setCopied] = useState(false);

    const imageLanguages = Object.fromEntries(
        Object.entries(languages).filter(([, code]) =>
            IMAGE_LANGUAGE_CODES.includes(code),
        ),
    );

    // Free the preview's object URL when it's replaced or the card unmounts
    useEffect(() => {
        if (!originalImageUrl) return;
        return () => URL.revokeObjectURL(originalImageUrl);
    }, [originalImageUrl]);

    const resetResults = () => {
        setResults([]);
        setTranslatedImage(null);
        setShowOriginal(false);
        setErrorMessage("");
    };

    const handleImageSelect = useCallback((file: File) => {
        setOriginalImageUrl(URL.createObjectURL(file));
        setSelectedImage(file);
        resetResults();
    }, []);

    const handleImageRemove = () => {
        setOriginalImageUrl(null);
        setSelectedImage(null);
        resetResults();
    };

    const handleTranslate = async () => {
        if (!selectedImage) {
            setErrorMessage("Please select an image first.");
            return;
        }

        setIsLoading(true);
        resetResults();
        const slowTimer = setTimeout(() => setIsSlow(true), SLOW_REQUEST_MS);
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
            setErrorMessage(
                getErrorMessage(
                    error,
                    "Image translation failed. Please try again.",
                ),
            );
            console.error("Image translation failed:", error);
        } finally {
            clearTimeout(slowTimer);
            setIsSlow(false);
            setIsLoading(false);
        }
    };

    const handleCopyAll = () => {
        navigator.clipboard.writeText(
            results.map((result) => result.translated_text).join("\n"),
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="translator-card">
            <LanguageSelector
                sourceLanguages={imageLanguages}
                targetLanguages={imageLanguages}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceChange={setSourceLanguage}
                onTargetChange={setTargetLanguage}
                onSwap={swapLanguages}
                allowAutoDetect={false}
            />

            {/* Once translated, the result view replaces the upload area */}
            {!translatedImage && (
                <>
                    <ImageUpload
                        previewUrl={originalImageUrl}
                        onImageSelect={handleImageSelect}
                        onImageRemove={handleImageRemove}
                        onError={setErrorMessage}
                        disabled={isLoading}
                    />
                    <TranslateButton
                        isLoading={isLoading}
                        onClick={handleTranslate}
                        disabled={!selectedImage}
                    />
                </>
            )}
            {isSlow && (
                <p className="image-slow-hint">
                    Still working. The first translation from a new language
                    downloads its text recognition model, which can take a
                    minute.
                </p>
            )}
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
                        <div className="image-result-actions">
                            <button
                                className="image-secondary-button"
                                onClick={handleImageRemove}
                            >
                                New image
                            </button>
                            <a
                                className="image-download-button"
                                href={translatedImage}
                                download={`translated-${targetLanguage}.${translatedImage.startsWith("data:image/png") ? "png" : "jpg"}`}
                            >
                                <Download size={16} />
                                Download
                            </a>
                        </div>
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
                    <div className="image-results-header">
                        <span>
                            {results.length} text{" "}
                            {results.length === 1 ? "block" : "blocks"} found
                        </span>
                        <button
                            className="image-secondary-button"
                            onClick={handleCopyAll}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "Copied" : "Copy all"}
                        </button>
                    </div>
                    {results.map((result, index) => (
                        <div key={index} className="image-result-row">
                            <div className="image-result-text-group">
                                <p
                                    className="image-result-original"
                                    title={result.original_text}
                                >
                                    {result.original_text}
                                </p>
                                <p
                                    className="image-result-translated"
                                    title={result.translated_text}
                                >
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
