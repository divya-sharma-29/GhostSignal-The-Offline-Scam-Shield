"""Optional local model status. No model is shipped or fabricated."""
from __future__ import annotations

from pathlib import Path
from backend.config import BASE_DIR

MODEL_PATH = BASE_DIR / "models" / "scam_classifier.onnx"


def status() -> dict:
    if not MODEL_PATH.is_file():
        return {"available": False, "mode": "rules-only", "model_version": None, "detail": "No trained ONNX model is installed; explainable rules are active."}
    try:
        import onnxruntime  # noqa: F401
    except ImportError:
        return {"available": False, "mode": "rules-only", "model_version": None, "detail": "Model file exists, but onnxruntime is not installed."}
    return {"available": False, "mode": "rules-only", "model_version": None, "detail": "A model file is present, but this project has no compatible tokenizer/model manifest. Model inference is disabled."}


def predict(_text: str) -> dict:
    return status()

