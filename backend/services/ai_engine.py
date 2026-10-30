"""Optional local model status. No model is shipped or fabricated."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from backend.config import BASE_DIR

MODEL_PATH = BASE_DIR / "models" / "scam_classifier.onnx"
TOKENIZER_PATH = BASE_DIR / "models" / "tokenizer.json"
MODEL_CONFIG_PATH = BASE_DIR / "models" / "model_config.json"


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.is_file():
        return None
    try:
        import onnxruntime as ort
        from tokenizers import Tokenizer
        config = json.loads(MODEL_CONFIG_PATH.read_text(encoding="utf-8"))
        tokenizer = Tokenizer.from_file(str(TOKENIZER_PATH))
        session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
        return {"session": session, "tokenizer": tokenizer, "config": config}
    except Exception:
        return None


def status() -> dict:
    model = _load_model()
    if model:
        return {"available": True, "mode": "onnx-local", "model_version": model["config"].get("version", "unversioned"), "detail": "Configured ONNX model is loaded on CPU."}
    if not MODEL_PATH.is_file():
        detail = "No trained ONNX model is installed; explainable rules are active."
    else:
        detail = "The model, tokenizer, runtime, or model_config.json is missing or invalid; explainable rules are active."
    return {"available": False, "mode": "rules-only", "model_version": None, "detail": detail}


def predict(text: str) -> dict:
    model = _load_model()
    if not model:
        return status()
    try:
        import numpy as np
        tokenizer = model["tokenizer"]
        session = model["session"]
        config = model["config"]
        encoded = tokenizer.encode(text)
        ids = encoded.ids[:int(config.get("max_length", 256))]
        mask = [1] * len(ids)
        pad_id = int(config.get("pad_token_id", 0))
        max_length = int(config.get("max_length", 256))
        padding = max(0, max_length - len(ids))
        ids += [pad_id] * padding
        mask += [0] * padding
        values = {"input_ids": np.asarray([ids], dtype=np.int64), "attention_mask": np.asarray([mask], dtype=np.int64)}
        input_names = {item.name for item in session.get_inputs()}
        if "token_type_ids" in input_names:
            values["token_type_ids"] = np.zeros((1, max_length), dtype=np.int64)
        output = np.asarray(session.run(None, {name: value for name, value in values.items() if name in input_names})[0]).reshape(-1)
        shifted = output - output.max()
        probabilities = np.exp(shifted) / np.exp(shifted).sum()
        labels = config.get("labels", ["legitimate", "scam"])
        scam_label = config.get("scam_label", "scam")
        scam_index = labels.index(scam_label)
        probability = float(probabilities[scam_index])
        score = round(probability * 100)
        threshold = float(config.get("threshold", 0.7))
        return {"available": True, "mode": "onnx-local", "model_version": config.get("version", "unversioned"), "risk_score": score if probability >= threshold else 0}
    except Exception:
        # A faulty optional model must never make the deterministic scanner unavailable.
        return status()

