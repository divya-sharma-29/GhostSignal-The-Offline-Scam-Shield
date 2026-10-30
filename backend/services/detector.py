"""Explainable pattern detector. This is not an ML model."""
from __future__ import annotations

import json
import re
from pathlib import Path

from backend.config import RULES_FILE
from backend.services.text_normalizer import normalize_text


def load_rules() -> dict:
    with Path(RULES_FILE).open("r", encoding="utf-8") as file:
        return json.load(file)


def detect(text: str) -> dict:
    normalized = normalize_text(text)
    haystack = f"{text}\n{normalized['normalized']}".casefold()
    threats = []
    for rule in load_rules().get("rules", []):
        phrases = rule.get("patterns", [])
        matched = next((phrase for phrase in phrases if re.search(rf"(?<!\w){re.escape(phrase.casefold())}(?!\w)", haystack)), None)
        if matched:
            source = text
            position = source.casefold().find(matched.casefold())
            excerpt = source[max(0, position - 35):position + len(matched) + 55] if position >= 0 else matched
            threats.append({"category": rule["category"], "title": rule["title"], "phrase": excerpt.strip(), "explanation": rule["explanation"], "why_suspicious": rule["why_suspicious"], "weight": rule.get("weight", 15)})
    return {"normalization": normalized, "threats": threats}

