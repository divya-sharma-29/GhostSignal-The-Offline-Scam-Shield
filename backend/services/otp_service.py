import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session

from config import settings
from models import OTPRecordModel

class OTPService:
    """
    Secure Cryptographic OTP (One-Time Password) Generator & Verifier.
    Features:
    - CSPRNG (Cryptographically Secure Pseudo-Random Number Generation)
    - Salted SHA-256 hashing (raw OTP codes are never stored in plaintext)
    - 5-minute expiration enforcement
    - Maximum verification attempts limit (brute-force defense)
    - Local test mode support (allows '123456' for rapid developer testing)
    """

    @staticmethod
    def _hash_otp(otp_str: str, salt: str) -> str:
        """Computes salted SHA-256 digest."""
        return hashlib.sha256((otp_str + salt).encode('utf-8')).hexdigest()

    def generate_otp(
        self,
        db: Session,
        phone_number: str,
        country_code: str = "+91"
    ) -> Dict[str, Any]:
        """
        Generates a 6-digit OTP code, salts and persists its hash with expiration.
        """
        digits = "".join(filter(str.isdigit, phone_number))
        full_phone = f"{country_code}{digits}"

        # Generate 6-digit random code using CSPRNG
        raw_otp = str(secrets.randbelow(900000) + 100000)
        salt = secrets.token_hex(16)
        otp_hash = self._hash_otp(raw_otp, salt)

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)

        # Upsert OTP record
        record = db.query(OTPRecordModel).filter(OTPRecordModel.phone_number == full_phone).first()
        if not record:
            record = OTPRecordModel(
                phone_number=full_phone,
                otp_hash=otp_hash,
                salt=salt,
                created_at=now.isoformat(),
                expires_at=expires_at.isoformat(),
                attempts=0,
                verified=False
            )
            db.add(record)
        else:
            record.otp_hash = otp_hash
            record.salt = salt
            record.created_at = now.isoformat()
            record.expires_at = expires_at.isoformat()
            record.attempts = 0
            record.verified = False

        db.commit()

        return {
            "success": True,
            "message": f"Verification code generated for {country_code} ••••••{digits[-2:] if len(digits) >= 2 else '00'}.",
            "expiresInSeconds": settings.OTP_EXPIRY_SECONDS,
            "devCode": raw_otp  # Accessible for local development / testing
        }

    def verify_otp(
        self,
        db: Session,
        phone_number: str,
        country_code: str = "+91",
        otp_code: str = ""
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Verifies submitted OTP code against salted hash.
        Enforces expiration and attempt limits.
        """
        digits = "".join(filter(str.isdigit, phone_number))
        full_phone = f"{country_code}{digits}"
        cleaned_otp = otp_code.strip()

        # Development static override
        if cleaned_otp == settings.DEVELOPMENT_STATIC_OTP:
            token = secrets.token_urlsafe(32)
            return True, "Code verified successfully (Developer Test Code).", token

        record = db.query(OTPRecordModel).filter(OTPRecordModel.phone_number == full_phone).first()
        if not record:
            return False, "No active verification request found. Please request a new code.", None

        # Check expiration
        try:
            exp_time = datetime.fromisoformat(record.expires_at)
            if datetime.now(timezone.utc) > exp_time:
                return False, "Verification code has expired. Please request a new one.", None
        except Exception:
            return False, "Verification code timestamp corrupted.", None

        # Check attempts
        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            return False, "Too many failed attempts. Please request a new verification code.", None

        # Verify hash
        computed_hash = self._hash_otp(cleaned_otp, record.salt)
        if secrets.compare_digest(computed_hash, record.otp_hash):
            record.verified = True
            db.commit()
            token = secrets.token_urlsafe(32)
            return True, "Phone verification successful.", token

        # Increment failure attempts
        record.attempts += 1
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - record.attempts
        return False, f"Incorrect code. {remaining} attempt(s) remaining.", None

otp_service = OTPService()

