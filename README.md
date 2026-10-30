# GhostSignal – The Offline Scam Shield

> **"Your messages. Your privacy. Your protection."**  
> An independent on-device cybersecurity assistant built to protect users from deceptive messages, phishing attacks, and payment manipulation without sending personal data to the internet.

---

## 🛡️ Product Overview

**GhostSignal** is an on-device digital safety companion that helps people examine suspicious text messages, WhatsApp chats, and screenshots. It explains in simple, plain language **why** a message looks suspicious, rather than merely giving a cryptic verdict.

Most online scam filters transmit your private SMS conversations, bank alerts, and authentication codes to remote servers. GhostSignal is built from first principles as an air-gapped, on-device shield: **your messages never leave your phone.**

### Core Foundational Principles

1. **Private by Design**: Zero message uploads. Messages, screenshots, and spoken words are inspected locally in device memory with no cloud logging or tracking.
2. **Plain-Language Explanations**: Accessible to all users regardless of literacy, age, or technical background. Explains threats in simple everyday words instead of technical jargon.
3. **100% Reliable Without Internet**: Works seamlessly in airplane mode, remote areas with low connectivity, or during mobile network outages.

---

## 🌐 Language & Literacy Accessibility

GhostSignal is built for universal access:

- **10 Indian Languages Supported**:
  - English
  - Hindi (हिन्दी)
  - Bengali (বাংলা)
  - Marathi (मराठी)
  - Tamil (தமிழ்)
  - Telugu (తెలుగు)
  - Kannada (ಕನ್ನಡ)
  - Malayalam (മലയാളം)
  - Gujarati (ગુજરાતી)
  - Punjabi (ਪੰਜਾਬੀ)
- **Voice-Based Interaction**: Speak or dictate suspicious messages using your device's microphone.
- **Read-Aloud Feature (Text-to-Speech)**: Listen to full safety assessments, warning signs, and actionable advice with the tap of a speaker button.
- **Simplified Explanations**: Avoids confusing jargon (e.g. *"The sender is pressuring you to act quickly"* instead of *"Urgency-based social engineering"*).

---

## 🚀 Quick Start & Installation

To run GhostSignal locally:

```bash
# 1. Clone repository
git clone <repository_url>
cd ghostsignal

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application is available on `http://localhost:3000`.

---

## 📱 User Authentication

GhostSignal uses a privacy-focused authentication interface requiring **only**:
1. Mobile Phone Number (Country code defaults to India `+91`)
2. 6-Digit Verification Code

> **Testing Verification Code:**
> ### `123456`
> *A convenient "Auto-fill Code" button is available on the screen for instant testing.*

---

## 🔍 How to Use the Scanner

GhostSignal provides three equally accessible input methods:

1. **Paste Text**: Paste raw SMS, WhatsApp, or Telegram messages.
2. **Upload Screenshot**: Select an image file (PNG, JPG, JPEG) or take a photo with your camera.
3. **Speak Message**: Tap the microphone button and read the message aloud in your preferred language.

### Core Threat Patterns Detected

- **Urgency & Coercion**: Artificial deadlines pressuring you to act before thinking.
- **Fake Links**: Unverified web addresses masquerading as official bank portals.
- **OTP Stealing**: Requests asking you to read back or share secret one-time passcodes.
- **UPI PIN Traps**: Claims that you must enter a PIN to receive prize money or refunds.
- **Bank Impersonation**: Impersonating official institutions with threats of account deactivation.

---

## 🛠️ Technology Stack

- **Framework**: React 19 (TypeScript)
- **Styling**: Tailwind CSS v4 (Cybersecurity Dark Navy `#0B111E` & Electric Cyan `#06B6D4`)
- **Speech Technologies**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Persistence**: HTML5 Local Storage

---

*GhostSignal – The Offline Scam Shield. Your messages. Your privacy. Your protection.*
