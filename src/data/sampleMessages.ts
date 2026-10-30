import { SampleMessage } from '../types';

export const SAMPLE_MESSAGES: SampleMessage[] = [
  {
    id: 'sample-bank-impersonation',
    name: 'Sample 1: Bank Impersonation',
    category: 'Bank Fraud',
    riskLevel: 'HIGH',
    language: 'English',
    text: 'Dear Customer, your bank account will be blocked within 2 hours. Verify your account immediately using the link below and share your OTP to avoid suspension.',
    description: 'Classic high-threat phishing attempt inducing panic with artificial time limits to extract one-time passwords.'
  },
  {
    id: 'sample-upi-manipulation',
    name: 'Sample 2: UPI Payment Manipulation',
    category: 'UPI Scam',
    riskLevel: 'MEDIUM',
    language: 'English',
    text: 'You have received ₹5,000. Enter your UPI PIN to claim the payment.',
    description: 'Reverse payment trick designed to siphon funds by confusing receiving money with authorizing an outgoing transfer.'
  },
  {
    id: 'sample-normal-message',
    name: 'Sample 3: Normal Appointment',
    category: 'Legitimate SMS',
    riskLevel: 'LOW',
    language: 'English',
    text: 'Your appointment is confirmed for tomorrow at 10 AM. Thank you.',
    description: 'Standard transactional notification without coercive demands, urgent deadlines, or credential extraction.'
  },
  {
    id: 'sample-hindi-electricity',
    name: 'Sample 4: Electricity Bill Suspension (Hindi)',
    category: 'Utility Scam',
    riskLevel: 'HIGH',
    language: 'Hindi (हिन्दी)',
    text: 'प्रिय ग्राहक, आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा क्योंकि आपका बिल बकाया है। तुरंत इस लिंक पर क्लिक करें और अपडेट करें।',
    description: 'Hindi utility fraud exploiting fear of power cut to compel victims to click malicious payment links.'
  },
  {
    id: 'sample-tamil-lottery',
    name: 'Sample 5: Lottery Prize Trick (Tamil)',
    category: 'Lottery Scam',
    riskLevel: 'HIGH',
    language: 'Tamil (தமிழ்)',
    text: 'வாழ்த்துக்கள்! நீங்கள் ₹25,00,000 ரொக்கப் பரிசை வென்றுள்ளீர்கள். பரிசைப் பெற உடனே உங்கள் வங்கிக் கணக்கு மற்றும் OTP ஐப் பகிரவும்.',
    description: 'Tamil prize lure attempting credential harvesting by dangling an unearned cash jackpot.'
  }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' }
];
