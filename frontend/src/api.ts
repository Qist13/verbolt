import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export interface TranslateResponse {
    translated_text: string;
    source_language: string;
    target_language: string;
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
