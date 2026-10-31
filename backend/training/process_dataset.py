"""
GhostSignal — Dataset Processor for SmolLM3-3B Fine-Tuning.

Processes the user's synthetic scam dataset CSV into ChatML JSONL format
for training, evaluating, and testing SmolLM3-3B in Google Colab or locally.
"""

import csv
import json
from pathlib import Path

SYSTEM_PROMPT = (
    "You are GhostSignal AI, an offline cybersecurity scam detection model. "
    "Analyze the provided message, detect disguised threats, zero-width/homoglyph obfuscations, "
    "credential theft, and artificial urgency. Output your verdict in strict JSON format with keys: "
    "risk_level (LOW, MEDIUM, HIGH), risk_score (0-100), scam_type, red_flags (list of strings), "
    "obfuscation_type, explanation, and recommended_action."
)

def row_to_chatml(row: dict) -> dict:
    text = row.get("message_text", "").strip()
    score_str = row.get("risk_score", "0")
    try:
        score = int(float(score_str))
    except (ValueError, TypeError):
        score = 0

    level = row.get("risk_level", "LOW").strip().upper()
    scam_type = row.get("scam_type", "benign").strip()
    raw_flags = row.get("red_flags", "")
    flags = [f.strip() for f in raw_flags.split("|") if f.strip()]
    obfuscation = row.get("obfuscation_type", "none").strip()
    explanation = row.get("explanation", "").strip()
    action = row.get("recommended_action", "").strip()

    assistant_dict = {
        "risk_level": level,
        "risk_score": score,
        "scam_type": scam_type,
        "red_flags": flags,
        "obfuscation_type": obfuscation,
        "explanation": explanation,
        "recommended_action": action
    }

    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this message for scam indicators:\n\"\"\"{text}\"\"\""},
            {"role": "assistant", "content": json.dumps(assistant_dict, indent=2, ensure_ascii=False)}
        ]
    }

def convert_csv_to_jsonl(csv_path: str = "backend/training/data/synthetic_scam_dataset.csv", output_dir: str = "backend/training/data"):
    csv_file = Path(csv_path)
    if not csv_file.exists():
        raise FileNotFoundError(f"CSV dataset not found at: {csv_file}")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    train_rows = []
    val_rows = []
    test_rows = []

    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            split = row.get("split", "train").strip().lower()
            sample = row_to_chatml(row)
            if split == "validation" or split == "val":
                val_rows.append(sample)
            elif split == "test":
                test_rows.append(sample)
            else:
                train_rows.append(sample)

    train_file = out_dir / "train_scam_dataset.jsonl"
    val_file = out_dir / "eval_scam_dataset.jsonl"
    test_file = out_dir / "test_scam_dataset.jsonl"

    with open(train_file, "w", encoding="utf-8") as f:
        for item in train_rows:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    with open(val_file, "w", encoding="utf-8") as f:
        for item in val_rows:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    with open(test_file, "w", encoding="utf-8") as f:
        for item in test_rows:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"[SUCCESS] Converted dataset:")
    print(f"  - Train:      {len(train_rows)} samples -> {train_file}")
    print(f"  - Validation: {len(val_rows)} samples -> {val_file}")
    print(f"  - Test:       {len(test_rows)} samples -> {test_file}")
    print(f"  - Total:      {len(train_rows) + len(val_rows) + len(test_rows)} samples processed.")

if __name__ == "__main__":
    convert_csv_to_jsonl()
