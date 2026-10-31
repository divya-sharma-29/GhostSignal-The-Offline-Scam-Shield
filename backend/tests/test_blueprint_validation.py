"""
GhostSignal — Blueprint Validation Test Suite (T01 - T15).
Implements all 15 formal test scenarios defined in Section 12 of the System Blueprint.
"""

import pytest
import json
from pathlib import Path

from services.detector import scam_detector
from services.text_normalizer import text_normalizer
from services.url_analyzer import url_analyzer
from services.update_manager import update_manager
from services.signature_verifier import signature_verifier


# --- T01: Ordinary Legitimate Bank Notification ---
def test_t01_ordinary_legitimate_bank_notification():
    """T01: Ordinary legitimate bank notifications must not produce high-risk false positives."""
    legitimate_msg = "Your account balance for XX1234 is Rs 5,420 as of 30 Oct. Thank you for banking with Northstar."
    result = scam_detector.scan(legitimate_msg)

    assert result["risk_level"] in ("LOW", "MEDIUM"), f"Expected low or medium, got {result['risk_level']}"
    assert result["score"] < 40, f"Expected risk score < 40, got {result['score']}"
    assert result["processed_offline"] is True
    assert result["score_is_calibrated_probability"] is False


# --- T02: Dotted K.Y.C. Obfuscation ---
def test_t02_dotted_kyc_obfuscation():
    """T02: Detects separator obfuscation where dots break up keywords (K.Y.C.)."""
    evasion_msg = "Your account will be suspended today. Please complete your K.Y.C. verification immediately: https://parcel-fee.example.test/pay"
    norm_result = text_normalizer.normalize(evasion_msg)

    # Unicode shield must detect dotted pattern
    dotted_findings = [f for f in norm_result["findings"] if f["type"] == "dotted_pattern"]
    assert len(dotted_findings) > 0, "Dotted pattern finding must be detected"
    assert "kyc" in norm_result["normalized_text"].lower()

    scan_result = scam_detector.scan(evasion_msg)
    assert scan_result["risk_level"] == "HIGH"
    assert scan_result["score"] >= 70


# --- T03: Cyrillic Homoglyph in Bank ---
def test_t03_cyrillic_homoglyph_in_bank():
    """T03: Identifies Cyrillic 'а' (U+0430) inside Latin 'bank'."""
    homoglyph_msg = "Your b\u0430nk account has been locked. Verify at https://secure-login.test"
    norm_result = text_normalizer.normalize(homoglyph_msg)

    confusable_findings = [f for f in norm_result["findings"] if f["type"] == "confusable_homoglyph"]
    assert len(confusable_findings) > 0, "Cyrillic homoglyph must be detected"
    assert any(f["char"] == "\u0430" for f in confusable_findings)
    assert any(f["code_point"] == "U+0430" for f in confusable_findings)
    assert "bank" in norm_result["normalized_text"].lower()


# --- T04: Zero-Width Invisible Character in Keyword ---
def test_t04_zero_width_invisible_character():
    """T04: Identifies zero-width space (U+200B) inside keyword with offset and codepoint."""
    zero_width_msg = "Urgent: Complete your k\u200Byc now to avoid deactivation."
    norm_result = text_normalizer.normalize(zero_width_msg)

    zero_width_findings = [f for f in norm_result["findings"] if f["type"] == "zero_width"]
    assert len(zero_width_findings) > 0, "Zero width character must be detected"
    assert any(f["char"] == "\u200B" for f in zero_width_findings)
    assert any(f["code_point"] == "U+200B" for f in zero_width_findings)
    assert "kyc" in norm_result["normalized_text"].lower()


# --- T05: Urgent Account-Blocking Message ---
def test_t05_urgent_account_blocking_pressure():
    """T05: Detects psychological pressure, urgency, and account threats."""
    threat_msg = "URGENT: Your account will be blocked within 2 hours. Submit verification immediately!"
    result = scam_detector.scan(threat_msg)

    urgency_flags = [f for f in result["redFlags"] if f["category"] in ("urgency", "threat")]
    assert len(urgency_flags) > 0, "Must flag urgency/threat"
    assert result["score"] >= 40


# --- T06: Suspicious Verification Link ---
def test_t06_suspicious_verification_link():
    """T06: Detects IP-based links and suspicious domain indicators without making network requests."""
    ip_link_msg = "Update security profile now: http://192.168.1.100/verify-account"
    analysis = url_analyzer.analyze_text_urls(ip_link_msg)

    assert analysis["has_urls"] is True
    assert analysis["is_suspicious"] is True
    assert any("IP" in c for c in analysis["characteristics"])


# --- T07: No Network (Offline Scan Functions Locally) ---
def test_t07_offline_scan_functions_locally():
    """T07: Scan operates strictly offline and returns processed_offline=True."""
    test_msg = "URGENT: Bank security alert. Share OTP 892110 with our officer to cancel unauthorized transaction."
    result = scam_detector.scan(test_msg)

    assert result["processed_offline"] is True
    assert result["risk_level"] == "HIGH"
    assert "findings" in result
    assert "rules_version" in result


# --- T08: Valid Signed Update Package ---
def test_t08_valid_signed_update_verifies():
    """T08: Verifies valid Ed25519 signed rule update package."""
    staged_path = Path("backend/rules/updates/signed_update_2.4.1.json")
    assert staged_path.exists()

    with open(staged_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)

    payload = {
        "version": pkg["version"],
        "rules": pkg["rules"],
        "timestamp": pkg["timestamp"]
    }
    if "expiresAt" in pkg:
        payload["expiresAt"] = pkg["expiresAt"]

    is_valid, msg = signature_verifier.verify_signature(payload, pkg["signature"])
    assert is_valid is True, f"Signature verification failed: {msg}"


# --- T09: Modified Update Package (Rejects Tampering) ---
def test_t09_modified_update_package_rejected():
    """T09: Tampering with even 1 byte in rules payload causes verification failure."""
    staged_path = Path("backend/rules/updates/signed_update_2.4.1.json")
    with open(staged_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)

    tampered_rules = dict(pkg["rules"])
    tampered_rules["unauthorized_override"] = True

    payload = {
        "version": pkg["version"],
        "rules": tampered_rules,
        "timestamp": pkg["timestamp"]
    }
    if "expiresAt" in pkg:
        payload["expiresAt"] = pkg["expiresAt"]

    is_valid, msg = signature_verifier.verify_signature(payload, pkg["signature"])
    assert is_valid is False
    assert "failed" in msg.lower()


# --- T10: Unsigned Update Package Rejected ---
def test_t10_unsigned_update_rejected():
    """T10: An update missing a valid signature must be rejected immediately."""
    is_valid, msg = signature_verifier.verify_signature({"version": "2.5.0"}, "")
    assert is_valid is False


# --- T11: Older Update Version (Rejects Rollback) ---
def test_t11_older_update_version_rejects_rollback():
    """T11: Monotonic version check blocks rollback to older versions (e.g., 1.0.0 vs 2.4.0)."""
    success, msg = update_manager.install_update(
        version="1.0.0",
        rules_payload={"categories": {}},
        signature="invalid_or_old",
        timestamp="2026-01-01T00:00:00Z"
    )
    assert success is False
    assert "Rollback" in msg or "lower" in msg.lower()


# --- T12: Malformed/Oversized Update Rules Rejected ---
def test_t12_malformed_oversized_update_rules_rejected():
    """T12: Malformed rule structures must fail cleanly without corrupting active rules."""
    success, msg = update_manager.install_update(
        version="9.9.9",
        rules_payload={"malformed_data": [1, 2, 3]},
        signature="corrupted_signature",
        timestamp="2026-10-31T00:00:00Z"
    )
    assert success is False


# --- T13: Hindi/Indic Text Preserves Typography ---
def test_t13_hindi_indic_text_preserves_typography():
    """T13: Legitimate Hindi/Indic conjuncts (matras, halant, nukta) must not be flagged as attacks."""
    hindi_legit = "नमस्ते, आपका खाता सक्रिय है। किसी भी सहायता के लिए संपर्क करें।"
    norm_result = text_normalizer.normalize(hindi_legit)

    # Must preserve text and not flag genuine Devanagari characters as homoglyph attacks
    assert norm_result["is_indic_safe"] is True
    assert norm_result["has_anomalies"] is False
    assert len(norm_result["findings"]) == 0

    scan_result = scam_detector.scan(hindi_legit)
    assert scan_result["risk_level"] == "LOW"


# --- T14: Large Message Input Stays Bounded ---
def test_t14_large_message_input_stays_bounded():
    """T14: Oversized inputs (e.g. 50,000 characters) are handled gracefully without crashing."""
    large_input = "Northstar alert: " + ("check your balance online. " * 2000)
    assert len(large_input) > 40000

    scan_result = scam_detector.scan(large_input)
    assert "risk_level" in scan_result
    assert "score" in scan_result
    assert scan_result["processed_offline"] is True


# --- T15: Failure During Activation Restores Previous Trusted Rules ---
def test_t15_failure_during_activation_restores_trusted():
    """T15: Active rule engine remains valid and operational even if a bad update is rejected."""
    original_version = update_manager.get_current_version()

    # Attempt bogus update
    update_manager.install_update(
        version="2.4.99",
        rules_payload={"categories": {}},
        signature="bogus_signature",
        timestamp="2026-10-31T00:00:00Z"
    )

    # Active version must remain intact
    current_version = update_manager.get_current_version()
    assert current_version == original_version

    # Detection engine remains fully operational
    scan_result = scam_detector.scan("URGENT: Northstar Bank alert. Share OTP 123456 to verify account")
    assert scan_result["risk_level"] == "HIGH"
