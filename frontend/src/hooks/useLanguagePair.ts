import { useState } from "react";

function useLanguagePair(initialTarget: string = "ja") {
    const [sourceLanguage, setSourceLanguage] = useState("auto");
    const [targetLanguage, setTargetLanguage] = useState(initialTarget);

    const swapLanguages = () => {
        const oldSource = sourceLanguage === "auto" ? "en" : sourceLanguage;
        setSourceLanguage(targetLanguage);
        setTargetLanguage(oldSource);
    };

    return {
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        swapLanguages,
    };
}

export default useLanguagePair;
