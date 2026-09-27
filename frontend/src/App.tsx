import { useState } from "react";

import ThemeToggle from "./components/ThemeToggle";
import ModeToggle from "./components/ModeToggle";
import type { TranslationMode } from "./components/ModeToggle";
import TextTranslatorCard from "./components/TextTranslatorCard";
import MorseTranslatorCard from "./components/MorseTranslatorCard";
import ImageTranslatorCard from "./components/ImageTranslatorCard";

import useDarkMode from "./hooks/useDarkMode";
import useLanguages from "./hooks/useLanguages";

import "./App.css";

function App() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { languages } = useLanguages();
    const [activeMode, setActiveMode] = useState<TranslationMode>("text");

    const ocrSupportedCodes = [
        "en",
        "es",
        "fr",
        "de",
        "it",
        "pt",
        "ja",
        "ko",
        "zh-Hans",
        "zh",
    ];

    const imageLanguages = Object.fromEntries(
        Object.entries(languages).filter(([, code]) =>
            ocrSupportedCodes.includes(code),
        ),
    );

    return (
        <div className={`app-container ${isDarkMode ? "dark" : ""}`}>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
            <header className="app-header">
                <h1 className="app-title">Verbolt</h1>
                <p className="app-tagline">
                    Translate text, Morse code, and images in one place.
                </p>
            </header>
            <ModeToggle activeMode={activeMode} onModeChange={setActiveMode} />
            {activeMode === "text" && (
                <TextTranslatorCard languages={languages} />
            )}
            {activeMode === "morse" && <MorseTranslatorCard />}
            {activeMode === "image" && (
                <ImageTranslatorCard languages={imageLanguages} />
            )}
            {activeMode === "voice" && (
                <p className="coming-soon-text">
                    Voice translation coming soon.
                </p>
            )}
            {activeMode === "video" && (
                <p className="coming-soon-text">
                    Video translation coming soon.
                </p>
            )}
        </div>
    );
}

export default App;
