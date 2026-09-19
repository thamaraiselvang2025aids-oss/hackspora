from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.emergency import Emergency
from app.schemas.emergency import EmergencyCreate, EmergencyAcknowledge, EmergencyResponse
from app.services.emergency.emergency_manager import emergency_service

router = APIRouter(prefix="/emergency", tags=["Emergency Services"])

def _to_response(em: Emergency) -> EmergencyResponse:
    seconds_left = None
    if em.next_escalation_at and em.status == "ACTIVE":
        delta = (em.next_escalation_at - datetime.datetime.utcnow()).total_seconds()
        seconds_left = max(0, int(delta))

    return EmergencyResponse(
        id=em.id,
        user_id=em.user_id,
        user_name=em.user_name,
        type=em.type,
        message=em.message,
        latitude=em.latitude,
        longitude=em.longitude,
        created_at=em.created_at,
        status=em.status,
        acknowledged_by=em.acknowledged_by,
        acknowledged_at=em.acknowledged_at,
        response_time_seconds=em.response_time_seconds,
        escalation_level=em.escalation_level,
        current_notified_contact=em.current_notified_contact,
        next_escalation_in_seconds=seconds_left
    )

@router.post("", response_model=EmergencyResponse)
async def trigger_emergency(payload: EmergencyCreate, db: Session = Depends(get_db)):
    em = await emergency_service.create_emergency(db, payload)
    return _to_response(em)

@router.get("/active", response_model=Optional[EmergencyResponse])
async def get_active_emergency(db: Session = Depends(get_db)):
    em = db.query(Emergency).filter(Emergency.status.in_(["ACTIVE", "ACKNOWLEDGED"])).order_by(Emergency.created_at.desc()).first()
    if not em:
        return None
    return _to_response(em)

@router.get("/history", response_model=List[EmergencyResponse])
async def get_emergency_history(db: Session = Depends(get_db)):
    items = db.query(Emergency).order_by(Emergency.created_at.desc()).limit(25).all()
    return [_to_response(em) for em in items]

@router.get("/{emergency_id}", response_model=EmergencyResponse)
async def get_emergency(emergency_id: str, db: Session = Depends(get_db)):
    em = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Emergency incident not found")
    return _to_response(em)

@router.post("/{emergency_id}/acknowledge", response_model=EmergencyResponse)
async def acknowledge_emergency(
    emergency_id: str, payload: EmergencyAcknowledge, db: Session = Depends(get_db)
):
    em = await emergency_service.acknowledge_emergency(db, emergency_id, payload.responder_name)
    if not em:
        raise HTTPException(status_code=404, detail="Emergency incident not found")
    return _to_response(em)

@router.post("/{emergency_id}/resolve", response_model=EmergencyResponse)
async def resolve_emergency(emergency_id: str, db: Session = Depends(get_db)):
    em = await emergency_service.resolve_emergency(db, emergency_id)
    if not em:
        raise HTTPException(status_code=404, detail="Emergency incident not found")
    return _to_response(em)
