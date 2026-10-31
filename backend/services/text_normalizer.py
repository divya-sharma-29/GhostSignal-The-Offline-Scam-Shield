import unicodedata
import re
from typing import Dict, List, Tuple, Any

# Unicode ranges for Indic scripts (Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam)
INDIC_RANGES = [
    (0x0900, 0x097F),  # Devanagari
    (0x0980, 0x09FF),  # Bengali
    (0x0A00, 0x0A7F),  # Gurmukhi
    (0x0A80, 0x0AFF),  # Gujarati
    (0x0B00, 0x0B7F),  # Oriya
    (0x0B80, 0x0BFF),  # Tamil
    (0x0C00, 0x0C7F),  # Telugu
    (0x0C80, 0x0CFF),  # Kannada
    (0x0D00, 0x0D7F),  # Malayalam
]

# Legitimate conjunct joiners
INDIC_LIGATURE_JOINERS = {'\u200C', '\u200D'}

# Known confusable homoglyphs (Cyrillic, Greek, Fullwidth to Latin)
HOMOGLYPH_MAP: Dict[str, str] = {
    # Cyrillic lowercase
    '\u0430': 'a', '\u0441': 'c', '\u0435': 'e', '\u043E': 'o',
    '\u0440': 'p', '\u0455': 's', '\u0445': 'x', '\u0443': 'y',
    '\u0456': 'i', '\u0458': 'j', '\u0432': 'b', '\u0442': 't',
    # Cyrillic uppercase
    '\u0410': 'A', '\u0412': 'B', '\u0421': 'C', '\u0415': 'E',
    '\u041D': 'H', '\u041C': 'M', '\u041E': 'O', '\u0420': 'P',
    '\u0422': 'T', '\u0425': 'X',
    # Greek
    '\u03B1': 'a', '\u03BF': 'o', '\u03C1': 'p', '\u03BD': 'v',
    '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u039F': 'O',
    # Fullwidth Latin
    '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd',
    '\uFF45': 'e', '\uFF4B': 'k', '\uFF4F': 'o', '\uFF50': 'p',
    '\uFF53': 's', '\uFF54': 't', '\uFF55': 'u', '\uFF59': 'y',
    '\uFF21': 'A', '\uFF22': 'B', '\uFF23': 'C', '\uFF2B': 'K',
    '\uFF2F': 'O', '\uFF30': 'P', '\uFF33': 'S', '\uFF34': 'T',
    '\uFF35': 'U', '\uFF39': 'Y'
}

# Suspicious separators used to mimic dots, slashes, or hyphens in URLs / keywords
SUSPICIOUS_SEPARATORS: Dict[str, str] = {
    '\u2024': '.',  # One-dot leader
    '\u2027': '.',  # Hyphenation point
    '\uFF0E': '.',  # Fullwidth full stop
    '\u06D4': '.',  # Arabic full stop
    '\u2044': '/',  # Fraction slash
    '\u2215': '/',  # Division slash
    '\uFF0F': '/',  # Fullwidth slash
    '\u2010': '-',  # Hyphen
    '\u2011': '-',  # Non-breaking hyphen
    '\u2012': '-',  # Figure dash
    '\u2013': '-',  # En dash
    '\u2014': '-',  # Em dash
    '\uFF0D': '-',  # Fullwidth hyphen-minus
}

# Directional controls (Bidi overrides)
DIRECTIONAL_CONTROLS = {
    '\u202A': 'Left-to-Right Embedding (LRE)',
    '\u202B': 'Right-to-Left Embedding (RLE)',
    '\u202C': 'Pop Directional Formatting (PDF)',
    '\u202D': 'Left-to-Right Override (LRO)',
    '\u202E': 'Right-to-Left Override (RLO)'
}

# Invisible and zero-width code points
INVISIBLE_CHARS = {
    '\u200B': 'Zero-Width Space',
    '\u200C': 'Zero-Width Non-Joiner',
    '\u200D': 'Zero-Width Joiner',
    '\u00AD': 'Soft Hyphen',
    '\u2060': 'Word Joiner',
    '\u200E': 'Left-to-Right Mark',
    '\u200F': 'Right-to-Left Mark',
    '\uFEFF': 'Zero-Width No-Break Space (BOM)',
    **DIRECTIONAL_CONTROLS
}

def is_indic_char(char: str) -> bool:
    """Check if character falls within an official Indic Unicode script range."""
    if not char:
        return False
    cp = ord(char)
    return any(start <= cp <= end for start, end in INDIC_RANGES)

def is_indic_context(text: str, index: int) -> bool:
    """
    Check if a character at index is enclosed in legitimate Indic script context.
    Prevents false alerts on Hindi, Tamil, Bengali, etc. conjunct ligatures.
    """
    prev_char = text[index - 1] if index > 0 else ''
    next_char = text[index + 1] if index + 1 < len(text) else ''
    return is_indic_char(prev_char) or is_indic_char(next_char)

class TextNormalizer:
    """
    Advanced text normalizer for cyber threat analysis.
    Implements Section 5 of GhostSignal Blueprint:
    - Retains original Unicode string before normalization.
    - Inspects code points, Unicode category, and name.
    - Detects confusables, zero-width, dotted keywords, unusual spacing, directional controls.
    - Protects Indic scripts against false positives.
    """

    def normalize(self, text: str) -> Dict[str, Any]:
        if not text:
            return {
                "original_text": "",
                "normalized_text": "",
                "findings": [],
                "has_anomalies": False,
                "invisible_count": 0,
                "mixed_script_count": 0,
                "confusable_count": 0,
                "suspicious_separator_count": 0,
                "obfuscated_keywords": [],
                "summary": "Clean message",
                "is_indic_safe": True
            }

        original_text = text
        findings = []
        invisible_count = 0
        mixed_script_count = 0
        confusable_count = 0
        suspicious_separator_count = 0
        is_indic_safe = True

        normalized_chars = []

        # Pass 1: Character-by-character Unicode inspection
        for idx, ch in enumerate(text):
            cp_hex = f"U+{ord(ch):04X}"
            uname = unicodedata.name(ch, "UNKNOWN CHARACTER")

            # Check for directional controls (bidi override evasion)
            if ch in DIRECTIONAL_CONTROLS:
                invisible_count += 1
                findings.append({
                    "char": ch,
                    "codePoint": cp_hex,
                    "code_point": cp_hex,
                    "index": idx,
                    "start": idx,
                    "end": idx + 1,
                    "unicode_name": uname,
                    "category": "directional_controls",
                    "type": "directional_controls",
                    "severity": "high",
                    "explanation": f"Direction-control character {DIRECTIONAL_CONTROLS[ch]} ({cp_hex}) detected.",
                    "expectedChar": ""
                })
                continue

            # Check for invisible / zero-width characters
            if ch in INVISIBLE_CHARS:
                # If ZWJ/ZWNJ is in legitimate Indic context, it is genuine typographic conjunct
                if ch in INDIC_LIGATURE_JOINERS and is_indic_context(text, idx):
                    normalized_chars.append(ch)
                    continue

                invisible_count += 1
                findings.append({
                    "char": ch,
                    "codePoint": cp_hex,
                    "code_point": cp_hex,
                    "index": idx,
                    "start": idx,
                    "end": idx + 1,
                    "unicode_name": uname,
                    "category": "invisible_char",
                    "type": "zero_width",
                    "severity": "medium",
                    "explanation": f"Invisible character {INVISIBLE_CHARS[ch]} ({cp_hex}) embedded in text.",
                    "expectedChar": ""
                })
                continue

            # Check for suspicious punctuation / separators
            if ch in SUSPICIOUS_SEPARATORS:
                replacement = SUSPICIOUS_SEPARATORS[ch]
                suspicious_separator_count += 1
                findings.append({
                    "char": ch,
                    "codePoint": cp_hex,
                    "code_point": cp_hex,
                    "index": idx,
                    "start": idx,
                    "end": idx + 1,
                    "unicode_name": uname,
                    "category": "suspicious_separator",
                    "type": "suspicious_separator",
                    "severity": "medium",
                    "explanation": f"Deceptive separator '{ch}' ({cp_hex}) substituted for standard '{replacement}'.",
                    "expectedChar": replacement
                })
                normalized_chars.append(replacement)
                continue

            # Check for confusable homoglyphs
            if ch in HOMOGLYPH_MAP:
                replacement = HOMOGLYPH_MAP[ch]
                confusable_count += 1
                script_name = "Cyrillic/Greek" if ord(ch) >= 0x0370 else "Fullwidth"
                findings.append({
                    "char": ch,
                    "codePoint": cp_hex,
                    "code_point": cp_hex,
                    "index": idx,
                    "start": idx,
                    "end": idx + 1,
                    "unicode_name": uname,
                    "category": "confusable",
                    "type": "confusable_homoglyph",
                    "severity": "high",
                    "explanation": f"Look-alike {script_name} character '{ch}' ({cp_hex}) disguised as Latin '{replacement}'.",
                    "expectedChar": replacement
                })
                normalized_chars.append(replacement)
                continue

            # Check for generic mixed scripts in Latin-dominated words
            if ord(ch) > 0x0400 and ord(ch) < 0x052F: # Cyrillic block
                mixed_script_count += 1
                findings.append({
                    "char": ch,
                    "codePoint": cp_hex,
                    "code_point": cp_hex,
                    "index": idx,
                    "start": idx,
                    "end": idx + 1,
                    "unicode_name": uname,
                    "category": "mixed_script",
                    "type": "mixed_script",
                    "severity": "medium",
                    "explanation": f"Mixed-script token; inspect confusables '{ch}' ({cp_hex}).",
                    "expectedChar": ""
                })
                normalized_chars.append(unicodedata.normalize('NFKD', ch))
                continue

            normalized_chars.append(ch)

        current_norm = "".join(normalized_chars)

        # Pass 2: Detect dotted / spaced / leetspeak obfuscated keywords (e.g. K.Y.C, O-T-P, 0TP, P@YTM)
        obfuscated_keywords = []
        dotted_patterns = [
            (r'\b[kK][\.\s\-_/]+[yY][\.\s\-_/]+[cC](?:[\.\s\-_/]+|\b)', 'KYC'),
            (r'\b[oO][\.\s\-_/]+[tT][\.\s\-_/]+[pP](?:[\.\s\-_/]+|\b)', 'OTP'),
            (r'\b[uU][\.\s\-_/]+[pP][\.\s\-_/]+[iI](?:[\.\s\-_/]+|\b)', 'UPI'),
            (r'\b[sS][\.\s\-_/]+[bB][\.\s\-_/]+[iI](?:[\.\s\-_/]+|\b)', 'SBI'),
            (r'\b[pP][\.\s\-_/]+[aA][\.\s\-_/]+[yY][\.\s\-_/]+[tT][\.\s\-_/]+[mM](?:[\.\s\-_/]+|\b)', 'PAYTM'),
            (r'\b[bB][\.\s\-_/]+[aA][\.\s\-_/]+[nN][\.\s\-_/]+[kK](?:[\.\s\-_/]+|\b)', 'BANK'),
            (r'\b[pP][\.\s\-_/]+[aA][\.\s\-_/]+[sS][\.\s\-_/]+[sS][\.\s\-_/]+[wW][\.\s\-_/]+[oO][\.\s\-_/]+[rR][\.\s\-_/]+[dD](?:[\.\s\-_/]+|\b)', 'PASSWORD'),
            # Leetspeak keyword substitutions
            (r'\b0[tT][pP]\b', 'OTP'),
            (r'\b[pP]@[yY][tT][mM]\b', 'PAYTM'),
            (r'\b[bB]@[nN][kK]\b', 'BANK'),
            (r'\b[kK]¥[cC]\b', 'KYC'),
        ]

        for pattern, replacement in dotted_patterns:
            matches = list(re.finditer(pattern, current_norm))
            if matches:
                obfuscated_keywords.append(replacement)
                for m in matches:
                    findings.append({
                        "char": m.group(0),
                        "codePoint": "PATTERN",
                        "code_point": "PATTERN",
                        "index": m.start(),
                        "start": m.start(),
                        "end": m.end(),
                        "unicode_name": "DOTTED_PATTERN",
                        "category": "obfuscated_keyword",
                        "type": "dotted_pattern",
                        "severity": "high",
                        "explanation": f"Keyword separated by punctuation '{m.group(0)}' resolved to '{replacement}'.",
                        "expectedChar": replacement
                    })
                current_norm = re.sub(pattern, replacement, current_norm)

        # Pass 3: Unusual spacing detection (e.g. V E R I F Y, P A Y M E N T)
        spacing_patterns = [
            (r'\b[vV]\s+[eE]\s+[rR]\s+[iI]\s+[fF]\s+[yY]\b', 'VERIFY'),
            (r'\b[pP]\s+[aA]\s+[yY]\s+[mM]\s+[eE]\s+[nN]\s+[tT]\b', 'PAYMENT'),
            (r'\b[uU]\s+[rR]\s+[gG]\s+[eE]\s+[nN]\s+[tT]\b', 'URGENT'),
            (r'\b[bB]\s+[lL]\s+[oO]\s+[cC]\s+[kK]\s+[eE]\s+[dD]\b', 'BLOCKED'),
        ]
        for spattern, sreplacement in spacing_patterns:
            smatches = list(re.finditer(spattern, current_norm))
            if smatches:
                obfuscated_keywords.append(sreplacement)
                for sm in smatches:
                    findings.append({
                        "char": sm.group(0),
                        "codePoint": "SPACED_PATTERN",
                        "code_point": "SPACED_PATTERN",
                        "index": sm.start(),
                        "start": sm.start(),
                        "end": sm.end(),
                        "unicode_name": "SPACED_PATTERN",
                        "category": "obfuscated_keyword",
                        "type": "unusual_spacing",
                        "severity": "medium",
                        "explanation": f"Unusual spacing obfuscation '{sm.group(0)}' resolved to '{sreplacement}'.",
                        "expectedChar": sreplacement
                    })
                current_norm = re.sub(spattern, sreplacement, current_norm)

        # Pass 4: Normalize unicode compatibility form (NFKC)
        final_normalized = unicodedata.normalize('NFKC', current_norm)

        has_anomalies = (
            len(findings) > 0 or
            invisible_count > 0 or 
            confusable_count > 0 or 
            suspicious_separator_count > 0 or 
            len(obfuscated_keywords) > 0 or 
            mixed_script_count > 0
        )

        # Formulate human summary
        summary_parts = []
        if confusable_count > 0:
            summary_parts.append(f"{confusable_count} look-alike (homoglyph) character(s)")
        if invisible_count > 0:
            summary_parts.append(f"{invisible_count} hidden zero-width character(s)")
        if suspicious_separator_count > 0:
            summary_parts.append(f"{suspicious_separator_count} deceptive separator(s)")
        if obfuscated_keywords:
            summary_parts.append(f"obfuscated keyword(s): {', '.join(set(obfuscated_keywords))}")
        if mixed_script_count > 0:
            summary_parts.append(f"{mixed_script_count} mixed-script character(s)")

        summary = "; ".join(summary_parts) if summary_parts else "No deceptive character obfuscations detected"

        return {
            "original_text": original_text,
            "normalized_text": final_normalized,
            "findings": findings,
            "has_anomalies": has_anomalies,
            "invisible_count": invisible_count,
            "mixed_script_count": mixed_script_count,
            "confusable_count": confusable_count,
            "suspicious_separator_count": suspicious_separator_count,
            "obfuscated_keywords": list(set(obfuscated_keywords)),
            "summary": summary,
            "is_indic_safe": is_indic_safe
        }

text_normalizer = TextNormalizer()
