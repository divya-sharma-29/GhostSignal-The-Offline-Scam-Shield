from typing import Dict, List, Any

class RiskAnalyzer:
    """
    Transparent risk scoring engine.
    Combines keyword weights, threat categories, Unicode obfuscation findings,
    URL analysis scores, and local AI predictions into a calibrated 0-100 risk score.
    Avoids double-counting multiple triggers from the same underlying threat.
    """

    def calculate_risk(
        self,
        red_flags: List[Dict[str, Any]],
        unicode_report: Dict[str, Any],
        url_analysis: Dict[str, Any] = None,
        ai_score: float = None
    ) -> Dict[str, Any]:
        """
        Calculates calibrated score, risk level, plain-language explanation, and recommendations.
        """
        score = 0
        reasons = []

        # 1. Base Threat Categories (capped per category to avoid score inflation)
        category_weights = {
            "otp": 40,
            "upi": 40,
            "kyc": 35,
            "payment_pressure": 30,
            "urgency": 25,
            "impersonation": 25,
            "link": 20,
            "lottery": 20
        }

        # Track which categories fired to prevent double-counting
        seen_categories = set()
        for flag in red_flags:
            cat = flag.get("category", "")
            if cat not in seen_categories:
                seen_categories.add(cat)
                weight = category_weights.get(cat, 15)
                score += weight
                reasons.append(f"Detected {flag.get('title', cat)}: {flag.get('whySuspicious', '')}")

        # Compound Threat Boosters (Multi-factor attack recognition)
        if "otp" in seen_categories and ("urgency" in seen_categories or "impersonation" in seen_categories):
            score = max(score, 75)
            reasons.append("High-risk compound attack: Credential/OTP request combined with urgency or impersonation.")

        if "upi" in seen_categories and ("lottery" in seen_categories or "urgency" in seen_categories or "payment_pressure" in seen_categories):
            score = max(score, 75)
            reasons.append("High-risk compound attack: Reverse-payment trap combined with lottery reward or pressure.")

        if "kyc" in seen_categories and ("urgency" in seen_categories or "link" in seen_categories or "impersonation" in seen_categories):
            score = max(score, 75)
            reasons.append("High-risk compound attack: Fake KYC demand combined with urgency or unverified link.")

        # 2. Unicode Obfuscation Penalties
        if unicode_report.get("has_anomalies", False):
            # Homoglyph attacks (e.g. Cyrillic in English) are high-intent evasion techniques
            if unicode_report.get("confusable_count", 0) > 0:
                score += 30
                reasons.append(
                    f"Message uses {unicode_report['confusable_count']} look-alike (homoglyph) characters to evade filters."
                )
            if unicode_report.get("invisible_count", 0) > 0:
                score += 25
                reasons.append(
                    f"Message contains {unicode_report['invisible_count']} hidden zero-width characters inserted between letters."
                )
            if unicode_report.get("suspicious_separator_count", 0) > 0:
                score += 20
                reasons.append(
                    f"Message uses deceptive separators to disguise domain names or keywords."
                )
            if unicode_report.get("obfuscated_keywords"):
                score += 25
                reasons.append(
                    f"Recovered intentionally obfuscated keywords: {', '.join(unicode_report['obfuscated_keywords'])}."
                )

        # 3. URL Risk Contribution
        if url_analysis and url_analysis.get("isSuspicious", False):
            url_score = url_analysis.get("riskScore", 0)
            # Add up to 35 points for URL risk, scaled proportionately
            added_url_score = int(url_score * 0.35)
            score += added_url_score
            reasons.extend(url_analysis.get("reasons", []))

        # 4. Local AI Classifier contribution (if model was run)
        if ai_score is not None:
            # AI score is 0.0 to 1.0; adjust score slightly without overriding explicit deterministic rules
            ai_percentage = int(ai_score * 100)
            if ai_percentage >= 80:
                score += 15
                reasons.append(f"Local AI text classification indicated {ai_percentage}% scam probability pattern.")
            elif ai_percentage <= 20 and score < 50:
                score = max(0, score - 10)

        # 5. Determine Final Risk Score (clamped 0 to 100)
        final_score = min(100, max(0, score))

        # 6. Categorize into LOW, MEDIUM, or HIGH
        if final_score >= 70:
            risk_level = "HIGH"
            plain_explanation = (
                "This message exhibits strong characteristics of cyber fraud or credential theft. "
                "Multiple critical warning signs—such as artificial urgency, payment/OTP demands, or deliberate character obfuscation—were detected."
            )
        elif final_score >= 35:
            risk_level = "MEDIUM"
            plain_explanation = (
                "This message contains warning signs commonly seen in deceptive or unsolicited communications. "
                "Proceed with caution and verify the sender's identity through official independent channels."
            )
        else:
            risk_level = "LOW"
            plain_explanation = (
                "No major deceptive indicators or high-risk threat signatures were detected in this message. "
                "Note: A low-risk assessment does not guarantee complete safety. Always verify unfamiliar contacts."
            )

        # 7. Actionable next steps / recommendations
        recommendations = self._generate_recommendations(seen_categories, unicode_report, url_analysis)

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "plain_explanation": plain_explanation,
            "reasons": reasons if reasons else ["No prominent scam indicators found in the message."],
            "recommendations": recommendations
        }

    def _generate_recommendations(
        self,
        categories: set,
        unicode_report: Dict[str, Any],
        url_analysis: Dict[str, Any] = None
    ) -> List[str]:
        recs = []

        if "otp" in categories:
            recs.append("NEVER share your OTP, verification code, or passwords with anyone, including bank representatives.")
        if "upi" in categories:
            recs.append("Remember the golden rule: You NEVER need to enter a UPI PIN or scan a QR code to RECEIVE money.")
        if "kyc" in categories:
            recs.append("Banks and telecom providers do NOT update KYC via SMS links. Visit your official bank branch or app.")
        if "link" in categories or (url_analysis and url_analysis.get("isSuspicious")):
            recs.append("Do NOT open links or download attachments from unexpected messages.")
        if "payment_pressure" in categories:
            recs.append("Verify electricity, traffic challan, or court notices only through official government portals.")
        if unicode_report.get("has_anomalies", False):
            recs.append("The sender disguised characters to evade filters; treat the message as intentional fraud.")

        # Default fallback recommendations
        if not recs:
            recs.append("Verify unfamiliar messages through official customer care numbers obtained from official websites.")
            recs.append("Do not send money or personal documents in response to unsolicited requests.")

        # Always add emergency helpline
        recs.append("If financial fraud has occurred, immediately dial 1930 (National Cybercrime Helpline) or visit cybercrime.gov.in.")

        return recs

risk_analyzer = RiskAnalyzer()
