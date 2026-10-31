import json
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from pathlib import Path

from config import settings
from services.text_normalizer import text_normalizer
from services.url_analyzer import url_analyzer
from services.risk_analyzer import risk_analyzer
from services.ai_engine import ai_engine

class ScamDetector:
    """
    Advanced Scam Detection Engine.
    Combines rule-based keyword & regex matching, normalized Unicode analysis,
    passive URL inspection, and local CPU-based AI classification.
    """

    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = rules_path or settings.DEFAULT_RULES_PATH
        self.rules: Dict[str, Any] = {}
        self.rule_version: str = settings.RULES_VERSION
        self.load_rules()

    def load_rules(self, custom_path: Optional[Path] = None) -> bool:
        """Loads security detection rules from JSON file."""
        target_path = custom_path or self.rules_path
        if target_path and Path(target_path).exists():
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.rules = data
                    self.rule_version = data.get("version", settings.RULES_VERSION)
                return True
            except Exception as e:
                print(f"[Detector] Failed to load rules from {target_path}: {e}")
        return False

    def scan(
        self,
        text: str,
        language: str = "English",
        source_type: str = "text"
    ) -> Dict[str, Any]:
        """
        Executes complete multi-stage detection pipeline on a message.
        """
        scan_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        if not text or not text.strip():
            return {
                "id": scan_id,
                "timestamp": timestamp,
                "sourceType": source_type,
                "messageText": "",
                "language": language,
                "riskLevel": "UNASSESSED",
                "riskScore": 0,
                "redFlags": [],
                "plainLanguageExplanation": "No text provided for analysis.",
                "safetyRecommendations": ["Please paste or submit text to check for threats."],
                "unicodeShield": None,
                "aiVerdict": None,
                "ruleVersion": self.rule_version,
                "aiModelVersion": ai_engine.model_version,
                "isOfflineScan": True,
                "scan_id": scan_id,
                "risk_level": "UNASSESSED",
                "score": 0,
                "score_is_calibrated_probability": False,
                "rules_version": self.rule_version,
                "findings": [],
                "recommendations": ["Please paste or submit text to check for threats."],
                "processed_offline": True
            }

        # 1. Advanced Unicode Normalization
        norm_result = text_normalizer.normalize(text)
        normalized_text = norm_result["normalized_text"]
        norm_lower = normalized_text.lower()
        orig_lower = text.lower()

        # 2. Extract and analyze any embedded URLs
        url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+|bit\.ly/[^\s<>"]+|tinyurl\.com/[^\s<>"]+'
        urls_found = re.findall(url_pattern, text)
        url_analysis = None
        if urls_found:
            # Analyze the primary found URL passively
            url_analysis = url_analyzer.analyze(urls_found[0])

        # 3. Match Threat Categories across both original & normalized representations
        red_flags: List[Dict[str, Any]] = []
        categories = self.rules.get("categories", {})

        # Map rules to red flag categories
        for cat_key, cat_data in categories.items():
            patterns = cat_data.get("patterns", [])
            for pattern in patterns:
                pat_lower = pattern.lower()
                # Check normalized text and original text
                matched = (pat_lower in norm_lower) or (pat_lower in orig_lower)
                if matched:
                    flag_id = f"flag_{cat_key}_{len(red_flags) + 1}"
                    # Provide explainable threat description
                    why_suspicious = self._get_why_suspicious(cat_key, pattern)
                    explanation = self._get_category_explanation(cat_key, cat_data.get("name", cat_key))

                    red_flags.append({
                        "id": flag_id,
                        "category": cat_key,
                        "title": cat_data.get("name", cat_key.capitalize()),
                        "phrase": pattern,
                        "explanation": explanation,
                        "whySuspicious": why_suspicious
                    })
                    break  # Avoid multiple triggers for the same category

        # Add URL flag if suspicious URL was found
        if url_analysis and url_analysis.get("isSuspicious"):
            red_flags.append({
                "id": f"flag_url_{len(red_flags) + 1}",
                "category": "link",
                "title": "Suspicious Link Destination",
                "phrase": url_analysis["url"][:40] + ("..." if len(url_analysis["url"]) > 40 else ""),
                "explanation": "The message contains a link with characteristics commonly associated with phishing or malware.",
                "whySuspicious": "; ".join(url_analysis.get("reasons", ["Unverified URL structure"]))
            })

        # Add Unicode flag if homoglyphs or zero-width chars were found
        if norm_result["has_anomalies"]:
            red_flags.append({
                "id": f"flag_unicode_{len(red_flags) + 1}",
                "category": "impersonation",
                "title": "Unicode Obfuscation / Look-alike Spoofing",
                "phrase": f"{norm_result['summary']}",
                "explanation": "Characters from foreign scripts or invisible zero-width code points were used to disguise high-risk words.",
                "whySuspicious": "Legitimate institutions do not conceal characters inside messages using Cyrillic or zero-width spaces."
            })

        # 4. Local SmolLM3 AI Classifier & Structured Semantic Reasoning
        ai_full = ai_engine.predict_full(text)
        ai_prob = ai_full.get("scam_probability", 0.0)

        obf_type = ai_full.get("obfuscation_type", "none")
        if obf_type == "none" and norm_result["has_anomalies"]:
            if norm_result.get("confusable_count", 0) > 0:
                obf_type = "lookalike"
            elif norm_result.get("invisible_count", 0) > 0:
                obf_type = "invisible"
            elif norm_result.get("suspicious_separator_count", 0) > 0:
                obf_type = "dotted"
            else:
                obf_type = "unicode_anomaly"

        ai_verdict = {
            "modelName": ai_full.get("model_name", "SmolLM3-3B (GhostSignal Local AI)"),
            "scamProbability": ai_full.get("scam_probability", 0.0),
            "riskScore": ai_full.get("risk_score", 0),
            "riskLevel": ai_full.get("risk_level", "LOW"),
            "scamType": ai_full.get("scam_type", "benign"),
            "redFlags": ai_full.get("red_flags", []),
            "obfuscationType": obf_type,
            "explanation": ai_full.get("explanation", ""),
            "recommendedAction": ai_full.get("recommended_action", ""),
            "confidence": ai_full.get("confidence", 0.90),
            "inferenceTimeMs": ai_full.get("inference_time_ms", 12.0),
            "engine": ai_full.get("engine", "smollm3_local_reasoner"),
            "isOffline": True
        }

        # 5. Risk Analysis & Score Calculation (without double counting)
        risk_result = risk_analyzer.calculate_risk(
            red_flags=red_flags,
            unicode_report=norm_result,
            url_analysis=url_analysis,
            ai_score=ai_prob
        )

        # 6. Format Unicode Shield Report for Frontend
        unicode_shield_report = {
            "hasAnomalies": norm_result["has_anomalies"],
            "originalText": norm_result["original_text"],
            "normalizedText": norm_result["normalized_text"],
            "findings": norm_result["findings"],
            "invisibleCount": norm_result["invisible_count"],
            "mixedScriptCount": norm_result["mixed_script_count"],
            "confusableCount": norm_result["confusable_count"],
            "suspiciousSeparatorCount": norm_result["suspicious_separator_count"],
            "obfuscatedKeywords": norm_result["obfuscated_keywords"],
            "summary": norm_result["summary"],
            "isIndicSafe": norm_result["is_indic_safe"]
        }

        # Aggregate blueprint contract findings (Section 6 & 11)
        blueprint_findings = []
        for idx, rf in enumerate(red_flags):
            blueprint_findings.append({
                "id": rf.get("id", f"RULE_{idx+1}"),
                "type": rf.get("category", "threat_pattern"),
                "evidence": rf.get("phrase", ""),
                "explanation": rf.get("explanation", ""),
                "severity": "high" if risk_result["risk_level"] == "HIGH" else "medium"
            })
        for idx, uf in enumerate(norm_result.get("findings", [])):
            blueprint_findings.append({
                "id": f"OBFUSCATION_{idx+1}",
                "type": uf.get("type", uf.get("category", "unicode_anomaly")),
                "evidence": uf.get("char", ""),
                "explanation": uf.get("explanation", ""),
                "severity": uf.get("severity", "medium"),
                "start": uf.get("start"),
                "end": uf.get("end"),
                "code_point": uf.get("code_point", uf.get("codePoint")),
                "unicode_name": uf.get("unicode_name")
            })

        return {
            "id": scan_id,
            "timestamp": timestamp,
            "sourceType": source_type,
            "messageText": text,
            "language": language,
            "riskLevel": risk_result["risk_level"],
            "riskScore": risk_result["risk_score"],
            "redFlags": red_flags,
            "plainLanguageExplanation": risk_result["plain_explanation"],
            "safetyRecommendations": risk_result["recommendations"],
            "unicodeShield": unicode_shield_report,
            "aiVerdict": ai_verdict,
            "ruleVersion": self.rule_version,
            "aiModelVersion": ai_verdict["modelName"],
            "isOfflineScan": True,
            # Blueprint Section 6 & 11 Result Contract Fields
            "scan_id": scan_id,
            "risk_level": risk_result["risk_level"],
            "score": risk_result["risk_score"],
            "score_is_calibrated_probability": False,
            "rules_version": self.rule_version,
            "findings": blueprint_findings,
            "recommendations": risk_result["recommendations"],
            "processed_offline": True
        }

    def _get_why_suspicious(self, category: str, pattern: str) -> str:
        explanations = {
            "otp": f"Asking for or sharing '{pattern}' directly allows threat actors to compromise your accounts.",
            "upi": f"The phrase '{pattern}' is a classic reverse-payment scam designed to trick you into authorizing an outgoing transfer.",
            "kyc": f"Claiming '{pattern}' is a standard phishing pretext to collect identity documents and bank credentials.",
            "urgency": f"Phrases like '{pattern}' create psychological panic so targets act before verifying independently.",
            "payment_pressure": f"Threats regarding '{pattern}' intimidate victims into paying fraudulent fees.",
            "impersonation": f"Mentioning '{pattern}' establishes false authority to lower your guard.",
            "lottery": f"Claims of '{pattern}' are bait to request upfront processing fees or banking details.",
            "link": f"Demanding that you open '{pattern}' often downloads malicious APKs or opens credential-harvesting phishing pages."
        }
        return explanations.get(category, f"The pattern '{pattern}' matches known deception tactics.")

    def _get_category_explanation(self, category: str, title: str) -> str:
        explanations = {
            "otp": "Credential theft tactic seeking one-time codes or security passwords.",
            "upi": "Deceptive payment manipulation exploiting confusion around UPI authorizations.",
            "kyc": "Fake compliance demand threatening account suspension unless updated immediately.",
            "urgency": "Artificial time pressure designed to prevent independent verification.",
            "payment_pressure": "Coercive claims of penalties, fines, or service disconnections.",
            "impersonation": "Pretending to represent an official bank, regulator, or utility agency.",
            "lottery": "Unsolicited reward or prize notification requiring action.",
            "link": "Unverified hyperlink or direct executable download."
        }
        return explanations.get(category, f"Identified warning sign relating to {title}.")

scam_detector = ScamDetector()

