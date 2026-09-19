import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.contact import TrustedContact
from app.schemas.emergency import ContactCreate, ContactUpdate, ContactResponse

router = APIRouter(prefix="/contacts", tags=["Emergency Contacts"])

# Prepopulate default contacts if empty
def ensure_default_contacts(db: Session, user_id: str = "default-user"):
    count = db.query(TrustedContact).filter(TrustedContact.user_id == user_id).count()
    if count == 0:
        defaults = [
            TrustedContact(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name="Aisha Mohamed (Sister)",
                phone="+91 98401 23456",
                relationship="Sister",
                priority=1,
                enabled=True
            ),
            TrustedContact(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name="Dr. Rajiv Mehta (Caregiver)",
                phone="+91 98401 67890",
                relationship="Caregiver",
                priority=2,
                enabled=True
            ),
            TrustedContact(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name="Emergency Services Dispatch",
                phone="112",
                relationship="First Responder",
                priority=3,
                enabled=True
            )
        ]
        db.add_all(defaults)
        db.commit()

@router.get("", response_model=List[ContactResponse])
async def list_contacts(db: Session = Depends(get_db)):
    ensure_default_contacts(db)
    return db.query(TrustedContact).order_by(TrustedContact.priority.asc()).all()

@router.post("", response_model=ContactResponse)
async def create_contact(contact: ContactCreate, db: Session = Depends(get_db)):
    item = TrustedContact(
        id=str(uuid.uuid4()),
        user_id="default-user",
        name=contact.name,
        phone=contact.phone,
        relationship=contact.relationship,
        priority=contact.priority,
        enabled=contact.enabled
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, payload: ContactUpdate, db: Session = Depends(get_db)):
    item = db.query(TrustedContact).filter(TrustedContact.id == contact_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    if payload.name is not None: item.name = payload.name
    if payload.phone is not None: item.phone = payload.phone
    if payload.relationship is not None: item.relationship = payload.relationship
    if payload.priority is not None: item.priority = payload.priority
    if payload.enabled is not None: item.enabled = payload.enabled

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str, db: Session = Depends(get_db)):
    item = db.query(TrustedContact).filter(TrustedContact.id == contact_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(item)
    db.commit()
    return {"status": "success", "deleted_id": contact_id}
