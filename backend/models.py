from sqlalchemy import Column, String, Integer, Boolean, DateTime
from database import Base
import datetime

class ScanHistoryModel(Base):
    __tablename__ = "scan_history"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(String(32), index=True)
    source_type = Column(String(16), default="text")
    message_snippet = Column(String(256), nullable=False)
    risk_level = Column(String(16), index=True, nullable=False)
    risk_score = Column(Integer, nullable=False)
    threats_json = Column(String(1024), default="[]")
    reasons_json = Column(String(2048), default="[]")
    rule_version = Column(String(32), default="v2.4.0-offline")
    ai_model_version = Column(String(32), nullable=True)
    has_unicode_anomalies = Column(Boolean, default=False)

class UpdateLogModel(Base):
    __tablename__ = "update_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    installed_at = Column(String(32))
    version = Column(String(32), index=True)
    signature_verified = Column(Boolean, default=False)
    package_hash = Column(String(128))
    status = Column(String(32))

class OTPRecordModel(Base):
    __tablename__ = "otp_records"

    phone_number = Column(String(32), primary_key=True, index=True)
    otp_hash = Column(String(128), nullable=False)
    salt = Column(String(64), nullable=False)
    created_at = Column(String(32), nullable=False)
    expires_at = Column(String(32), nullable=False)
    attempts = Column(Integer, default=0)
    verified = Column(Boolean, default=False)

