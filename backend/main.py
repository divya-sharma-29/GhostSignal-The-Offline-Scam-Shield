from contextlib import asynccontextmanager
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from config import settings
from database import init_db
from routes import (
    health_router,
    scan_router,
    ocr_router,
    url_router,
    history_router,
    update_router,
    auth_router,
    model_router,
    voice_router
)

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ghostsignal_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Starting GhostSignal Backend Subsystems...")
    init_db()
    logger.info(f"GhostSignal database initialized successfully at {settings.DATABASE_URL}")
    yield
    logger.info("GhostSignal Backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "GhostSignal Privacy-Focused Scam Detection Backend. "
        "Provides Unicode Shield normalization, threat detection, offline signed updates, "
        "passive URL analysis, and local AI inference."
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS for React frontend (localhost:3000, 127.0.0.1:3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health_router)
app.include_router(scan_router)
app.include_router(ocr_router)
app.include_router(url_router)
app.include_router(history_router)
app.include_router(update_router)
app.include_router(auth_router)
app.include_router(model_router)
app.include_router(voice_router)

# Safe Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred. Your privacy and input were preserved.",
            "details": str(exc) if settings.DEBUG else None
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
