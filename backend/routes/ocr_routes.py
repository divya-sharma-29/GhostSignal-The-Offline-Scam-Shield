from fastapi import APIRouter, File, HTTPException, UploadFile
from backend.config import MAX_IMAGE_BYTES
from backend.routes.scan_routes import run_scan
from backend.services.ocr_engine import extract_text

router = APIRouter()

@router.post("/scan/image")
async def scan_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in {"image/png", "image/jpeg"}:
            raise HTTPException(415, "Upload a PNG or JPEG image.")
        data = await file.read(MAX_IMAGE_BYTES + 1)
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(413, "Image exceeds the configured size limit.")
        ocr = extract_text(data, file.content_type)
        if not ocr["text"]:
            return {"extracted_text": "", "message": ocr["message"], "risk_level": "LOW", "risk_score": 0, "threats": [], "recommendations": ["No text was assessed. Do not treat this image-only result as evidence of safety."], "assessed": False}
        result = run_scan(ocr["text"], "image")
        return {"extracted_text": ocr["text"], "assessed": True, **result}
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    finally:
        await file.close()

