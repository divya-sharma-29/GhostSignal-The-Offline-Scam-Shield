from typing import List, Optional
from pydantic import BaseModel, Field, AliasChoices

# --- Unicode Shield Schemas ---
class UnicodeCharFindingSchema(BaseModel):
    char: str
    codePoint: str
    index: int
    category: str  # invisible_char, mixed_script, confusable, suspicious_separator, obfuscated_keyword
    explanation: str
    expectedChar: Optional[str] = None

class UnicodeShieldReportSchema(BaseModel):
    hasAnomalies: bool
    originalText: str
    normalizedText: str
    findings: List[UnicodeCharFindingSchema] = []
    invisibleCount: int = 0
    mixedScriptCount: int = 0
    confusableCount: int = 0
    suspiciousSeparatorCount: int = 0
    obfuscatedKeywords: List[str] = []
    summary: str
    isIndicSafe: bool = True

# --- Threat Red Flags & Blueprint Findings ---
class RedFlagSchema(BaseModel):
    id: str
    category: str  # urgency, link, otp, upi, payment_pressure, impersonation
    title: str
    phrase: str
    explanation: str
    whySuspicious: str

class FindingSchema(BaseModel):
    id: str
    type: str  # dotted_keyword, confusable, zero_width_character, urgency, credential_theft, payment_pressure, suspicious_url, impersonation
    evidence: str
    explanation: str
    severity: Optional[str] = "medium"
    start: Optional[int] = None
    end: Optional[int] = None
    code_point: Optional[str] = None
    unicode_name: Optional[str] = None

# --- AI Verdict Schema ---
class AIVerdictSchema(BaseModel):
    modelName: str
    scamProbability: float
    riskScore: int
    riskLevel: str
    scamType: str
    redFlags: List[str] = []
    obfuscationType: Optional[str] = "none"
    explanation: str
    recommendedAction: str
    confidence: float
    inferenceTimeMs: float
    engine: str
    isOffline: bool = True

# --- Scan Requests & Responses ---
class TextScanRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Message text to analyze")
    language: Optional[str] = Field("English", description="Expected or selected language")
    source_type: Optional[str] = Field("text", description="Source type: text, voice, screenshot")

class ScanResponseSchema(BaseModel):
    id: str
    timestamp: str
    sourceType: str
    messageText: str
    language: str
    riskLevel: str  # HIGH, MEDIUM, LOW, UNASSESSED
    riskScore: int  # 0 to 100
    redFlags: List[RedFlagSchema] = []
    plainLanguageExplanation: str
    safetyRecommendations: List[str] = []
    unicodeShield: Optional[UnicodeShieldReportSchema] = None
    aiVerdict: Optional[AIVerdictSchema] = None
    ruleVersion: str = "v2.4.0-offline"
    aiModelVersion: Optional[str] = None
    isOfflineScan: bool = False

    # Blueprint Section 6 & 11 Result Contract Fields
    scan_id: Optional[str] = None
    risk_level: Optional[str] = None
    score: Optional[int] = None
    score_is_calibrated_probability: bool = False
    rules_version: Optional[str] = None
    findings: List[FindingSchema] = []
    recommendations: List[str] = []
    processed_offline: bool = True

# --- URL Analysis Schemas ---
class URLScanRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048, description="URL to analyze without opening")

class URLAnalysisResponseSchema(BaseModel):
    url: str
    isSuspicious: bool
    riskLevel: str
    riskScore: int
    characteristics: List[str] = []
    reasons: List[str] = []
    recommendation: str

# --- History Schemas ---
class HistoryItemSchema(BaseModel):
    id: str
    timestamp: str
    sourceType: str
    messageSnippet: str
    riskLevel: str
    riskScore: int
    threats: List[str] = []
    reasons: List[str] = []
    ruleVersion: str
    hasUnicodeAnomalies: bool

class HistoryListResponse(BaseModel):
    total: int
    items: List[HistoryItemSchema]

class SimpleMessageResponse(BaseModel):
    success: bool
    message: str

# --- Update Schemas ---
class RuleVersionResponse(BaseModel):
    version: str
    installedAt: str
    rulesCount: int
    lastVerified: bool

class UpdateCheckResponse(BaseModel):
    updateAvailable: bool
    currentVersion: str
    latestVersion: Optional[str] = None
    releaseNotes: Optional[str] = None
    publishedAt: Optional[str] = None

class UpdateInstallRequest(BaseModel):
    version: str
    rules: dict
    signature: str
    timestamp: str
    expiresAt: Optional[str] = None

class UpdateInstallResponse(BaseModel):
    success: bool
    message: str
    installedVersion: str
    timestamp: str

# --- System Status Schemas ---
class SystemStatusResponse(BaseModel):
    backend: str
    version: str
    ruleVersion: str
    databaseAvailable: bool
    aiEngineAvailable: bool
    aiModelLoaded: bool
    ocrEngineAvailable: bool
    offlineModeSupported: bool
    details: dict = {}

# --- OTP Authentication Schemas ---
class OTPGenerateRequest(BaseModel):
    phoneNumber: str = Field(..., validation_alias=AliasChoices('phoneNumber', 'phone_number'), min_length=7, max_length=16, description="User mobile number")
    countryCode: Optional[str] = Field("+91", validation_alias=AliasChoices('countryCode', 'country_code'), description="Country calling code")

class OTPGenerateResponse(BaseModel):
    success: bool
    message: str
    expiresInSeconds: int
    deliveryMethod: Optional[str] = "sms"
    smsStatus: Optional[str] = "sent"
    devCode: Optional[str] = None  # None when live SMS dispatch is active

class OTPVerifyRequest(BaseModel):
    phoneNumber: str = Field(..., validation_alias=AliasChoices('phoneNumber', 'phone_number'), min_length=7, max_length=16)
    countryCode: Optional[str] = Field("+91", validation_alias=AliasChoices('countryCode', 'country_code'))
    otp: str = Field(..., validation_alias=AliasChoices('otp', 'otpCode', 'otp_code'), min_length=4, max_length=10)

class OTPVerifyResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
