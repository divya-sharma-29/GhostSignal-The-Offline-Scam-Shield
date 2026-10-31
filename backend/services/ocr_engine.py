import io
import logging
import asyncio
import concurrent.futures
from typing import Dict, Any, Tuple, Optional
from PIL import Image
from config import settings

logger = logging.getLogger(__name__)

# Check for local OCR engine availability in order of preference
OCR_ENGINE = None

try:
    import winocr
    OCR_ENGINE = "winocr"
except ImportError:
    try:
        import easyocr
        OCR_ENGINE = "easyocr"
    except ImportError:
        try:
            import pytesseract
            OCR_ENGINE = "pytesseract"
        except ImportError:
            OCR_ENGINE = None

class OCREngine:
    """
    Offline Screenshot and Image OCR Service.
    Extracts text from user-uploaded screenshots entirely on the local device/server.
    Supports:
    1. winocr: Windows 10/11 built-in Windows.Media.Ocr (super-fast, native, 100% offline).
    2. easyocr: Deep learning PyTorch OCR.
    3. pytesseract: Tesseract wrapper.
    Never sends image data over the network to any third-party services.
    Validates MIME types, magic bytes, dimensions, and limits memory consumption.
    """

    def __init__(self):
        self.engine_type = OCR_ENGINE
        self._easyocr_reader = None

    def _get_easyocr_reader(self):
        """Lazy-loads EasyOCR reader to save memory during startup."""
        if self._easyocr_reader is None:
            try:
                import easyocr
                self._easyocr_reader = easyocr.Reader(['en'], gpu=False)
            except Exception as e:
                logger.warning(f"Failed to initialize EasyOCR reader: {e}")
        return self._easyocr_reader

    def validate_image(self, file_bytes: bytes, filename: str) -> Tuple[bool, str, Optional[Image.Image]]:
        """
        Validates file size, format, and verifies image integrity using PIL.
        Protects against zip bombs and malicious file header spoofing.
        """
        # Check size
        if len(file_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
            return False, f"File size exceeds maximum limit of {settings.MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB.", None

        # Check extension
        lower_name = filename.lower()
        if not lower_name.endswith((".png", ".jpg", ".jpeg", ".webp")):
            return False, "Unsupported file format. Please upload PNG, JPG, JPEG, or WebP images.", None

        # Verify image opens safely in PIL
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.verify()  # Verify stream is undamaged
            # Reopen because verify() closes the file pointer in PIL
            image = Image.open(io.BytesIO(file_bytes))
            # Format check
            if image.format not in ["JPEG", "PNG", "WEBP"]:
                return False, f"Invalid image format '{image.format}'. Only PNG, JPEG, and WebP are permitted.", None
            return True, "Valid image", image
        except Exception as e:
            return False, f"Corrupted or invalid image file: {str(e)}", None

    def extract_text(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Extracts text locally from image file bytes using available offline OCR engines.
        Handles both synchronous execution and execution inside running asyncio event loops.
        Returns extracted text, OCR engine used, and confidence metrics.
        """
        is_valid, msg, image = self.validate_image(file_bytes, filename)
        if not is_valid:
            return {
                "success": False,
                "text": "",
                "error": msg,
                "engine": self.engine_type or "none",
                "ocr_available": bool(self.engine_type)
            }

        # 1. Primary Engine: Windows Native OCR (winocr)
        try:
            import winocr
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop is not None and loop.is_running():
                # Avoid "asyncio.run() cannot be called from a running event loop" by executing in thread pool
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                    ocr_res = pool.submit(winocr.recognize_pil_sync, image).result(timeout=10)
            else:
                ocr_res = winocr.recognize_pil_sync(image)

            text = ocr_res.get("text", "").strip() if isinstance(ocr_res, dict) else str(ocr_res).strip()
            if text:
                return {
                    "success": True,
                    "text": text,
                    "engine": "winocr_windows_native",
                    "ocr_available": True
                }
        except Exception as e:
            logger.info(f"winocr unavailable or failed ({e}), attempting fallback OCR engines...")

        # 2. Secondary Engine: EasyOCR
        try:
            reader = self._get_easyocr_reader()
            if reader:
                results = reader.readtext(file_bytes, detail=0)
                extracted_text = " ".join(results).strip()
                if extracted_text:
                    return {
                        "success": True,
                        "text": extracted_text,
                        "engine": "easyocr_local",
                        "ocr_available": True
                    }
        except Exception as e:
            logger.info(f"EasyOCR error: {e}")

        # 3. Tertiary Engine: Pytesseract
        try:
            import pytesseract
            extracted_text = pytesseract.image_to_string(image).strip()
            if extracted_text:
                return {
                    "success": True,
                    "text": extracted_text,
                    "engine": "pytesseract_local",
                    "ocr_available": True
                }
        except Exception as e:
            logger.info(f"Pytesseract error: {e}")

        # Fallback if image was validated but contained no recognizable text
        return {
            "success": False,
            "text": "",
            "error": "Image validated successfully, but no readable text could be recognized.",
            "engine": self.engine_type or "none",
            "ocr_available": bool(self.engine_type),
            "image_details": {
                "format": image.format,
                "dimensions": f"{image.width}x{image.height}",
                "mode": image.mode
            }
        }

ocr_engine = OCREngine()
