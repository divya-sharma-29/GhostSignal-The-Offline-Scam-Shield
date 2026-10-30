"""OTP placeholders fail closed until a real SMS delivery provider is configured."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

class OtpRequest(BaseModel):
    phoneNumber: str = Field(min_length=8, max_length=16, pattern=r"^\+[1-9]\d{6,14}$")

class OtpVerify(BaseModel):
    challengeId: str = Field(min_length=1, max_length=128)
    code: str = Field(min_length=4, max_length=8, pattern=r"^\d+$")

@router.post("/auth/otp/request")
def request_otp(_request: OtpRequest):
    raise HTTPException(503, "SMS sign-in is not configured on this server yet.")

@router.post("/auth/otp/verify")
def verify_otp(_request: OtpVerify):
    raise HTTPException(503, "SMS sign-in is not configured on this server yet.")

@router.get("/auth/session")
def session():
    raise HTTPException(401, "No authenticated session.")

@router.post("/auth/logout")
def logout():
    return {"ok": True}

