import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import {
    Check,
    Copy,
    FileAudio,
    FileVideo,
    Mic,
    Square,
    Subtitles,
    X,
} from "lucide-react";

import { getErrorMessage, translateSpeech } from "../api";
import type { SpeechTranslateResponse } from "../api";
import LanguageSelector from "./LanguageSelector";
import TranslateButton from "./TranslateButton";
import ErrorMessage from "./ErrorMessage";
import useLanguagePair from "../hooks/useLanguagePair";
import useRecorder from "../hooks/useRecorder";
import { formatTimestamp, toSrt } from "../utils/subtitles";

// Shares the dropzone and file chip styles with the other upload modes
import "./ImageUpload.css";
import "./FileTranslatorCard.css";
import "./SpeechTranslatorCard.css";

interface SpeechTranslatorCardProps {
    languages: Record<string, string>;
}

const MAX_MEDIA_BYTES = 200 * 1024 * 1024;
// After this long, explain why the request is slow
const SLOW_REQUEST_MS = 6000;

function SpeechTranslatorCard({ languages }: SpeechTranslatorCardProps) {
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [result, setResult] = useState<SpeechTranslateResponse | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    } = useLanguagePair("speech", "auto", "en");
    const [isLoading, setIsLoading] = useState(false);
    const [isSlow, setIsSlow] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [copied, setCopied] = useState(false);
    const mediaRef = useRef<HTMLMediaElement | null>(null);

    const isVideo = mediaFile?.type.startsWith("video/") ?? false;

    // Free the player's object URL when it's replaced or the card unmounts
    useEffect(() => {
        if (!mediaUrl) return;
        return () => URL.revokeObjectURL(mediaUrl);
    }, [mediaUrl]);

    const selectMedia = (file: File | null) => {
        setMediaFile(file);
        setMediaUrl(file ? URL.createObjectURL(file) : null);
        setResult(null);
        setCurrentTime(0);
        setErrorMessage("");
    };

    const recorder = useRecorder(selectMedia);

    const handleRecord = async () => {
        setErrorMessage("");
        try {
            await recorder.start();
        } catch (error) {
            console.error("Could not start recording:", error);
            setErrorMessage(
                "Couldn't access the microphone. Check that one is connected and that the browser has permission to use it.",
            );
        }
    };

    const handleRejection = ([rejection]: FileRejection[]) => {
        const code = rejection?.errors[0]?.code;
        setErrorMessage(
            code === "file-too-large"
                ? "That file is too large. The limit is 200 MB."
                : "That file isn't audio or video.",
        );
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "audio/*": [], "video/*": [] },
        maxFiles: 1,
        maxSize: MAX_MEDIA_BYTES,
        disabled: isLoading || recorder.isRecording,
        onDropAccepted: ([file]) => selectMedia(file),
        onDropRejected: handleRejection,
    });

    const handleTranslate = async () => {
        if (!mediaFile) return;

        setIsLoading(true);
        setErrorMessage("");
        setResult(null);
        const slowTimer = setTimeout(() => setIsSlow(true), SLOW_REQUEST_MS);
        try {
            const response = await translateSpeech(
                mediaFile,
                sourceLanguage,
                targetLanguage,
            );
            if (response.segments.length === 0) {
                setErrorMessage("No speech was detected in this file.");
            } else {
                setResult(response);
            }
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Translation failed. Please try again."),
            );
            console.error("Speech translation failed:", error);
        } finally {
            clearTimeout(slowTimer);
            setIsSlow(false);
            setIsLoading(false);
        }
    };

    const seekTo = (seconds: number) => {
        const media = mediaRef.current;
        if (!media) return;
        media.currentTime = seconds;
        media.play();
    };

    const languageName = (code: string) => {
        const name = Object.entries(languages).find(([, c]) => c === code)?.[0];
        return name ? name[0].toUpperCase() + name.slice(1) : code;
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(
            result.segments
                .map((segment) => segment.translated_text)
                .join("\n"),
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDownloadSubtitles = () => {
        if (!result || !mediaFile) return;
        const srt = toSrt(
            result.segments.map((segment) => ({
                start: segment.start,
                end: segment.end,
                text: segment.translated_text,
            })),
        );
        const url = URL.createObjectURL(
            new Blob([srt], { type: "application/x-subrip" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = `${mediaFile.name.replace(/\.[^.]+$/, "")}_${targetLanguage}.srt`;
        link.click();
        URL.revokeObjectURL(url);
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
                onSwap={() => swapLanguages(result?.detected_language)}
                swapDisabled={sourceLanguage === "auto" && !result}
            />

            {mediaFile && mediaUrl ? (
                <div className="speech-media">
                    <div className="file-chip">
                        <div className="file-chip-icon">
                            {isVideo ? (
                                <FileVideo size={20} />
                            ) : (
                                <FileAudio size={20} />
                            )}
                        </div>
                        <div className="file-chip-text">
                            <p
                                className="file-chip-name"
                                title={mediaFile.name}
                            >
                                {mediaFile.name}
                            </p>
                            <p className="file-chip-size">
                                {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                        </div>
                        <button
                            className="file-chip-remove"
                            onClick={() => selectMedia(null)}
                            disabled={isLoading}
                            aria-label="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    {isVideo ? (
                        <video
                            ref={(element) => {
                                mediaRef.current = element;
                            }}
                            className="speech-player speech-player-video"
                            src={mediaUrl}
                            controls
                            onTimeUpdate={(e) =>
                                setCurrentTime(e.currentTarget.currentTime)
                            }
                        />
                    ) : (
                        <audio
                            ref={(element) => {
                                mediaRef.current = element;
                            }}
                            className="speech-player"
                            src={mediaUrl}
                            controls
                            onTimeUpdate={(e) =>
                                setCurrentTime(e.currentTarget.currentTime)
                            }
                        />
                    )}
                </div>
            ) : recorder.isRecording ? (
                <div className="speech-recording">
                    <span className="speech-recording-dot" />
                    <span className="speech-recording-time">
                        Recording {formatTimestamp(recorder.elapsedSeconds)}
                    </span>
                    <button
                        className="speech-stop-button"
                        onClick={recorder.stop}
                    >
                        <Square size={14} />
                        Stop
                    </button>
                </div>
            ) : (
                <div className="speech-input-options">
                    <div
                        {...getRootProps()}
                        className={`image-dropzone speech-dropzone ${isDragActive ? "drag-active" : ""}`}
                    >
                        <input {...getInputProps()} />
                        <div className="image-dropzone-icon">
                            <FileVideo size={24} />
                        </div>
                        <p className="image-dropzone-title">
                            {isDragActive
                                ? "Drop the file here"
                                : "Drag audio or video here, or click to select"}
                        </p>
                        <p className="image-dropzone-hint">
                            MP3, WAV, M4A, MP4, MOV, WebM and more, up to 200 MB
                        </p>
                    </div>
                    <div className="speech-divider">or</div>
                    <button
                        className="speech-record-button"
                        onClick={handleRecord}
                    >
                        <Mic size={18} />
                        Record from microphone
                    </button>
                </div>
            )}

            {!result && (
                <TranslateButton
                    isLoading={isLoading}
                    onClick={handleTranslate}
                    disabled={!mediaFile}
                />
            )}
            {isSlow && (
                <p className="file-loading-hint">
                    Still working. Transcription takes roughly a quarter of the
                    recording's length, and the first run also downloads the
                    speech model (about 500 MB).
                </p>
            )}
            <ErrorMessage message={errorMessage} />

            {result && (
                <div className="speech-results">
                    <div className="speech-results-header">
                        <span>
                            {sourceLanguage === "auto" && (
                                <>
                                    Detected{" "}
                                    <strong>
                                        {languageName(result.detected_language)}
                                    </strong>{" "}
                                    ·{" "}
                                </>
                            )}
                            {formatTimestamp(result.duration)} ·{" "}
                            {result.segments.length}{" "}
                            {result.segments.length === 1
                                ? "segment"
                                : "segments"}
                        </span>
                        <div className="speech-results-actions">
                            <button
                                className="image-secondary-button"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <Check size={14} />
                                ) : (
                                    <Copy size={14} />
                                )}
                                {copied ? "Copied" : "Copy translation"}
                            </button>
                            <button
                                className="image-secondary-button"
                                onClick={handleDownloadSubtitles}
                            >
                                <Subtitles size={14} />
                                Subtitles (.srt)
                            </button>
                        </div>
                    </div>

                    <ol className="speech-segments">
                        {result.segments.map((segment, index) => {
                            const isActive =
                                currentTime >= segment.start &&
                                currentTime < segment.end;
                            return (
                                <li
                                    key={index}
                                    className={`speech-segment ${isActive ? "active" : ""}`}
                                >
                                    <button
                                        className="speech-segment-time"
                                        onClick={() => seekTo(segment.start)}
                                        aria-label={`Play from ${formatTimestamp(segment.start)}`}
                                    >
                                        {formatTimestamp(segment.start)}
                                    </button>
                                    <div className="speech-segment-text">
                                        <p className="speech-segment-original">
                                            {segment.text}
                                        </p>
                                        <p className="speech-segment-translated">
                                            {segment.translated_text}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>

                    <button
                        className="file-secondary-button speech-new-button"
                        onClick={() => selectMedia(null)}
                    >
                        Translate another recording
                    </button>
                </div>
            )}
        </div>
    );
}

export default SpeechTranslatorCard;
