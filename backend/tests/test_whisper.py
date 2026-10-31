import io
import math
import struct
import wave
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from routes.voice_routes import get_whisper_status
from services.whisper_service import whisper_service

def create_synthetic_wav_bytes(duration_sec: float = 0.3, freq: float = 440.0) -> bytes:
    """Generates a standard 16kHz mono WAV file in memory."""
    sample_rate = 16000
    num_samples = int(sample_rate * duration_sec)
    buffer = io.BytesIO()

    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)       # Mono
        wav_file.setsampwidth(2)       # 16-bit
        wav_file.setframerate(sample_rate)

        for i in range(num_samples):
            # Generate 440Hz sine wave tone
            val = int(32767.0 * 0.2 * math.sin(2.0 * math.pi * freq * (i / sample_rate)))
            data = struct.pack('<h', val)
            wav_file.writeframesraw(data)

    buffer.seek(0)
    return buffer.read()

def test_whisper_status_endpoint():
    """Verify get_whisper_status returns Whisper engine details."""
    data = get_whisper_status()
    assert data["isOffline"] is True
    assert "Whisper" in data["engine"]
    assert "wav" in data["supportedFormats"]
    assert data["device"] == "cpu"

def test_whisper_synthetic_audio_transcription():
    """Verify Whisper handles synthetic audio waveform through the transcription service."""
    wav_bytes = create_synthetic_wav_bytes(duration_sec=0.2, freq=440.0)
    result = whisper_service.transcribe_audio_bytes(wav_bytes, filename="tone.wav", language="en")
    assert result["isOffline"] is True
    assert "engine" in result
    assert "faster-whisper" in result["engine"] or "whisper" in result["engine"]

def test_whisper_invalid_file_handling():
    """Verify Whisper handles non-existent file path gracefully."""
    with pytest.raises(FileNotFoundError):
        whisper_service.transcribe_audio_file("non_existent_audio_file_123.wav")

def test_whisper_service_direct():
    """Verify WhisperVoiceService direct byte transcription returns offline metadata."""
    wav_bytes = create_synthetic_wav_bytes(duration_sec=0.2, freq=440.0)
    result = whisper_service.transcribe_audio_bytes(wav_bytes, filename="test.wav", language="en")
    assert "isOffline" in result
    assert result["isOffline"] is True
    assert "text" in result
    assert "duration" in result
