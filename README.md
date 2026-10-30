# GhostSignal — The Offline Scam Shield

GhostSignal helps people review suspicious messages, understand common warning signs, and find practical next steps. The application supports a local keyword-based check, multilingual navigation, voice-assisted input, scan history, and India-specific cybercrime support.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default: `http://localhost:3000`). No API key or backend is required.

## Sign in

1. Enter a phone number and continue.
2. Enter the local sign-in code shown on screen: **123456**.
3. Sign-in, language, theme, and voice preferences are stored in this browser. Sign out from the navigation menu.

No SMS is sent. The sign-in code is for local access only.

## Language and voice

The interface supports English, Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, and Punjabi. Your selection is saved and updates the interface without a refresh.

The voice assistant uses browser speech recognition for navigation commands and voice-message transcription, and browser speech synthesis for spoken advice. Availability and voice quality depend on the browser and device. Microphone permission is requested only when you start listening. Voice input is not sent to GhostSignal's message checker; do not speak private messages or financial credentials if your browser's speech service is not trusted.

## Message checks

Text is reviewed using local keyword rules for common signals such as urgency, suspicious links, OTP requests, UPI payment pressure, and impersonation. Results explain the rules that matched; they are not AI predictions, statistically validated probabilities, or proof that a message is safe.

PNG and JPG screenshots can be previewed, but image text recognition is not available. Screenshot-only results are marked **Not assessed**. Paste or dictate the message text to check it.

Scan history is stored in this browser's local storage and can be cleared from Scan History.

## Cybercrime support

For suspected financial cyber fraud in India, call **1930** and report through the [National Cyber Crime Reporting Portal](https://cybercrime.gov.in/). GhostSignal does not file complaints. No official SMS reporting contact is verified in the app; do not use 1930 as an SMS number. If money was lost, contact your bank or payment provider immediately. Never share your OTP, UPI PIN, or banking password.

## Privacy and offline limits

Message checks run in the browser and are not sent to a remote analysis service. The application has not undergone network-isolation verification and does not include offline asset caching. Initial loading and browser speech services may use network connections depending on the environment. These limits are shown in the app so offline design goals are not mistaken for a security certification.
