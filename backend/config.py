"""Environment-backed configuration for the GhostSignal API."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("GHOSTSIGNAL_DATA_DIR", str(BASE_DIR / "data"))).resolve()
RULES_DIR = BASE_DIR / "rules"
RULES_FILE = Path(os.getenv("GHOSTSIGNAL_RULES_FILE", str(RULES_DIR / "default_rules.json"))).resolve()
DATABASE_FILE = Path(os.getenv("GHOSTSIGNAL_DATABASE", str(DATA_DIR / "ghostsignal.sqlite3"))).resolve()
BACKUP_FILE = DATA_DIR / "last_known_good_rules.json"
UPDATE_HISTORY_FILE = DATA_DIR / "update_history.json"
MAX_TEXT_LENGTH = int(os.getenv("GHOSTSIGNAL_MAX_TEXT_LENGTH", "20000"))
MAX_IMAGE_BYTES = int(os.getenv("GHOSTSIGNAL_MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))
TRUSTED_UPDATE_PUBLIC_KEY = os.getenv("GHOSTSIGNAL_UPDATE_PUBLIC_KEY", "")
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "GHOSTSIGNAL_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",") if origin.strip()]

