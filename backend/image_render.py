"""Draw translated text back onto an image in place of the original text."""

import os
import threading
from functools import lru_cache

import cv2
import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")

NOTO_CJK_URL = "https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF"

# Fonts are downloaded on first use. Each CJK font also covers Latin text, but
# has region-specific glyph shapes, so each target language gets its own.
FONT_URLS = {
    "latin": "https://github.com/notofonts/notofonts.github.io/raw/main/fonts/NotoSans/hinted/ttf/NotoSans-Medium.ttf",
    "ja": f"{NOTO_CJK_URL}/Japanese/NotoSansCJKjp-Medium.otf",
    "zh": f"{NOTO_CJK_URL}/SimplifiedChinese/NotoSansCJKsc-Medium.otf",
    "ko": f"{NOTO_CJK_URL}/Korean/NotoSansCJKkr-Medium.otf",
}

FONT_FOR_LANGUAGE = {"ja": "ja", "zh-Hans": "zh", "zh": "zh", "ko": "ko"}

# Languages written without spaces between words, so lines can break anywhere
NO_SPACE_LANGUAGES = {"ja", "zh-Hans", "zh"}

MIN_FONT_SIZE = 10
LINE_SPACING = 1.15

# A text box counts as having a flat background when at least this share of the
# pixels along its edge are within SOLID_COLOR_TOLERANCE of their most common
# color. It's a share rather than all of them because boxes often clip glyphs
# or overhang the label the text sits on. Flat labels, documents and
# screenshots score 0.7+, gradients around 0.35, photos under 0.1.
SOLID_BACKGROUND_MIN_SHARE = 0.6
SOLID_COLOR_TOLERANCE = 8

_font_download_lock = threading.Lock()


def get_font_path(target_language: str) -> str:
    font_key = FONT_FOR_LANGUAGE.get(target_language, "latin")
    url = FONT_URLS[font_key]
    path = os.path.join(FONT_DIR, os.path.basename(url))

    with _font_download_lock:
        if not os.path.exists(path):
            print(f"Downloading font {os.path.basename(path)}...")
            os.makedirs(FONT_DIR, exist_ok=True)
            response = requests.get(url, timeout=120)
            response.raise_for_status()
            # Write to a temp file first so a failed download never leaves a broken font
            with open(path + ".part", "wb") as f:
                f.write(response.content)
            os.replace(path + ".part", path)

    return path


@lru_cache(maxsize=256)
def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: float, no_spaces: bool) -> list[str]:
    tokens = list(text) if no_spaces else text.split(" ")
    separator = "" if no_spaces else " "

    lines = []
    current = ""
    for token in tokens:
        candidate = f"{current}{separator}{token}" if current else token
        if current and font.getlength(candidate) > max_width:
            lines.append(current)
            current = token
        else:
            current = candidate
    if current:
        lines.append(current)

    return lines


def fit_text(text: str, font_path: str, box_width: int, box_height: int, no_spaces: bool):
    """Find the largest font size where the text, wrapped, fits inside the box."""
    size = max(int(box_height * 0.8), MIN_FONT_SIZE)

    while True:
        font = load_font(font_path, size)
        lines = wrap_text(text, font, box_width, no_spaces)
        fits_width = all(font.getlength(line) <= box_width for line in lines)
        fits_height = len(lines) * size * LINE_SPACING <= box_height

        if (fits_width and fits_height) or size == MIN_FONT_SIZE:
            return font, lines

        size = max(int(size * 0.9), MIN_FONT_SIZE)


def solid_background_color(image: np.ndarray, polygon: np.ndarray) -> tuple[int, int, int] | None:
    """Return the background color if most pixels along the box's edge are one flat color."""
    height, width = image.shape[:2]
    x0, y0 = np.clip(polygon.min(axis=0), 0, [width - 1, height - 1])
    x1, y1 = np.clip(polygon.max(axis=0), 0, [width - 1, height - 1])
    band = max(2, int((y1 - y0) * 0.08))

    region = image[y0 : y1 + 1, x0 : x1 + 1].astype(float)
    edge_pixels = np.concatenate([
        region[:band].reshape(-1, 3),
        region[-band:].reshape(-1, 3),
        region[:, :band].reshape(-1, 3),
        region[:, -band:].reshape(-1, 3),
    ])

    # Most common color, bucketed so tiny variations (JPEG noise) count as one color
    buckets, counts = np.unique((edge_pixels // 8).astype(int), axis=0, return_counts=True)
    common_color = buckets[counts.argmax()] * 8 + 4

    matching = np.linalg.norm(edge_pixels - common_color, axis=1) <= SOLID_COLOR_TOLERANCE
    if matching.mean() < SOLID_BACKGROUND_MIN_SHARE:
        return None

    return tuple(int(c) for c in np.median(edge_pixels[matching], axis=0))


def luminance(color) -> float:
    r, g, b = color
    return 0.299 * r + 0.587 * g + 0.114 * b


def pick_text_color(original: np.ndarray, background: np.ndarray, box) -> tuple[int, int, int]:
    """Guess the original text color: the pixels in the box least like the background."""
    x0, y0, x1, y1 = box
    region = original[y0:y1, x0:x1].reshape(-1, 3).astype(float)
    background_color = np.median(background[y0:y1, x0:x1].reshape(-1, 3), axis=0)

    distances = np.linalg.norm(region - background_color, axis=1)
    text_color = np.median(region[distances >= np.percentile(distances, 90)], axis=0)

    # Fall back to black or white if the guess wouldn't be readable
    if abs(luminance(text_color) - luminance(background_color)) < 60:
        return (20, 20, 20) if luminance(background_color) > 128 else (245, 245, 245)

    return tuple(int(c) for c in text_color)


def render_translated_image(
    image: np.ndarray,
    blocks: list[tuple[list, str]],
    target_language: str,
) -> Image.Image:
    """Erase each block's original text and draw its translation in the same spot.

    `blocks` is a list of (bounding_box, translated_text), where bounding_box is
    EasyOCR's four corner points.
    """
    height, width = image.shape[:2]

    # Text on a plain background (signs, labels, screenshots) is covered with
    # that color. Inpainting can't do this well: when the text fills most of a
    # small label, it fills in from pixels outside the label instead.
    # Anything on a textured background is inpainted from its surroundings.
    solid_fills = []
    inpaint_mask = np.zeros((height, width), dtype=np.uint8)
    for bounding_box, _ in blocks:
        polygon = np.array(bounding_box, dtype=np.int32)
        background_color = solid_background_color(image, polygon)
        if background_color is not None:
            solid_fills.append((polygon, background_color))
        else:
            cv2.fillPoly(inpaint_mask, [polygon], 255)

    cleaned = image.copy()
    if inpaint_mask.any():
        inpaint_mask = cv2.dilate(inpaint_mask, np.ones((5, 5), np.uint8), iterations=2)
        cleaned = cv2.inpaint(image, inpaint_mask, 5, cv2.INPAINT_TELEA)
    for polygon, background_color in solid_fills:
        cv2.fillPoly(cleaned, [polygon], background_color)
        # Cover anti-aliased text edges that sit right on the box border
        cv2.polylines(cleaned, [polygon], True, background_color, thickness=3)

    output = Image.fromarray(cleaned)
    draw = ImageDraw.Draw(output)
    font_path = get_font_path(target_language)
    no_spaces = target_language in NO_SPACE_LANGUAGES

    for bounding_box, translated_text in blocks:
        points = np.array(bounding_box)
        x0, y0 = np.clip(points.min(axis=0).astype(int), 0, [width, height])
        x1, y1 = np.clip(points.max(axis=0).astype(int), 0, [width, height])
        box_width, box_height = x1 - x0, y1 - y0
        if box_width < 2 or box_height < 2:
            continue

        color = pick_text_color(image, cleaned, (x0, y0, x1, y1))
        font, lines = fit_text(translated_text, font_path, box_width, box_height, no_spaces)

        # Start where the original text started, centered vertically in its box
        line_height = font.size * LINE_SPACING
        top = y0 + (box_height - line_height * len(lines)) / 2
        for i, line in enumerate(lines):
            draw.text((x0, top + i * line_height), line, font=font, fill=color)

    return output
