from fastapi import APIRouter, Query
from backend.database import clear_scans, list_scans

router = APIRouter()

@router.get("/history")
def history(limit: int = Query(default=50, ge=1, le=100)):
    return {"items": list_scans(limit)}

@router.delete("/history")
def delete_history():
    return {"deleted": clear_scans()}

