import re
from urllib.parse import urlparse
from typing import Dict, List, Any

# Common URL shortener services that hide final destinations
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy",
    "ow.ly", "goo.gl", "buff.ly", "adf.ly", "bit.do", "shorte.st"
}

# TLDs frequently abused in rapid disposable phishing campaigns
HIGH_RISK_TLDS = {
    ".xyz", ".top", ".club", ".work", ".click", ".gq", ".cf",
    ".ml", ".tk", ".ga", ".rest", ".fit", ".casa", ".monster",
    ".surf", ".icu", ".cam", ".sbs", ".cfd"
}

# Trusted brand keywords frequently targeted by typosquatters
BRAND_TARGETS = [
    "sbi", "hdfc", "icici", "axis", "pnb", "paytm", "phonepe",
    "gpay", "googlepay", "bhim", "aadhaar", "uidai", "incometax",
    "postoffice", "netflix", "amazon", "flipkart", "microsoft", "apple"
]

class URLAnalyzer:
    """
    Static URL security analyzer.
    Analyzes URLs completely passively without ever making an outbound network connection.
    Evaluates IP-address hosts, shorteners, punycode, brand typosquatting, excessive subdomains,
    and deceptive path structures.
    """

    def analyze(self, raw_url: str) -> Dict[str, Any]:
        if not raw_url:
            return {
                "url": "",
                "isSuspicious": False,
                "riskLevel": "LOW",
                "riskScore": 0,
                "characteristics": [],
                "reasons": ["Empty URL provided."],
                "recommendation": "Do not open unverified links."
            }

        url = raw_url.strip()
        # Add scheme if missing for parseability
        if not url.startswith(("http://", "https://")):
            parsed = urlparse("http://" + url)
        else:
            parsed = urlparse(url)

        hostname = (parsed.hostname or "").lower()
        path = parsed.path.lower()
        scheme = parsed.scheme.lower()

        characteristics = []
        reasons = []
        score = 0

        # 1. IP address in hostname
        ip_pattern = r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'
        if re.match(ip_pattern, hostname):
            score += 45
            characteristics.append("IP-Address Host")
            reasons.append("The link directs to a raw numerical IP address instead of a registered domain name.")

        # 2. URL Shortener detection
        if hostname in URL_SHORTENERS:
            score += 30
            characteristics.append("URL Shortener")
            reasons.append(f"Domain '{hostname}' is a URL shortener service that obscures the real destination website.")

        # 3. Punycode / IDN Homograph domain
        if hostname.startswith("xn--") or ".xn--" in hostname:
            score += 40
            characteristics.append("Punycode / IDN Homograph")
            reasons.append("The domain uses Punycode (xn--) which is often employed to register lookalike internationalized domains.")

        # 4. Insecure HTTP with sensitive banking / verification targets
        has_sensitive_word = any(w in (hostname + path) for w in ["bank", "kyc", "login", "verify", "secure", "pay", "otp"])
        if scheme == "http" and has_sensitive_word:
            score += 25
            characteristics.append("Unencrypted HTTP for Sensitive Action")
            reasons.append("The website requests login or verification credentials over unencrypted HTTP.")

        # 5. Excessive subdomains (more than 3 subdomains indicates free dynamic DNS masking)
        parts = hostname.split('.')
        if len(parts) >= 4:
            score += 20
            characteristics.append("Excessive Subdomains")
            reasons.append(f"The domain has {len(parts)} levels of subdomains, a common tactic to impersonate brands on free hosting.")

        # 6. Embedded credentials or '@' sign in URL authority (RFC 3986 trick)
        if "@" in raw_url:
            score += 50
            characteristics.append("Deceptive '@' Authority Trick")
            reasons.append("The URL contains an '@' symbol, tricking users into seeing a legitimate domain while routing elsewhere.")

        # 7. Brand typosquatting in non-official domains
        matched_brands = [b for b in BRAND_TARGETS if b in hostname or b in path]
        is_known_official = any(hostname.endswith(f".{b}.com") or hostname.endswith(f".{b}.in") for b in matched_brands)
        if matched_brands and not is_known_official:
            score += 35
            characteristics.append(f"Brand Keyword ({', '.join(matched_brands)}) in Third-Party Domain")
            reasons.append(f"The link references brand '{matched_brands[0]}' on an unrecognized domain '{hostname}'.")

        # 8. High-risk or disposable TLD
        for tld in HIGH_RISK_TLDS:
            if hostname.endswith(tld):
                score += 25
                characteristics.append(f"High-Risk TLD ({tld})")
                reasons.append(f"Domain uses '{tld}', an extension frequently associated with disposable spam operations.")
                break

        # 9. Direct download of executable / Android package
        if path.endswith((".apk", ".exe", ".scr", ".bat", ".vbs")):
            score += 50
            characteristics.append("Direct Executable / APK Download")
            reasons.append("The link points directly to a downloadable executable or Android APK package.")

        # 10. Legitimate common websites check
        trusted_suffixes = (".gov.in", ".nic.in", ".ac.in", ".google.com", ".microsoft.com", ".wikipedia.org")
        if hostname.endswith(trusted_suffixes):
            score = max(0, score - 40)

        # Cap score between 0 and 100
        risk_score = min(100, max(0, score))

        if risk_score >= 70:
            risk_level = "HIGH"
            recommendation = "Do NOT open this link. It exhibits high-risk indicators typical of phishing or malware distribution."
        elif risk_score >= 35:
            risk_level = "MEDIUM"
            recommendation = "Exercise caution. Verify the destination with official sources before clicking or entering information."
        else:
            risk_level = "LOW"
            recommendation = "No prominent phishing signals were detected in this URL. However, a low score does not guarantee safety."

        is_suspicious = risk_score >= 35

        return {
            "url": raw_url,
            "isSuspicious": is_suspicious,
            "riskLevel": risk_level,
            "riskScore": risk_score,
            "characteristics": characteristics,
            "reasons": reasons if reasons else ["Standard domain structure detected."],
            "recommendation": recommendation
        }

    def extract_urls(self, text: str) -> List[str]:
        """Extracts HTTP and HTTPS URLs from input text."""
        pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
        return re.findall(pattern, text)

    def analyze_text_urls(self, text: str) -> Dict[str, Any]:
        """Passively analyzes all URLs embedded in a message without network interaction."""
        urls = self.extract_urls(text)
        if not urls:
            return {
                "has_urls": False,
                "urls": [],
                "is_suspicious": False,
                "characteristics": [],
                "max_risk_level": "LOW",
                "max_risk_score": 0,
                "reports": []
            }

        reports = [self.analyze(u) for u in urls]
        is_suspicious = any(r["isSuspicious"] for r in reports)
        max_score = max((r["riskScore"] for r in reports), default=0)
        chars = []
        for r in reports:
            chars.extend(r["characteristics"])

        return {
            "has_urls": True,
            "urls": urls,
            "is_suspicious": is_suspicious,
            "characteristics": list(set(chars)),
            "max_risk_level": "HIGH" if max_score >= 70 else ("MEDIUM" if max_score >= 35 else "LOW"),
            "max_risk_score": max_score,
            "reports": reports
        }

url_analyzer = URLAnalyzer()

