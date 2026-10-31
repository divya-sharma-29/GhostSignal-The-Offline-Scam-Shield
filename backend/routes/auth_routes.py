from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    OTPGenerateRequest,
    OTPGenerateResponse,
    OTPVerifyRequest,
    OTPVerifyResponse
)
from services.otp_service import otp_service
from services.sms_service import sms_service

router = APIRouter(prefix="/auth", tags=["Authentication & OTP"])

@router.get("/sms/status")
def get_sms_status():
    """
    Returns active SMS delivery provider and configuration status.
    """
    return sms_service.get_provider_status()

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

