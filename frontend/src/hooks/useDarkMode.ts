import { useEffect } from "react";
import useStoredState from "./useStoredState";

function useDarkMode() {
    // Follow the system theme until the user picks one
    const [isDarkMode, setIsDarkMode] = useStoredState(
        "verbolt:dark-mode",
        () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    useEffect(() => {
        document.body.classList.toggle("dark", isDarkMode);
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return { isDarkMode, toggleDarkMode };
}

export default useDarkMode;
