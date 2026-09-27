from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import easyocr
import numpy as np
from PIL import Image, ImageOps
import base64
import io
import os
import threading
from functools import lru_cache

import requests

from image_render import render_translated_image

LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "http://localhost:5000").rstrip("/")
LIBRETRANSLATE_API_KEY = os.getenv("LIBRETRANSLATE_API_KEY")

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

# EasyOCR can't mix CJK scripts in one reader (each only pairs with English),
# so each script gets its own reader. Readers are loaded on first use and cached.
LATIN_OCR_LANGUAGES = ("en", "es", "fr", "de", "it", "pt")

CJK_OCR_LANGUAGES = {
    "ja": ("ja", "en"),
    # LibreTranslate uses "zh-Hans" (older versions use "zh")
    "zh-Hans": ("ch_sim", "en"),
    "zh": ("ch_sim", "en"),
    "ko": ("ko", "en"),
}

_ocr_reader_lock = threading.Lock()


@lru_cache(maxsize=None)
def _load_ocr_reader(languages: tuple[str, ...]) -> easyocr.Reader:
    return easyocr.Reader(list(languages), gpu=False)


def get_ocr_reader(source_language: str) -> easyocr.Reader:
    languages = CJK_OCR_LANGUAGES.get(source_language, LATIN_OCR_LANGUAGES)
    # Lock so concurrent first requests don't load the same model twice
    with _ocr_reader_lock:
        return _load_ocr_reader(languages)


def libretranslate(texts: list[str], source: str, target: str) -> list[str]:
    """Translate a batch of strings in one LibreTranslate request."""
    payload = {"q": texts, "source": source, "target": target, "format": "text"}
    if LIBRETRANSLATE_API_KEY:
        payload["api_key"] = LIBRETRANSLATE_API_KEY

    try:
        response = requests.post(f"{LIBRETRANSLATE_URL}/translate", json=payload, timeout=60)
    except requests.RequestException as e:
        print(f"LibreTranslate unreachable at {LIBRETRANSLATE_URL}: {e}")
        raise HTTPException(status_code=502, detail="Translation service unavailable")

    if not response.ok:
        error = response.json().get("error", response.text) if response.content else response.reason
        print(f"LibreTranslate error {response.status_code}: {error}")
        raise HTTPException(status_code=502, detail=f"Translation failed: {error}")

    return response.json()["translatedText"]


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
    # The image with translations drawn in place, as a data URL
    translated_image: str | None = None


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/translate")
def translate(request: TranslateRequest):
    [result] = libretranslate(
        [request.text], request.source_language, request.target_language
    )

    return {"translated_text": result}


@app.get("/languages")
def get_languages():
    try:
        response = requests.get(f"{LIBRETRANSLATE_URL}/languages", timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Could not load languages from LibreTranslate: {e}")
        raise HTTPException(status_code=502, detail="Translation service unavailable")

    languages = {language["name"]: language["code"] for language in response.json()}

    return {"languages": languages}


CONFIDENCE_THRESHOLD = 0.3


def encode_image(image: Image.Image, original_format: str | None) -> str:
    # Keep PNGs lossless (screenshots, graphics); send photos as JPEG to stay small
    image_format = "PNG" if original_format == "PNG" else "JPEG"
    buffer = io.BytesIO()
    image.save(buffer, format=image_format, quality=90)
    encoded = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/{image_format.lower()};base64,{encoded}"


@app.post("/translate-image", response_model=ImageTranslateResponse)
def translate_image(
    file: UploadFile = File(...),
    source_language: str = Form("en"),
    target_language: str = Form("ja"),
):
    image_bytes = file.file.read()
    image = Image.open(io.BytesIO(image_bytes))
    original_format = image.format
    # Phone photos are often stored sideways with an EXIF rotation flag
    image = ImageOps.exif_transpose(image).convert("RGB")
    image_array = np.array(image)

    ocr_results = get_ocr_reader(source_language).readtext(image_array)

    print(f"OCR found {len(ocr_results)} raw blocks", source_language, target_language)

    blocks = []
    for bounding_box, text, confidence in ocr_results:
        if confidence < CONFIDENCE_THRESHOLD or not text.strip():
            print(f"SKIPPED (low confidence {confidence}): {text}")
            continue
        blocks.append((bounding_box, text.strip(), confidence))

    if not blocks:
        return ImageTranslateResponse(results=[])

    translations = libretranslate(
        [text for _, text, _ in blocks], source_language, target_language
    )

    translated_blocks = [
        (bounding_box, text, confidence, translated.strip())
        for (bounding_box, text, confidence), translated in zip(blocks, translations)
        if translated.strip()
    ]

    results = [
        ImageTranslationResult(
            original_text=text,
            translated_text=translated,
            confidence=confidence,
        )
        for _, text, confidence, translated in translated_blocks
    ]

    # The text results are still useful if drawing the image fails
    try:
        rendered = render_translated_image(
            image_array,
            [(bounding_box, translated) for bounding_box, _, _, translated in translated_blocks],
            target_language,
        )
        translated_image = encode_image(rendered, original_format)
    except Exception as e:
        print(f"Could not render translated image: {e}")
        translated_image = None

    return ImageTranslateResponse(results=results, translated_image=translated_image)
