from datetime import datetime
from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notification Service")

@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()

@app.get("/notifications", response_model=list[schemas.NotificationRead])
def list_notifications(
    referralId: Optional[int] = None,
    patientId: Optional[int] = None,
    unreadOnly: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(models.Notification)
    if referralId is not None:
        query = query.filter(models.Notification.ReferralId == referralId)
    if patientId is not None:
        query = query.filter(models.Notification.PatientId == patientId)
    if unreadOnly:
        query = query.filter(models.Notification.Read == False)
    return query.order_by(models.Notification.Timestamp.desc()).all()

@app.post("/notifications", response_model=schemas.NotificationRead, status_code=201)
def create_notification(payload: schemas.NotificationCreate, db: Session = Depends(get_db)):
    notification = models.Notification(
        PatientId=payload.PatientId,
        ReferralId=payload.ReferralId,
        EventType=payload.EventType.value,
        Message=payload.Message,
        Source=payload.Source,
        Read=False,
        Timestamp=datetime.utcnow(),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
