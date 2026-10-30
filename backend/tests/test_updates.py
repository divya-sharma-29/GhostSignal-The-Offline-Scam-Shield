import base64
import json
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from backend.services.signature_verifier import canonical_payload, verify_package

def make_package():
    private = Ed25519PrivateKey.generate()
    public = private.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    package = {"version": "2.0.0", "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(), "rules": {"rules": []}}
    package["signature"] = base64.b64encode(private.sign(canonical_payload(package))).decode()
    return package, base64.b64encode(public).decode()

def test_valid_signature_verifies():
    package, public = make_package()
    assert verify_package(package, public)

def test_tampered_and_unsigned_packages_fail():
    package, public = make_package()
    package["rules"]["rules"].append({"title": "tampered"})
    assert not verify_package(package, public)
    assert not verify_package({"version": "2", "expires_at": "2099-01-01T00:00:00+00:00", "rules": {"rules": []}}, public)

