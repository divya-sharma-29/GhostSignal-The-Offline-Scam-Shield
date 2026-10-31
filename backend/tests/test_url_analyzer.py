import pytest
from services.url_analyzer import url_analyzer

def test_ip_address_url():
    url = "http://192.168.1.100/sbi-login.html"
    res = url_analyzer.analyze(url)
    assert res["isSuspicious"] is True
    assert "IP-Address Host" in res["characteristics"]
    assert res["riskScore"] >= 45

def test_url_shortener():
    url = "https://bit.ly/sbi-verify-kyc"
    res = url_analyzer.analyze(url)
    assert res["isSuspicious"] is True
    assert "URL Shortener" in res["characteristics"]

def test_punycode_domain():
    url = "https://xn--e1afmkfd.xn--p1ai/bank"
    res = url_analyzer.analyze(url)
    assert res["isSuspicious"] is True
    assert "Punycode / IDN Homograph" in res["characteristics"]

def test_brand_typosquatting_on_risky_tld():
    url = "http://paytm-security-update.xyz/verify"
    res = url_analyzer.analyze(url)
    assert res["isSuspicious"] is True
    assert res["riskLevel"] in ["HIGH", "MEDIUM"]

def test_legitimate_government_url():
    url = "https://cybercrime.gov.in/Webform/Crime_AuthoLogin.aspx"
    res = url_analyzer.analyze(url)
    assert res["riskLevel"] == "LOW"
    assert res["riskScore"] < 35

