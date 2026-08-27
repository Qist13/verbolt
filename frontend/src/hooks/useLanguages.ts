import { useState, useEffect } from "react";
import { fetchLanguages } from "../api";

function useLanguages() {
    const [languages, setLanguages] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchLanguages()
            .then((result) => setLanguages(result))
            .catch((error) =>
                console.error("Failed to load languages:", error),
            );
    }, []);

    return { languages };
}

export default useLanguages;
