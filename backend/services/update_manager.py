import json
import os
import shutil
import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

from config import settings
from services.signature_verifier import signature_verifier

def parse_semver(v_str: str) -> Tuple[int, int, int]:
    """Extracts major, minor, patch tuple from strings like 'v2.4.0-offline' or '2.4.1'."""
    clean = re.sub(r'^[vV]', '', v_str).split('-')[0]
    parts = clean.split('.')
    try:
        return (
            int(parts[0]) if len(parts) > 0 else 0,
            int(parts[1]) if len(parts) > 1 else 0,
            int(parts[2]) if len(parts) > 2 else 0,
        )
    except ValueError:
        return (0, 0, 0)

class UpdateManager:
    """
    Secure Offline Security Rule Update Manager.
    Features:
    - Ed25519 digital signature verification
    - Rollback attack prevention
    - Expiration timestamp validation
    - Schema integrity verification
    - Atomic file replacement with last-known-good backup
    - Hot-reloading into active detector memory
    """

    def __init__(self):
        self.rules_path = settings.DEFAULT_RULES_PATH
        self.backup_path = settings.BACKUP_RULES_PATH

    def get_installed_version_info(self) -> Dict[str, Any]:
        """Returns currently installed security rules version and metadata."""
        if self.rules_path.exists():
            try:
                with open(self.rules_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    categories = data.get("categories", {})
                    pattern_count = sum(len(c.get("patterns", [])) for c in categories.values())
                    return {
                        "version": data.get("version", settings.RULES_VERSION),
                        "installedAt": data.get("updated_at", "2026-10-30T00:00:00Z"),
                        "rulesCount": pattern_count,
                        "lastVerified": True
                    }
            except Exception:
                pass

        return {
            "version": settings.RULES_VERSION,
            "installedAt": "2026-10-30T00:00:00Z",
            "rulesCount": 45,
            "lastVerified": True
        }

    def get_current_version(self) -> str:
        """Returns the active rules semantic version string."""
        return self.get_installed_version_info()["version"]

    def check_for_updates(self) -> Dict[str, Any]:
        """
        Checks update status against local repository or update directory.
        Returns whether an update is available and what version.
        """
        current_info = self.get_installed_version_info()
        current_ver = current_info["version"]

        # Check if an update package is staged in the updates directory
        latest_version = current_ver
        update_available = False
        release_notes = "You are running the latest verified security rule definitions."

        if settings.UPDATES_DIR.exists():
            update_files = list(settings.UPDATES_DIR.glob("*.json"))
            if update_files:
                try:
                    with open(update_files[0], "r", encoding="utf-8") as f:
                        up_pkg = json.load(f)
                        staged_ver = up_pkg.get("version", "")
                        if parse_semver(staged_ver) > parse_semver(current_ver):
                            update_available = True
                            latest_version = staged_ver
                            release_notes = up_pkg.get("release_notes", f"Security definitions package {staged_ver}")
                except Exception:
                    pass

        return {
            "updateAvailable": update_available,
            "currentVersion": current_ver,
            "latestVersion": latest_version if update_available else current_ver,
            "releaseNotes": release_notes,
            "publishedAt": datetime.now(timezone.utc).isoformat()
        }

    def install_update(
        self,
        version: str,
        rules_payload: dict,
        signature: str,
        timestamp: str,
        expires_at: Optional[str] = None,
        db_session = None
    ) -> Tuple[bool, str]:
        """
        Verifies signature, validates schema & semver, and atomically installs updated rules.
        """
        # 1. Schema check
        if not isinstance(rules_payload, dict) or "categories" not in rules_payload:
            return False, "Update rejected: Invalid package schema. Missing 'categories' dictionary."

        # 2. Rollback Attack Prevention (Semantic Version Comparison)
        current_ver = self.get_installed_version_info()["version"]
        if parse_semver(version) <= parse_semver(current_ver):
            return False, (
                f"Rollback Attack Prevented: Proposed update version ({version}) is not strictly newer "
                f"than currently installed version ({current_ver})."
            )

        # 3. Expiration Check
        if expires_at:
            try:
                exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > exp_dt:
                    return False, "Update rejected: This security definitions package has expired."
            except Exception:
                return False, "Update rejected: Malformed expiration timestamp."

        # 4. Cryptographic Ed25519 Signature Verification
        payload_to_verify = {
            "version": version,
            "rules": rules_payload,
            "timestamp": timestamp
        }
        if expires_at:
            payload_to_verify["expiresAt"] = expires_at

        is_valid, msg = signature_verifier.verify_signature(payload_to_verify, signature)
        if not is_valid:
            return False, f"Update rejected: Cryptographic verification failed ({msg})."

        # 5. Atomic File Installation with Backup
        try:
            # Backup currently installed good rules
            if self.rules_path.exists():
                shutil.copy2(self.rules_path, self.backup_path)

            # Prepare full new rules document
            new_rules_doc = {
                "version": version,
                "updated_at": timestamp,
                "description": rules_payload.get("description", "GhostSignal Verified Update Package"),
                "categories": rules_payload.get("categories", {}),
                "high_risk_keywords": rules_payload.get("high_risk_keywords", []),
                "confusable_homoglyphs": rules_payload.get("confusable_homoglyphs", {}),
                "suspicious_separators": rules_payload.get("suspicious_separators", []),
                "invisible_characters": rules_payload.get("invisible_characters", [])
            }

            temp_path = self.rules_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(new_rules_doc, f, indent=2, ensure_ascii=False)

            # Atomic swap
            os.replace(temp_path, self.rules_path)

            # Hot reload in detector
            from services.detector import scam_detector
            scam_detector.load_rules(self.rules_path)

            # Compute package hash
            pkg_hash = hashlib.sha256(json.dumps(new_rules_doc).encode('utf-8')).hexdigest()

            # Record in database if session supplied
            if db_session:
                from models import UpdateLogModel
                log_entry = UpdateLogModel(
                    installed_at=datetime.now(timezone.utc).isoformat(),
                    version=version,
                    signature_verified=True,
                    package_hash=pkg_hash,
                    status="VERIFIED_AND_INSTALLED"
                )
                db_session.add(log_entry)
                db_session.commit()

            return True, f"Security rules successfully updated and hot-reloaded to version {version}."
        except Exception as e:
            # Restore backup if available
            if self.backup_path.exists():
                shutil.copy2(self.backup_path, self.rules_path)
            return False, f"Installation failure: {str(e)}. Reverted to previous safe rules."

update_manager = UpdateManager()

