import pytest
from services.text_normalizer import text_normalizer

def test_clean_message_passes_unmodified():
    msg = "Hi Dad, can you pick up some groceries on your way back home?"
    res = text_normalizer.normalize(msg)
    assert res["has_anomalies"] is False
    assert res["invisible_count"] == 0
    assert res["confusable_count"] == 0
    assert res["normalized_text"] == msg

def test_dotted_kyc_obfuscation():
    msg = "Dear customer, your K.Y.C has expired. Update immediately."
    res = text_normalizer.normalize(msg)
    assert res["has_anomalies"] is True
    assert "KYC" in res["obfuscated_keywords"]
    assert "KYC" in res["normalized_text"]

def test_dotted_otp_obfuscation():
    msg = "Share your O-T-P with agent to confirm payment."
    res = text_normalizer.normalize(msg)
    assert res["has_anomalies"] is True
    assert "OTP" in res["obfuscated_keywords"]
    assert "OTP" in res["normalized_text"]

def test_invisible_unicode_characters():
    # Insert zero-width spaces into 'paytm'
    msg = "Your p\u200Ba\u200By\u200Bt\u200Bm wallet is blocked."
    res = text_normalizer.normalize(msg)
    assert res["has_anomalies"] is True
    assert res["invisible_count"] >= 3
    assert "paytm" in res["normalized_text"].lower()

def test_homoglyph_cyrillic_spoofing():
    # 'а' is Cyrillic \u0430, 'у' is Cyrillic \u0443
    msg = "Login at sbi.\u0430\u0441.in to verify account."
    res = text_normalizer.normalize(msg)
    assert res["has_anomalies"] is True
    assert res["confusable_count"] >= 1
    assert "sbi.ac.in" in res["normalized_text"]

def test_leetspeak_substitution():
    msg = "Do not share your 0TP or P@YTM password with anyone."
    res = text_normalizer.normalize(msg)
    assert res["has_anomalies"] is True
    assert "OTP" in res["normalized_text"]
    assert "PAYTM" in res["normalized_text"]

def test_indic_script_ligature_preservation():
    # Legitimate Hindi text with Devanagari conjuncts and halant + ZWNJ (e.g. नमस्ते / क्‌ष)
    msg = "नमस्ते, आपकी बैंक शाखा आज खुली है।"
    res = text_normalizer.normalize(msg)
    assert res["is_indic_safe"] is True
    assert res["has_anomalies"] is False

