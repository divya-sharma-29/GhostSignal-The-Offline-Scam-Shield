"""
GhostSignal — AI Model Management and Quantized Download Routes.
"""

import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, RedirectResponse
from typing import Dict, Any
from pathlib import Path
import logging

from services.ai_engine import ai_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/model", tags=["AI Model Management"])

GGUF_MODEL_PATH = Path("backend/models/smollm3-3b-q4.gguf")
DIRECT_HF_URL = "https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF/resolve/main/smollm3-3b-instruct-q4_k_m.gguf"

@router.get("/status")
def get_ai_model_status() -> Dict[str, Any]:
    """Returns status, quantization format, and offline readiness of local AI models."""
    return ai_engine.get_model_info()

@router.get("/download/info")
def get_model_download_info() -> Dict[str, Any]:
    """Returns direct download URLs, quantization details, and offline instructions for SmolLM3-3B."""
    has_local = GGUF_MODEL_PATH.exists()
    local_size_mb = round(GGUF_MODEL_PATH.stat().st_size / (1024 * 1024), 2) if has_local else 0

    return {
        "model_name": "SmolLM3-3B (Quantized)",
        "base_repo": "https://huggingface.co/HuggingFaceTB/SmolLM3-3B",
        "gguf_repo": "https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF",
        "direct_download_url": DIRECT_HF_URL,
        "local_download_url": "/model/download/file",
        "quantization_format": "Q4_K_M (4-bit medium)",
        "file_size_bytes": 1953504800,
        "file_size_gb": "1.82 GB",
        "original_fp16_size_gb": "6.0 GB",
        "compression_ratio": "3.3x",
        "target_file_name": "smollm3-3b-q4.gguf",
        "target_local_path": "backend/models/smollm3-3b-q4.gguf",
        "is_locally_installed": has_local,
        "local_size_mb": local_size_mb,
        "colab_notebook_url": "https://colab.research.google.com/notebook#fileId=https%3A//huggingface.co/HuggingFaceTB/SmolLM3-3B.ipynb",
        "instructions": (
            "1. Download the quantized model file (~1.82 GB).\n"
            "2. Place it in 'backend/models/smollm3-3b-q4.gguf'.\n"
            "3. GhostSignal will automatically load the model for completely offline reasoning."
        )
    }

@router.get("/download/file")
def download_model_file():
    """
    Directly streams the quantized GGUF file to the client browser if installed locally,
    or redirects to HuggingFace Hub CDN for instant direct download.
    """
    if GGUF_MODEL_PATH.exists() and GGUF_MODEL_PATH.stat().st_size > 1024 * 1024:
        return FileResponse(
            path=str(GGUF_MODEL_PATH),
            filename="smollm3-3b-q4.gguf",
            media_type="application/octet-stream"
        )
    # Redirect to HuggingFace CDN directly
    return RedirectResponse(url=DIRECT_HF_URL)

@router.post("/download/trigger")
def trigger_model_download(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Triggers background download of the quantized SmolLM3-3B model."""
    try:
        from tools.download_smollm import download_model
        background_tasks.add_task(download_model, "quantized", "backend/models")
        return {
            "success": True,
            "message": "Quantized SmolLM3-3B download initiated in the background.",
            "destination": "backend/models/smollm3-3b-q4.gguf",
            "direct_url": DIRECT_HF_URL
        }
    except Exception as e:
        logger.error(f"Download trigger failed: {e}")
        return {
            "success": False,
            "message": f"Could not start background task: {e}. You can download directly via URL.",
            "direct_url": DIRECT_HF_URL
        }

@router.get("/colab/pipeline")
def get_colab_pipeline() -> Dict[str, Any]:
    """Returns complete pipeline specification for Colab fine-tuning and holdout evaluation."""
    from training.colab_pipeline import get_pipeline_specs
    return get_pipeline_specs()

@router.get("/colab/notebook")
def download_colab_notebook():
    """Directly downloads the generated self-contained train_smollm3_3b.ipynb notebook."""
    notebook_path = Path("backend/training/train_smollm3_3b.ipynb")
    if not notebook_path.exists():
        from training.colab_pipeline import create_notebook
        create_notebook()
    if notebook_path.exists():
        return FileResponse(
            path=str(notebook_path),
            filename="train_smollm3_3b.ipynb",
            media_type="application/x-ipynb+json"
        )
    raise HTTPException(status_code=404, detail="Colab notebook not found.")

@router.get("/colab/dataset")
def download_colab_dataset():
    """Directly downloads the 508-sample synthetic scam dataset in CSV format."""
    csv_path = Path("backend/training/data/synthetic_scam_dataset.csv")
    if csv_path.exists():
        return FileResponse(
            path=str(csv_path),
            filename="synthetic_scam_dataset.csv",
            media_type="text/csv"
        )
    raise HTTPException(status_code=404, detail="Synthetic dataset CSV not found.")

@router.get("/architecture")
def get_model_architecture() -> Dict[str, Any]:
    """Returns the Two-Tier Engine architecture breakdown according to the system blueprint."""
    return {
        "engine_framework": "Two-Tier Hybrid Offline Scam Shield",
        "philosophy": "Deterministic rules form the foundation of truth; AI provides contextual explanation.",
        "tiers": {
            "tier_1_foundational": {
                "name": "Deterministic Inspection & Unicode Shield (P0)",
                "priority": "P0 (Core Ground Truth)",
                "components": [
                    "Unicode Shield (Homoglyphs, Zero-Width Spaces, Bidi Overrides, Unusual Spacing, Dotted Patterns)",
                    "Threat Heuristic Rule Matchers (Bank Impersonation, UPI Reverse Collect, KYC Urgency, OTP Harvesting)",
                    "Regex Pattern Extractors & High-Risk URL Domain Indicators",
                    "Ed25519 Cryptographically Signed Rule Updates & Anti-Rollback Monotonic Engine"
                ],
                "performance": {
                    "latency": "< 1 ms",
                    "ram_usage": "< 10 MB",
                    "network_calls": 0,
                    "offline_guarantee": "100% On-Device"
                }
            },
            "tier_2_explainability": {
                "name": "SmolLM3-3B Quantized Reasoner (P2)",
                "priority": "P2 (Optional Explainability Enhancement)",
                "base_model": "HuggingFaceTB/SmolLM3-3B",
                "fine_tuning": "Curated 508-sample cyber threat dataset (ChatML SFT)",
                "quantization": "GGUF Q4_K_M (4-bit medium)",
                "quantized_size": "1.82 GB (compressed from 6.0 GB)",
                "ram_required": "~2.1 GB",
                "role": "Translates technical threat flags into plain-language advice and safe steps; does not override deterministic security scores.",
                "offline_guarantee": "100% On-Device"
            }
        }
    }
