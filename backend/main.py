from fastapi import FastAPI, File, UploadFile
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

ocr_reader = easyocr.Reader(["en"], gpu=False)


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


CONFIDENCE_THRESHOLD = 0.5


@app.post("/translate-image", response_model=ImageTranslateResponse)
async def translate_image(
    file: UploadFile = File(...),
    target_language: str = "ja",
):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
    image_array = np.array(image)

    ocr_results = ocr_reader.readtext(image_array)

    results = []
    for bounding_box, text, confidence in ocr_results:
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        try:
            translated = GoogleTranslator(
                source="auto", target=target_language
            ).translate(text)
            if translated is None or "Error 500" in translated:
                continue
        except Exception:
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
