from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.event_log import ActivityEvent
from app.schemas.sound import AudioClassifyRequest, AudioClassifyResponse
from app.services.audio.sound_classifier import sound_provider

router = APIRouter(prefix="/audio", tags=["Acoustic Perception"])

@router.post("/classify", response_model=AudioClassifyResponse)
async def classify_audio(payload: AudioClassifyRequest, db: Session = Depends(get_db)):
    result = sound_provider.classify_audio(
        audio_base64=payload.audio_base64,
        ambient_db=payload.ambient_db or 45.0,
        is_demo=payload.is_demo_mode,
        simulated_event=payload.simulated_event
    )

    if result.active_alert and result.active_alert.is_emergency:
        event = ActivityEvent(
            user_id="default-user",
            mode="DEAF",
            event_type="SOUND_ALERT",
            description=f"Critical acoustic alert: {result.active_alert.label} ({result.active_alert.direction})"
        )
        db.add(event)
        db.commit()

    return result
