"""Single FastAPI application for GhostSignal's server-side integrations."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import ALLOWED_ORIGINS
from backend.database import initialize
from backend.routes import auth_routes, history_routes, health_routes, ocr_routes, scan_routes, update_routes, url_routes

@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize()
    yield

app = FastAPI(title="GhostSignal API", version="1.0.0", description="Privacy-conscious scam analysis and signed rules API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["GET", "POST", "DELETE"], allow_headers=["content-type", "accept"])

for router in (health_routes.router, scan_routes.router, url_routes.router, ocr_routes.router, history_routes.router, update_routes.router, auth_routes.router):
    app.include_router(router)
    app.include_router(router, prefix="/api")

@app.exception_handler(ValueError)
async def invalid_input(_request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

