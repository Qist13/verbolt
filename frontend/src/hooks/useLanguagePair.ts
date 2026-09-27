import { useState } from "react";

function useLanguagePair(
    initialSource: string = "auto",
    initialTarget: string = "ja",
) {
    const [sourceLanguage, setSourceLanguage] = useState(initialSource);
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
