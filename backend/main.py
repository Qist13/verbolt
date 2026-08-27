from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from deep_translator import GoogleTranslator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranslateRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    source_language: str
    target_language: str


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
