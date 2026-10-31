import pytest
import json
from pathlib import Path
from services.update_manager import update_manager
from services.signature_verifier import signature_verifier

def test_verify_valid_signed_package():
    # Load staged signed update
    staged_path = Path(__file__).resolve().parent.parent / "rules" / "updates" / "signed_update_2.4.1.json"
    assert staged_path.exists(), "Staged signed update must exist."

    with open(staged_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)

    payload_to_verify = {
        "version": pkg["version"],
        "rules": pkg["rules"],
        "timestamp": pkg["timestamp"]
    }
    if "expiresAt" in pkg:
        payload_to_verify["expiresAt"] = pkg["expiresAt"]

    is_valid, msg = signature_verifier.verify_signature(payload_to_verify, pkg["signature"])
    assert is_valid is True

def test_tampered_package_rejected():
    staged_path = Path(__file__).resolve().parent.parent / "rules" / "updates" / "signed_update_2.4.1.json"
    with open(staged_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)

    # Tamper with rules dictionary
    tampered_rules = dict(pkg["rules"])
    tampered_rules["malicious_flag"] = True

    payload_to_verify = {
        "version": pkg["version"],
        "rules": tampered_rules,
        "timestamp": pkg["timestamp"]
    }
    if "expiresAt" in pkg:
        payload_to_verify["expiresAt"] = pkg["expiresAt"]

    is_valid, msg = signature_verifier.verify_signature(payload_to_verify, pkg["signature"])
    assert is_valid is False
    assert "failed" in msg.lower()

def test_rollback_prevention():
    # Attempting to install version 1.0.0 when current is 2.4.0 must be rejected
    success, msg = update_manager.install_update(
        version="1.0.0",
        rules_payload={"categories": {}},
        signature="dummy",
        timestamp="2026-10-31T00:00:00Z"
    )
    assert success is False
    assert "Rollback Attack Prevented" in msg

