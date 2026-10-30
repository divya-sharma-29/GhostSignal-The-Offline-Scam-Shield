"""Inspect URL strings without resolving DNS or visiting them."""
from __future__ import annotations

import ipaddress
import re
from urllib.parse import urlsplit

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "cutt.ly", "rb.gy"}
SENSITIVE = ("bank", "kyc", "verify", "account", "support", "secure", "login", "pay")


def analyze_url(value: str) -> dict:
    candidate = value.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", candidate): candidate = "https://" + candidate
    try:
        parsed = urlsplit(candidate)
        host = (parsed.hostname or "").rstrip(".").lower()
        if not host or parsed.scheme not in {"http", "https"}: raise ValueError
    except ValueError:
        return {"url": value, "risk_level": "MEDIUM", "risk_score": 30, "reasons": ["The address could not be parsed as a standard HTTP(S) URL."]}
    reasons = []
    try:
        ipaddress.ip_address(host.strip("[]"))
        reasons.append("The host is an IP address rather than a recognizable domain name.")
    except ValueError:
        pass
    if host in SHORTENERS: reasons.append("The domain is a known link-shortening service, which hides the final destination.")
    if "xn--" in host: reasons.append("The domain contains punycode labels that may represent internationalized characters.")
    if host.count(".") >= 4: reasons.append("The hostname has many subdomain levels.")
    if parsed.username or parsed.password: reasons.append("The URL embeds user information before the hostname, which can mislead readers.")
    if parsed.scheme == "http": reasons.append("The URL uses HTTP without transport encryption.")
    if any(ord(char) > 127 for char in host): reasons.append("The domain contains non-ASCII characters; visually similar spellings can be hard to distinguish.")
    labels = host.split(".")
    if len(labels) > 1 and any(term in labels[-2] for term in SENSITIVE) and labels[-1] not in {"in", "com", "org", "net", "gov"}:
        reasons.append("The domain label uses a sensitive banking or verification term; verify its owner independently.")
    score = min(85, sum(25 if "IP address" in reason else 18 if "shortening" in reason else 10 for reason in reasons))
    level = "HIGH" if score >= 45 else "MEDIUM" if score >= 18 else "LOW"
    return {"url": value, "host": host, "risk_level": level, "risk_score": score, "reasons": reasons or ["No listed structural URL warning was detected. This does not establish that the destination is safe."]}

