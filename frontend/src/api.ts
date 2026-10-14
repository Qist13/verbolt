import axios from "axios";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export interface TranslateResponse {
    translated_text: string;
    // Set when the source language was "auto"
    detected_language: string | null;
}

export interface ImageTranslationResult {
    original_text: string;
    translated_text: string;
    confidence: number;
}

/** The backend's error detail if there is one, otherwise `fallback`. */
export function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return "Can't reach the Verbolt server. Is the backend running?";
        }
        const detail = error.response.data?.detail;
        if (typeof detail === "string") return detail;
    }
    return fallback;
}

export async function translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
): Promise<TranslateResponse> {
    const response = await axios.post<TranslateResponse>(
        `${API_BASE_URL}/translate`,
        {
            text,
            source_language: sourceLanguage,
            target_language: targetLanguage,
        },
    );
    return response.data;
}

export async function fetchLanguages(): Promise<Record<string, string>> {
    const response = await axios.get<{ languages: Record<string, string> }>(
        `${API_BASE_URL}/languages`,
    );

    return response.data.languages;
}

export interface ImageTranslateResponse {
    results: ImageTranslationResult[];
    // Data URL of the image with translations drawn in place, if rendering worked
    translated_image: string | null;
}

export async function translateImage(
    imageFile: File,
    sourceLanguage: string,
    targetLanguage: string,
): Promise<ImageTranslateResponse> {
    const formData = new FormData();

    formData.append("file", imageFile);
    formData.append("source_language", sourceLanguage);
    formData.append("target_language", targetLanguage);

    const response = await axios.post<ImageTranslateResponse>(
        `${API_BASE_URL}/translate-image`,
        formData,
    );

    return response.data;
}

/** Translates a document, returning the translated file in the same format. */
export async function translateFile(
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
): Promise<Blob> {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("source_language", sourceLanguage);
    formData.append("target_language", targetLanguage);

    try {
        const response = await axios.post<Blob>(
            `${API_BASE_URL}/translate-file`,
            formData,
            { responseType: "blob" },
        );
        return response.data;
    } catch (error) {
        // Errors come back as a Blob too; parse them so getErrorMessage can read the detail
        if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
            try {
                error.response.data = JSON.parse(
                    await error.response.data.text(),
                );
            } catch {
                // Not JSON: leave it for the generic message
            }
        }
        throw error;
    }
}
