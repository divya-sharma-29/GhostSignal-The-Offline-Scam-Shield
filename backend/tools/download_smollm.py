"""
GhostSignal — SmolLM3-3B Model Downloader & Offline Preparation Tool.

Downloads HuggingFaceTB/SmolLM3-3B weights or the official pre-quantized GGUF
artifacts into backend/models/ for local offline inference.
Supports both direct HTTP streaming and huggingface_hub API.
"""

import os
import sys
import argparse
import urllib.request
from pathlib import Path

GGUF_URL = "https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF/resolve/main/smollm3-3b-instruct-q4_k_m.gguf"
BASE_REPO = "HuggingFaceTB/SmolLM3-3B"

def reporthook(block_num, block_size, total_size):
    downloaded = block_num * block_size
    if total_size > 0:
        percent = min(100.0, downloaded * 100.0 / total_size)
        mb_down = downloaded / (1024 * 1024)
        mb_total = total_size / (1024 * 1024)
        sys.stdout.write(f"\r  Progress: [{percent:5.1f}%] {mb_down:6.1f} MB / {mb_total:6.1f} MB")
        sys.stdout.flush()
    else:
        sys.stdout.write(f"\r  Downloaded: {downloaded / (1024 * 1024):.1f} MB")
        sys.stdout.flush()

def download_model(model_type="quantized", target_dir="backend/models"):
    target_path = Path(target_dir)
    target_path.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("  GhostSignal — SmolLM3-3B Offline Model Setup Tool")
    print("=" * 65)

    if model_type == "quantized":
        dest_file = target_path / "smollm3-3b-q4.gguf"
        print("Selected: Quantized GGUF Q4_K_M (~1.82 GB) for offline CPU inference.")
        print(f"Target destination: {dest_file.resolve()}\n")

        # First attempt: via huggingface_hub if available
        hf_success = False
        try:
            from huggingface_hub import hf_hub_download
            print("[INFO] Attempting download via HuggingFace Hub API...")
            file_path = hf_hub_download(
                repo_id="HuggingFaceTB/SmolLM3-3B-GGUF",
                filename="smollm3-3b-instruct-q4_k_m.gguf",
                local_dir=str(target_path),
                local_dir_use_symlinks=False
            )
            # Rename / link to standard expected name if needed
            downloaded_path = Path(file_path)
            if downloaded_path.exists() and downloaded_path != dest_file:
                import shutil
                shutil.copy2(downloaded_path, dest_file)
            print(f"\n[SUCCESS] Model installed at: {dest_file}")
            hf_success = True
        except Exception as e:
            print(f"[INFO] HuggingFace Hub API skipped ({e}). Using direct HTTP stream...")

        if not hf_success:
            print(f"Downloading from: {GGUF_URL}")
            try:
                urllib.request.urlretrieve(GGUF_URL, str(dest_file), reporthook=reporthook)
                print(f"\n[SUCCESS] Quantized model downloaded to: {dest_file}")
            except Exception as e:
                print(f"\n[WARNING] Direct stream encountered: {e}")
                print(f"You can download the model directly from your browser:")
                print(f"URL: {GGUF_URL}")
                print(f"And save it to: {dest_file.resolve()}")

    elif model_type == "base":
        print("Selected: Base FP16 Model (~6 GB) for local training/fine-tuning.")
        try:
            from huggingface_hub import snapshot_download
            print("Downloading HuggingFaceTB/SmolLM3-3B repository snapshot...")
            snapshot_path = snapshot_download(
                repo_id=BASE_REPO,
                local_dir=str(target_path / "SmolLM3-3B-Base"),
                ignore_patterns=["*.msgpack", "*.h5"]
            )
            print(f"\n[SUCCESS] Base model downloaded to: {snapshot_path}")
        except Exception as e:
            print(f"\n[ERROR] Base download failed: {e}")
            print("To download base model for training, install huggingface_hub: pip install huggingface_hub")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download SmolLM3-3B for GhostSignal")
    parser.add_argument(
        "--type",
        choices=["quantized", "base"],
        default="quantized",
        help="Model format: 'quantized' (Q4_K_M, ~1.82GB) or 'base' (FP16, ~6GB)"
    )
    parser.add_argument("--dir", type=str, default="backend/models", help="Destination folder")
    args = parser.parse_args()
    download_model(model_type=args.type, target_dir=args.dir)
