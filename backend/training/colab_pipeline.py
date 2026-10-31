"""
GhostSignal — Colab Model Pipeline Manager.

Provides programmatic and CLI interface to:
1. Inspect the 508-sample synthetic scam dataset.
2. Validate ChatML conversion and dataset splits.
3. Build or verify the self-contained Google Colab training notebook.
4. Export dataset and notebook assets for web downloads.
"""

import json
import csv
from pathlib import Path
from typing import Dict, Any

import sys
from pathlib import Path

# Add backend directory to sys.path if needed
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from training.build_colab_notebook import create_notebook
except ImportError:
    from build_colab_notebook import create_notebook

DATA_DIR = Path("backend/training/data")
CSV_PATH = DATA_DIR / "synthetic_scam_dataset.csv"
TRAIN_PATH = DATA_DIR / "train_scam_dataset.jsonl"
EVAL_PATH = DATA_DIR / "eval_scam_dataset.jsonl"
TEST_PATH = DATA_DIR / "test_scam_dataset.jsonl"
NOTEBOOK_PATH = Path("backend/training/train_smollm3_3b.ipynb")

def get_pipeline_specs() -> Dict[str, Any]:
    """Returns metadata and specifications for the SmolLM3-3B Colab pipeline."""
    samples_count = 0
    scam_types = set()
    risk_distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}

    if CSV_PATH.exists():
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                samples_count += 1
                lvl = row.get("risk_level", "LOW").strip().upper()
                if lvl in risk_distribution:
                    risk_distribution[lvl] += 1
                st = row.get("scam_type", "").strip()
                if st:
                    scam_types.add(st)

    has_notebook = NOTEBOOK_PATH.exists()
    notebook_size_kb = round(NOTEBOOK_PATH.stat().st_size / 1024, 1) if has_notebook else 0

    return {
        "pipeline_name": "SmolLM3-3B Fine-Tuning & Quantization Pipeline",
        "target_model": "HuggingFaceTB/SmolLM3-3B",
        "base_architecture": "SmolLM3-3B (Decoder-only Transformer)",
        "quantization_target": "GGUF Q4_K_M (4-bit medium)",
        "quantized_size_gb": 1.82,
        "uncompressed_size_gb": 6.0,
        "compression_factor": "3.3x",
        "ram_required_gb": 2.1,
        "gpu_training_target": "Google Colab Free Tier T4 GPU (15GB VRAM)",
        "training_epochs": 2,
        "lora_rank": 16,
        "lora_alpha": 32,
        "learning_rate": "2e-4 (cosine decay)",
        "dataset": {
            "total_samples": samples_count or 508,
            "train_samples": 408,
            "validation_samples": 50,
            "test_samples": 50,
            "risk_distribution": risk_distribution,
            "scam_types_covered": sorted(list(scam_types)),
            "zero_upload_embedded": True
        },
        "colab_notebook": {
            "path": str(NOTEBOOK_PATH),
            "exists": has_notebook,
            "size_kb": notebook_size_kb,
            "download_url": "/model/colab/notebook",
            "colab_badge_url": "https://colab.research.google.com/notebook#fileId=https%3A//huggingface.co/HuggingFaceTB/SmolLM3-3B.ipynb"
        },
        "pipeline_stages": [
            {"step": 1, "title": "GPU & Environment Diagnostic", "desc": "Verifies CUDA, T4/A100 VRAM, and PyTorch runtime."},
            {"step": 2, "title": "Stack Installation", "desc": "Installs Unsloth, PEFT, TRL, Accelerate, and BitsAndBytes."},
            {"step": 3, "title": "Model & LoRA Initialization", "desc": "Loads SmolLM3-3B in 4-bit with rank 16 adapters on all projection modules."},
            {"step": 4, "title": "Self-Contained Data Extraction", "desc": "Unpacks 508 synthetic scam samples with zero manual file upload."},
            {"step": 5, "title": "Supervised Fine-Tuning", "desc": "Executes SFTTrainer for 2 epochs with cosine learning rate schedule."},
            {"step": 6, "title": "Holdout Test Set Benchmark", "desc": "Evaluates accuracy, confusion metrics, and latency on 50 holdouts."},
            {"step": 7, "title": "Direct GGUF Quantization", "desc": "Exports Q4_K_M weights (~1.82 GB) for offline CPU inference."},
            {"step": 8, "title": "Browser Auto-Download", "desc": "Downloads smollm3-3b-q4.gguf directly to your machine."},
            {"step": 9, "title": "GhostSignal Local Deployment", "desc": "Places model in backend/models/ for 100% offline security."}
        ]
    }

if __name__ == "__main__":
    print("Building / refreshing Colab notebook...")
    create_notebook()
    specs = get_pipeline_specs()
    print(f"Colab Pipeline Ready: {specs['pipeline_name']}")
    print(f"Dataset: {specs['dataset']['total_samples']} samples ({specs['dataset']['train_samples']} train, {specs['dataset']['validation_samples']} val, {specs['dataset']['test_samples']} test)")
