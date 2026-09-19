from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str
    priority: int = 1
    enabled: bool = True

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relationship: Optional[str] = None
    priority: Optional[int] = None
    enabled: Optional[bool] = None

class ContactResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    relationship: str
    priority: int
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class EmergencyCreate(BaseModel):
    type: str  # CANNOT SPEAK, MEDICAL, DANGER, FIRE, ACCIDENT, FOLLOWING, UNSAFE, OTHER
    message: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class EmergencyAcknowledge(BaseModel):
    responder_name: str = "Contact Responder"

class EmergencyResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    type: str
    message: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    response_time_seconds: Optional[int] = None
    escalation_level: int
    current_notified_contact: Optional[str] = None
    next_escalation_in_seconds: Optional[int] = None

    class Config:
        from_attributes = True
