from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        extra="allow",
        env_file=[str(BASE_DIR.parent / ".env"), str(BASE_DIR / ".env")],
        env_file_encoding="utf-8"
    )

    APP_NAME: str = "GhostSignal – The Offline Scam Shield"
    VERSION: str = "2.4.0"
    RULES_VERSION: str = "v2.4.0-offline"
    DEBUG: bool = False
    
    # Server network settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.0.4.15:3000",
    ]
    
    # Storage & Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'ghostsignal.db'}"
    
    # Paths for rules and cryptographic verification
    RULES_DIR: Path = BASE_DIR / "rules"
    DEFAULT_RULES_PATH: Path = BASE_DIR / "rules" / "default_rules.json"
    BACKUP_RULES_PATH: Path = BASE_DIR / "rules" / "rules_backup.json"
    UPDATES_DIR: Path = BASE_DIR / "rules" / "updates"
    PUBLIC_KEY_PATH: Path = BASE_DIR / "rules" / "ed25519_public.pem"
    
    # AI Models
    MODELS_DIR: Path = BASE_DIR / "models"
    ONNX_MODEL_PATH: Path = BASE_DIR / "models" / "scam_classifier.onnx"
    
    # Upload limits (Images)
    MAX_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/jpg"]
    
    # OTP Authentication & SMS Gateway
    OTP_LENGTH: int = 6
    OTP_EXPIRY_SECONDS: int = 300  # 5 minutes
    OTP_MAX_ATTEMPTS: int = 3
    DEVELOPMENT_STATIC_OTP: str = "123456"
    SMS_ENABLED: bool = True
    SHOW_DEV_OTP_IN_RESPONSE: bool = False
    
    # SMS Gateway Credentials (optional for live SMS text delivery)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""

    # Whisper Voice Transcription
    WHISPER_MODEL_SIZE: str = "tiny"
    WHISPER_DEVICE: str = "cpu"

settings = Settings()
