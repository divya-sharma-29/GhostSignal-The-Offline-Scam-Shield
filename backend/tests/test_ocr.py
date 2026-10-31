import io
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from PIL import Image, ImageDraw, ImageFont
from services.ocr_engine import ocr_engine

def test_ocr_engine_available():
    assert ocr_engine.engine_type in ["winocr", "pytesseract", "easyocr", None]

def test_ocr_extract_text_from_image():
    img = Image.new("RGB", (600, 150), color="white")
    draw = ImageDraw.Draw(img)
    font_path = Path("C:/Windows/Fonts/arial.ttf")
    if font_path.exists():
        font = ImageFont.truetype(str(font_path), 32)
    else:
        font = ImageFont.load_default()
    draw.text((20, 50), "URGENT: Bank OTP 987654", fill="black", font=font)
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    file_bytes = img_bytes.getvalue()

    result = ocr_engine.extract_text(file_bytes, "test_screenshot.png")
    assert "ocr_available" in result
    assert "success" in result

def test_ocr_validate_invalid_extension():
    is_valid, msg, _ = ocr_engine.validate_image(b"fake data", "document.pdf")
    assert is_valid is False
    assert "Unsupported file format" in msg
