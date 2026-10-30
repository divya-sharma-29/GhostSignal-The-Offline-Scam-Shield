from backend.services.text_normalizer import normalize_text

def test_invisible_character_is_reported_and_removed_only_in_analysis_copy():
    result = normalize_text("veri\u200bfy OTP")
    assert result["original"] == "veri\u200bfy OTP"
    assert result["normalized"] == "verify OTP"
    assert result["findings"][0]["kind"] == "invisible"

def test_dotted_keyword_is_normalized():
    result = normalize_text("K.Y.C expired; O.T.P")
    assert "KYC" in result["normalized"] and "OTP" in result["normalized"]

def test_mixed_script_homoglyph_is_reported():
    result = normalize_text("gооgle")  # second and third characters are Cyrillic o
    assert any(item["kind"] == "mixed-script" for item in result["findings"])
    assert any(item["kind"] == "homoglyph" for item in result["findings"])

def test_indic_text_is_not_flagged_as_mixed_latin():
    result = normalize_text("कृपया अपना संदेश पढ़ें")
    assert not any(item["kind"] in {"mixed-script", "homoglyph"} for item in result["findings"])

def test_leetspeak_analysis_copy_does_not_change_original():
    original = "0tp verification"
    result = normalize_text(original)
    assert result["original"] == original
    assert result["normalized"].startswith("otp")

