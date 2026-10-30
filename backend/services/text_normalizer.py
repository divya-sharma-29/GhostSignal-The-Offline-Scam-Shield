"""Conservative text normalization that always retains the original input."""
from __future__ import annotations

import unicodedata

INVISIBLE = {"\u00ad", "\u034f", "\u061c", "\u115f", "\u1160", "\u17b4", "\u17b5", "\u180e", "\u200b", "\u200c", "\u200d", "\u200e", "\u200f", "\u202a", "\u202b", "\u202c", "\u202d", "\u202e", "\u2060", "\u2066", "\u2067", "\u2068", "\u2069", "\ufeff"}
# Only known Latin-looking characters are mapped, and only inside mixed Latin tokens.
CONFUSABLES = str.maketrans({"а":"a", "е":"e", "о":"o", "р":"p", "с":"c", "у":"y", "х":"x", "і":"i", "ј":"j", "ӏ":"l", "Α":"a", "Β":"b", "Ε":"e", "Ι":"i", "Κ":"k", "Μ":"m", "Ν":"n", "Ο":"o", "Ρ":"p", "Τ":"t", "Χ":"x"})
LEET = str.maketrans({"0":"o", "@":"a", "1":"i", "3":"e", "4":"a", "5":"s", "7":"t", "$":"s"})


def normalize_text(original: str) -> dict:
    findings: list[dict] = []
    for index, char in enumerate(original):
        if char in INVISIBLE:
            findings.append({"kind": "invisible", "text": char, "explanation": f"Invisible format character U+{ord(char):04X} may hide or split text.", "start": index, "end": index + 1, "code_points": [f"U+{ord(char):04X}"]})
        elif unicodedata.category(char) == "Cf":
            findings.append({"kind": "invisible", "text": char, "explanation": f"Unicode format character U+{ord(char):04X} is not normally visible.", "start": index, "end": index + 1, "code_points": [f"U+{ord(char):04X}"]})

    normalized = unicodedata.normalize("NFKC", original)
    normalized = "".join(char for char in normalized if char not in INVISIBLE and unicodedata.category(char) != "Cf")
    # Convert unusual whitespace to ordinary spaces but preserve punctuation.
    normalized = "".join(" " if char.isspace() else char for char in normalized)
    token_chars: list[str] = []
    tokens: list[str] = []
    for char in normalized:
        if char.isalnum() or char in "@.$":
            token_chars.append(char)
        else:
            if token_chars:
                tokens.append("".join(token_chars)); token_chars = []
            tokens.append(char)
    if token_chars:
        tokens.append("".join(token_chars))

    converted: list[str] = []
    for token in tokens:
        scripts = {"Latin" if "LATIN" in unicodedata.name(c, "") else "Cyrillic" if "CYRILLIC" in unicodedata.name(c, "") else "Greek" if "GREEK" in unicodedata.name(c, "") else "Other" for c in token if c.isalpha()}
        mixed = "Latin" in scripts and len(scripts - {"Other"}) > 1
        if mixed:
            findings.append({"kind": "mixed-script", "text": token, "explanation": "This word mixes Latin letters with another writing system; check whether the letters are intentional.", "scripts": sorted(scripts - {"Other"})})
            mapped = token.translate(CONFUSABLES)
            if mapped != token:
                findings.append({"kind": "homoglyph", "text": token, "explanation": "A look-alike character was mapped only in this mixed-script token for comparison."})
                token = mapped
        # Collapse long repeated runs for analysis only; keep the visible source unchanged.
        collapsed = __import__("re").sub(r"(.)\1{2,}", r"\1", token, flags=__import__("re").IGNORECASE)
        if collapsed != token:
            findings.append({"kind": "obfuscated-keyword", "text": token, "explanation": "Repeated characters were reduced in the analysis copy to help match stretched words."})
            token = collapsed
        converted.append(token)
    normalized = "".join(converted)

    # Dotted terms and common leetspeak are handled only in the separate analysis copy.
    dotted = __import__("re").sub(r"(?i)\b(?:[k]\s*\.\s*y\s*\.\s*c|[o]\s*\.\s*t\s*\.\s*p|p\s*\.\s*a\s*\.\s*y)\b", lambda m: m.group(0).replace(".", "").replace(" ", ""), normalized)
    if dotted != normalized:
        findings.append({"kind": "obfuscated-keyword", "text": dotted, "explanation": "Periods split a common payment or verification keyword."})
        normalized = dotted
    # Limit leet conversion to repeated substitutions or known scam/security terms.
    import re
    known_terms = {"otp", "otps", "kyc", "pay", "payment", "password", "passcode", "account", "verify", "verification", "claim"}
    leet_changes: list[str] = []
    def replace_leet(match):
        word = match.group(0)
        mapped = word.translate(LEET)
        if mapped.casefold() in known_terms or sum(char in "0@13457$" for char in word) >= 2:
            leet_changes.append(word)
            return mapped
        return word
    normalized = re.sub(r"(?i)\b[\w@$]{3,}\b", replace_leet, normalized)
    if leet_changes:
        findings.append({"kind": "obfuscated-keyword", "text": normalized, "explanation": "Common leetspeak substitutions are represented in a separate analysis copy."})
    return {"original": original, "normalized": normalized, "findings": findings}

