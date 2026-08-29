from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from deep_translator import GoogleTranslator
import easyocr
import numpy as np
from PIL import Image
import io
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED_OCR_LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
}

ocr_reader_latin = easyocr.Reader(["en", "es", "fr", "de", "it", "pt"], gpu=False)

ocr_reader_ja = easyocr.Reader(["ja", "en"], gpu=False)

ocr_reader_zh = easyocr.Reader(["ch_sim", "en"], gpu=False)

ocr_reader_ko = easyocr.Reader(["ko", "en"], gpu=False)


class TranslateRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    source_language: str
    target_language: str


class ImageTranslationResult(BaseModel):
    original_text: str
    translated_text: str
    confidence: float


class ImageTranslateResponse(BaseModel):
    results: list[ImageTranslationResult]


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/translate")
def translate(request: TranslateRequest):
    result = GoogleTranslator(
        source=request.source_language, target=request.target_language
    ).translate(request.text)

    return {"translated_text": result}


@app.get("/languages")
def get_languages():
    languages = GoogleTranslator().get_supported_languages(as_dict=True)

    return {"languages": languages}


CONFIDENCE_THRESHOLD = 0.3


@app.post("/translate-image", response_model=ImageTranslateResponse)
async def translate_image(
    file: UploadFile = File(...),
    source_language: str = Form("en"),
    target_language: str = Form("ja"),
):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image)

    if source_language == "ja":
        reader = ocr_reader_ja
    elif source_language == "zh-CN":
        reader = ocr_reader_zh
    elif source_language == "ko":
        reader = ocr_reader_ko
    else:
        reader = ocr_reader_latin

    ocr_results = reader.readtext(image_array)

    results = []

    print(f"OCR found {len(ocr_results)} raw blocks", source_language, target_language)

    for bounding_box, text, confidence in ocr_results:
        if confidence < CONFIDENCE_THRESHOLD:
            print(f"SKIPPED (low confidence {confidence}): {text}")
            continue

        try:
            translated = GoogleTranslator(
                source="auto", target=target_language
            ).translate(text)
            if translated is None or "Error 500" in translated:
                print(
                    f"SKIPPED (bad translation): {text}",
                    source_language,
                    target_language,
                    translated,
                )
                continue
        except Exception as e:
            print(f"SKIPPED (exception {e}): {text}")
            continue

        results.append(
            ImageTranslationResult(
                original_text=text,
                translated_text=translated,
                confidence=confidence,
            )
        )

        # small delay between requests
        time.sleep(0.5)

    return ImageTranslateResponse(results=results)
