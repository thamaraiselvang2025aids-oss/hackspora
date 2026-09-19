import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from app.core.database import Base

class Emergency(Base):
    __tablename__ = "emergencies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, default="default-user")
    user_name = Column(String, default="Shahith Mohamed")
    type = Column(String, nullable=False)  # CANNOT SPEAK, MEDICAL, DANGER, FIRE, ACCIDENT, etc.
    message = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED, CANCELLED
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    response_time_seconds = Column(Integer, nullable=True)
    escalation_level = Column(Integer, default=1)
    current_notified_contact = Column(String, nullable=True)
    next_escalation_at = Column(DateTime, nullable=True)
