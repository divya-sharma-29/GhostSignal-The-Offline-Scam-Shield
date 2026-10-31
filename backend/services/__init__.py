from services.text_normalizer import text_normalizer
from services.url_analyzer import url_analyzer
from services.risk_analyzer import risk_analyzer
from services.ai_engine import ai_engine
from services.ocr_engine import ocr_engine
from services.detector import scam_detector
from services.signature_verifier import signature_verifier
from services.update_manager import update_manager
from services.history_manager import history_manager
from services.otp_service import otp_service

__all__ = [
    "text_normalizer",
    "url_analyzer",
    "risk_analyzer",
    "ai_engine",
    "ocr_engine",
    "scam_detector",
    "signature_verifier",
    "update_manager",
    "history_manager",
    "otp_service",
]

