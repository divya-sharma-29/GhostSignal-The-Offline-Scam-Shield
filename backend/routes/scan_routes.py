from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import TextScanRequest, ScanResponseSchema
from services.detector import scam_detector
from services.history_manager import history_manager

router = APIRouter(prefix="/scan", tags=["Scanning"])

@router.post("/text", response_model=ScanResponseSchema)
def scan_text(request: TextScanRequest, db: Session = Depends(get_db)):
    """
    Scans a submitted text message through the unified GhostSignal security pipeline:
    1. Unicode Shield Character Normalization (homoglyphs, invisibles, dotted spellings, Indic preservation)
    2. Threat Pattern Matching (KYC, OTP, UPI reverse payment, urgency, extortion, impersonation)
    3. Passive URL extraction & static link risk analysis
    4. Local AI classification
    5. Calibrated Risk Analysis
    6. Anonymous SQLite Scan History Record
    """
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text field must not be empty.")

    # Execute scam detector
    result = scam_detector.scan(
        text=clean_text,
        language=request.language or "English",
        source_type=request.source_type or "text"
    )

    # Save to SQLite history
    try:
        history_manager.save_scan(db, result)
    except Exception as e:
        # Scan must never fail if DB write has a transient issue
        print(f"[ScanRoutes] Warning: Failed to save scan history: {e}")

    return result

