import ThemeToggle from "./components/ThemeToggle";
import TranslatorCard from "./components/TranslatorCard";
import useDarkMode from "./hooks/useDarkMode";
import useLanguages from "./hooks/useLanguages";
import "./App.css";

function App() {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { languages } = useLanguages();

    return (
        <div className={`app-container ${isDarkMode ? "dark" : ""}`}>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
            <h1>Verbolt</h1>
            <TranslatorCard languages={languages} />
        </div>
    );
}

export default App;
