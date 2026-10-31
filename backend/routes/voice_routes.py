import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.whisper_service import whisper_service

logger = logging.getLogger("ghostsignal.voice")

router = APIRouter(prefix="/voice", tags=["Voice & Whisper Speech-to-Text"])

@router.get("/status")
def get_whisper_status():
    """
    Returns on-device Whisper model status and capabilities.
    """
    return {
        "engine": "Whisper On-Device STT",
        "modelSize": whisper_service.model_size,
        "device": "cpu",
        "quantization": "int8",
        "isOffline": True,
        "supportedFormats": ["wav", "mp3", "ogg", "webm", "m4a", "flac"]
    }

@router.post("/transcribe")
async def transcribe_voice(
    file: UploadFile = File(..., description="Audio recording file (wav, webm, mp3, ogg, etc.)"),
    language: Optional[str] = Form(None, description="Optional target language (e.g. en, hi, bn)")
):
    """
    Transcribes audio speech to text locally on-device using Whisper.
    100% Offline: zero audio leaves the user's computer.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")

    if hasattr(file, "file") and hasattr(file.file, "read"):
        content = file.file.read()
    else:
        content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    if len(content) > 25 * 1024 * 1024:  # 25 MB max
        raise HTTPException(status_code=400, detail="Audio file exceeds 25 MB size limit.")

    try:
        result = whisper_service.transcribe_audio_bytes(
            audio_bytes=content,
            filename=file.filename,
            language=language
        )
        return {
            "success": True,
            "filename": file.filename,
            "text": result.get("text", ""),
            "language": result.get("language", language or "en"),
            "duration": result.get("duration", 0.0),
            "engine": result.get("engine", "whisper"),
            "isOffline": True
        }
    except Exception as e:
        logger.error(f"[Voice] Whisper transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice transcription failed: {str(e)}")
