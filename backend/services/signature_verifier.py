"""Ed25519 verification for signed JSON rule packages."""
from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from backend.config import TRUSTED_UPDATE_PUBLIC_KEY


def canonical_payload(package: dict) -> bytes:
    signed = {key: value for key, value in package.items() if key != "signature"}
    return json.dumps(signed, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def verify_package(package: dict, public_key_b64: str | None = None) -> bool:
    encoded = public_key_b64 or TRUSTED_UPDATE_PUBLIC_KEY
    if not encoded:
        return False
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        public_key = Ed25519PublicKey.from_public_bytes(base64.b64decode(encoded, validate=True))
        signature = base64.b64decode(package["signature"], validate=True)
        public_key.verify(signature, canonical_payload(package))
        expires = datetime.fromisoformat(package["expires_at"].replace("Z", "+00:00"))
        if expires.tzinfo is None or expires <= datetime.now(timezone.utc):
            return False
        return True
    except Exception:
        return False

