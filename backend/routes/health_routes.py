from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text

from config import settings
from database import get_db
from schemas import SystemStatusResponse
from services.ai_engine import ai_engine
from services.ocr_engine import ocr_engine

router = APIRouter(tags=["Health & Status"])

@router.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "tagline": "Your messages. Your privacy. Your protection.",
        "status": "online",
        "version": settings.VERSION,
        "rule_version": settings.RULES_VERSION,
        "documentation": "/docs"
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ghostsignal_backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/system/status", response_model=SystemStatusResponse)
def system_status(db: Session = Depends(get_db)):
    """
    Returns the operational availability of all internal subsystems:
    Database, AI Classifier, OCR Engine, Security Update signatures, and Offline Mode.
    """
    # Check Database connection
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return SystemStatusResponse(
        backend="FastAPI Python Modular Backend",
        version=settings.VERSION,
        ruleVersion=settings.RULES_VERSION,
        databaseAvailable=db_ok,
        aiEngineAvailable=True,
        aiModelLoaded=ai_engine.is_model_loaded,
        ocrEngineAvailable=bool(ocr_engine.engine_type),
        offlineModeSupported=True,
        details={
            "aiEngineType": "ONNX (CPU)" if ai_engine.is_model_loaded else "Local Rule Fallback",
            "ocrEngineType": ocr_engine.engine_type or "Validation Only (Install Tesseract for OCR)",
            "databaseType": "SQLite (Local File-based)",
            "signatureAlgorithm": "Ed25519 Cryptographic Verification",
            "offlineReadiness": "Full Client & Server Offline Execution Compatible"
        }
    )

