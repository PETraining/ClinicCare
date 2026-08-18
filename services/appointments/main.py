from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Appointment Service")


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


def get_patient_id(x_patient_id: Optional[int] = Header(None, alias="X-Patient-Id")) -> int:
    if x_patient_id is None:
        raise HTTPException(status_code=400, detail="X-Patient-Id header is required")
    return x_patient_id


@app.get("/appointments/me", response_model=list[schemas.AppointmentRead])
def list_my_appointments(patient_id: int = Depends(get_patient_id), db: Session = Depends(get_db)):
    return (
        db.query(models.Appointment)
        .filter(models.Appointment.PatientId == patient_id)
        .order_by(models.Appointment.AppointmentId)
        .all()
    )


@app.get("/appointments/me/{appointment_id}", response_model=schemas.AppointmentRead)
def get_my_appointment(
    appointment_id: int,
    patient_id: int = Depends(get_patient_id),
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(models.Appointment)
        .filter(models.Appointment.AppointmentId == appointment_id, models.Appointment.PatientId == patient_id)
        .first()
    )
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment
