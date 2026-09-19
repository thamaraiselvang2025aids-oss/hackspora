import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.core.database import Base

class ActivityEvent(Base):
    __tablename__ = "activity_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, default="default-user")
    mode = Column(String, nullable=False)  # BLIND, DEAF, COMMUNICATE, EMERGENCY
    event_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    payload_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
