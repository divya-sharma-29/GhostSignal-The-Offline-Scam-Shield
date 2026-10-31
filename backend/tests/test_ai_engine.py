import pytest
from services.ai_engine import ai_engine
from services.smollm3_reasoner import smollm3_reasoner
from services.detector import scam_detector

def test_smollm3_reasoner_otp_theft():
    text = "Bank Alert: Share OTP 948201 immediately with officer to stop unauthorized debit."
    verdict = smollm3_reasoner.infer(text)
    assert verdict["scam_type"] == "otp_theft"
    assert verdict["risk_level"] == "HIGH"
    assert verdict["risk_score"] >= 90
    assert verdict["is_offline"] is True

def test_smollm3_reasoner_bank_impersonation():
    text = "Dear user, your SBI account KYC expired today. Update within 24 hours to prevent account suspension."
    verdict = smollm3_reasoner.infer(text)
    assert verdict["scam_type"] == "bank_impersonation"
    assert verdict["risk_level"] == "HIGH"
    assert "bank" in verdict["explanation"].lower() or "kyc" in verdict["explanation"].lower()

def test_smollm3_reasoner_upi_scam():
    text = "You won Rs 25,000 reward! Approve collect request and enter your UPI PIN to claim reward."
    verdict = smollm3_reasoner.infer(text)
    assert verdict["scam_type"] == "upi_payment_scam"
    assert verdict["risk_level"] == "HIGH"
    assert "upi" in verdict["explanation"].lower()

def test_smollm3_reasoner_benign_notification():
    text = "Thanks for your payment of Rs 450. Receipt is available in your account dashboard."
    verdict = smollm3_reasoner.infer(text)
    assert verdict["scam_type"] == "benign"
    assert verdict["risk_level"] == "LOW"
    assert verdict["scam_probability"] < 0.20

def test_smollm3_reasoner_homoglyph_normalization():
    # Cyrillic lookalike 'а' in bank
    text = "Dear customer, your b\u0430nk account will be blocked today."
    norm = smollm3_reasoner.normalize(text)
    assert norm["has_lookalike"] is True
    assert norm["obfuscation_type"] == "lookalike"
    verdict = smollm3_reasoner.infer(text)
    assert verdict["scam_type"] == "bank_impersonation"
    assert verdict["obfuscation_type"] == "lookalike"

def test_detector_returns_ai_verdict():
    text = "URGENT: Electricity connection will be disconnected tonight. Pay bill immediately or legal action begins."
    result = scam_detector.scan(text)
    assert "aiVerdict" in result
    verdict = result["aiVerdict"]
    assert verdict is not None
    assert verdict["riskLevel"] == "HIGH"
    assert verdict["scamType"] == "urgency_payment_pressure"
    assert verdict["isOffline"] is True
    assert "modelName" in verdict
    assert "recommendedAction" in verdict
