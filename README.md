# GhostSignal — The Offline Scam Shield

GhostSignal is a local-first, zero-cloud cybersecurity scam shield engineered to analyze suspicious text, screenshots, and voice recordings entirely on-device without exposing sensitive personal or financial credentials to remote cloud APIs.

---

## ⚡ Core Runtime Engine Architecture

### 1. 📷 Live On-Device OCR (Windows Native WinRT)
- **Engine**: Direct `Windows.Media.Ocr.OcrEngine` WinRT API integration (`winocr` / fallback `easyocr`).
- **Execution**: Runs in backend runtime on screenshot image uploads (`PNG`, `JPG`, `WebP`).
- **Privacy**: Screenshot images are processed 100% locally in memory without remote API exposure.
- **Workflow**: Extracts text automatically and forwards it directly through the calibrated scam detector pipeline.

### 2. 🎙️ Offline Whisper Voice Speech-to-Text (CPU int8)
- **Engine**: `faster-whisper` (CTranslate2 int8 quantization on CPU) with `openai-whisper` fallback.
- **Microphone Dictation**: Live browser `MediaRecorder` captures real microphone audio chunks and streams the audio blob to backend `POST /voice/transcribe`.
- **Audio Files**: Supports uploading audio recordings (`.wav`, `.mp3`, `.ogg`, `.webm`, `.m4a`, `.flac`).
- **Privacy**: Speech is transcribed strictly on local CPU; zero voice audio leaves the local device.

### 3. 🔐 CSPRNG OTP Generator & Mobile SMS Delivery
- **Generation**: Cryptographically Secure Pseudo-Random Number Generation (`secrets.randbelow`).
- **Storage**: Salted SHA-256 hash stored in SQLite database with 5-minute expiration and 3-attempt brute force limits.
- **Mobile SMS Delivery**: Dispatches 6-digit OTP codes directly to the user's mobile phone via SMS gateways (Twilio / Fast2SMS).
- **Security**: Raw OTP codes are never logged or exposed client-side; verification is performed exclusively against the backend database hash.

### 4. 🧠 SmolLM3-3B Local AI Threat Intelligence
- **AI Model**: Quantized SmolLM3-3B local AI reasoner fine-tuned on cybersecurity scam patterns.
- **Unicode Shield**: Normalizes Cyrillic/Greek homoglyphs, invisible zero-width characters, and dotted URL evasions while preserving Indic text.
- **Risk Assessment**: Produces live calibrated threat scores (0–100), severity levels (LOW, MEDIUM, HIGH, CRITICAL), red flag categorization, and plain-language safety recommendations.

---

## 🚀 Running Locally

### Prerequisites
- **Node.js**: v20.19+ or v22.12+
- **Python**: 3.10+ (Python 3.12 recommended)

### 1. Start the Backend Server (FastAPI)
```bash
# Install Python backend dependencies
pip install -r backend/requirements.txt

# Launch FastAPI backend on port 8000
python backend/main.py
```

### 2. Start the Frontend Application (Vite + React)
```bash
# Install NPM packages
npm install

# Launch frontend dev server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🇮🇳 Cybercrime Support & Helpline
For suspected financial cyber fraud in India:
- **Helpline**: Call **1930** immediately.
- **Portal**: Report incidents via the [National Cyber Crime Reporting Portal (cybercrime.gov.in)](https://cybercrime.gov.in/).
- **Guidance**: Contact your bank immediately to freeze compromised accounts or cards. Never share your OTP, UPI PIN, or net-banking password.
