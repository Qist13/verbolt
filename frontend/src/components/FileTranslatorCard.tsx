import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import { Download, FileText, FileUp, X } from "lucide-react";

import { getErrorMessage, translateFile } from "../api";
import LanguageSelector from "./LanguageSelector";
import TranslateButton from "./TranslateButton";
import ErrorMessage from "./ErrorMessage";
import useLanguagePair from "../hooks/useLanguagePair";

// Shares the dropzone styles with image mode
import "./ImageUpload.css";
import "./FileTranslatorCard.css";

interface FileTranslatorCardProps {
    languages: Record<string, string>;
}

// Must match SUPPORTED_DOCUMENT_EXTENSIONS in the backend
const SUPPORTED_EXTENSIONS = [
    ".docx",
    ".pptx",
    ".pdf",
    ".txt",
    ".odt",
    ".odp",
    ".epub",
    ".html",
    ".srt",
];
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function splitName(name: string): [string, string] {
    const dot = name.lastIndexOf(".");
    return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
}

function FileTranslatorCard({ languages }: FileTranslatorCardProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<{ url: string; name: string } | null>(
        null,
    );
    const {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    } = useLanguagePair("file", "auto", "en");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Free the translated file's object URL when it's replaced or the card unmounts
    useEffect(() => {
        if (!result) return;
        return () => URL.revokeObjectURL(result.url);
    }, [result]);

    const selectFile = (file: File | null) => {
        setSelectedFile(file);
        setResult(null);
        setErrorMessage("");
    };

    const handleRejection = ([rejection]: FileRejection[]) => {
        const code = rejection?.errors[0]?.code;
        setErrorMessage(
            code === "file-too-large"
                ? "That file is too large. The limit is 20 MB."
                : `That file type isn't supported. Use ${SUPPORTED_EXTENSIONS.join(", ")}.`,
        );
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        // Match on extension: browsers report inconsistent MIME types for documents
        accept: { "application/octet-stream": SUPPORTED_EXTENSIONS },
        maxFiles: 1,
        maxSize: MAX_FILE_BYTES,
        disabled: isLoading,
        onDropAccepted: ([file]) => selectFile(file),
        onDropRejected: handleRejection,
    });

    const handleTranslate = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setErrorMessage("");
        setResult(null);
        try {
            const blob = await translateFile(
                selectedFile,
                sourceLanguage,
                targetLanguage,
            );
            const [stem, extension] = splitName(selectedFile.name);
            setResult({
                url: URL.createObjectURL(blob),
                name: `${stem}_${targetLanguage}${extension}`,
            });
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    "File translation failed. Please try again.",
                ),
            );
            console.error("File translation failed:", error);
        } finally {
            setIsLoading(false);
        }
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

            {selectedFile ? (
                <div className="file-chip">
                    <div className="file-chip-icon">
                        <FileText size={20} />
                    </div>
                    <div className="file-chip-text">
                        <p className="file-chip-name" title={selectedFile.name}>
                            {selectedFile.name}
                        </p>
                        <p className="file-chip-size">
                            {formatSize(selectedFile.size)}
                        </p>
                    </div>
                    <button
                        className="file-chip-remove"
                        onClick={() => selectFile(null)}
                        disabled={isLoading}
                        aria-label="Remove file"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`image-dropzone ${isDragActive ? "drag-active" : ""}`}
                >
                    <input {...getInputProps()} />
                    <div className="image-dropzone-icon">
                        <FileUp size={24} />
                    </div>
                    <p className="image-dropzone-title">
                        {isDragActive
                            ? "Drop the file here"
                            : "Drag a document here, or click to select"}
                    </p>
                    <p className="image-dropzone-hint">
                        Word, PowerPoint, PDF, text, OpenDocument, EPUB, HTML,
                        or subtitles (.srt) up to 20 MB
                    </p>
                </div>
            )}

            {result ? (
                <div className="file-result">
                    <a
                        className="file-download-button"
                        href={result.url}
                        download={result.name}
                    >
                        <Download size={18} />
                        Download {result.name}
                    </a>
                    <button
                        className="file-secondary-button"
                        onClick={() => selectFile(null)}
                    >
                        Translate another file
                    </button>
                </div>
            ) : (
                <TranslateButton
                    isLoading={isLoading}
                    onClick={handleTranslate}
                    disabled={!selectedFile}
                />
            )}
            {isLoading && (
                <p className="file-loading-hint">
                    Long documents are translated paragraph by paragraph and can
                    take a few minutes.
                </p>
            )}
            <ErrorMessage message={errorMessage} />
        </div>
    );
}

export default FileTranslatorCard;
