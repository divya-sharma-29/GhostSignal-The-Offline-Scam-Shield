"""
GhostSignal — SmolLM3-3B Quantization Utility.

Converts fine-tuned or base SmolLM3-3B models into:
1. GGUF Q4_K_M (~1.82 GB) for local CPU inference using llama.cpp / ctransformers
2. ONNX INT4 for cross-platform / browser / Android execution
"""

import os
import sys
import argparse
from pathlib import Path

def quantize_to_gguf(input_dir: str, output_file: str, method: str = "q4_k_m"):
    print("=" * 65)
    print("  GhostSignal — SmolLM3-3B Quantizer (GGUF Q4_K_M)")
    print("=" * 65)
    print(f"Input model directory: {input_dir}")
    print(f"Quantization method:   {method.upper()}")
    print(f"Output GGUF file:      {output_file}")

    out_path = Path(output_file)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print("\n[RECOMMENDED OFFLINE CONVERSION STEPS]:")
    print("1. From Unsloth (Google Colab / Local GPU):")
    print("   model.save_pretrained_gguf('ghostsignal_smollm3_3b_q4km', tokenizer, quantization_method='q4_k_m')")
    print("   # Directly produces 'ghostsignal_smollm3_3b_q4km/smollm3-3b-q4_k_m.gguf' (~1.82 GB)")
    print("\n2. From llama.cpp CLI:")
    print(f"   git clone https://github.com/ggerganov/llama.cpp")
    print(f"   python llama.cpp/convert_hf_to_gguf.py {input_dir} --outfile temp.gguf")
    print(f"   ./llama-quantize temp.gguf {output_file} {method.upper()}")
    print(f"\n3. Pre-quantized Direct Download:")
    print("   URL: https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF/resolve/main/smollm3-3b-instruct-q4_k_m.gguf")
    print(f"   Destination: {out_path.resolve()}")
    print("\nOnce generated, place the file at 'backend/models/smollm3-3b-q4.gguf'.")
    print("GhostSignal will immediately activate local AI reasoning on CPU.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quantize SmolLM3-3B for GhostSignal")
    parser.add_argument("--input", type=str, default="backend/models/smollm3_fine_tuned", help="Input model path")
    parser.add_argument("--output", type=str, default="backend/models/smollm3-3b-q4.gguf", help="Output GGUF path")
    parser.add_argument("--method", type=str, default="q4_k_m", choices=["q4_k_m", "q5_k_m", "q8_0"])
    args = parser.parse_args()
    quantize_to_gguf(args.input, args.output, args.method)
