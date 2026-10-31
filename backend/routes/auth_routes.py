from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    OTPGenerateRequest,
    OTPGenerateResponse,
    OTPVerifyRequest,
    OTPVerifyResponse
)
from pydantic import BaseModel
from services.otp_service import otp_service
from services.sms_service import sms_service

class Fast2SMSConfigRequest(BaseModel):
    apiKey: str

router = APIRouter(prefix="/auth", tags=["Authentication & OTP"])

@router.get("/sms/status")
def get_sms_status():
    """
    Returns active SMS delivery provider and configuration status.
    """
    return sms_service.get_provider_status()

@router.post("/sms/fast2sms/configure")
def configure_fast2sms(request: Fast2SMSConfigRequest):
    """
    Configures and tests Fast2SMS API key dynamically.
    Validates key against Fast2SMS API and updates local environment.
    """
    clean_key = request.apiKey.strip()
    if not clean_key:
        raise HTTPException(status_code=400, detail="Fast2SMS API key cannot be empty.")

    balance_res = sms_service.check_fast2sms_balance(clean_key)
    if not balance_res.get("valid"):
        raise HTTPException(
            status_code=400,
            detail=f"Fast2SMS API verification failed: {balance_res.get('error', 'Invalid Key')}"
        )

    # Save to settings in runtime
    from config import settings, BASE_DIR
    settings.FAST2SMS_API_KEY = clean_key

    # Persist to .env files (root and backend)
    env_paths = [BASE_DIR.parent / ".env", BASE_DIR / ".env"]
    for env_path in env_paths:
        lines = []
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.startswith("FAST2SMS_API_KEY="):
                        lines.append(line.rstrip("\r\n"))
        lines.append(f"FAST2SMS_API_KEY={clean_key}")
        with open(env_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    return {
        "success": True,
        "message": f"Fast2SMS connected successfully! Wallet balance: ₹{balance_res.get('wallet', 0.0):.2f}",
        "wallet": balance_res.get("wallet", 0.0),
        "provider": "fast2sms"
    }

@router.get("/sms/fast2sms/test")
def test_fast2sms():
    """
    Tests currently configured Fast2SMS credentials and balance.
    """
    return sms_service.check_fast2sms_balance()

@router.post("/otp/generate", response_model=OTPGenerateResponse)
def generate_otp(request: OTPGenerateRequest, db: Session = Depends(get_db)):
    """
    Generates a secure 6-digit OTP code for the user's phone number.
    Uses CSPRNG and stores a salted SHA-256 hash with 5-minute expiration.
    In local development, returns the dev code for immediate developer testing.
    """
    clean_phone = request.phoneNumber.strip()
    if len(clean_phone) < 7:
        raise HTTPException(status_code=400, detail="Invalid phone number format.")

    res = otp_service.generate_otp(
        db=db,
        phone_number=clean_phone,
        country_code=request.countryCode or "+91"
    )
    return res

@router.post("/otp/verify", response_model=OTPVerifyResponse)
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies submitted 6-digit OTP code against the stored salted hash.
    Enforces maximum attempts and expiration.
    """
    success, message, token = otp_service.verify_otp(
        db=db,
        phone_number=request.phoneNumber,
        country_code=request.countryCode or "+91",
        otp_code=request.otp
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return OTPVerifyResponse(
        success=True,
        message=message,
        token=token
    )

