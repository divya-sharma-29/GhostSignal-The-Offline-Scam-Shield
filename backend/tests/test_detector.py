import pytest
from services.detector import scam_detector

def test_detect_fake_kyc_scam():
    msg = "Dear customer, your SBI account KYC expired today. Click here to update within 24 hours to avoid suspension."
    result = scam_detector.scan(msg)
    assert result["riskLevel"] in ["HIGH", "MEDIUM"]
    assert result["riskScore"] >= 50
    flag_categories = [rf["category"] for rf in result["redFlags"]]
    assert "kyc" in flag_categories or "urgency" in flag_categories

def test_detect_otp_theft():
    msg = "URGENT: Bank security alert. Share OTP 482910 with our officer to cancel unauthorized transaction."
    result = scam_detector.scan(msg)
    assert result["riskLevel"] == "HIGH"
    assert result["riskScore"] >= 70
    flag_categories = [rf["category"] for rf in result["redFlags"]]
    assert "otp" in flag_categories

def test_detect_upi_reverse_payment():
    msg = "Congratulations! You won Rs 50,000 lottery. Enter your UPI PIN to receive money in your GooglePay account."
    result = scam_detector.scan(msg)
    assert result["riskLevel"] == "HIGH"
    assert result["riskScore"] >= 70
    flag_categories = [rf["category"] for rf in result["redFlags"]]
    assert "upi" in flag_categories or "lottery" in flag_categories

def test_detect_legitimate_message():
    msg = "Hi Rohit, let's meet at 5 PM at the library to review our class project."
    result = scam_detector.scan(msg)
    assert result["riskLevel"] == "LOW"
    assert result["riskScore"] < 35
    assert len(result["redFlags"]) == 0

def test_detect_disguised_homoglyph_attack():
    # Cyrillic 'а' and 'у' in 'paytm'
    msg = "Your p\u0430\u0443tm wallet is suspended. Share OTP immediately."
    result = scam_detector.scan(msg)
    assert result["riskLevel"] == "HIGH"
    assert result["riskScore"] >= 70
    assert result["unicodeShield"]["hasAnomalies"] is True

