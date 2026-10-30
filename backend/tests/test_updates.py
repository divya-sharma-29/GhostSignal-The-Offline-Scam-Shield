import base64
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

def test_update_install_requires_signature_and_is_atomic(tmp_path, monkeypatch):
    import backend.services.update_manager as manager
    import backend.services.signature_verifier as verifier
    package, public = make_package()
    package["rules"] = {"rules": [{"category": "otp", "title": "OTP", "patterns": ["send otp"], "explanation": "Requests code", "why_suspicious": "Secret", "weight": 50}]}
    package.pop("signature")
    private = Ed25519PrivateKey.generate()
    public_raw = private.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    public = base64.b64encode(public_raw).decode()
    package["signature"] = base64.b64encode(private.sign(canonical_payload(package))).decode()
    current = tmp_path / "rules.json"
    current.write_text('{"version":"1.0.0","rules":[]}', encoding="utf-8")
    monkeypatch.setattr(manager, "RULES_FILE", current)
    monkeypatch.setattr(manager, "BACKUP_FILE", tmp_path / "backup.json")
    monkeypatch.setattr(manager, "UPDATE_HISTORY_FILE", tmp_path / "history.json")
    monkeypatch.setattr(manager, "TRUSTED_UPDATE_PUBLIC_KEY", public)
    monkeypatch.setattr(verifier, "TRUSTED_UPDATE_PUBLIC_KEY", public)
    installed = manager.install(package)
    assert installed["verificationStatus"] == "Verified"
    assert current.exists() and (tmp_path / "backup.json").exists()

def test_rollback_is_rejected(tmp_path, monkeypatch):
    import backend.services.update_manager as manager
    monkeypatch.setattr(manager, "RULES_FILE", tmp_path / "rules.json")
    monkeypatch.setattr(manager, "BACKUP_FILE", tmp_path / "backup.json")
    (tmp_path / "rules.json").write_text('{"version":"3.0.0","rules":[]}', encoding="utf-8")
    try:
        manager.install({"version": "2.0.0", "expires_at": "2099-01-01T00:00:00+00:00", "rules": {"rules": []}, "signature": "invalid"})
    except ValueError as exc:
        assert "newer" in str(exc)
    else:
        raise AssertionError("A rollback package was accepted")

