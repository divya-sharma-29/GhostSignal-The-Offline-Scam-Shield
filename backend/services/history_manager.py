"""Privacy-minimized history facade."""
from backend.database import clear_scans, list_scans, save_scan

__all__ = ["clear_scans", "list_scans", "save_scan"]

