from backend.services.url_analyzer import analyze_url

def test_url_is_not_opened_and_shortener_is_explained():
    result = analyze_url("https://bit.ly/abc123")
    assert result["risk_level"] == "MEDIUM"
    assert any("shortening" in reason for reason in result["reasons"])

def test_plain_https_url_is_not_automatically_high_risk():
    result = analyze_url("https://example.com/path")
    assert result["risk_level"] == "LOW"

def test_ip_host_is_reported():
    result = analyze_url("http://192.0.2.1/login")
    assert any("IP address" in reason for reason in result["reasons"])

