# 🛡️ GhostSignal — SmolLM3-3B Fine-Tuning & Offline Quantization Guide

This directory contains the complete pipeline to fine-tune **HuggingFaceTB/SmolLM3-3B** on GhostSignal's curated synthetic scam dataset (508 samples), quantize it into **GGUF Q4_K_M (~1.82 GB)**, and deploy it locally for **100% offline scam shielding** with zero internet dependencies.

---

## 📌 Quick Links
- **Base Model (Hugging Face)**: [`HuggingFaceTB/SmolLM3-3B`](https://huggingface.co/HuggingFaceTB/SmolLM3-3B)
- **Official GGUF Quantized Model**: [`HuggingFaceTB/SmolLM3-3B-GGUF`](https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF)
- **Google Colab Notebook**: [`train_smollm3_3b.ipynb`](./train_smollm3_3b.ipynb)
- **Direct GGUF Download**: [`smollm3-3b-instruct-q4_k_m.gguf`](https://huggingface.co/HuggingFaceTB/SmolLM3-3B-GGUF/resolve/main/smollm3-3b-instruct-q4_k_m.gguf)

---

## 📁 Dataset Details

Your dataset is stored in `backend/training/data/`:
1. `synthetic_scam_dataset.csv` — Full 508-sample curated dataset.
2. `train_scam_dataset.jsonl` — 408 training samples formatted in ChatML.
3. `eval_scam_dataset.jsonl` — 50 validation samples formatted in ChatML.
4. `test_scam_dataset.jsonl` — 50 test samples for final evaluation.

### Categories Covered:
- **Bank Impersonation & KYC Panics**: Fake account blocks, fake debit card suspension, phishing URLs.
- **OTP Harvesting**: Social engineering attempts to extract 4-digit and 6-digit one-time passwords.
- **UPI Reverse Collect Traps**: Fake lottery, cashback, and reverse-payment scams requiring UPI PIN.
- **Urgency & Utility Cutoffs**: Electricity power cutoff threats compelling immediate contact.
- **Unicode & Script Evasion**: Dotted keywords (`b.a.n.k`, `k.y.c`), Cyrillic homoglyphs (`Yоur Cedаr Bank`), zero-width spaces (`U+200B`).
- **Legitimate Benign Baselines**: Official transaction receipts, appointment confirmations, and service requests.

To regenerate or reprocess:
```bash
python backend/training/process_dataset.py
```

---

## 🚀 Google Colab Training Workflow

The notebook `train_smollm3_3b.ipynb` is designed to run seamlessly on a **free Google Colab T4 GPU**.

### Step 1: Open in Colab
1. Go to [Google Colab](https://colab.research.google.com/).
2. Click **File** > **Upload notebook** > Select `backend/training/train_smollm3_3b.ipynb`.
3. Select **Runtime** > **Change runtime type** > **T4 GPU** > Save.

### Step 2: Run Training Cells
1. **Cell 1**: Installs `unsloth`, `trl`, `peft`, `accelerate`, and `bitsandbytes`.
2. **Cell 2**: Loads `HuggingFaceTB/SmolLM3-3B` in 4-bit with LoRA adapters (rank 16, alpha 32).
3. **Cell 3**: Prepares the instruction-formatted dataset in ChatML format.
4. **Cell 4**: Trains with `SFTTrainer` for 2 epochs (~5-8 minutes on T4).
5. **Cell 5**: Runs live inference on sample scams and outputs calibrated JSON verdicts.

### Step 3: Quantize to GGUF (Q4_K_M)
Cell 6 executes:
```python
model.save_pretrained_gguf("ghostsignal_smollm3_3b_q4km", tokenizer, quantization_method="q4_k_m")
```
This compresses the model from **6.0 GB (FP16)** down to **~1.82 GB (Q4_K_M)**, providing a 3.3x compression ratio that comfortably runs on standard laptops and mobile CPUs.

### Step 4: Download Quantized Model from Colab
Cell 7 triggers the automatic download:
```python
from google.colab import files
files.download("ghostsignal_smollm3_3b_q4km/smollm3-3b-q4_k_m.gguf")
```
Your browser will download the file directly to your `Downloads` folder.

---

## 💻 Installing & Running Offline in GhostSignal

Once you have downloaded the quantized model file:

1. Rename the downloaded file to:
   ```
   smollm3-3b-q4.gguf
   ```
2. Place it in the GhostSignal models directory:
   ```
   GhostSignal-The-Offline-Scam-Shield-main/backend/models/smollm3-3b-q4.gguf
   ```
3. Start the GhostSignal backend:
   ```bash
   python backend/main.py
   ```
4. GhostSignal automatically detects `backend/models/smollm3-3b-q4.gguf`:
   - System status shows: `SmolLM3-3B-GGUF-Q4_K_M (1.82 GB) Ready Offline`.
   - The web app and API run all scam reasoning locally on device without sending any data over the internet.

---

## 🌐 Downloading Directly from the Web App

The web interface also features one-click direct download:
1. Open the web app (`http://localhost:3000`).
2. On the **Dashboard** or **Privacy** page, find the **Offline AI Model Center: SmolLM3-3B (Quantized)** section.
3. Click **Download Quantized Model (~1.82 GB)**.
4. The file will be downloaded to your machine. Move it to `backend/models/smollm3-3b-q4.gguf` to activate offline AI protection!
