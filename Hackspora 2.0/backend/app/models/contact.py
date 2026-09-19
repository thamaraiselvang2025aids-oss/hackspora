import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime
from app.core.database import Base

class TrustedContact(Base):
    __tablename__ = "trusted_contacts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, default="default-user")
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relationship = Column(String, nullable=False)
    priority = Column(Integer, default=1)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
