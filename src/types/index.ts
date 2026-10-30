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
  category?: RedFlagCategory;
  label?: string;
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
  sampleName?: string;
  screenshotUrl?: string;
  /** Findings returned by a trusted analysis service. The client does not derive these. */
  unicodeSecurity?: UnicodeSecurityFindings;
}

export interface UnicodeSecurityFinding {
  kind: 'invisible' | 'mixed-script' | 'homoglyph' | 'separator' | 'obfuscated-keyword' | 'suspicious-url';
  text: string;
  explanation: string;
  start?: number;
  end?: number;
  codePoints?: string[];
  scripts?: string[];
}

export interface UnicodeSecurityFindings {
  findings: UnicodeSecurityFinding[];
  normalizedForAnalysis?: string;
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
