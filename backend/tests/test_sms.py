import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from database import init_db, SessionLocal
from routes.auth_routes import generate_otp, verify_otp, get_sms_status
from schemas import OTPGenerateRequest, OTPVerifyRequest
from services.sms_service import sms_service
from config import settings

init_db()

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_sms_service_status():
    """Verify SMS provider status reports correctly."""
    status = sms_service.get_provider_status()
    assert "provider" in status
    assert "smsEnabled" in status
    assert status["smsEnabled"] is True

def test_sms_status_endpoint():
    """Verify get_sms_status endpoint returns operational provider details."""
    data = get_sms_status()
    assert "provider" in data
    assert "twilioConfigured" in data
    assert "smsEnabled" in data

def test_direct_sms_service_send():
    """Verify direct SMSService send_otp_sms call."""
    res = sms_service.send_otp_sms(
        phone_number="9988776655",
        country_code="+91",
        otp_code="654321"
    )
    assert res["success"] is True
    assert "phone" in res
    assert "9988776655"[-2:] in res["phone"]

def test_sms_otp_dispatch_endpoint(db):
    """Verify OTP generation endpoint dispatches SMS and withholds devCode in secure mode."""
    # Ensure secure mode
    settings.SHOW_DEV_OTP_IN_RESPONSE = False

    payload = OTPGenerateRequest(
        phoneNumber="9876543210",
        countryCode="+91"
    )
    data = generate_otp(payload, db=db)

    assert data["success"] is True
    assert "SMS" in data["message"] or "text" in data["message"]
    assert data["deliveryMethod"] == "sms"
    # devCode should be None in secure production mode
    assert data["devCode"] is None

def test_otp_verification_with_static_override(db):
    """Verify developer static override code works for testing."""
    payload = OTPVerifyRequest(
        phoneNumber="9876543210",
        countryCode="+91",
        otp=settings.DEVELOPMENT_STATIC_OTP
    )
    res = verify_otp(payload, db=db)
    assert res.success is True
    assert res.token is not None

def test_fast2sms_invalid_key_rejected():
    """Verify configure_fast2sms rejects empty or invalid keys."""
    from routes.auth_routes import configure_fast2sms, Fast2SMSConfigRequest
    from fastapi import HTTPException
    
    with pytest.raises(HTTPException) as exc_info:
        configure_fast2sms(Fast2SMSConfigRequest(apiKey="invalid_test_key_xyz"))
    assert exc_info.value.status_code == 400
