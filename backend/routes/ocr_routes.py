from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from schemas import ScanResponseSchema
from services.ocr_engine import ocr_engine
from services.detector import scam_detector
from services.history_manager import history_manager

router = APIRouter(prefix="/scan", tags=["Scanning"])

@router.post("/image/extract")
async def extract_image_text(
    file: UploadFile = File(..., description="Screenshot image to extract text from")
):
    """
    Extracts text from screenshot locally without running complete scan.
    Enables live interactive preview of extracted text in the UI.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    if hasattr(file, "file") and hasattr(file.file, "read"):
        file_bytes = file.file.read()
    else:
        file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    ocr_result = ocr_engine.extract_text(file_bytes, file.filename)
    return {
        "success": ocr_result.get("success", False),
        "text": ocr_result.get("text", ""),
        "engine": ocr_result.get("engine", "none"),
        "ocr_available": ocr_result.get("ocr_available", False),
        "error": ocr_result.get("error", None)
    }

@router.post("/image", response_model=ScanResponseSchema)
async def scan_image(
    file: UploadFile = File(..., description="Screenshot or message image (PNG, JPG, JPEG, WebP)"),
    language: Optional[str] = Form("English"),
    db: Session = Depends(get_db)
):
    """
    Accepts an uploaded screenshot or image file, performs local OCR text extraction,
    and forwards the extracted text through the GhostSignal scam detection pipeline.
    Never transmits image files to third-party cloud services.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Read uploaded bytes into memory
    if hasattr(file, "file") and hasattr(file.file, "read"):
        file_bytes = file.file.read()
    else:
        file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Validate and extract text locally
    ocr_result = ocr_engine.extract_text(file_bytes, file.filename)
    if not ocr_result.get("success"):
        # If extraction failed due to validation or missing engine
        error_msg = ocr_result.get("error", "Failed to extract text from image.")
        if not ocr_result.get("ocr_available"):
            scan_res = scam_detector.scan(
                text=f"[Uploaded Image: {file.filename}]. {error_msg}",
                language=language or "English",
                source_type="screenshot"
            )
            scan_res["plainLanguageExplanation"] = (
                f"Image '{file.filename}' was uploaded and verified locally. "
                "No OCR engine is active; paste the text directly into the scanner to analyze threat patterns."
            )
            return scan_res
        
        # If OCR was available but found no text
        scan_res = scam_detector.scan(
            text=f"[No readable text found in image '{file.filename}']",
            language=language or "English",
            source_type="screenshot"
        )
        scan_res["plainLanguageExplanation"] = (
            "Screenshot was processed by on-device OCR, but no clear text could be recognized. "
            "Please ensure the image is sharp or type the message text directly."
        )
        return scan_res

    extracted_text = ocr_result.get("text", "").strip()
    if not extracted_text:
        scan_res = scam_detector.scan(
            text=f"[Empty text detected in image '{file.filename}']",
            language=language or "English",
            source_type="screenshot"
        )
        scan_res["plainLanguageExplanation"] = (
            "No legible text could be extracted from the uploaded screenshot. "
            "Please ensure the text in the screenshot is clear, or paste the text manually."
        )
        return scan_res

    # Pass extracted text to the detector pipeline
    result = scam_detector.scan(
        text=extracted_text,
        language=language or "English",
        source_type="screenshot"
    )

    # Save to history
    try:
        history_manager.save_scan(db, result)
    except Exception as e:
        print(f"[OCRRoutes] Warning: Failed to save scan history: {e}")

    return result
