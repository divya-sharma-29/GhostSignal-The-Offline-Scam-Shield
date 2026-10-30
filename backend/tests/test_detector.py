from backend.services.detector import detect
from backend.services.risk_analyzer import analyze

def test_dotted_otp_matches_rule():
    result = detect("Send your O.T.P immediately")
    assert any(item["category"] == "otp" for item in result["threats"])

def test_account_threat_is_detected():
    result = analyze(detect("Your bank account will be blocked within 2 hours; verify K.Y.C now"))
    assert result["risk_level"] == "HIGH"
    assert result["risk_score"] <= 100

def test_normal_message_stays_low():
    result = analyze(detect("Your appointment is confirmed for tomorrow at 10 AM."))
    assert result["risk_level"] == "LOW"
    assert result["risk_score"] < 25

def test_leetspeak_and_stretched_terms_are_analyzed():
    result = analyze(detect("Send your 0TP immediately; your account will be blockeeeed"))
    assert result["risk_level"] == "HIGH"
    assert any(item["category"] == "otp" for item in result["threats"])

def test_ai_is_honestly_reported_as_rules_only():
    from backend.services.ai_engine import predict
    assert predict("message")["mode"] == "rules-only"

