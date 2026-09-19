from pydantic import BaseModel
from typing import Optional, Literal, List

class SoundEvent(BaseModel):
    id: str
    label: str  # "Smoke Alarm", "Siren", "Horn", "Doorbell", "Knock", "Glass Break", "Emergency Alarm"
    confidence: float
    direction: Literal["LEFT", "CENTER", "RIGHT", "OMNIDIRECTIONAL"]
    priority: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    timestamp: float
    is_emergency: bool = False
    action_prompt: str

class AudioClassifyRequest(BaseModel):
    audio_base64: Optional[str] = None
    ambient_db: Optional[float] = 45.0
    is_demo_mode: bool = False
    simulated_event: Optional[str] = None

class AudioClassifyResponse(BaseModel):
    sound_events: List[SoundEvent]
    active_alert: Optional[SoundEvent] = None
    ambient_noise_level: float
    vad_speaking: bool
