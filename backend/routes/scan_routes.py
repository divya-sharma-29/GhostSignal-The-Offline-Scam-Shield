from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter
from backend.config import MAX_TEXT_LENGTH
from backend.database import save_scan
from backend.schemas import ScanResponse, TextScanRequest
from backend.services.ai_engine import predict
from backend.services.detector import detect
from backend.services.risk_analyzer import analyze
from backend.services.update_manager import read_rules
from backend.services.url_analyzer import analyze_url
import re

router = APIRouter()

def run_scan(text: str, scan_type: str) -> dict:
    if len(text) > MAX_TEXT_LENGTH:
        raise ValueError("Text is longer than the configured limit.")
    detected = detect(text)
    urls = [analyze_url(match.group(0)) for match in re.finditer(r"(?:https?://|www\.)[^\s<>()]+", text, re.I)]
    ai = predict(text)
    risk = analyze(detected, urls, ai)
    rules = read_rules()
    result = {"id": str(uuid4()), "timestamp": datetime.now(timezone.utc).isoformat(), "scan_type": scan_type,
        "message_text": text, "risk_level": risk["risk_level"], "risk_score": risk["risk_score"],
        "threats": risk["threats"], "reasons": risk["reasons"], "recommendations": risk["recommendations"],
        "unicode_findings": detected["normalization"]["findings"], "normalized_for_analysis": detected["normalization"]["normalized"],
        "rule_version": rules.get("version", "unknown"), "ai_status": ai["mode"]}
    save_scan(result)
    return result

@router.post("/scan/text", response_model=ScanResponse)
def scan_text(request: TextScanRequest):
    return run_scan(request.text, "text")

