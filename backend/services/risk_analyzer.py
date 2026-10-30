"""Combine distinct threat categories without over-weighting repeated hits."""
from __future__ import annotations


def analyze(detection: dict, urls: list[dict] | None = None, ai_prediction: dict | None = None) -> dict:
    threats = detection["threats"]
    by_category: dict[str, dict] = {}
    for threat in threats:
        by_category.setdefault(threat["category"], threat)
    score = min(100, sum(int(item["weight"]) for item in by_category.values()))
    reasons = [f"{item['title']}: {item['explanation']}" for item in by_category.values()]
    recommendations = []
    if any(item["category"] == "otp" for item in by_category.values()): recommendations.append("Never share an OTP, PIN, or password with anyone.")
    if any(item["category"] in {"upi", "payment", "money_transfer"} for item in by_category.values()): recommendations.append("Do not approve a payment or transfer without checking through your official bank app.")
    if urls:
        for result in urls:
            if result["risk_level"] != "LOW":
                reasons.extend(result["reasons"])
                recommendations.append("Do not open this link; verify the request through an official channel.")
                score = min(100, score + min(20, result["risk_score"] // 3))
    if ai_prediction and ai_prediction.get("available"):
        reasons.append("A configured local model also contributed to this assessment.")
        score = max(score, int(ai_prediction.get("risk_score", 0)))
    level = "HIGH" if score >= 50 else "MEDIUM" if score >= 25 else "LOW"
    if not recommendations:
        recommendations.append("No listed scam indicators matched. Verify unexpected requests independently; a low-risk result does not guarantee safety.")
    if not reasons:
        reasons = ["No configured scam-pattern rules matched this text."]
    return {"risk_level": level, "risk_score": score, "reasons": reasons, "recommendations": list(dict.fromkeys(recommendations)), "threats": threats}

