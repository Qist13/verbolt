import useStoredState from "./useStoredState";

function useLanguagePair(
    storageKey: string,
    initialSource: string = "auto",
    initialTarget: string = "ja",
) {
    const [sourceLanguage, setSourceLanguage] = useStoredState(
        `verbolt:${storageKey}:source`,
        initialSource,
    );
    const [targetLanguage, setTargetLanguage] = useStoredState(
        `verbolt:${storageKey}:target`,
        initialTarget,
    );

    // `detectedSource` lets an auto-detected language swap into the target
    const swapLanguages = (detectedSource?: string | null) => {
        const oldSource =
            sourceLanguage === "auto"
                ? (detectedSource ?? "en")
                : sourceLanguage;
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
