from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    RuleVersionResponse,
    UpdateCheckResponse,
    UpdateInstallRequest,
    UpdateInstallResponse
)
from services.update_manager import update_manager

router = APIRouter(prefix="/updates", tags=["Security Updates"])

@router.get("/version", response_model=RuleVersionResponse)
def get_rule_version():
    """
    Returns the currently active security rules version, update timestamp,
    total pattern count, and cryptographic verification status.
    """
    return update_manager.get_installed_version_info()

@router.get("/check", response_model=UpdateCheckResponse)
def check_updates():
    """
    Checks if a newer signed security definition package is available for installation.
    """
    return update_manager.check_for_updates()

@router.post("/install", response_model=UpdateInstallResponse)
def install_signed_update(
    package: UpdateInstallRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies and installs an authentic, digitally signed Ed25519 rule package.
    Enforces:
    - Cryptographic signature verification with local trusted public key
    - Rollback attack prevention (must be strictly newer semver)
    - Package expiration verification
    - Schema validation
    - Atomic file replacement with backup preservation
    - Live detector hot-reload
    """
    success, message = update_manager.install_update(
        version=package.version,
        rules_payload=package.rules,
        signature=package.signature,
        timestamp=package.timestamp,
        expires_at=package.expiresAt,
        db_session=db
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return UpdateInstallResponse(
        success=True,
        message=message,
        installedVersion=package.version,
        timestamp=package.timestamp
    )

