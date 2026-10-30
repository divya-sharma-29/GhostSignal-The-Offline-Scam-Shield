from fastapi import APIRouter
from importlib.util import find_spec
from backend.services.ai_engine import status as ai_status
from backend.services.update_manager import status as update_status
from backend.services.ocr_engine import ALLOWED_TYPES
from backend.database import initialize

router = APIRouter()

@router.get("/")
def root():
    return {"service": "GhostSignal API", "status": "ok", "docs": "/docs"}

@router.get("/health")
def health():
    try:
        initialize(); database = "available"
    except Exception:
        database = "unavailable"
    return {"status": "ok" if database == "available" else "degraded", "database": database}

@router.get("/system/status")
def system_status():
    try: initialize(); database = "available"
    except Exception: database = "unavailable"
    return {"database": database, "ocr": "available" if find_spec("easyocr") and find_spec("PIL") else "optional; not installed", "ai": ai_status(), "updates": update_status()}

