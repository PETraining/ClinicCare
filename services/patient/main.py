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
            joinedload(models.Patient.insurance),
        )
        .filter(models.Patient.PatientId == patient_id)
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return patient


def _get_patient_or_404(patient_id: int, db: Session) -> models.Patient:
    patient = db.get(models.Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return patient


def _get_insurance_or_404(patient_id: int, insurance_id: int, db: Session) -> models.Insurance:
    insurance = (
        db.query(models.Insurance)
        .filter(models.Insurance.InsuranceId == insurance_id, models.Insurance.PatientId == patient_id)
        .first()
    )
    if insurance is None:
        raise HTTPException(
            status_code=404, detail=f"Insurance {insurance_id} not found for patient {patient_id}"
        )
    return insurance


@app.get("/patients/{patient_id}/insurance", response_model=list[schemas.InsuranceRead])
def list_insurance(patient_id: int, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    return (
        db.query(models.Insurance)
        .filter(models.Insurance.PatientId == patient_id)
        .order_by(models.Insurance.InsuranceId)
        .all()
    )


@app.post("/patients/{patient_id}/insurance", response_model=schemas.InsuranceRead, status_code=201)
def create_insurance(patient_id: int, payload: schemas.InsuranceCreate, db: Session = Depends(get_db)):
    _get_patient_or_404(patient_id, db)
    insurance = models.Insurance(PatientId=patient_id, **payload.model_dump())
    db.add(insurance)
    db.commit()
    db.refresh(insurance)
    return insurance


@app.put("/patients/{patient_id}/insurance/{insurance_id}", response_model=schemas.InsuranceRead)
def update_insurance(
    patient_id: int, insurance_id: int, payload: schemas.InsuranceUpdate, db: Session = Depends(get_db)
):
    insurance = _get_insurance_or_404(patient_id, insurance_id, db)
    for field, value in payload.model_dump().items():
        setattr(insurance, field, value)
    db.commit()
    db.refresh(insurance)
    return insurance


@app.delete("/patients/{patient_id}/insurance/{insurance_id}", status_code=204)
def delete_insurance(patient_id: int, insurance_id: int, db: Session = Depends(get_db)):
    insurance = _get_insurance_or_404(patient_id, insurance_id, db)
    db.delete(insurance)
    db.commit()
    return None


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
    for i in payload.insurance:
        db.add(models.Insurance(PatientId=patient.PatientId, **i.model_dump()))
    db.commit()
    db.refresh(patient)
    return get_patient(patient.PatientId, db)
