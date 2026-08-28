import { useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import ModeToggle from "./components/ModeToggle";
import type { TranslationMode } from "./components/ModeToggle";
import TextTranslatorCard from "./components/TextTranslatorCard";
import MorseTranslatorCard from "./components/MorseTranslatorCard";

import useDarkMode from "./hooks/useDarkMode";
import useLanguages from "./hooks/useLanguages";

import "./App.css";

function App() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { languages } = useLanguages();
    const [activeMode, setActiveMode] = useState<TranslationMode>("text");

    return (
        <div className={`app-container ${isDarkMode ? "dark" : ""}`}>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
            <h1>Verbolt</h1>
            <ModeToggle activeMode={activeMode} onModeChange={setActiveMode} />
            {activeMode === "text" && (
                <TextTranslatorCard languages={languages} />
            )}
            {activeMode === "morse" && <MorseTranslatorCard />}
            {activeMode === "image" && <p>Image translation coming soon.</p>}
            {activeMode === "voice" && <p>Voice translation coming soon.</p>}
        </div>
    );
}

export default App;
