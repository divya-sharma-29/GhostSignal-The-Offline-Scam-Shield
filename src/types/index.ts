export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNASSESSED';

export type RedFlagCategory = 
  | 'urgency'
  | 'link'
  | 'otp'
  | 'upi'
  | 'payment_pressure'
  | 'impersonation';

export interface RedFlag {
  id: string;
  category: RedFlagCategory;
  title: string;
  phrase: string;
  explanation: string;
  whySuspicious: string;
}

export interface HighlightSpan {
  text: string;
  category?: RedFlagCategory | 'unicode_anomaly';
  label?: string;
}

export type UnicodeFindingCategory = 
  | 'invisible_char'
  | 'mixed_script'
  | 'confusable'
  | 'suspicious_separator'
  | 'obfuscated_keyword';

export interface UnicodeCharFinding {
  char: string;
  codePoint: string;
  index: number;
  category: UnicodeFindingCategory;
  explanation: string;
  expectedChar?: string;
}

export interface UnicodeShieldReport {
  hasAnomalies: boolean;
  originalText: string;
  normalizedText: string;
  findings: UnicodeCharFinding[];
  invisibleCount: number;
  mixedScriptCount: number;
  confusableCount: number;
  suspiciousSeparatorCount: number;
  obfuscatedKeywords: string[];
  summary: string;
  isIndicSafe: boolean;
}

export interface AIVerdict {
  modelName: string;
  scamProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  scamType: string;
  redFlags: string[];
  obfuscationType?: string;
  explanation: string;
  recommendedAction: string;
  confidence: number;
  inferenceTimeMs: number;
  engine: string;
  isOffline: boolean;
}

export interface ScanResult {
  id: string;
  timestamp: string;
  sourceType: 'text' | 'screenshot' | 'voice';
  messageText: string;
  language: string;
  riskLevel: RiskLevel;
  riskScore: number;
  redFlags: RedFlag[];
  plainLanguageExplanation: string;
  safetyRecommendations: string[];
  unicodeShield?: UnicodeShieldReport;
  aiVerdict?: AIVerdict;
  sampleName?: string;
  screenshotUrl?: string;
  isOfflineScan?: boolean;
}

export interface SampleMessage {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  language: string;
  category: string;
  text: string;
  description: string;
}

export type SecurityUpdateStatus = 
  | 'verified'
  | 'update_available'
  | 'update_rejected'
  | 'offline_rules'
  | 'verification_unavailable';

export interface SecurityUpdateInfo {
  installedVersion: string;
  lastSuccessfulUpdate: string | null;
  status: SecurityUpdateStatus;
  availableVersion?: string;
  verificationDetails?: string;
}
