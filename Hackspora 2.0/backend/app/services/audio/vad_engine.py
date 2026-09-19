import numpy as np

class VoiceActivityDetector:
    """
    Lightweight Voice Activity Detector for audio energy & silence distinction.
    """
    def is_speech_active(self, audio_chunk_bytes: bytes, threshold_energy: float = 0.02) -> bool:
        if not audio_chunk_bytes:
            return False
        try:
            samples = np.frombuffer(audio_chunk_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            rms = np.sqrt(np.mean(samples**2))
            return bool(rms > threshold_energy)
        except Exception:
            return False

vad_engine = VoiceActivityDetector()
