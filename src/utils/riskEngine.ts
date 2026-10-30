import { ScanResult, RedFlag, RiskLevel } from '../types';

/**
 * Evaluates a message or screenshot input.
 * Applies transparent local keyword rules to text supplied by the user.
 */
export function analyzeMessageInput(
  text: string,
  language = 'English',
  sourceType: 'text' | 'screenshot' = 'text',
  sampleId?: string,
  screenshotUrl?: string
): ScanResult {
  const trimmed = text.trim();

  if (sourceType === 'screenshot' && !trimmed) {
    return {
      id: 'scan-' + Date.now(),
      timestamp: new Date().toISOString(),
      sourceType,
      messageText: 'Screenshot uploaded. Text extraction is not available in this frontend checkpoint.',
      language,
      riskLevel: 'UNASSESSED',
      demonstrationScore: 0,
      redFlags: [],
      plainLanguageExplanation: 'The screenshot preview was saved, but GhostSignal does not include OCR in this checkpoint. No message text was assessed, so a risk level cannot be determined.',
      safetyRecommendations: ['Paste the message text into the scanner for a simulated rules-based assessment. Do not treat this image-only result as evidence that the message is safe.'],
      screenshotUrl
    };
  }

  // Local keyword checks; this is not an AI model.
  const lower = trimmed.toLowerCase();
  const detectedFlags: RedFlag[] = [];
  let score = 15; // baseline

  // Rule A: OTP Harvest
  if (lower.includes('otp') || lower.includes('one time password') || lower.includes('verification code') || lower.includes('passcode')) {
    score += 35;
    detectedFlags.push({
      id: 'rf-otp-' + Date.now(),
      category: 'otp',
      title: 'Credential / OTP Extraction',
      phrase: extractSurrounding(trimmed, ['otp', 'verification code', 'passcode', 'code']),
      explanation: 'Message directly or indirectly requests your secret One-Time Password.',
      whySuspicious: 'Legitimate services never request your authentication codes via SMS or chat.'
    });
  }

  // Rule B: UPI PIN / Payment trick
  if (lower.includes('upi') || lower.includes('upi pin') || lower.includes('gpay') || lower.includes('phonepe') || lower.includes('paytm') || lower.includes('claim')) {
    score += 30;
    detectedFlags.push({
      id: 'rf-upi-' + Date.now(),
      category: 'upi',
      title: 'UPI PIN / Reverse Collect Lure',
      phrase: extractSurrounding(trimmed, ['upi pin', 'upi', 'claim', 'receive']),
      explanation: 'Instructs the recipient to enter a security PIN or authorize incoming funds.',
      whySuspicious: 'In standard banking protocols, entering a PIN always authorizes money to leave your account, never to receive it.'
    });
  }

  // Rule C: Urgency / Deadline intimidation
  if (
    lower.includes('immediately') || 
    lower.includes('urgent') || 
    lower.includes('within 2 hours') || 
    lower.includes('today') || 
    lower.includes('24 hours') || 
    lower.includes('blocked') || 
    lower.includes('suspended') || 
    lower.includes('deactivated')
  ) {
    score += 25;
    detectedFlags.push({
      id: 'rf-urgency-' + Date.now(),
      category: 'urgency',
      title: 'Manufactured Panic & Artificial Deadline',
      phrase: extractSurrounding(trimmed, ['immediately', 'within', 'blocked', 'suspended', 'deactivated', 'urgent']),
      explanation: 'Creates rapid emotional urgency or fear of imminent service termination.',
      whySuspicious: 'Scammers use panic to bypass caution and suppress verification through official channels.'
    });
  }

  // Rule D: Suspicious Link / Unverified URL
  if (
    lower.includes('http') || 
    lower.includes('www.') || 
    lower.includes('.link') || 
    lower.includes('link below') || 
    lower.includes('click') || 
    lower.includes('bit.ly') || 
    lower.includes('tinyurl')
  ) {
    score += 20;
    detectedFlags.push({
      id: 'rf-link-' + Date.now(),
      category: 'link',
      title: 'Unverified External Link',
      phrase: extractSurrounding(trimmed, ['http', 'link below', 'link', 'click', 'bit.ly', 'www']),
      explanation: 'Encourages visiting an unverified external address or web hyperlink.',
      whySuspicious: 'Links can redirect to credential-phishing portals or automated malware downloads.'
    });
  }

  // Rule E: Financial/Banking Impersonation
  if (
    lower.includes('bank') || 
    lower.includes('sbi') || 
    lower.includes('hdfc') || 
    lower.includes('icici') || 
    lower.includes('kyc') || 
    lower.includes('pan card') || 
    lower.includes('aadhaar') || 
    lower.includes('electricity') || 
    lower.includes('bill')
  ) {
    score += 20;
    detectedFlags.push({
      id: 'rf-imp-' + Date.now(),
      category: 'impersonation',
      title: 'Institutional Impersonation / KYC Pressure',
      phrase: extractSurrounding(trimmed, ['bank', 'kyc', 'account', 'pan', 'electricity', 'sbi']),
      explanation: 'Claims to represent a bank, telecom provider, or utility board regarding account status.',
      whySuspicious: 'Real compliance updates are delivered via secured banking apps and physical branch documentation.'
    });
  }

  // Determine Risk Level
  let riskLevel: RiskLevel = 'LOW';
  if (score >= 65 || detectedFlags.length >= 2) {
    riskLevel = 'HIGH';
    score = Math.min(Math.max(score, 82), 97);
  } else if (score >= 35 || detectedFlags.length === 1) {
    riskLevel = 'MEDIUM';
    score = Math.min(Math.max(score, 52), 74);
  } else {
    riskLevel = 'LOW';
    score = Math.min(score, 24);
  }

  // Plain-Language Explanation
  let plainLanguageExplanation = '';
  if (riskLevel === 'HIGH') {
    plainLanguageExplanation = `This message exhibits high-threat scam indicators: it combines pressure tactics (${detectedFlags.map(f => f.title).join(', ')}) to trick you into surrendering money or personal security credentials.`;
  } else if (riskLevel === 'MEDIUM') {
    plainLanguageExplanation = `This message contains potential warning signs (${detectedFlags.map(f => f.title).join(', ')}) that deviate from standard communication practices. Proceed with caution.`;
  } else {
    plainLanguageExplanation = 'No standard high-risk scam indicators (such as coercive deadlines, OTP demands, or suspicious payment requests) were detected in this demonstration analysis.';
  }

  const safetyRecommendations = riskLevel === 'HIGH'
    ? [
        'Do not click any embedded links or dial phone numbers in the message.',
        'Never share OTPs, PINs, or passwords with anyone.',
        'Contact the institution exclusively via their verified official website or mobile app.',
        'Delete the message and block the sender on your device.'
      ]
    : riskLevel === 'MEDIUM'
    ? [
        'Verify the sender identity through independent channels before responding.',
        'Remember that receiving funds via UPI never requires entering a secret PIN.',
        'Do not forward this message or download any attached software.'
      ]
    : [
        'Always maintain baseline vigilance even with benign notifications.',
        'Confirm sender details if the message asks for follow-up actions.',
        'Never enter personal financial details on unencrypted platforms.'
      ];

  return {
    id: 'scan-' + Date.now(),
    timestamp: new Date().toISOString(),
    sourceType,
    messageText: trimmed,
    language,
    riskLevel,
    demonstrationScore: score,
    redFlags: detectedFlags,
    plainLanguageExplanation,
    safetyRecommendations,
    screenshotUrl
  };
}

/**
 * Extracts a neat snippet of text surrounding a keyword match
 */
function extractSurrounding(fullText: string, keywords: string[]): string {
  const lower = fullText.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      const start = Math.max(0, idx - 15);
      const end = Math.min(fullText.length, idx + kw.length + 25);
      let snippet = fullText.substring(start, end).trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < fullText.length) snippet = snippet + '...';
      return snippet;
    }
  }
  return fullText.slice(0, 40) + '...';
}
