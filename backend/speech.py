"""Transcribe speech from audio and video files with Whisper."""

import os
import threading
from functools import lru_cache
from typing import BinaryIO

from faster_whisper import WhisperModel
from faster_whisper.tokenizer import _LANGUAGE_CODES as WHISPER_LANGUAGES

# "small" is a good balance of speed and accuracy on CPU; "base" is faster,
# "medium" more accurate. Downloaded on first use (~500 MB for small).
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")

_model_lock = threading.Lock()


@lru_cache(maxsize=1)
def _load_model() -> WhisperModel:
    print(f"Loading Whisper model '{WHISPER_MODEL}'...")
    # int8 runs several times faster than float32 on CPU with little accuracy loss
    return WhisperModel(
        WHISPER_MODEL,
        device="cpu",
        compute_type="int8",
        cpu_threads=min(os.cpu_count() or 4, 8),
    )


def get_model() -> WhisperModel:
    # Lock so concurrent first requests don't load the model twice
    with _model_lock:
        return _load_model()


def to_whisper_language(code: str) -> str | None:
    """Map a LibreTranslate language code to Whisper's, or None if unsupported."""
    # LibreTranslate uses "zh-Hans"/"zh-Hant"; Whisper just "zh"
    base = code.split("-")[0]
    return base if base in WHISPER_LANGUAGES else None


def transcribe(
    media: BinaryIO, language: str | None
) -> tuple[list[tuple[float, float, str]], str, float]:
    """Transcribe an audio or video file.

    Returns (segments as (start, end, text), detected language, duration in seconds).
    Raises ValueError if the file has no readable audio.
    """
    try:
        segments, info = get_model().transcribe(
            media,
            language=language,
            # Skip silence, which also stops Whisper making up text for it
            vad_filter=True,
        )
        # Segments are generated lazily; transcription happens here
        results = [
            (segment.start, segment.end, segment.text.strip())
            for segment in segments
            if segment.text.strip()
        ]
    except Exception as e:
        # PyAV raises many different errors for corrupt or audio-less files
        if type(e).__module__.startswith("av"):
            raise ValueError(str(e)) from e
        raise

    return results, info.language, info.duration
