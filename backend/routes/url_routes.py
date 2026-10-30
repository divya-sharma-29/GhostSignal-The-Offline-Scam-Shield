from fastapi import APIRouter
from backend.schemas import UrlScanRequest
from backend.services.url_analyzer import analyze_url

router = APIRouter()

@router.post("/scan/url")
def scan_url(request: UrlScanRequest):
    return analyze_url(request.url)

