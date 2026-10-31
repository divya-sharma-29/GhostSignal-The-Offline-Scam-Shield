import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import URLScanRequest, URLAnalysisResponseSchema
from services.url_analyzer import url_analyzer
from services.history_manager import history_manager

router = APIRouter(prefix="/scan", tags=["Scanning"])

@router.post("/url", response_model=URLAnalysisResponseSchema)
def scan_url(request: URLScanRequest, db: Session = Depends(get_db)):
    """
    Passively analyzes a suspicious URL without connecting to or visiting the target website.
    Evaluates:
    - Raw IP address destinations
    - URL shortener disguises
    - Punycode IDN homographs
    - Brand typosquatting
    - Excessive subdomains
    - High-risk TLD extensions
    - Direct executable / APK downloads
    """
    clean_url = request.url.strip()
    if not clean_url:
        raise HTTPException(status_code=400, detail="URL field cannot be empty.")

    result = url_analyzer.analyze(clean_url)

    # Save to history for auditability
    try:
        synthetic_scan = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sourceType": "url",
            "messageText": clean_url,
            "riskLevel": result["riskLevel"],
            "riskScore": result["riskScore"],
            "redFlags": [{"title": c, "whySuspicious": r} for c, r in zip(result["characteristics"], result["reasons"])],
            "ruleVersion": "v2.4.0-offline",
            "unicodeShield": {"hasAnomalies": False}
        }
        history_manager.save_scan(db, synthetic_scan)
    except Exception as e:
        print(f"[URLRoutes] Warning: Failed to save URL scan history: {e}")

    return result

