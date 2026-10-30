<<<<<<< HEAD
# GhostSignal

**The Offline Scam Shield** is an offline-first scam protection project for AfterHours 1.0 by Team The Vanguard. This version provides local keyword checks and explains the warning signs it finds.

## Run locally

Prerequisite: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:3000`). No API key, backend, or external scam-detection service is required.

## Sign in

1. Enter a phone number and continue. No SMS is sent.
2. Enter the six-digit test code shown on screen: **123456**.
3. Sign-in state is stored in this browser's local storage. Use **Log out** in the sidebar to clear it.

## Included in this checkpoint

- Phone number and test-code sign-in, with login persistence.
- Dashboard, message scanner, animated analysis stages, explainable results, scan history, privacy information, and one-tap assistant shortcuts.
- Local keyword checks with three sample scenarios: bank impersonation, UPI payment pressure, and a normal appointment.
- PNG/JPG screenshot preview and drag-and-drop upload. OCR is not available; an image-only scan is labeled **Not assessed**. Paste the message text separately for keyword checks.
- Language selection for English and selected Indian languages. Language detection and translation are not implemented.
- Scan history and mock sign-in data stored in browser local storage. Clear history from the Scan History page.

## Important limitations

Risk scores and red flags come from local keyword checks, not AI predictions or proof that a message is safe. AI analysis, OCR, backend services, real SMS authentication, and PWA offline caching are not included. Offline operation and network isolation have not been independently verified. Privacy and offline-first descriptions express the product's design goals, not a security certification.
=======
# GhostSignal-The-Offline-Scam-Shield
Offline AI-Powered Scam Detection and Digital Safety Platform
>>>>>>> d9f18f9fd1712289caef10af0be6e001011f5ccd
