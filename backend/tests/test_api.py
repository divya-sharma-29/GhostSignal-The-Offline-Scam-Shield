from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_and_api_aliases():
    assert client.get("/health").status_code == 200
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/security/status").status_code == 200

def test_scan_validation_and_response():
    response = client.post("/scan/text", json={"text": "Send your OTP now"})
    assert response.status_code == 200
    assert response.json()["risk_level"] == "HIGH"
    assert response.json()["unicode_findings"] is not None
    assert client.post("/scan/text", json={"text": ""}).status_code == 422

def test_otp_auth_fails_closed_without_sms_configuration():
    response = client.post("/api/auth/otp/request", json={"phoneNumber": "+911234567890"})
    assert response.status_code == 503

def test_ocr_reports_unsupported_content_type():
    response = client.post("/scan/image", files={"file": ("x.txt", b"hello", "text/plain")})
    assert response.status_code == 415

