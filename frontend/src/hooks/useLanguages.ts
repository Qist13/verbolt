import { useState, useEffect, useCallback } from "react";
import { fetchLanguages, getErrorMessage } from "../api";

function useLanguages() {
    const [languages, setLanguages] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLanguages = useCallback(
        () =>
            fetchLanguages()
                .then((result) => {
                    setLanguages(result);
                    setError("");
                })
                .catch((error) => {
                    console.error("Failed to load languages:", error);
                    setError(
                        getErrorMessage(
                            error,
                            "Couldn't load the language list.",
                        ),
                    );
                })
                .finally(() => setIsLoading(false)),
        [],
    );

    useEffect(() => {
        loadLanguages();
    }, [loadLanguages]);

    const retry = () => {
        setIsLoading(true);
        loadLanguages();
    };

    return { languages, isLoading, error, retry };
}

export default useLanguages;
