import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Play, Square } from "lucide-react";

import TranslationInput from "./TranslationInput";
import TranslationOutput from "./TranslationOutput";

import {
    encodeToMorse,
    decodeFromMorse,
    looksLikeMorse,
} from "../utils/morseCode";
import { playMorse } from "../utils/morseAudio";
import useStoredState from "../hooks/useStoredState";

import "./MorseTranslatorCard.css";

type MorseDirection = "encode" | "decode";

function MorseTranslatorCard() {
    const [inputText, setInputText] = useState("");
    const [direction, setDirection] = useStoredState<MorseDirection>(
        "verbolt:morse-direction",
        "encode",
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const stopPlaybackRef = useRef<(() => void) | null>(null);

    // Conversion is instant, so the output follows the input as you type
    const outputText =
        direction === "encode"
            ? encodeToMorse(inputText)
            : decodeFromMorse(inputText);
    const morseText = direction === "encode" ? outputText : inputText;

    const suggestDecode = direction === "encode" && looksLikeMorse(inputText);

    const stopPlayback = () => stopPlaybackRef.current?.();

    // Stop the beeping if the card unmounts (e.g. switching modes)
    useEffect(() => stopPlayback, []);

    const handlePlay = () => {
        if (isPlaying) {
            stopPlayback();
            return;
        }
        setIsPlaying(true);
        stopPlaybackRef.current = playMorse(morseText, () => {
            stopPlaybackRef.current = null;
            setIsPlaying(false);
        });
    };

    const changeDirection = (newDirection: MorseDirection) => {
        if (newDirection === direction) return;
        stopPlayback();
        setDirection(newDirection);
        // Carry the result over so it can be converted back
        setInputText(outputText);
    };

    const handleClearInput = () => {
        stopPlayback();
        setInputText("");
    };

    return (
        <div className="translator-card">
            <div className="morse-toolbar">
                <div
                    className="morse-direction-toggle"
                    role="radiogroup"
                    aria-label="Conversion direction"
                >
                    <button
                        role="radio"
                        aria-checked={direction === "encode"}
                        className={direction === "encode" ? "active" : ""}
                        onClick={() => changeDirection("encode")}
                    >
                        Text
                        <ArrowLeftRight size={12} className="morse-arrow" />
                        Morse
                    </button>
                    <button
                        role="radio"
                        aria-checked={direction === "decode"}
                        className={direction === "decode" ? "active" : ""}
                        onClick={() => changeDirection("decode")}
                    >
                        Morse
                        <ArrowLeftRight size={12} className="morse-arrow" />
                        Text
                    </button>
                </div>

                <button
                    className="morse-play-button"
                    onClick={handlePlay}
                    disabled={!/[.-]/.test(morseText)}
                    aria-label={isPlaying ? "Stop playback" : "Play Morse code"}
                >
                    {isPlaying ? <Square size={14} /> : <Play size={14} />}
                    {isPlaying ? "Stop" : "Play"}
                </button>
            </div>

            <div className="morse-textarea-row">
                <TranslationInput
                    value={inputText}
                    onChange={setInputText}
                    onClear={handleClearInput}
                    maxLength={2000}
                    isLoading={false}
                    placeholder={
                        direction === "encode"
                            ? "Type text to encode"
                            : "Type Morse code, e.g. ... --- ... / ..."
                    }
                />
                <TranslationOutput
                    value={outputText}
                    placeholder={
                        direction === "encode"
                            ? "Morse code will appear here"
                            : "Decoded text will appear here"
                    }
                />
            </div>

            {suggestDecode && (
                <p className="morse-suggestion">
                    That looks like Morse code.{" "}
                    <button onClick={() => setDirection("decode")}>
                        Decode it instead
                    </button>
                </p>
            )}

            <p className="morse-help">
                Separate letters with spaces and words with <code>/</code>.
                Characters with no Morse equivalent show as <code>?</code>.
            </p>
        </div>
    );
}

export default MorseTranslatorCard;
