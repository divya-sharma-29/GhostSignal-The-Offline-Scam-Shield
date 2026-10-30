"""Optional local OCR. EasyOCR is loaded only if explicitly installed."""
from __future__ import annotations

import io
from backend.config import MAX_IMAGE_BYTES

ALLOWED_TYPES = {"image/png", "image/jpeg"}


def extract_text(data: bytes, content_type: str) -> dict:
    if content_type not in ALLOWED_TYPES:
        raise ValueError("Upload a PNG or JPEG image.")
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise ValueError(f"Image must be non-empty and no larger than {MAX_IMAGE_BYTES} bytes.")
    try:
        from PIL import Image
        image = Image.open(io.BytesIO(data))
        image.verify()
        image = Image.open(io.BytesIO(data)).convert("RGB")
        if image.width * image.height > 20_000_000:
            raise ValueError("Image dimensions are too large.")
    except ImportError as exc:
        raise RuntimeError("Local OCR dependencies are not installed.") from exc
    except Exception as exc:
        if isinstance(exc, ValueError): raise
        raise ValueError("The uploaded file is not a readable image.") from exc
    try:
        import easyocr
    except ImportError as exc:
        raise RuntimeError("EasyOCR is not installed; image text extraction is unavailable.") from exc
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    text = "\n".join(reader.readtext(image, detail=0)).strip()
    return {"text": text, "available": True, "message": "" if text else "No readable text was found in this image."}

