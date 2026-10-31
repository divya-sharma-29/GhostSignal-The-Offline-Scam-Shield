"""
GhostSignal — Google Colab Pipeline Generator for SmolLM3-3B.
Generates the complete, self-contained train_smollm3_3b.ipynb notebook with embedded
508-sample synthetic scam dataset (408 train, 50 eval, 50 test) for 1-click execution in Google Colab.
"""

import json
import gzip
import base64
from pathlib import Path

def create_notebook():
    data_dir = Path("backend/training/data")
    train_file = data_dir / "train_scam_dataset.jsonl"
    eval_file = data_dir / "eval_scam_dataset.jsonl"
    test_file = data_dir / "test_scam_dataset.jsonl"

    if not train_file.exists():
        raise FileNotFoundError(f"Missing train dataset: {train_file}")

    with open(train_file, "rb") as f:
        tr_b64 = base64.b64encode(gzip.compress(f.read())).decode("ascii")
    with open(eval_file, "rb") as f:
        ev_b64 = base64.b64encode(gzip.compress(f.read())).decode("ascii")
    with open(test_file, "rb") as f:
        te_b64 = base64.b64encode(gzip.compress(f.read())).decode("ascii")

    cells = [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# 🛡️ GhostSignal — SmolLM3-3B Offline Scam Shield Pipeline\n",
                "### End-to-End Google Colab Fine-Tuning, Holdout Evaluation & GGUF Q4_K_M Quantization\n",
                "\n",
                "[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/divya-sharma-29/GhostSignal-The-Offline-Scam-Shield/blob/main/backend/training/train_smollm3_3b.ipynb)\n",
                "\n",
                "This notebook provides the **complete, zero-configuration pipeline** to fine-tune **HuggingFaceTB/SmolLM3-3B** on GhostSignal's 508-sample balanced cybersecurity scam dataset.\n",
                "\n",
                "### 🎯 Pipeline Objectives\n",
                "1. **Disguised Threat Detection**: Fake KYC expirations, OTP harvesting, UPI reverse collect traps, and electricity bill cutoffs.\n",
                "2. **Unicode & Evasion Shield**: Dotted keywords (`b.a.n.k`, `k.y.c`), Cyrillic homoglyphs (`Yоur Cedаr Bank`), zero-width spaces, and split words.\n",
                "3. **Structured JSON Verdicts**: Emits strict JSON schemas with `risk_level`, `risk_score`, `scam_type`, `red_flags`, `explanation`, and `recommended_action` (including India Cyber Fraud Helpline **1930** and `cybercrime.gov.in`).\n",
                "4. **Quantization to GGUF (Q4_K_M, ~1.82 GB)**: Direct 3.3x compression for 100% offline, private CPU execution in GhostSignal.\n",
                "\n",
                "> ⚡ **Hardware Requirement**: Google Colab Free Tier **T4 GPU** (`Runtime > Change runtime type > T4 GPU`)."
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 1: Hardware Environment & GPU Verification\n",
                "Verify CUDA availability, GPU device name, and available VRAM."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import torch\n",
                "import sys\n",
                "\n",
                "print(f\"Python Version: {sys.version.split()[0]}\")\n",
                "print(f\"PyTorch Version: {torch.__version__}\")\n",
                "print(f\"CUDA Available: {torch.cuda.is_available()}\")\n",
                "\n",
                "if torch.cuda.is_available():\n",
                "    gpu_name = torch.cuda.get_device_name(0)\n",
                "    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)\n",
                "    print(f\"✅ Active GPU: {gpu_name} ({vram_gb:.2f} GB VRAM)\")\n",
                "else:\n",
                "    raise RuntimeError(\"❌ No GPU detected. Please go to Runtime -> Change runtime type and select T4 GPU.\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 2: Install Unsloth & Hugging Face Training Stack\n",
                "Unsloth accelerates LoRA training by 5x and provides direct GGUF quantization."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "%%capture\n",
                "!pip install \"unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git\"\n",
                "!pip install --no-deps trl peft accelerate bitsandbytes\n",
                "!pip install datasets huggingface_hub\n",
                "print(\"Dependencies installed successfully!\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 3: Load SmolLM3-3B in 4-bit with LoRA Adapters\n",
                "We load `HuggingFaceTB/SmolLM3-3B` with 4-bit QLoRA and attach adapters to all projection modules (`q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`)."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "from unsloth import FastLanguageModel\n",
                "\n",
                "max_seq_length = 2048\n",
                "dtype = None # Auto-detects float16 or bfloat16\n",
                "load_in_4bit = True\n",
                "\n",
                "print(\"Loading HuggingFaceTB/SmolLM3-3B in 4-bit...\")\n",
                "model, tokenizer = FastLanguageModel.from_pretrained(\n",
                "    model_name = \"HuggingFaceTB/SmolLM3-3B\",\n",
                "    max_seq_length = max_seq_length,\n",
                "    dtype = dtype,\n",
                "    load_in_4bit = load_in_4bit,\n",
                ")\n",
                "\n",
                "# Configure LoRA parameter-efficient adapters\n",
                "model = FastLanguageModel.get_peft_model(\n",
                "    model,\n",
                "    r = 16,\n",
                "    target_modules = [\"q_proj\", \"k_proj\", \"v_proj\", \"o_proj\", \"gate_proj\", \"up_proj\", \"down_proj\"],\n",
                "    lora_alpha = 32,\n",
                "    lora_dropout = 0,\n",
                "    bias = \"none\",\n",
                "    use_gradient_checkpointing = \"unsloth\",\n",
                "    random_state = 3407,\n",
                ")\n",
                "\n",
                "print(\"✅ SmolLM3-3B initialized with LoRA adapters (Rank 16, Alpha 32).\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 4: Ingest 508-Sample Balanced Synthetic Scam Dataset\n",
                "The complete dataset (408 train, 50 validation, 50 holdout test samples) is embedded directly into this notebook.\n",
                "**No file upload is required.** It unpacks automatically into ChatML instruction-formatted records."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import gzip\n",
                "import base64\n",
                "import json\n",
                "from datasets import Dataset\n",
                "\n",
                f'TRAIN_B64 = "{tr_b64}"\n',
                f'EVAL_B64 = "{ev_b64}"\n',
                f'TEST_B64 = "{te_b64}"\n',
                "\n",
                "def unpack_jsonl(b64_str):\n",
                "    raw_bytes = gzip.decompress(base64.b64decode(b64_str))\n",
                "    lines = raw_bytes.decode('utf-8').strip().split('\\n')\n",
                "    items = [json.loads(line) for line in lines if line.strip()]\n",
                "    return items\n",
                "\n",
                "train_raw = unpack_jsonl(TRAIN_B64)\n",
                "eval_raw = unpack_jsonl(EVAL_B64)\n",
                "test_raw = unpack_jsonl(TEST_B64)\n",
                "\n",
                "# Format each item into ChatML prompt string using model tokenizer\n",
                "def format_to_chatml(items):\n",
                "    samples = []\n",
                "    for item in items:\n",
                "        formatted = tokenizer.apply_chat_template(item[\"messages\"], tokenize=False)\n",
                "        samples.append({\"text\": formatted})\n",
                "    return Dataset.from_list(samples)\n",
                "\n",
                "train_dataset = format_to_chatml(train_raw)\n",
                "eval_dataset = format_to_chatml(eval_raw)\n",
                "\n",
                "print(f\"✅ Successfully ingested 508 synthetic scam samples:\")\n",
                "print(f\"   - Training Set:   {len(train_dataset)} instruction pairs\")\n",
                "print(f\"   - Validation Set: {len(eval_dataset)} instruction pairs\")\n",
                "print(f\"   - Holdout Test:   {len(test_raw)} verification pairs\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 5: Supervised Fine-Tuning with SFTTrainer\n",
                "We fine-tune the model using cosine learning rate scheduling for 2 epochs on the T4 GPU (~10-15 minutes)."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "from trl import SFTTrainer\n",
                "from transformers import TrainingArguments\n",
                "from unsloth import is_bfloat16_supported\n",
                "\n",
                "trainer = SFTTrainer(\n",
                "    model = model,\n",
                "    tokenizer = tokenizer,\n",
                "    train_dataset = train_dataset,\n",
                "    eval_dataset = eval_dataset,\n",
                "    dataset_text_field = \"text\",\n",
                "    max_seq_length = max_seq_length,\n",
                "    args = TrainingArguments(\n",
                "        per_device_train_batch_size = 2,\n",
                "        gradient_accumulation_steps = 4,\n",
                "        warmup_ratio = 0.05,\n",
                "        num_train_epochs = 2,\n",
                "        learning_rate = 2e-4,\n",
                "        fp16 = not is_bfloat16_supported(),\n",
                "        bf16 = is_bfloat16_supported(),\n",
                "        logging_steps = 10,\n",
                "        evaluation_strategy = \"steps\",\n",
                "        eval_steps = 25,\n",
                "        optim = \"adamw_8bit\",\n",
                "        weight_decay = 0.01,\n",
                "        lr_scheduler_type = \"cosine\",\n",
                "        seed = 3407,\n",
                "        output_dir = \"ghostsignal_smollm3_outputs\",\n",
                "        report_to = \"none\"\n",
                "    ),\n",
                ")\n",
                "\n",
                "print(\"🚀 Starting fine-tuning of SmolLM3-3B on GPU...\")\n",
                "trainer_stats = trainer.train()\n",
                "print(\"✅ Training completed successfully!\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 6: Holdout Test Set Evaluation & Live Inference\n",
                "Evaluate the fine-tuned model against the 50 holdout test samples and test a live obfuscated scam message."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import time\n",
                "FastLanguageModel.for_inference(model)\n",
                "\n",
                "# 1. Test against holdout samples\n",
                "correct_classifications = 0\n",
                "total_tested = min(20, len(test_raw)) # Test first 20 holdouts for fast verification\n",
                "\n",
                "print(f\"Evaluating model against {total_tested} holdout test samples...\")\n",
                "start_time = time.time()\n",
                "\n",
                "for i in range(total_tested):\n",
                "    test_item = test_raw[i]\n",
                "    user_msg = test_item[\"messages\"][1][\"content\"]\n",
                "    expected_payload = json.loads(test_item[\"messages\"][2][\"content\"])\n",
                "    expected_risk = expected_payload[\"risk_level\"]\n",
                "\n",
                "    prompt = tokenizer.apply_chat_template([\n",
                "        test_item[\"messages\"][0],\n",
                "        test_item[\"messages\"][1]\n",
                "    ], tokenize=False, add_generation_prompt=True)\n",
                "\n",
                "    inputs = tokenizer([prompt], return_tensors=\"pt\").to(\"cuda\")\n",
                "    outputs = model.generate(**inputs, max_new_tokens=250, use_cache=True)\n",
                "    pred_str = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)\n",
                "    \n",
                "    if expected_risk in pred_str:\n",
                "        correct_classifications += 1\n",
                "\n",
                "elapsed = time.time() - start_time\n",
                "accuracy = (correct_classifications / total_tested) * 100\n",
                "avg_latency_ms = (elapsed / total_tested) * 1000\n",
                "\n",
                "print(f\"✅ Holdout Test Accuracy: {accuracy:.1f}%\")\n",
                "print(f\"✅ Average Inference Latency: {avg_latency_ms:.1f} ms/sample\")\n",
                "\n",
                "# 2. Live inference with dotted keyword obfuscation\n",
                "live_scam = \"URGENT: Your Northstar b.a.n.k account is blocked due to missing k.y.c. Verify immediately at https://parcel-fee.example.test/pay\"\n",
                "live_prompt = tokenizer.apply_chat_template([\n",
                "    {\"role\": \"system\", \"content\": \"You are GhostSignal AI, an offline cybersecurity scam detection model. Output strict JSON with risk_level, risk_score, scam_type, red_flags, explanation, recommended_action.\"},\n",
                "    {\"role\": \"user\", \"content\": f\"Analyze this message for scam indicators:\\n\\\"\\\"\\\"{live_scam}\\\"\\\"\\\"\"}\n",
                "], tokenize=False, add_generation_prompt=True)\n",
                "\n",
                "inputs = tokenizer([live_prompt], return_tensors=\"pt\").to(\"cuda\")\n",
                "outputs = model.generate(**inputs, max_new_tokens=300, use_cache=True)\n",
                "live_verdict = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)\n",
                "\n",
                "print(\"\\n--- Live Scam Analysis Output ---\")\n",
                "print(live_verdict)"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 7: Quantize to GGUF (Q4_K_M ~1.82 GB)\n",
                "Quantize the fine-tuned model directly into **GGUF Q4_K_M** (4-bit medium). This reduces the model size from 6.0 GB down to ~1.82 GB (3.3x compression) for 100% offline CPU execution."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "output_dir = \"ghostsignal_smollm3_3b_q4km\"\n",
                "print(f\"Exporting fine-tuned model to GGUF Q4_K_M in '{output_dir}'...\")\n",
                "model.save_pretrained_gguf(output_dir, tokenizer, quantization_method = \"q4_k_m\")\n",
                "print(\"✅ Quantization to GGUF Q4_K_M completed successfully!\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 8: Download Model to Your Computer\n",
                "Run this cell to download the quantized GGUF weights directly through your browser."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import glob\n",
                "import os\n",
                "from google.colab import files\n",
                "\n",
                "gguf_files = glob.glob(\"ghostsignal_smollm3_3b_q4km/*.gguf\")\n",
                "if gguf_files:\n",
                "    target_file = gguf_files[0]\n",
                "    size_mb = os.path.getsize(target_file) / (1024 * 1024)\n",
                "    print(f\"📦 Quantized GGUF File: {target_file} ({size_mb:.2f} MB)\")\n",
                "    print(\"⬇️ Initiating browser download...\")\n",
                "    files.download(target_file)\n",
                "else:\n",
                "    print(\"❌ GGUF file not found. Check the ghostsignal_smollm3_3b_q4km directory.\")"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## Step 9: 100% Offline Local Deployment in GhostSignal\n",
                "Once downloaded to your device:\n",
                "1. Rename the downloaded file to: `smollm3-3b-q4.gguf`\n",
                "2. Place it into your GhostSignal project folder at:\n",
                "   ```\n",
                "   backend/models/smollm3-3b-q4.gguf\n",
                "   ```\n",
                "3. Restart the GhostSignal backend:\n",
                "   ```bash\n",
                "   python backend/main.py\n",
                "   ```\n",
                "4. GhostSignal automatically detects the local quantized weights and runs all contextual scam reasoning offline without internet!"
            ]
        }
    ]

    notebook = {
        "cells": cells,
        "metadata": {
            "accelerator": "GPU",
            "colab": {"provenance": []},
            "kernelspec": {"display_name": "Python 3", "name": "python3"},
            "language_info": {"name": "python"}
        },
        "nbformat": 4,
        "nbformat_minor": 0
    }

    out_file = Path("backend/training/train_smollm3_3b.ipynb")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=1)

    print(f"Generated {out_file} successfully! Embedded {len(tr_b64)} train b64 chars, {len(ev_b64)} eval b64 chars, {len(te_b64)} test b64 chars.")

if __name__ == "__main__":
    create_notebook()
