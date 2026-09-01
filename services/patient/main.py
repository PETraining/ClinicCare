from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Patient Service")


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/patients", response_model=list[schemas.PatientRead])
def list_patients(name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Patient)
    if name:
        query = query.filter(models.Patient.Name.ilike(f"%{name}%"))
    return query.order_by(models.Patient.PatientId).all()


@app.get("/patients/{patient_id}", response_model=schemas.PatientDetail)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = (
        db.query(models.Patient)
        .options(
            joinedload(models.Patient.allergies),
            joinedload(models.Patient.conditions),
            joinedload(models.Patient.medications),
        )
        .filter(models.Patient.PatientId == patient_id)
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return patient


@app.post("/patients", response_model=schemas.PatientDetail, status_code=201)
def create_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db)):
    patient = models.Patient(Name=payload.Name, DOB=payload.DOB, Gender=payload.Gender)
    db.add(patient)
    db.flush()
    for a in payload.allergies:
        db.add(models.Allergy(PatientId=patient.PatientId, **a.model_dump()))
    for c in payload.conditions:
        db.add(models.ChronicCondition(PatientId=patient.PatientId, **c.model_dump()))
    for m in payload.medications:
        db.add(models.Medication(PatientId=patient.PatientId, **m.model_dump()))
    db.commit()
    db.refresh(patient)
    return get_patient(patient.PatientId, db)


@app.patch("/patients/{patient_id}", response_model=schemas.PatientRead)
def update_patient_referral_status(patient_id: int, update: dict, db: Session = Depends(get_db)):
    """Update patient referral status when they're added via referral."""
    patient = db.query(models.Patient).filter(models.Patient.PatientId == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    if "IsReferralPatient" in update:
        patient.IsReferralPatient = update["IsReferralPatient"]
    if "LastReferralId" in update:
        patient.LastReferralId = update["LastReferralId"]
    db.commit()
    db.refresh(patient)
    return patient
