from fastapi import APIRouter, HTTPException
from backend.schemas import UpdatePackage
from backend.services.update_manager import install, status

router = APIRouter()

@router.get("/updates/check")
def check_updates():
    return {**status(), "available": False, "message": "No update feed is configured. Supply packages through a trusted deployment channel."}

@router.get("/updates/version")
def installed_version():
    return status()

@router.get("/security/status")
def security_status():
    return status()

@router.post("/updates/install")
def install_update(package: UpdatePackage):
    try: return install(package.model_dump())
    except PermissionError as exc: raise HTTPException(422, str(exc)) from exc
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc

