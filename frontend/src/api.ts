import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export interface TranslateResponse {
    translated_text: string;
    source_language: string;
    target_language: string;
}

export interface ImageTranslationResult {
    original_text: string;
    translated_text: string;
    confidence: number;
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

export async function translateImage(
    imageFile: File,
    targetLanguage: string,
): Promise<ImageTranslationResult[]> {
    const formData = new FormData();

    formData.append("file", imageFile);
    formData.append("target_language", targetLanguage);

    const response = await axios.post<{ results: ImageTranslationResult[] }>(
        `${API_BASE_URL}/translate-image`,
        formData,
    );

    return response.data.results;
}
