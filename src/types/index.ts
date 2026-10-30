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
  sourceType: 'text' | 'screenshot';
  messageText: string;
  language: string;
  riskLevel: RiskLevel;
  demonstrationScore: number; // For demo presentation e.g. 92, 64, 12
  redFlags: RedFlag[];
  plainLanguageExplanation: string;
  safetyRecommendations: string[];
  sampleName?: string;
  screenshotUrl?: string;
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
