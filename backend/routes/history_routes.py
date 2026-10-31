from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas import HistoryListResponse, SimpleMessageResponse
from services.history_manager import history_manager

router = APIRouter(prefix="/history", tags=["Scan History"])

@router.get("", response_model=HistoryListResponse)
def get_scan_history(
    limit: int = Query(50, ge=1, le=200, description="Maximum records to retrieve"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Retrieves privacy-sanitized scan history stored locally in SQLite.
    Private messages are truncated into safe snippets to preserve user confidentiality.
    """
    total = history_manager.get_count(db)
    items = history_manager.get_history(db, limit=limit, offset=offset)
    return {
        "total": total,
        "items": items
    }

@router.delete("", response_model=SimpleMessageResponse)
def clear_all_history(db: Session = Depends(get_db)):
    """
    Permanently deletes all stored scan history from the local SQLite database.
    """
    count = history_manager.clear_all(db)
    return {
        "success": True,
        "message": f"Successfully cleared {count} scan record(s) from local history."
    }

@router.delete("/{scan_id}", response_model=SimpleMessageResponse)
def delete_single_scan(scan_id: str, db: Session = Depends(get_db)):
    """
    Permanently removes a single scan record by its unique ID.
    """
    deleted = history_manager.delete_scan(db, scan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Scan record '{scan_id}' not found.")
    return {
        "success": True,
        "message": f"Successfully deleted scan record '{scan_id}'."
    }

