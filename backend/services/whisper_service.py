import io
import os
import tempfile
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger("ghostsignal.whisper")

class WhisperVoiceService:
    """
    GhostSignal On-Device Voice Transcription Service.
    Powered by Whisper (faster-whisper CTranslate2 & OpenAI Whisper fallback).
    
    100% Offline and Private:
    - Audio recordings are transcribed locally on-device on CPU.
    - Zero audio data leaves the local machine.
    """

    def __init__(self, model_size: str = "tiny"):
        self.model_size = getattr(settings, "WHISPER_MODEL_SIZE", model_size)
        self._faster_model = None
        self._whisper_model = None

    def _get_faster_whisper(self):
        """Lazy load faster-whisper model on CPU."""
        if self._faster_model is None:
            try:
                from faster_whisper import WhisperModel
                local_dir = settings.MODELS_DIR / "whisper-tiny"
                if local_dir.exists() and (local_dir / "model.bin").exists():
                    target = str(local_dir)
                    logger.info(f"[Whisper] Loading local offline faster-whisper model from {target}...")
                    self._faster_model = WhisperModel(target, device="cpu", compute_type="int8", local_files_only=True)
                else:
                    logger.info(f"[Whisper] Loading faster-whisper model ({self.model_size}) on CPU...")
                    self._faster_model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
                logger.info("[Whisper] faster-whisper model loaded successfully.")
            except Exception as e:
                logger.warning(f"[Whisper] faster-whisper load failed: {e}")
                self._faster_model = None
        return self._faster_model

    def _get_openai_whisper(self):
        """Fallback to openai-whisper."""
        if self._whisper_model is None:
            try:
                import whisper
                logger.info(f"[Whisper] Loading openai-whisper ({self.model_size}) on CPU...")
                self._whisper_model = whisper.load_model(self.model_size, device="cpu")
                logger.info("[Whisper] openai-whisper loaded successfully.")
            except Exception as e:
                logger.warning(f"[Whisper] openai-whisper load failed: {e}")
                self._whisper_model = None
        return self._whisper_model

    def transcribe_audio_file(self, file_path: str, language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribes local audio file to text using on-device Whisper.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        # 1. Try faster-whisper
        faster_model = self._get_faster_whisper()
        if faster_model:
            try:
                lang_code = language.lower()[:2] if language and len(language) >= 2 else None
                segments, info = faster_model.transcribe(
                    file_path,
                    beam_size=5,
                    language=lang_code,
                    vad_filter=True
                )
                transcribed_text = " ".join([seg.text.strip() for seg in segments]).strip()
                return {
                    "text": transcribed_text,
                    "language": info.language if info else (lang_code or "en"),
                    "languageProbability": getattr(info, "language_probability", 1.0) if info else 1.0,
                    "duration": getattr(info, "duration", 0.0) if info else 0.0,
                    "engine": "faster-whisper (CTranslate2 int8)",
                    "isOffline": True
                }
            except Exception as e:
                logger.warning(f"[Whisper] faster-whisper execution failed: {e}. Trying openai-whisper...")

        # 2. Try openai-whisper fallback
        std_model = self._get_openai_whisper()
        if std_model:
            try:
                import whisper
                lang_code = language.lower()[:2] if language and len(language) >= 2 else None
                result = std_model.transcribe(file_path, language=lang_code, fp16=False)
                return {
                    "text": result.get("text", "").strip(),
                    "language": result.get("language", lang_code or "en"),
                    "duration": 0.0,
                    "engine": "openai-whisper",
                    "isOffline": True
                }
            except Exception as e:
                logger.error(f"[Whisper] openai-whisper execution failed: {e}")

        # 3. Clean placeholder if engines couldn't process the audio
        return {
            "text": "",
            "language": language or "en",
            "duration": 0.0,
            "engine": "whisper-unavailable",
            "isOffline": True,
            "error": "Whisper transcription could not parse audio stream."
        }

    def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "audio.wav", language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribes raw audio bytes by saving to temporary disk buffer and passing to Whisper.
        """
        suffix = os.path.splitext(filename)[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_path = tmp_file.name
            tmp_file.write(audio_bytes)

        try:
            return self.transcribe_audio_file(tmp_path, language=language)
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

whisper_service = WhisperVoiceService()
