# GhostSignal — The Offline Scam Shield

GhostSignal helps people review suspicious messages, understand warning signs, and find practical next steps. The tagline is “Your messages. Your privacy. Your protection.” Message checks run in the browser using explainable keyword rules.

## Requirements and local development

Use Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Vite serves the app at `http://localhost:3000`. The development server binds to `0.0.0.0` so devices on the same trusted Wi-Fi network can access it at `http://<computer-LAN-IP>:3000`. Keep the firewall enabled, use a trusted private network, and do not forward this development port to the public internet.

Create an optimized production bundle with `npm run build` and serve the generated `dist/` directory with any static host. Configure HTTPS, compression (Brotli or gzip), and long-lived immutable caching for hashed assets at the host. `npm run preview` serves the built app locally for review.

## Install and offline use

The production build includes a web app manifest, scalable icons, and a service worker that precaches the app shell and built route assets. Serve the built app over HTTPS (or localhost), open it once while online, then use the browser's **Install app** or **Add to Home screen** action. The offline fallback page appears if the app shell was not cached yet. The service worker does not cache API responses or user screenshots.

Text rules, safety guidance, and browser-local scan history are designed to remain available after the app shell has been cached. This project has not yet been verified in airplane mode on physical Android devices. OCR and an ML model are not included, so screenshot text extraction and model-based detection are unavailable offline.

## Phone verification backend

The login screen requests a one-time verification code for the entered mobile number and verifies the code through a same-origin backend. This repository does not include an SMS delivery provider or backend, so no real text message is sent until those services are configured. Scanning remains available without signing in.

Implement these endpoints before enabling phone verification in a deployment:

- `POST /api/auth/otp/request` accepts `{ "phoneNumber": "+911234567890" }`, rate-limits requests, creates a short-lived single-use code, and sends it through a configured SMS provider. Return `{ "challengeId": "...", "expiresInSeconds": 300 }`; never return the code.
- `POST /api/auth/otp/verify` accepts `{ "challengeId": "...", "code": "..." }`, verifies the code safely, and returns `{ "user": { "id": "...", "displayName": "..." } }` while establishing a secure server session.
- `GET /api/auth/session` returns the current server-verified user or 401 when no valid session exists.
- `POST /api/auth/logout` invalidates the server session.

Keep SMS provider credentials on the backend. Store only a salted/hashed code verifier, expire and invalidate challenges after use, limit attempts and sends, and avoid logging phone numbers or codes. Use secure, HttpOnly, SameSite cookies and CSRF protection as appropriate. Never trust a client-only success result.

## What works today

- Text and voice-message scanning with local explainable rules, highlighted phrases, risk levels, and next steps.
- Screenshot selection and preview. OCR is not implemented; image-only results are marked not assessed.
- Local scan history, language selection (10 Indian languages), optional browser speech output/input, and theme preference stored in this browser.
- AI Guide, a small contextual explainer that reuses existing scan results and predefined safety guidance. It is not a generative AI model.
- Privacy information and India cybercrime support. For suspected financial cyber fraud call 1930 and report at [cybercrime.gov.in](https://cybercrime.gov.in/). GhostSignal does not file complaints.

## Offline and privacy limits

Message checks execute locally and are not sent to a remote analysis service. First installation and initial asset caching require the host. Browser speech services may use network connections depending on the browser/device. Language and theme preferences and scan history are stored in local storage on this device. Do not treat a low-risk result as proof that a message is safe.

## Checks and measurements

`npm run lint` runs TypeScript checking. `npm run build` creates the production bundle and prints emitted asset sizes. No Lighthouse, real mobile-device, or network-isolation measurements are claimed by this project; collect those against a deployed build before publishing performance claims.
