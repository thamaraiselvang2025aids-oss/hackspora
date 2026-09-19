import asyncio
import datetime
from app.core.database import SessionLocal
from app.models.emergency import Emergency
from app.services.emergency.emergency_manager import emergency_service

async def run_escalation_worker_loop():
    """
    Background worker loop for multi-contact escalation timeouts (default 60s).
    """
    print("[EscalationWorker] Background escalation loop started.")
    while True:
        try:
            await asyncio.sleep(2)
            db = SessionLocal()
            try:
                now = datetime.datetime.utcnow()
                active_emergencies = db.query(Emergency).filter(
                    Emergency.status == "ACTIVE",
                    Emergency.next_escalation_at <= now
                ).all()

                for em in active_emergencies:
                    print(f"[EscalationWorker] Escalating emergency {em.id} from level {em.escalation_level}")
                    await emergency_service.escalate_incident(db, em)
            finally:
                db.close()
        except asyncio.CancelledError:
            print("[EscalationWorker] Escalation loop cancelled.")
            break
        except Exception as e:
            print(f"[EscalationWorker] Loop error: {e}")
            await asyncio.sleep(5)
