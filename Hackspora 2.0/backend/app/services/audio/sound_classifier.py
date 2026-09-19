import time
import uuid
import math
import random
from typing import List, Optional, Tuple, Dict
from app.schemas.sound import SoundEvent, AudioClassifyResponse

class SoundEventProvider:
    """
    Environmental Sound Event Provider with Acoustic Feature Extraction.
    Uses simulated spectral centroid, zero-crossing rate (ZCR), and amplitude envelopes
    to classify acoustic signals into critical environmental events.
    """
    
    SOUND_CATALOG = {
        "smoke_alarm": {
            "label": "Smoke Alarm",
            "priority": "CRITICAL",
            "is_emergency": True,
            "prompt": "🚨 HIGH URGENCY: Evacuate immediately or verify smoke.",
            "default_direction": "LEFT",
            "acoustic_profile": {"target_hz": 3100, "zcr_range": (0.4, 0.6)}
        },
        "siren": {
            "label": "Emergency Siren",
            "priority": "HIGH",
            "is_emergency": True,
            "prompt": "🚨 Emergency vehicle approaching. Move to safety.",
            "default_direction": "OMNIDIRECTIONAL",
            "acoustic_profile": {"target_hz": 900, "zcr_range": (0.1, 0.3)}
        },
        "horn": {
            "label": "Vehicle Horn",
            "priority": "HIGH",
            "is_emergency": False,
            "prompt": "⚠️ Vehicle horn alert nearby. Caution on roadway.",
            "default_direction": "RIGHT",
            "acoustic_profile": {"target_hz": 400, "zcr_range": (0.05, 0.15)}
        },
        "doorbell": {
            "label": "Doorbell",
            "priority": "MEDIUM",
            "is_emergency": False,
            "prompt": "Doorbell chime detected at front entrance.",
            "default_direction": "CENTER",
            "acoustic_profile": {"target_hz": 1200, "zcr_range": (0.2, 0.4)}
        },
        "knock": {
            "label": "Door Knock",
            "priority": "MEDIUM",
            "is_emergency": False,
            "prompt": "Rhythmic knocking heard at the door.",
            "default_direction": "CENTER",
            "acoustic_profile": {"target_hz": 150, "zcr_range": (0.01, 0.08)}
        },
        "glass_break": {
            "label": "Glass Break",
            "priority": "CRITICAL",
            "is_emergency": True,
            "prompt": "🚨 Sharp glass break impact detected.",
            "default_direction": "LEFT",
            "acoustic_profile": {"target_hz": 5500, "zcr_range": (0.7, 0.95)}
        }
    }

    def _extract_simulated_features(self, simulated_event: Optional[str], ambient_db: float) -> Dict[str, float]:
        """
        Simulates DSP feature extraction (Spectral Centroid, Zero-Crossing Rate) 
        from raw audio buffers.
        """
        if simulated_event and simulated_event in self.SOUND_CATALOG:
            profile = self.SOUND_CATALOG[simulated_event]["acoustic_profile"]
            # Add some jitter to simulate real-world noise
            centroid = profile["target_hz"] + random.uniform(-100, 100) # type: ignore
            zcr_min, zcr_max = profile["zcr_range"] # type: ignore
            zcr = random.uniform(zcr_min, zcr_max)
            return {"spectral_centroid": centroid, "zcr": zcr, "amplitude": ambient_db}
        
        # Default ambient noise profile
        return {"spectral_centroid": random.uniform(200, 500), "zcr": random.uniform(0.02, 0.1), "amplitude": ambient_db}

    def _classify_from_features(self, features: Dict[str, float]) -> Optional[dict]:
        """
        Heuristic classification based on extracted acoustic features.
        """
        centroid = features["spectral_centroid"]
        zcr = features["zcr"]
        amp = features["amplitude"]

        if amp < 50.0:
            return None # Noise floor

        # High-frequency, high ZCR -> Glass Break
        if centroid > 4500 and zcr > 0.6:
            return self.SOUND_CATALOG["glass_break"]
        
        # High-frequency, mid ZCR -> Smoke Alarm (T3/T4 patterns usually ~3kHz)
        if 2800 < centroid < 3500 and 0.3 < zcr < 0.7:
            return self.SOUND_CATALOG["smoke_alarm"]

        # Mid-frequency, distinct ZCR -> Siren (oscillating usually, but taking average)
        if 700 < centroid < 1100 and zcr < 0.35:
            return self.SOUND_CATALOG["siren"]

        # Doorbell chime (often ~1200Hz)
        if 1000 < centroid < 1400 and 0.15 < zcr < 0.45:
            return self.SOUND_CATALOG["doorbell"]

        # Low frequency, low ZCR -> Horn or Knock
        if centroid < 500 and zcr < 0.2:
            if amp > 75.0:
                return self.SOUND_CATALOG["horn"]
            elif amp > 60.0:
                return self.SOUND_CATALOG["knock"]

        return None

    def classify_audio(
        self,
        audio_base64: Optional[str] = None,
        ambient_db: float = 45.0,
        is_demo: bool = False,
        simulated_event: Optional[str] = None
    ) -> AudioClassifyResponse:
        
        now = time.time()
        events: List[SoundEvent] = []
        active_alert: Optional[SoundEvent] = None

        if is_demo and not simulated_event:
            simulated_event = "smoke_alarm"
            ambient_db = 85.0
            
        if simulated_event and ambient_db < 50.0:
            ambient_db = 80.0

        # 1. Feature Extraction Phase (Simulated DSP)
        features = self._extract_simulated_features(simulated_event, ambient_db)

        # 2. Heuristic Classification Phase
        matched_item = self._classify_from_features(features)

        if matched_item:
            ev = SoundEvent(
                id=str(uuid.uuid4())[:8],
                label=matched_item["label"],
                confidence=round(random.uniform(0.85, 0.98), 2),
                direction=matched_item["default_direction"], # type: ignore
                priority=matched_item["priority"], # type: ignore
                timestamp=now,
                is_emergency=matched_item["is_emergency"],
                action_prompt=matched_item["prompt"]
            )
            events.append(ev)
            active_alert = ev
        else:
            # Analyze ambient sound level for generic loud noise
            if ambient_db > 80.0:
                ev = SoundEvent(
                    id=str(uuid.uuid4())[:8],
                    label="Loud Acoustic Spike",
                    confidence=0.88,
                    direction="OMNIDIRECTIONAL",
                    priority="HIGH",
                    timestamp=now,
                    is_emergency=False,
                    action_prompt=f"Sudden high decibel noise detected ({round(ambient_db)} dB)."
                )
                events.append(ev)
                active_alert = ev

        return AudioClassifyResponse(
            sound_events=events,
            active_alert=active_alert,
            ambient_noise_level=round(ambient_db, 1),
            vad_speaking=ambient_db > 55.0
        )

sound_provider = SoundEventProvider()
