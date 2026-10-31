import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import init_db, SessionLocal
from routes.health_routes import root, health_check, system_status
from routes.scan_routes import scan_text
from routes.url_routes import scan_url
from routes.history_routes import get_scan_history, clear_all_history
from routes.update_routes import get_rule_version, check_updates
from routes.auth_routes import generate_otp, verify_otp
from schemas import (
    TextScanRequest,
    URLScanRequest,
    OTPGenerateRequest,
    OTPVerifyRequest
)

# Ensure database tables exist
init_db()

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_get_root():
    data = root()
    assert data["status"] == "online"
    assert "GhostSignal" in data["name"]

def test_get_health():
    data = health_check()
    assert data["status"] == "healthy"

def test_get_system_status(db):
    data = system_status(db=db)
    assert data.databaseAvailable is True
    assert data.offlineModeSupported is True

def test_scan_text_endpoint(db):
    req = TextScanRequest(
        text="URGENT: Your bank account is locked. Send your OTP to restore access.",
        language="English",
        source_type="text"
    )
    result = scan_text(req, db=db)
    assert result["riskLevel"] == "HIGH"
    assert result["riskScore"] >= 70
    assert len(result["redFlags"]) > 0

def test_scan_url_endpoint(db):
    req = URLScanRequest(url="http://192.168.1.50/sbi-update")
    result = scan_url(req, db=db)
    assert result["isSuspicious"] is True
    assert result["riskScore"] >= 45

def test_history_flow(db):
    # Perform a scan
    req = TextScanRequest(text="Hello, meeting at 3 PM today.", language="English")
    scan_text(req, db=db)

    hist = get_scan_history(limit=50, offset=0, db=db)
    assert hist["total"] >= 1

    # Clear history
    del_res = clear_all_history(db=db)
    assert del_res["success"] is True

    hist_cleared = get_scan_history(limit=50, offset=0, db=db)
    assert hist_cleared["total"] == 0

def test_updates_endpoints():
    ver = get_rule_version()
    assert "v2.4.0" in ver["version"]

    chk = check_updates()
    assert "currentVersion" in chk

def test_otp_generation_and_verification(db):
    # Generate OTP
    gen_req = OTPGenerateRequest(phoneNumber="9876543210", countryCode="+91")
    gen_res = generate_otp(gen_req, db=db)
    assert gen_res["success"] is True
    dev_code = gen_res["devCode"]
    assert dev_code is not None

    # Verify with generated code
    ver_req = OTPVerifyRequest(phoneNumber="9876543210", countryCode="+91", otp=dev_code)
    ver_res = verify_otp(ver_req, db=db)
    assert ver_res.success is True

    # Verify development static code '123456' also works
    dev_ver_req = OTPVerifyRequest(phoneNumber="9876543210", countryCode="+91", otp="123456")
    dev_ver_res = verify_otp(dev_ver_req, db=db)
    assert dev_ver_res.success is True
