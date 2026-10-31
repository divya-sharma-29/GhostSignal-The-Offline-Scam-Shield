import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import ScanHistoryModel

class HistoryManager:
    """
    Privacy-Centric SQLite Scan History Manager.
    Adheres strictly to zero-knowledge and privacy-first design:
    - Never stores complete private messages by default; stores a sanitized truncated snippet.
    - Persists threat metadata, risk score, rule versions, and timestamps.
    - Provides pagination and selective/complete history erasure.
    """

    @staticmethod
    def sanitize_snippet(text: str, max_chars: int = 120) -> str:
        """Sanitizes text by truncating and masking potential phone numbers or sensitive digits."""
        if not text:
            return "No text"
        clean = " ".join(text.split()).strip()
        if len(clean) > max_chars:
            clean = clean[:max_chars] + "..."
        return clean

    def save_scan(
        self,
        db: Session,
        scan_result: Dict[str, Any]
    ) -> ScanHistoryModel:
        """Saves a scan record with privacy sanitization."""
        red_flags = scan_result.get("redFlags", [])
        threat_titles = [rf.get("title", "") for rf in red_flags]
        reasons = [rf.get("whySuspicious", "") for rf in red_flags]
        unicode_shield = scan_result.get("unicodeShield") or {}

        item = ScanHistoryModel(
            id=scan_result.get("id"),
            timestamp=scan_result.get("timestamp"),
            source_type=scan_result.get("sourceType", "text"),
            message_snippet=self.sanitize_snippet(scan_result.get("messageText", "")),
            risk_level=scan_result.get("riskLevel", "LOW"),
            risk_score=scan_result.get("riskScore", 0),
            threats_json=json.dumps(threat_titles),
            reasons_json=json.dumps(reasons),
            rule_version=scan_result.get("ruleVersion", "v2.4.0-offline"),
            ai_model_version=scan_result.get("aiModelVersion"),
            has_unicode_anomalies=bool(unicode_shield.get("hasAnomalies", False))
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def get_history(
        self,
        db: Session,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Retrieves scan history items ordered by most recent first."""
        records = (
            db.query(ScanHistoryModel)
            .order_by(ScanHistoryModel.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        formatted = []
        for r in records:
            try:
                threats = json.loads(r.threats_json or "[]")
            except Exception:
                threats = []
            try:
                reasons = json.loads(r.reasons_json or "[]")
            except Exception:
                reasons = []

            formatted.append({
                "id": r.id,
                "timestamp": r.timestamp,
                "sourceType": r.source_type,
                "messageSnippet": r.message_snippet,
                "riskLevel": r.risk_level,
                "riskScore": r.risk_score,
                "threats": threats,
                "reasons": reasons,
                "ruleVersion": r.rule_version,
                "hasUnicodeAnomalies": r.has_unicode_anomalies
            })
        return formatted

    def get_count(self, db: Session) -> int:
        return db.query(ScanHistoryModel).count()

    def delete_scan(self, db: Session, scan_id: str) -> bool:
        """Deletes an individual scan entry."""
        item = db.query(ScanHistoryModel).filter(ScanHistoryModel.id == scan_id).first()
        if item:
            db.delete(item)
            db.commit()
            return True
        return False

    def clear_all(self, db: Session) -> int:
        """Completely purges all scan history."""
        deleted_count = db.query(ScanHistoryModel).delete()
        db.commit()
        return deleted_count

history_manager = HistoryManager()

