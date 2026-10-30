# GhostSignal — The Offline Scam Shield

GhostSignal helps people review suspicious messages, understand warning signs, and find practical next steps. **Your messages. Your privacy. Your protection.** Message checks run in the browser using explainable local keyword rules; no generative AI model is used for scanning.

## Features

- **Message scanning:** Paste text, dictate a message where browser speech recognition is supported, or upload a PNG/JPG screenshot. Uploaded images are previewed; OCR is not implemented, so image-only scans are marked not assessed.
- **Explainable results:** Shows HIGH, MEDIUM, LOW, or UNASSESSED risk, matched phrases and scam indicators, plain-language explanations, and safety recommendations. A low-risk result is not proof that a message is safe.
- **Unicode inspection panel:** Results include a collapsible “Inspect suspicious characters” section. It preserves the original text and can display Unicode findings and a separate normalized analysis representation when supplied by the analysis service. The frontend does not run its own Unicode detector. The local rules engine currently does not return Unicode findings, so the panel explains when inspection data is unavailable.
- **Local scan history:** Recent scans are kept in this browser and can be revisited from Scan History.
- **Contextual AI Guide:** Reuses the latest saved scan and predefined guidance to explain warning signs and next steps. It is a rules-based guide, not a connected generative AI service, and it does not run another scan.
- **OTP sign-in:** Phone verification UI requests and verifies a server-issued one-time code. The app does not simulate successful sign-in. Without the configured backend, scanning remains available without signing in.
- **Security Engine status:** Privacy & Security checks the backend for installed rules version, last successful update, verification status, and update availability. If the endpoint is missing or unavailable, the screen reports verification as unavailable (or offline using installed rules). The frontend does not verify or activate update packages.
- **Preferences and accessibility:** Persistent light/dark theme and language selection, optional browser speech input/output, responsive mobile navigation, keyboard focus indicators, and reduced-motion support.
- **Help:** Includes cybercrime reporting guidance for India. For suspected financial cyber fraud, call 1930 and report at [cybercrime.gov.in](https://cybercrime.gov.in/). GhostSignal does not file complaints.

The supported languages are English, Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, and Punjabi. Some explanatory UI copy remains English; translations are not complete across every screen.

## Requirements and local development

Use Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Vite serves the app at `http://localhost:3000` and binds to `0.0.0.0` for local-network testing. Only use a trusted private network; do not forward the development port to the public internet.

Create a production bundle with `npm run build`. Use `npm run preview` to review it locally. Deploy the generated `dist/` directory to a static host configured for HTTPS, compression, and long-lived immutable caching of hashed assets. The app uses lazy-loaded routes and the build reports emitted asset sizes; no benchmark score is claimed.

## Offline use and privacy

The production build includes a web app manifest, icons, and a service worker that precaches the app shell and route assets. Serve it over HTTPS (or localhost), open it once while online, then use the browser's **Install app** or **Add to Home screen** option. API responses and uploaded screenshots are not cached by the service worker.

After the app shell is cached, local text rules, safety guidance, and browser-local scan history are designed to remain available offline. Initial installation and asset caching require a network connection. Browser speech services may use network connections depending on the browser and device. This project has not been verified in airplane mode on physical Android devices.

Message content is not sent to a remote analysis service by the current local rules engine. Language/theme preferences and scan history are stored in this browser's local storage. Avoid storing sensitive messages on shared devices.

## Backend integration contracts

This repository includes an optional FastAPI backend, but it does not include an SMS provider, hosted message-analysis service, or remote trusted-rules feed. The local backend capabilities and setup are documented below. Configure external services before describing them as active.

### OTP authentication

- `POST /api/auth/otp/request` accepts `{ "phoneNumber": "+911234567890" }`, rate-limits requests, creates a short-lived single-use code, and sends it through the configured SMS provider. Return `{ "challengeId": "…", "expiresInSeconds": 300 }`; never return the code.
- `POST /api/auth/otp/verify` accepts `{ "challengeId": "…", "code": "…" }`, verifies the code, and returns `{ "user": { "id": "…", "displayName": "…" } }` while establishing a secure server session.
- `GET /api/auth/session` returns the current server-verified user or 401 when no valid session exists.
- `POST /api/auth/logout` invalidates the server session.

Keep SMS provider credentials on the backend. Store only a salted/hashed code verifier, expire and invalidate challenges after use, limit attempts and sends, and avoid logging phone numbers or codes. Use secure, HttpOnly, SameSite cookies and CSRF protection as appropriate. Never trust a client-only success result.

### Unicode findings

The results UI can display optional `unicodeSecurity` data attached to a scan result. The service should preserve the original input and return findings with explanations; `normalizedForAnalysis` is a separate comparison string, not a replacement for the displayed message. For example:

```json
{
  "unicodeSecurity": {
    "findings": [
      {
        "kind": "invisible",
        "text": "‌",
        "explanation": "An invisible format character appears within the displayed address.",
        "codePoints": ["U+200C"]
      }
    ],
    "normalizedForAnalysis": "example"
  }
}
```

Supported `kind` values: `invisible`, `mixed-script`, `homoglyph`, `separator`, `obfuscated-keyword`, and `suspicious-url`. Return no finding when the backend has no evidence; do not flag legitimate Indic script characters merely because they are non-Latin. The current local scanner does not produce this data.

### Security Engine status

`GET /api/security/status` should return the server's actual verification state, for example:

```json
{
  "rulesVersion": "2026.10.1",
  "lastSuccessfulUpdate": "2026-10-31T08:30:00Z",
  "verificationStatus": "Verified",
  "updateAvailable": false
}
```

The UI displays these fields as reported. The backend must validate signatures and package integrity before any update is trusted or activated. Do not treat a missing endpoint, network error, or client response as proof of verification.

## Checks

```sh
npm run lint  # TypeScript check
npm run build # Production bundle
```

No Lighthouse, real-device, slow-network, or airplane-mode performance measurements are claimed. Measure those against a deployed build before publishing performance claims.

## FastAPI backend (optional companion service)

The backend is a separate Python service in `backend/`. It supplements the website with server APIs for future clients and explicitly opted-in online use; **the current website scanner continues to use its local TypeScript rules and does not send message text to this server**. The React Privacy & Security page uses the backend's `/api/security/status` endpoint when the service is running. Vite proxies `/api` to `http://127.0.0.1:8000` in development.

### Start the services on Windows

In PowerShell, from the repository root:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, run the existing frontend command:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000` for the website and `http://127.0.0.1:8000/docs` for Swagger UI. Python 3.10 or newer is required. If PowerShell blocks venv activation, use `\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` and `\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000` without activating it.

### API endpoints

The backend exposes the paths below both at their documented root paths and under `/api` for same-origin frontend proxy use:

| Method | Path | Purpose |
|---|---|---|
| GET | `/` or `/health` | Basic service/database health |
| GET | `/system/status` | Database, OCR, local model, and update status |
| POST | `/scan/text` | Scan text and return risk, threats, reasons, Unicode findings, and advice |
| POST | `/scan/image` | Validate a PNG/JPEG and scan OCR output when local OCR dependencies are installed |
| POST | `/scan/url` | Inspect URL structure without opening it |
| GET/DELETE | `/history` | Read or clear metadata-only scan history |
| GET | `/updates/check` | Report update-feed availability (no feed is configured by default) |
| GET | `/updates/version` | Installed rule version and verification state |
| POST | `/updates/install` | Validate and install a signed Ed25519 rule package |
| GET | `/security/status` | Same status consumed by the Privacy & Security page |

Example text request: `POST /scan/text` with JSON `{ "text": "Send your OTP now", "language": "English" }`. The response includes `risk_level`, `risk_score`, `threats`, `reasons`, `recommendations`, `unicode_findings`, `normalized_for_analysis`, and the active `rule_version`. The server stores only scan metadata by default, not the message body.

The OTP endpoint paths used by the existing login UI are present but fail closed with HTTP 503 until an SMS provider and secure session implementation are configured. Login is not simulated. OCR dependencies are optional and can be installed with `python -m pip install pillow easyocr`; EasyOCR downloads model weights on first use, so it is not part of the lightweight base install. No ONNX model is included; `/system/status` reports rule-only operation.

### Signed rule updates

Set `GHOSTSIGNAL_UPDATE_PUBLIC_KEY` to the base64-encoded 32-byte Ed25519 public key and configure `GHOSTSIGNAL_DATA_DIR` to a protected writable directory. Generate a key pair offline and keep the private key outside the repository and deployment host:

```powershell
python -c "from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey; from cryptography.hazmat.primitives import serialization; import base64; k=Ed25519PrivateKey.generate(); print('PRIVATE (protect offline):',base64.b64encode(k.private_bytes(serialization.Encoding.Raw,serialization.PrivateFormat.Raw,serialization.NoEncryption())).decode()); print('PUBLIC:',base64.b64encode(k.public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw)).decode())"
```

Sign canonical UTF-8 JSON (`sort_keys=True`, separators `(',', ':')`, excluding the `signature` property) containing `version`, future ISO-8601 `expires_at`, and `rules` with a `rules` array. The server verifies Ed25519 signature and expiry, validates monotonically increasing numeric versions, stores the signed envelope, keeps a last-known-good backup, writes atomically, and never executes package content. There is no remote update feed configured by default. Only after verifying the stored signed envelope does status report **Verified**; a missing key or invalid/expired envelope reports verification unavailable.

### Tests and mobile/offline boundaries

Run backend tests from the repository root with `python -m pytest backend/tests`. They cover normalization, multilingual-script handling, detector scoring, URL inspection, signature checks, and API behavior. The FastAPI service is not an offline engine: PWA offline text scanning remains on-device in the existing frontend. An Android client would need a native/offline-compatible implementation or shared portable rules and its own local signature verification. Backend OCR, ONNX inference, SMS, and update-feed delivery each require separate configuration; no unavailable service is presented as active.
