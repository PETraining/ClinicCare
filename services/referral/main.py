import asyncio
from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

import clients
import models
import schemas
from clients import UpstreamUnavailable
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Referral Service")

TRANSITIONS = {
    "submit": ("Draft", "Submitted"),
    "accept": ("Submitted", "Accepted"),
    "reject": ("Submitted", "Rejected"),
    "complete": ("Accepted", "Completed"),
}


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


def _get_referral_or_404(referral_id: int, db: Session) -> models.Referral:
    referral = db.get(models.Referral, referral_id)
    if referral is None:
        raise HTTPException(status_code=404, detail=f"Referral {referral_id} not found")
    return referral


@app.get("/referrals", response_model=list[schemas.ReferralRead])
def list_referrals(
    patientId: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Referral)
    if patientId is not None:
        query = query.filter(models.Referral.PatientId == patientId)
    if status is not None:
        query = query.filter(models.Referral.Status == status)
    return query.order_by(models.Referral.ReferralId).all()


@app.get("/referrals/{referral_id}", response_model=schemas.ReferralRead)
def get_referral(referral_id: int, db: Session = Depends(get_db)):
    return _get_referral_or_404(referral_id, db)


@app.post("/referrals", response_model=schemas.ReferralRead, status_code=201)
async def create_referral(payload: schemas.ReferralCreate, db: Session = Depends(get_db)):
    try:
        referring_exists, specialist_exists = await asyncio.gather(
            clients.doctor_exists(payload.ReferringDoctorId),
            clients.doctor_exists(payload.SpecialistId),
        )
    except UpstreamUnavailable as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    missing = []
    if not referring_exists:
        missing.append(f"ReferringDoctorId {payload.ReferringDoctorId}")
    if not specialist_exists:
        missing.append(f"SpecialistId {payload.SpecialistId}")
    if missing:
        raise HTTPException(status_code=400, detail=f"Doctor(s) not found: {', '.join(missing)}")

    now = datetime.utcnow()
    referral = models.Referral(
        PatientId=payload.PatientId,
        ReferringDoctorId=payload.ReferringDoctorId,
        SpecialistId=payload.SpecialistId,
        Reason=payload.Reason,
        Priority=payload.Priority.value,
        Status="Draft",
        CreatedAt=now,
        UpdatedAt=now,
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral


async def _transition(referral_id: int, action: str, db: Session) -> models.Referral:
    required_status, next_status = TRANSITIONS[action]
    referral = _get_referral_or_404(referral_id, db)
    if referral.Status != required_status:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot {action} referral in status '{referral.Status}' — expected '{required_status}'.",
        )
    referral.Status = next_status
    referral.UpdatedAt = datetime.utcnow()
    db.commit()
    db.refresh(referral)
    await clients.record_notification(
        referral.ReferralId, next_status, f"Referral #{referral.ReferralId} {next_status.lower()}."
    )
    return referral


@app.patch("/referrals/{referral_id}/submit", response_model=schemas.ReferralRead)
async def submit_referral(referral_id: int, db: Session = Depends(get_db)):
    return await _transition(referral_id, "submit", db)


@app.patch("/referrals/{referral_id}/accept", response_model=schemas.ReferralRead)
async def accept_referral(referral_id: int, db: Session = Depends(get_db)):
    return await _transition(referral_id, "accept", db)


@app.patch("/referrals/{referral_id}/reject", response_model=schemas.ReferralRead)
async def reject_referral(referral_id: int, db: Session = Depends(get_db)):
    return await _transition(referral_id, "reject", db)


@app.patch("/referrals/{referral_id}/complete", response_model=schemas.ReferralRead)
async def complete_referral(referral_id: int, db: Session = Depends(get_db)):
    return await _transition(referral_id, "complete", db)
