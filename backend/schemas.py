"""Validated API request and response contracts."""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class TextScanRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    language: str = Field(default="English", max_length=40)


class Threat(BaseModel):
    category: str
    title: str
    phrase: str
    explanation: str
    why_suspicious: str


class UnicodeFinding(BaseModel):
    kind: Literal["invisible", "mixed-script", "homoglyph", "separator", "obfuscated-keyword", "suspicious-url"]
    text: str
    explanation: str
    start: int | None = None
    end: int | None = None
    code_points: list[str] = Field(default_factory=list)
    scripts: list[str] = Field(default_factory=list)


class ScanResponse(BaseModel):
    id: str
    timestamp: str
    scan_type: str
    message_text: str
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]
    risk_score: int = Field(ge=0, le=100)
    threats: list[Threat]
    reasons: list[str]
    recommendations: list[str]
    unicode_findings: list[UnicodeFinding]
    normalized_for_analysis: str
    rule_version: str
    ai_status: str


class UrlScanRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class UpdatePackage(BaseModel):
    version: str = Field(min_length=1, max_length=64)
    expires_at: str
    rules: dict
    signature: str = Field(min_length=1)

