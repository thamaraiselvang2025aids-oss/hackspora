from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.event_log import ActivityEvent
from app.schemas.isl import (
    ISLRecognizeRequest, ISLRecognizeResponse,
    SpeechToAvatarRequest, SpeechToAvatarResponse
)
from app.services.isl.isl_gloss_engine import isl_engine

router = APIRouter(prefix="/isl", tags=["Two-Way ISL & Non-Verbal Communication"])

@router.post("/recognize", response_model=ISLRecognizeResponse)
async def recognize_isl_gesture(payload: ISLRecognizeRequest, db: Session = Depends(get_db)):
    result = isl_engine.recognize_gesture_sequence(
        frames=payload.frames,
        is_signing_hint=payload.is_signing,
        is_demo=payload.is_demo_mode,
        simulated_gloss=payload.simulated_gloss
    )

    if result.detected_gloss:
        event = ActivityEvent(
            user_id="default-user",
            mode="COMMUNICATE",
            event_type="ISL_SIGN_RECOGNIZED",
            description=f"ISL Sign '{result.detected_gloss}' -> \"{result.natural_transcript}\""
        )
        db.add(event)
        db.commit()

    return result

@router.post("/speech-to-avatar", response_model=SpeechToAvatarResponse)
async def translate_speech_to_avatar_keyframes(payload: SpeechToAvatarRequest):
    return isl_engine.convert_text_to_avatar_gloss(payload.spoken_text)

@router.get("/vocabulary")
async def get_supported_vocabulary():
    return {
        "status": "ready",
        "vocabulary": isl_engine.VOCABULARY,
        "natural_gloss_map": isl_engine.GLOSS_TO_NATURAL
    }
