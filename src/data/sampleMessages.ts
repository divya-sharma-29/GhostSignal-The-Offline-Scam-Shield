import { SampleMessage } from '../types';

export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: 'sample-unicode-homoglyph',
    name: 'Sample 1: Unicode Homoglyph Attack (Mixed Cyrillic)',
    category: 'Unicode Spoofing',
    riskLevel: 'HIGH',
    language: 'English',
    text: 'Urgent Alert: Your sbi․com netbanking is blocked. Update kyc on рауtm app immediately to keep account active or OTP will expire.',
    description: 'Employs Cyrillic homoglyphs in "рауtm" and one-dot leader separator in "sbi․com" to evade keyword and domain filters.'
  },
  {
    id: 'sample-bank-impersonation',
    name: 'Sample 2: Bank Impersonation & OTP Harvest',
    category: 'Bank Fraud',
    riskLevel: 'HIGH',
    language: 'English',
    text: 'Dear Customer, your bank account will be blocked within 2 hours. Verify your account immediately using the link below and share your OTP to avoid suspension.',
    description: 'Classic phishing attempt inducing panic with artificial deadlines to extract one-time passwords.'
  },
  {
    id: 'sample-upi-manipulation',
    name: 'Sample 3: UPI Reverse Collect Trick',
    category: 'UPI Scam',
    riskLevel: 'MEDIUM',
    language: 'English',
    text: 'You have received ₹5,000 cash prize! Enter your secret UPI PIN to claim and credit the payment to your account.',
    description: 'Reverse payment trick designed to siphon funds by confusing receiving money with authorizing an outgoing payment.'
  },
  {
    id: 'sample-indic-hindi-clean',
    name: 'Sample 4: Legitimate Indic Text (Hindi Conjuncts)',
    category: 'Legitimate SMS',
    riskLevel: 'LOW',
    language: 'Hindi (हिन्दी)',
    text: 'नमस्ते। आपकी डॉक्टर नियुक्ति कल सुबह 10:00 बजे निश्चित है। सम्पर्क करने के लिए धन्यवाद।',
    description: 'Authentic Hindi transactional text featuring standard Devanagari conjuncts and halant ligatures, verifying Indic script preservation.'
  },
  {
    id: 'sample-hindi-electricity',
    name: 'Sample 5: Electricity Bill Disconnection (Hindi)',
    category: 'Utility Scam',
    riskLevel: 'HIGH',
    language: 'Hindi (हिन्दी)',
    text: 'प्रिय ग्राहक, आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा क्योंकि आपका बिल बकाया है। तुरंत इस लिंक पर क्लिक करें और अपडेट करें।',
    description: 'Hindi utility fraud exploiting fear of power cut to compel victims to click malicious links.'
  },
  {
    id: 'sample-normal-appointment',
    name: 'Sample 6: Normal Appointment (Clean)',
    category: 'Legitimate SMS',
    riskLevel: 'LOW',
    language: 'English',
    text: 'Your appointment is confirmed for tomorrow at 10:00 AM. Thank you for booking with us.',
    description: 'Standard transactional confirmation without urgency, OTP demands, or suspicious URLs.'
  }
];
