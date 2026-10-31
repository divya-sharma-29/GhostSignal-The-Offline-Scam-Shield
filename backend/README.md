# GhostSignal — The Offline Scam Shield (Python & FastAPI Backend)

> **"Your messages. Your privacy. Your protection."**

GhostSignal is a privacy-first scam detection system engineered to protect users from disguised scam messages, deceptive URLs, fraudulent screenshots, and malicious updates without transmitting sensitive private data to third-party cloud AI APIs.

This backend provides a unified, modular, and beginner-friendly **FastAPI** service that pairs with the React + TypeScript frontend and serves as the architectural reference for a native Android application.

---

## 1. Core Architecture & Design Principles

```
User Message / Screenshot / URL
           │
           ▼
┌──────────────────────────┐
│   Text Normalizer        │ ──► Unveils zero-width chars, Cyrillic/homoglyphs,
│   (Unicode Shield)       │     dotted spellings (K.Y.C), leetspeak (0TP, P@YTM)
└──────────┬───────────────┘     Preserves Indic script ligatures (Hindi/Marathi)
           │
           ▼
┌──────────────────────────┐     ┌────────────────────────────┐
│   Passive URL Analyzer   │ ──► │ Heuristic domain scoring   │
│   (Zero Network Ping)    │     │ Shorteners, IP, punycode   │
└──────────┬───────────────┘     └────────────────────────────┘
           │
           ▼
┌──────────────────────────┐     ┌────────────────────────────┐
│   Local AI Engine        │ ──► │ ONNX Runtime (CPU)         │
│   (Local Inference)      │     │ models/scam_classifier.onnx│
└──────────┬───────────────┘     └────────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│   Detector &             │ ──► Rules + Compound Threat Boosters
│   Risk Analyzer          │     Score 0–100, LOW/MEDIUM/HIGH,
└──────────┬───────────────┘     Helpline 1930 recommendation
           │
           ▼
┌──────────────────────────┐
│   Sanitized History      │ ──► SQLite DB: stores ONLY 40-char masked snippet,
│   (Privacy Guaranteed)   │     never raw private messages or full screenshots
└──────────────────────────┘
```

### Key Engineering Principles
- **True Offline-First Capability**: Local ONNX CPU model, compiled regex rules, and passive static heuristics execute without internet connectivity.
- **Privacy by Design**: Messages are analyzed in-memory. SQLite history records store only a 40-character masked snippet (e.g. `"Dear customer, your accoun..."`) and detected risk metadata.
- **Defensive Cryptography**: Security rule packages are digitally signed using Ed25519 public-key cryptography. Tampered packages and version rollbacks are rejected at the gate.
- **Dual Client Support**: Directly consumed by the Vite React web frontend (`src/services/api.ts`) via REST and structured for future Android Kotlin/Jetpack integration.

---

## 2. Directory Structure

```
backend/
├── main.py                     # FastAPI unified entry point & CORS configuration
├── config.py                   # Pydantic BaseSettings environment configuration
├── database.py                 # SQLite connection & session generator
├── models.py                   # SQLAlchemy ORM models (History, Updates, OTP)
├── schemas.py                  # Pydantic schemas for request/response validation
├── requirements.txt            # Python dependencies
├── ghostsignal.db              # SQLite local database (auto-generated)
├── README.md                   # This documentation
│
├── services/                   # Modular business logic services
│   ├── text_normalizer.py      # Unicode normalization, homoglyphs, leetspeak
│   ├── detector.py             # Main scanning orchestrator
│   ├── risk_analyzer.py        # Multi-factor scoring engine (0-100)
│   ├── ai_engine.py            # Local ONNX CPU inference & fallback
│   ├── url_analyzer.py         # Static passive URL heuristic inspection
│   ├── ocr_engine.py           # Screenshot validation & local OCR (EasyOCR/Tesseract)
│   ├── signature_verifier.py   # Ed25519 digital signature validation
│   ├── update_manager.py       # Atomic rule updates & rollback prevention
│   ├── history_manager.py      # Privacy-preserving SQLite audit trail
│   └── otp_service.py          # CSPRNG 6-digit OTP generator & SHA-256 verifier
│
├── routes/                     # FastAPI API endpoints
│   ├── scan_routes.py          # /scan/text
│   ├── url_routes.py           # /url/analyze
│   ├── ocr_routes.py           # /ocr/image
│   ├── history_routes.py       # /history
│   ├── update_routes.py        # /updates/status, /updates/apply, /updates/check
│   ├── auth_routes.py          # /auth/otp/generate, /auth/otp/verify
│   └── health_routes.py        # /, /health, /system/status
│
├── rules/                      # Local threat detection rules & cryptographic keys
│   ├── default_rules.json      # Active scam patterns, keywords, and thresholds
│   ├── ed25519_public.pem      # Ed25519 public verification key
│   ├── ed25519_private.pem     # Private signing key (keep protected)
│   └── updates/                # Signed update packages (e.g. signed_update_2.4.1.json)
│
├── models/                     # Machine learning models
│   └── scam_classifier.onnx    # Lightweight ONNX scam classification model
│
├── tools/                      # Maintenance & utility scripts
│   ├── sign_rules.py           # Keypair generator & update packaging tool
│   └── generate_onnx_model.py  # Script to export/generate ONNX CPU models
│
└── tests/                      # Automated test suite (28 passing tests)
    ├── test_normalizer.py      # Unicode, homoglyphs, Indic scripts
    ├── test_detector.py        # KYC, OTP, UPI reverse-payment detection
    ├── test_url_analyzer.py    # IP URLs, shorteners, punycode, typosquatting
    ├── test_updates.py         # Ed25519 verification, rollback prevention
    └── test_api.py             # Route & endpoint integration tests
```

---

## 3. Installation & Setup

### Prerequisites
- Python 3.10, 3.11, or 3.12 installed on your system.
- Node.js 18+ (if running the frontend alongside).

### Step 1: Install Dependencies
Open your terminal in the project root:
```bash
cd backend
pip install -r requirements.txt
```

*(Optional OCR dependencies)*: For local screenshot OCR:
```bash
pip install easyocr
# or
pip install pytesseract
```
*Note: If neither OCR library is installed, the backend continues running safely, reporting that OCR dependencies are optional while validating uploaded images.*

### Step 2: Initialize Database and Keys
The database (`ghostsignal.db`) and cryptographic keys (`rules/ed25519_public.pem`) are automatically initialized on startup.

---

## 4. Running the Backend Server

To start the FastAPI development server:

```bash
# Option A: From project root
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Option B: From within the backend directory
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Once running, access:
- **API Root**: `http://localhost:8000/`
- **Health Check**: `http://localhost:8000/health`
- **Subsystem Status**: `http://localhost:8000/system/status`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **Alternative ReDoc**: `http://localhost:8000/redoc`

---

## 5. Running the Automated Test Suite

To run the complete verification suite of 28 tests:

```bash
# From project root
python -m pytest backend/tests -v
```

All 28 tests verify:
- Unicode homoglyph detection and Indic ligature preservation.
- Urgent fake KYC and OTP theft compound threat boosts.
- UPI reverse-payment phishing patterns.
- Punycode and high-risk URL domain heuristic detection.
- Ed25519 signature validation and rejection of tampered packages.
- Semver version rollback prevention.
- Database CRUD and OTP generation/verification cycles.

---

## 6. Interactive Testing via Swagger UI (`http://localhost:8000/docs`)

You can test every endpoint directly inside your browser using FastAPI's built-in Swagger UI:

### 1. Test Text Scam Detection (`POST /scan/text`)
- Click on `POST /scan/text` $\rightarrow$ **Try it out**.
- Paste a sample disguised scam message:
  ```json
  {
    "text": "URGENT: Your SBI account is blocked! Complete your K.Y.C immediately at http://192.168.1.1/update or share 0TP to unlock."
  }
  ```
- Click **Execute**.
- **Expected Result**:
  - `risk_level`: `"HIGH"`
  - `risk_score`: $\ge 85$
  - `threats_detected`: Urgency, Fake KYC, OTP Theft, Raw IP Address URL.
  - `unicode_report`: Detects dotted `"K.Y.C"` and leetspeak `"0TP"`.
  - `recommended_action`: "Block the sender immediately and do NOT click any links. Call National Cyber Crime Helpline at 1930."

### 2. Test Screenshot OCR (`POST /ocr/image`)
- Click on `POST /ocr/image` $\rightarrow$ **Try it out**.
- Choose a `.png` or `.jpeg` screenshot of a bank alert or payment SMS.
- Click **Execute**.
- **Expected Result**: Image integrity is validated via PIL, text is extracted locally using EasyOCR/pytesseract, and then routed through the scam detection pipeline.

### 3. Test URL Analysis (`POST /url/analyze`)
- Click on `POST /url/analyze` $\rightarrow$ **Try it out**.
- Test a deceptive shortener or typosquatted link:
  ```json
  {
    "url": "http://xn--paytm-o11a.top/login"
  }
  ```
- Click **Execute**.
- **Expected Result**: Flags punycode domain (`xn--...`), untrusted `.top` TLD, and identifies typosquatting targeting `paytm`.

### 4. Test OTP Authentication (`POST /auth/otp/generate` & `/verify`)
- **Generate OTP**: Send `POST /auth/otp/generate` with `{"phone_number": "+919876543210"}`.
  - Generates a cryptographically secure 6-digit code. In development mode, `dev_code` is returned in the response for seamless testing.
- **Verify OTP**: Send `POST /auth/otp/verify` with `{"phone_number": "+919876543210", "otp_code": "<code_received>"}`.
  - Verifies the salted SHA-256 hash. Enforces 5-minute expiry and maximum 3 attempts.

### 5. Test Signed Security Updates (`POST /updates/apply`)
- Test applying a valid signed update package:
  ```json
  {
    "version": "2.4.1",
    "release_date": "2026-10-31T01:50:00Z",
    "signature": "<Ed25519_base64_signature>",
    "rules": { ... }
  }
  ```
- If the signature or rules are tampered with by even a single character, the endpoint immediately returns HTTP 400 (`"Cryptographic signature verification failed"`).

---

## 7. Generating Keys and Signing Updates (`tools/sign_rules.py`)

GhostSignal uses **Ed25519** digital signatures to guarantee that offline security rules cannot be hijacked or poisoned by malicious actors.

### How to Generate New Keys and Sign a Rule Package:

```bash
# Run the packaging utility
python backend/tools/sign_rules.py --version 2.5.0 --output backend/rules/updates/signed_update_2.5.0.json
```

What this tool does:
1. Loads the Ed25519 private key from `backend/rules/ed25519_private.pem` (or generates a fresh public/private keypair if none exists).
2. Reads the active rules from `backend/rules/default_rules.json`.
3. Canonicalizes the JSON structure using RFC 8785 sorting to guarantee byte-for-byte deterministic hashing.
4. Computes the Ed25519 signature and packages it into an update payload.
5. Verifies the newly generated signature against `backend/rules/ed25519_public.pem` before saving.

---

## 8. Real vs. Simulated Features (Integrity Transparency)

GhostSignal adheres strictly to engineering honesty:

| Feature | Implementation Status | Technical Mechanism |
| :--- | :---: | :--- |
| **Unicode Shield & Homoglyph Detection** | **REAL** | Python `unicodedata` inspection, Cyrillic-to-Latin mapping, zero-width codepoints (`\u200B-\u200D`, `\uFEFF`), dotted keyword recovery. |
| **Indic Script Ligature Protection** | **REAL** | Preserves Hindi/Marathi/Bengali Devanagari ZWJ/ZWNJ characters (`\u0900-\u0D7F`) without raising false spoofing flags. |
| **Scam Pattern & Risk Scoring Engine** | **REAL** | Calibrated multi-factor risk calculator with compound threat boosts (e.g. OTP theft + urgency $\ge 75$). |
| **Local AI Classification Engine** | **REAL** | Lightweight ONNX model (`backend/models/scam_classifier.onnx`) loaded and evaluated locally on CPU via `onnxruntime`. Zero cloud API calls. |
| **Ed25519 Security Updates** | **REAL** | Cryptographic signature verification using `cryptography.hazmat.primitives.asymmetric.ed25519`. |
| **Rollback Prevention** | **REAL** | Semantic version comparison (`packaging.version.parse`) rejecting equal or older version injections. |
| **Privacy-Preserving Audit Trail** | **REAL** | SQLite database via SQLAlchemy. Stores only 40-character masked snippets, threat types, and scores. Raw messages are never retained. |
| **CSPRNG OTP Authentication** | **REAL** | Python `secrets.randbelow` generating 6-digit codes stored as salted SHA-256 hashes with 5-minute TTL and 3-attempt lockouts. |
| **Image & Screenshot OCR** | **REAL** | PIL byte and header validation with local EasyOCR/pytesseract execution. Graceful fallback if OCR binaries are uninstalled. |

---

## 9. Frontend Integration

The React + TypeScript frontend communicates directly with this FastAPI backend via `src/services/api.ts`:

- When the backend is online at `http://localhost:8000`, the frontend automatically sends scan requests, URL checks, update queries, and OTP logins to FastAPI.
- **Fail-Safe Offline Mode**: If the user loses internet or the backend server is stopped, `src/services/api.ts` automatically falls back to client-side in-browser scanning (`src/utils/riskEngine.ts`). The user experience is never interrupted.

---

## 10. Future Android Integration Blueprint

This backend architecture is directly translatable to a native Android application:

```
┌────────────────────────────────────────────────────────┐
│               Android Application (Kotlin)             │
├────────────────────────────────────────────────────────┤
│ UI Layer: Jetpack Compose (GhostSignal Theme)          │
├────────────────────────────────────────────────────────┤
│ Local Database: Room DB (Sanitized History & Updates)   │
├────────────────────────────────────────────────────────┤
│ Text Normalizer: Ported Kotlin Unicode Scanner         │
├────────────────────────────────────────────────────────┤
│ Local AI: ONNX Runtime Mobile (`onnxruntime-android`) │
│           CPU execution of `scam_classifier.onnx`      │
├────────────────────────────────────────────────────────┤
│ Security Updates: Tink / BouncyCastle Ed25519 Verifier │
└────────────────────────────────────────────────────────┘
```

1. **Local ML on Android**: The existing `scam_classifier.onnx` file drops directly into Android's `assets/` folder and runs via `com.microsoft.onnxruntime:onnxruntime-android:1.17.0`.
2. **Offline Rule Storage**: The Android app can store `default_rules.json` in internal storage and apply signed updates using Android's native Keystore / Ed25519 cryptography.
3. **HTTP Client Synchronization**: Using Retrofit or Ktor, the Android app can optionally communicate with this FastAPI backend when network connectivity is available, or operate 100% autonomously in offline mode.

