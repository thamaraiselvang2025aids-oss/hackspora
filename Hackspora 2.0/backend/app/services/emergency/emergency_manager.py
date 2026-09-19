import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.emergency import Emergency
from app.models.contact import TrustedContact
from app.models.event_log import ActivityEvent
from app.schemas.emergency import EmergencyCreate, EmergencyResponse
from app.websocket.manager import ws_manager
from app.core.config import settings

class EmergencyService:
    """
    Central Emergency Orchestration Service.
    Handles incident creation, GPS tagging, contact notification, acknowledgment, and resolution.
    """
    
    async def create_emergency(self, db: Session, data: EmergencyCreate, user_id: str = "default-user") -> Emergency:
        # Resolve initial top-priority contact
        top_contact = db.query(TrustedContact).filter(
            TrustedContact.user_id == user_id,
            TrustedContact.enabled == True
        ).order_by(TrustedContact.priority.asc()).first()
        
        contact_name = top_contact.name if top_contact else "Primary Emergency Contact"
        
        next_escalation = datetime.datetime.utcnow() + datetime.timedelta(
            seconds=settings.DEFAULT_ESCALATION_TIMEOUT_SECONDS
        )

        emergency = Emergency(
            user_id=user_id,
            user_name="Shahith Mohamed",
            type=data.type,
            message=data.message or f"Silent SOS Alert: {data.type}",
            latitude=data.latitude,
            longitude=data.longitude,
            status="ACTIVE",
            escalation_level=1,
            current_notified_contact=contact_name,
            next_escalation_at=next_escalation,
            created_at=datetime.datetime.utcnow()
        )
        db.add(emergency)
        
        # Log activity
        event = ActivityEvent(
            user_id=user_id,
            mode="EMERGENCY",
            event_type="SOS_TRIGGERED",
            description=f"Emergency SOS triggered ({data.type}) with coordinates [{data.latitude}, {data.longitude}]"
        )
        db.add(event)
        db.commit()
        db.refresh(emergency)

        # Broadcast via WebSocket
        await self._broadcast_emergency(emergency, event_name="EMERGENCY_CREATED")
        return emergency

    async def acknowledge_emergency(
        self, db: Session, emergency_id: str, responder_name: str = "Contact Responder"
    ) -> Optional[Emergency]:
        emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
        if not emergency:
            return None

        now = datetime.datetime.utcnow()
        emergency.status = "ACKNOWLEDGED"
        emergency.acknowledged_by = responder_name
        emergency.acknowledged_at = now
        
        # Calculate response time
        diff_seconds = int((now - emergency.created_at).total_seconds())
        emergency.response_time_seconds = max(1, diff_seconds)

        event = ActivityEvent(
            user_id=emergency.user_id,
            mode="EMERGENCY",
            event_type="EMERGENCY_ACKNOWLEDGED",
            description=f"Emergency {emergency_id} acknowledged by {responder_name} in {diff_seconds}s"
        )
        db.add(event)
        db.commit()
        db.refresh(emergency)

        await self._broadcast_emergency(emergency, event_name="EMERGENCY_ACKNOWLEDGED")
        return emergency

    async def resolve_emergency(self, db: Session, emergency_id: str) -> Optional[Emergency]:
        emergency = db.query(Emergency).filter(Emergency.id == emergency_id).first()
        if not emergency:
            return None

        emergency.status = "RESOLVED"
        event = ActivityEvent(
            user_id=emergency.user_id,
            mode="EMERGENCY",
            event_type="EMERGENCY_RESOLVED",
            description=f"Emergency {emergency_id} resolved"
        )
        db.add(event)
        db.commit()
        db.refresh(emergency)

        await self._broadcast_emergency(emergency, event_name="EMERGENCY_RESOLVED")
        return emergency

    async def escalate_incident(self, db: Session, emergency: Emergency):
        contacts = db.query(TrustedContact).filter(
            TrustedContact.user_id == emergency.user_id,
            TrustedContact.enabled == True
        ).order_by(TrustedContact.priority.asc()).all()

        next_level = emergency.escalation_level + 1
        if next_level <= len(contacts):
            target_contact = contacts[next_level - 1]
            emergency.escalation_level = next_level
            emergency.current_notified_contact = target_contact.name
            emergency.next_escalation_at = datetime.datetime.utcnow() + datetime.timedelta(
                seconds=settings.DEFAULT_ESCALATION_TIMEOUT_SECONDS
            )
            db.commit()
            db.refresh(emergency)
            await self._broadcast_emergency(emergency, event_name="EMERGENCY_ESCALATED")

    async def _broadcast_emergency(self, emergency: Emergency, event_name: str):
        seconds_left = None
        if emergency.next_escalation_at and emergency.status == "ACTIVE":
            delta = (emergency.next_escalation_at - datetime.datetime.utcnow()).total_seconds()
            seconds_left = max(0, int(delta))

        payload = {
            "event": event_name,
            "data": {
                "id": emergency.id,
                "user_id": emergency.user_id,
                "user_name": emergency.user_name,
                "type": emergency.type,
                "message": emergency.message,
                "latitude": emergency.latitude,
                "longitude": emergency.longitude,
                "created_at": emergency.created_at.isoformat() if emergency.created_at else None,
                "status": emergency.status,
                "acknowledged_by": emergency.acknowledged_by,
                "acknowledged_at": emergency.acknowledged_at.isoformat() if emergency.acknowledged_at else None,
                "response_time_seconds": emergency.response_time_seconds,
                "escalation_level": emergency.escalation_level,
                "current_notified_contact": emergency.current_notified_contact,
                "next_escalation_in_seconds": seconds_left
            }
        }
        await ws_manager.broadcast_emergency_update(payload, emergency.user_id)

emergency_service = EmergencyService()
