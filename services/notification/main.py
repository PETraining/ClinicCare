from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
import schemas
from db import engine, get_db, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notification Service")


@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    if db.query(models.Notification).first() is None:
        from seed import seed_notifications
        seed_notifications(db)


@app.get("/health")
def health():
    return {"status": "ok"}


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


@app.get("/notifications/{notification_id}", response_model=schemas.NotificationRead)
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.NotificationId == notification_id).first()


@app.post("/notifications", response_model=schemas.NotificationRead)
def create_notification(notification: schemas.NotificationCreate, db: Session = Depends(get_db)):
    db_notification = models.Notification(
        PatientId=notification.PatientId,
        ReferralId=notification.ReferralId,
        Title=notification.Title,
        Message=notification.Message,
        Type=notification.Type,
        Timestamp=datetime.utcnow(),
        Read=False,
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


@app.patch("/notifications/{notification_id}", response_model=schemas.NotificationRead)
def update_notification(
    notification_id: int,
    notification: schemas.NotificationUpdate,
    db: Session = Depends(get_db)
):
    db_notification = db.query(models.Notification).filter(models.Notification.NotificationId == notification_id).first()
    if notification.Read is not None:
        db_notification.Read = notification.Read
    db.commit()
    db.refresh(db_notification)
    return db_notification


@app.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.NotificationId == notification_id).delete()
    db.commit()
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
