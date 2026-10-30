"""Validate, verify, and atomically install signed data-only rules."""
from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from backend.config import BACKUP_FILE, RULES_FILE, UPDATE_HISTORY_FILE, TRUSTED_UPDATE_PUBLIC_KEY
from backend.services.signature_verifier import verify_package


def read_rules() -> dict:
    try:
        return json.loads(RULES_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        try: return json.loads(BACKUP_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError): return {"version": "unknown", "rules": []}


def version_key(version: str) -> tuple[int, ...]:
    if not re.fullmatch(r"\d+(?:\.\d+){0,3}", version): raise ValueError("Version must contain one to four numeric components.")
    return tuple(int(part) for part in version.split("."))


def status() -> dict:
    rules = read_rules()
    signed_package = rules.get("signed_package")
    verified = bool(
        signed_package
        and signed_package.get("version") == rules.get("version")
        and signed_package.get("rules") == {key: value for key, value in rules.items() if key not in {"version", "updated_at", "verified", "signed_package"}}
        and verify_package(signed_package)
    )
    return {"rulesVersion": rules.get("version", "unknown"), "lastSuccessfulUpdate": rules.get("updated_at"), "verificationStatus": "Verified" if verified else "Verification unavailable", "updateAvailable": False}


def install(package: dict) -> dict:
    if not isinstance(package.get("rules"), dict) or not isinstance(package["rules"].get("rules"), list):
        raise ValueError("Package rules must contain a rules array.")
    rules = package["rules"]["rules"]
    if len(rules) > 5000:
        raise ValueError("An update cannot contain more than 5000 rules.")
    required = {"category", "title", "patterns", "explanation", "why_suspicious", "weight"}
    for rule in rules:
        if not isinstance(rule, dict) or not required.issubset(rule):
            raise ValueError("Each rule must include category, title, patterns, explanation, why_suspicious, and weight.")
        if not isinstance(rule["patterns"], list) or not rule["patterns"] or any(not isinstance(pattern, str) or not pattern or len(pattern) > 200 for pattern in rule["patterns"]):
            raise ValueError("Rule patterns must be a non-empty list of short strings.")
        if not isinstance(rule["weight"], int) or not 0 <= rule["weight"] <= 100:
            raise ValueError("Rule weight must be an integer from 0 to 100.")
    version_key(str(package.get("version", "")))
    current = read_rules()
    if version_key(package["version"]) <= version_key(str(current.get("version", "0"))):
        raise ValueError("Update version must be newer than the installed version.")
    if not TRUSTED_UPDATE_PUBLIC_KEY:
        raise PermissionError("No trusted update public key is configured.")
    if not verify_package(package):
        raise PermissionError("Update signature is invalid or package has expired.")
    updated = {"version": package["version"], "updated_at": datetime.now(timezone.utc).isoformat(), "signed_package": package, **package["rules"]}
    RULES_FILE.parent.mkdir(parents=True, exist_ok=True)
    BACKUP_FILE.parent.mkdir(parents=True, exist_ok=True)
    if RULES_FILE.exists():
        BACKUP_FILE.write_text(RULES_FILE.read_text(encoding="utf-8"), encoding="utf-8")
    fd, temp_name = tempfile.mkstemp(prefix="rules-", suffix=".json", dir=RULES_FILE.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as temp:
            json.dump(updated, temp, ensure_ascii=False, indent=2)
            temp.flush(); os.fsync(temp.fileno())
        os.replace(temp_name, RULES_FILE)
    finally:
        if os.path.exists(temp_name): os.unlink(temp_name)
    history = []
    if UPDATE_HISTORY_FILE.exists():
        try: history = json.loads(UPDATE_HISTORY_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError: pass
    history.append({"version": package["version"], "installed_at": updated["updated_at"], "verification": "Verified"})
    UPDATE_HISTORY_FILE.write_text(json.dumps(history[-100:], indent=2), encoding="utf-8")
    return status()

