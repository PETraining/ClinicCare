import asyncio
import os
from datetime import datetime, timedelta
from typing import Optional, List

import httpx
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Prescription Service")

PATIENT_SERVICE_URL = os.environ.get("PATIENT_SERVICE_URL", "http://localhost:8001")
DOCTOR_SERVICE_URL = os.environ.get("DOCTOR_SERVICE_URL", "http://localhost:8002")
NOTIFICATION_SERVICE_URL = os.environ.get("NOTIFICATION_SERVICE_URL", "http://localhost:8005")


class UpstreamUnavailable(Exception):
    pass


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


async def _validate_doctor(doctor_id: int) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{DOCTOR_SERVICE_URL}/doctors/{doctor_id}", timeout=10)
            resp.raise_for_status()
            return True
    except httpx.HTTPError as exc:
        raise UpstreamUnavailable(f"Doctor Service unavailable: {exc}") from exc


async def _validate_patient(patient_id: int) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{PATIENT_SERVICE_URL}/patients/{patient_id}", timeout=10)
            resp.raise_for_status()
            return True
    except httpx.HTTPError as exc:
        raise UpstreamUnavailable(f"Patient Service unavailable: {exc}") from exc


async def _notify_pharmacy(prescription_id: int, patient_id: int, db: Session) -> None:
    try:
        prescription = db.get(models.Prescription, prescription_id)
        if not prescription:
            return

        async with httpx.AsyncClient() as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications",
                json={
                    "type": "prescription_issued",
                    "recipient": "pharmacy",
                    "data": {
                        "prescription_id": prescription_id,
                        "patient_id": patient_id,
                        "referral_id": prescription.referral_id,
                    },
                },
                timeout=10,
            )
    except httpx.HTTPError:
        pass


def _get_prescription_or_404(prescription_id: int, db: Session) -> models.Prescription:
    prescription = db.get(models.Prescription, prescription_id)
    if prescription is None:
        raise HTTPException(status_code=404, detail=f"Prescription {prescription_id} not found")
    return prescription


@app.get("/prescriptions", response_model=List[schemas.PrescriptionRead])
def list_prescriptions(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Prescription)

    if patient_id is not None:
        query = query.filter(models.Prescription.patient_id == patient_id)

    if doctor_id is not None:
        query = query.filter(models.Prescription.doctor_id == doctor_id)

    if status is not None:
        query = query.filter(models.Prescription.status == status)

    prescriptions = query.all()
    for presc in prescriptions:
        presc.lines = db.query(models.PrescriptionLine).filter(
            models.PrescriptionLine.prescription_id == presc.id
        ).all()

    return prescriptions


@app.get("/prescriptions/{prescription_id}", response_model=schemas.PrescriptionRead)
def get_prescription(prescription_id: int, db: Session = Depends(get_db)):
    prescription = _get_prescription_or_404(prescription_id, db)
    prescription.lines = db.query(models.PrescriptionLine).filter(
        models.PrescriptionLine.prescription_id == prescription_id
    ).all()
    return prescription


@app.post("/prescriptions", response_model=schemas.PrescriptionRead, status_code=201)
async def create_prescription(
    payload: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
):
    try:
        await _validate_doctor(payload.doctor_id)
    except UpstreamUnavailable:
        raise HTTPException(status_code=502, detail="Doctor Service unavailable")

    try:
        await _validate_patient(payload.patient_id)
    except UpstreamUnavailable:
        raise HTTPException(status_code=502, detail="Patient Service unavailable")

    expires_at = datetime.utcnow() + timedelta(days=365)

    prescription = models.Prescription(
        referral_id=payload.referral_id,
        doctor_id=payload.doctor_id,
        patient_id=payload.patient_id,
        status=models.PrescriptionStatus.DRAFT,
        expires_at=expires_at,
        notes=payload.notes,
    )

    db.add(prescription)
    db.flush()

    for line in payload.lines:
        presc_line = models.PrescriptionLine(
            prescription_id=prescription.id,
            medication_name=line.medication_name,
            quantity=line.quantity,
            unit=line.unit,
            dosage=line.dosage,
            frequency=line.frequency,
            duration_days=line.duration_days,
            refill_count=line.refill_count,
            notes=line.notes,
        )
        db.add(presc_line)

    db.commit()
    db.refresh(prescription)

    prescription.lines = db.query(models.PrescriptionLine).filter(
        models.PrescriptionLine.prescription_id == prescription.id
    ).all()

    return prescription


@app.patch("/prescriptions/{prescription_id}/status", response_model=schemas.PrescriptionRead)
async def update_prescription_status(
    prescription_id: int,
    payload: schemas.PrescriptionStatusUpdate,
    db: Session = Depends(get_db),
):
    prescription = _get_prescription_or_404(prescription_id, db)

    old_status = prescription.status
    new_status = payload.status

    valid_transitions = {
        models.PrescriptionStatus.DRAFT: [
            models.PrescriptionStatus.ISSUED,
            models.PrescriptionStatus.CANCELLED,
        ],
        models.PrescriptionStatus.ISSUED: [
            models.PrescriptionStatus.FULFILLED,
            models.PrescriptionStatus.PARTIAL_FULFILLED,
            models.PrescriptionStatus.CANCELLED,
        ],
        models.PrescriptionStatus.FULFILLED: [models.PrescriptionStatus.CANCELLED],
        models.PrescriptionStatus.PARTIAL_FULFILLED: [
            models.PrescriptionStatus.FULFILLED,
            models.PrescriptionStatus.CANCELLED,
        ],
        models.PrescriptionStatus.EXPIRED: [],
        models.PrescriptionStatus.CANCELLED: [],
    }

    if new_status not in valid_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {old_status} to {new_status}",
        )

    prescription.status = new_status
    if new_status == models.PrescriptionStatus.ISSUED:
        prescription.issued_at = datetime.utcnow()

    db.commit()
    db.refresh(prescription)

    prescription.lines = db.query(models.PrescriptionLine).filter(
        models.PrescriptionLine.prescription_id == prescription_id
    ).all()

    if new_status == models.PrescriptionStatus.ISSUED:
        asyncio.create_task(_notify_pharmacy(prescription_id, prescription.patient_id, db))

    return prescription
