from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import easyocr
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
import base64
import io
import os
import threading
from functools import lru_cache
from urllib.parse import quote, urlsplit

import requests

from image_render import render_translated_image
from speech import to_whisper_language, transcribe

LIBRETRANSLATE_URL = os.getenv("LIBRETRANSLATE_URL", "http://localhost:5000").rstrip("/")
LIBRETRANSLATE_API_KEY = os.getenv("LIBRETRANSLATE_API_KEY")
# Comma-separated list of frontend origins allowed to call the API. When unset,
# any localhost port is allowed, since Vite moves to 5174+ if 5173 is taken.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
LOCALHOST_ORIGIN_REGEX = r"http://(localhost|127\.0\.0\.1)(:\d+)?"

MAX_IMAGE_BYTES = 10 * 1024 * 1024
# Very large images make OCR slow without improving accuracy
MAX_IMAGE_PIXELS = 40_000_000

MAX_DOCUMENT_BYTES = 20 * 1024 * 1024
MAX_MEDIA_BYTES = 200 * 1024 * 1024
# Formats LibreTranslate can translate while keeping the file's layout
SUPPORTED_DOCUMENT_EXTENSIONS = {
    ".txt", ".odt", ".odp", ".docx", ".pptx", ".epub", ".html", ".srt", ".pdf",
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=None if ALLOWED_ORIGINS else LOCALHOST_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def libretranslate(texts: list[str], source: str, target: str) -> dict:
    """Translate a batch of strings in one LibreTranslate request.

    Returns LibreTranslate's response: "translatedText" is a list matching
    `texts`, and "detectedLanguage" is set when `source` is "auto".
    """
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

    return response.json()


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
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
    data = libretranslate(
        [request.text], request.source_language, request.target_language
    )

    # Batch requests get one detection per string
    detected = data.get("detectedLanguage")
    if isinstance(detected, list):
        detected = detected[0] if detected else None

    return {
        "translated_text": data["translatedText"][0],
        "detected_language": detected.get("language") if detected else None,
    }


def fetch_languages() -> dict[str, str]:
    """Language names to codes for every language LibreTranslate has installed."""
    try:
        response = requests.get(f"{LIBRETRANSLATE_URL}/languages", timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Could not load languages from LibreTranslate: {e}")
        raise HTTPException(status_code=502, detail="Translation service unavailable")

    return {language["name"]: language["code"] for language in response.json()}


@app.get("/languages")
def get_languages():
    return {"languages": fetch_languages()}


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
    image_bytes = file.file.read(MAX_IMAGE_BYTES + 1)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large (max 10 MB)")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.width * image.height > MAX_IMAGE_PIXELS:
            raise HTTPException(status_code=413, detail="Image dimensions are too large")
        original_format = image.format
        # Phone photos are often stored sideways with an EXIF rotation flag
        image = ImageOps.exif_transpose(image).convert("RGB")
    except Image.DecompressionBombError:
        raise HTTPException(status_code=413, detail="Image dimensions are too large")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="That file isn't a readable image")
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
    )["translatedText"]

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


@app.post("/translate-file")
def translate_file(
    file: UploadFile = File(...),
    source_language: str = Form("auto"),
    target_language: str = Form("en"),
):
    filename = os.path.basename(file.filename or "")
    stem, extension = os.path.splitext(filename)
    extension = extension.lower()
    if extension not in SUPPORTED_DOCUMENT_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Use one of: {', '.join(sorted(SUPPORTED_DOCUMENT_EXTENSIONS))}",
        )

    file_bytes = file.file.read(MAX_DOCUMENT_BYTES + 1)
    if len(file_bytes) > MAX_DOCUMENT_BYTES:
        raise HTTPException(status_code=413, detail="File is too large (max 20 MB)")

    data = {"source": source_language, "target": target_language}
    if LIBRETRANSLATE_API_KEY:
        data["api_key"] = LIBRETRANSLATE_API_KEY

    try:
        # Large documents are translated paragraph by paragraph and can take minutes
        response = requests.post(
            f"{LIBRETRANSLATE_URL}/translate_file",
            files={"file": (filename, file_bytes, file.content_type)},
            data=data,
            timeout=600,
        )
        if not response.ok:
            error = response.json().get("error", response.text) if response.content else response.reason
            print(f"LibreTranslate file error {response.status_code}: {error}")
            raise HTTPException(status_code=502, detail=f"Translation failed: {error}")

        # LibreTranslate links to the result using its own idea of its hostname,
        # which may not be reachable from here, so only keep the path
        download_path = urlsplit(response.json()["translatedFileUrl"]).path
        download = requests.get(f"{LIBRETRANSLATE_URL}{download_path}", timeout=60)
        download.raise_for_status()
    except requests.RequestException as e:
        print(f"File translation via LibreTranslate failed: {e}")
        raise HTTPException(status_code=502, detail="Translation service unavailable")

    translated_name = f"{stem}_{target_language}{extension}"
    return Response(
        content=download.content,
        media_type=download.headers.get("Content-Type", "application/octet-stream"),
        headers={
            # filename* keeps non-ASCII names intact
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(translated_name)}",
        },
    )


class SpeechSegment(BaseModel):
    start: float
    end: float
    text: str
    translated_text: str


class SpeechTranslateResponse(BaseModel):
    # LibreTranslate code of the spoken language
    detected_language: str
    duration: float
    segments: list[SpeechSegment]


@app.post("/translate-speech", response_model=SpeechTranslateResponse)
def translate_speech(
    file: UploadFile = File(...),
    source_language: str = Form("auto"),
    target_language: str = Form("en"),
):
    if file.size is not None and file.size > MAX_MEDIA_BYTES:
        raise HTTPException(status_code=413, detail="File is too large (max 200 MB)")

    whisper_language = None
    if source_language != "auto":
        whisper_language = to_whisper_language(source_language)
        if whisper_language is None:
            raise HTTPException(
                status_code=400,
                detail="Speech recognition doesn't support that source language",
            )

    try:
        # The upload is already spooled to disk, so pass the file straight through
        segments, spoken_language, duration = transcribe(file.file, whisper_language)
    except ValueError as e:
        print(f"Could not read audio: {e}")
        raise HTTPException(status_code=400, detail="Couldn't find any audio in that file")

    if source_language == "auto":
        # Map Whisper's code back to the one LibreTranslate uses
        installed = set(fetch_languages().values())
        source_language = next(
            (code for code in installed if to_whisper_language(code) == spoken_language),
            None,
        )
        if source_language is None:
            raise HTTPException(
                status_code=400,
                detail=f"The speech seems to be in a language ({spoken_language}) the translation server doesn't have installed",
            )

    if not segments:
        return SpeechTranslateResponse(
            detected_language=source_language, duration=duration, segments=[]
        )

    texts = [text for _, _, text in segments]
    if source_language == target_language:
        translations = texts
    else:
        translations = libretranslate(texts, source_language, target_language)["translatedText"]

    return SpeechTranslateResponse(
        detected_language=source_language,
        duration=duration,
        segments=[
            SpeechSegment(start=start, end=end, text=text, translated_text=translated.strip())
            for (start, end, text), translated in zip(segments, translations)
        ],
    )
