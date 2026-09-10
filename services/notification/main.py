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
    unreadOnly: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Notification)
    if referralId is not None:
        query = query.filter(models.Notification.ReferralId == referralId)
    if patientId is not None:
        query = query.filter(models.Notification.PatientId == patientId)
    if unreadOnly:
        query = query.filter(models.Notification.Read == False)
    return query.order_by(models.Notification.Timestamp).all()


@app.post("/notifications", response_model=schemas.NotificationRead, status_code=201)
def create_notification(payload: schemas.NotificationCreate, db: Session = Depends(get_db)):
    notification = models.Notification(
        ReferralId=payload.ReferralId,
        EventType=payload.EventType.value,
        Message=payload.Message,
        PatientId=payload.PatientId,
        Read=payload.Read,
        Timestamp=datetime.utcnow(),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    print(f"[notification] Referral #{notification.ReferralId} -> {notification.EventType}: {notification.Message}")
    return notification


@app.patch("/notifications/{notification_id}/read", response_model=schemas.NotificationRead)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.get(models.Notification, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail=f"Notification {notification_id} not found")
    notification.Read = True
    db.commit()
    db.refresh(notification)
    return notification
