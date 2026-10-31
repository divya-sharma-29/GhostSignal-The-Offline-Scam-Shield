from routes.health_routes import router as health_router
from routes.scan_routes import router as scan_router
from routes.ocr_routes import router as ocr_router
from routes.url_routes import router as url_router
from routes.history_routes import router as history_router
from routes.update_routes import router as update_router
from routes.auth_routes import router as auth_router
from routes.model_routes import router as model_router

__all__ = [
    "health_router",
    "scan_router",
    "ocr_router",
    "url_router",
    "history_router",
    "update_router",
    "auth_router",
    "model_router",
]

