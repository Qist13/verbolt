import ThemeToggle from "./components/ThemeToggle";
import ModeToggle from "./components/ModeToggle";
import type { TranslationMode } from "./components/ModeToggle";
import TextTranslatorCard from "./components/TextTranslatorCard";
import MorseTranslatorCard from "./components/MorseTranslatorCard";
import ImageTranslatorCard from "./components/ImageTranslatorCard";
import ServiceBanner from "./components/ServiceBanner";

import useDarkMode from "./hooks/useDarkMode";
import useLanguages from "./hooks/useLanguages";
import useStoredState from "./hooks/useStoredState";

import "./App.css";

function App() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { languages, error: languagesError, retry } = useLanguages();
    const [activeMode, setActiveMode] = useStoredState<TranslationMode>(
        "verbolt:mode",
        "text",
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
            {/* Morse runs entirely in the browser, so it doesn't need the server */}
            {languagesError && activeMode !== "morse" && (
                <ServiceBanner message={languagesError} onRetry={retry} />
            )}
            {activeMode === "text" && (
                <TextTranslatorCard languages={languages} />
            )}
            {activeMode === "morse" && <MorseTranslatorCard />}
            {activeMode === "image" && (
                <ImageTranslatorCard languages={languages} />
            )}
        </div>
    );
}

export default App;
