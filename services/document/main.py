import os
from datetime import date
from typing import Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Header, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Service")

UPLOAD_ROOT = os.environ.get("UPLOAD_ROOT", "./uploads")
MAX_UPLOAD_BYTES = 1 * 1024 * 1024


def get_patient_id(x_patient_id: Optional[int] = Header(None, alias="X-Patient-Id")) -> int:
    if x_patient_id is None:
        raise HTTPException(status_code=400, detail="X-Patient-Id header is required")
    return x_patient_id


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/documents", response_model=list[schemas.DocumentRead])
def list_documents(
    patientId: Optional[int] = None,
    referralId: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if patientId is None and referralId is None:
        raise HTTPException(status_code=400, detail="patientId or referralId query param is required")
    query = db.query(models.Document)
    if patientId is not None:
        query = query.filter(models.Document.PatientId == patientId)
    if referralId is not None:
        query = query.filter(models.Document.ReferralId == referralId)
    return query.order_by(models.Document.DocumentId).all()


@app.post("/documents", response_model=schemas.DocumentRead, status_code=201)
def create_document(payload: schemas.DocumentCreate, db: Session = Depends(get_db)):
    document = models.Document(
        PatientId=payload.PatientId,
        ReferralId=payload.ReferralId,
        Type=payload.Type.value,
        UploadedDate=payload.UploadedDate,
        FileName=payload.FileName,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@app.get("/documents/me", response_model=list[schemas.DocumentRead])
def list_my_documents(patient_id: int = Depends(get_patient_id), db: Session = Depends(get_db)):
    return (
        db.query(models.Document)
        .filter(models.Document.PatientId == patient_id)
        .order_by(models.Document.DocumentId)
        .all()
    )


@app.post("/documents/me", response_model=schemas.DocumentUploadResponse, status_code=201)
async def upload_my_document(
    file: UploadFile = File(...),
    patient_id: int = Depends(get_patient_id),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 1MB limit")

    patient_dir = os.path.join(UPLOAD_ROOT, str(patient_id))
    os.makedirs(patient_dir, exist_ok=True)

    safe_name = os.path.basename(file.filename or "upload.bin")
    disk_name = f"{uuid4().hex}_{safe_name}"
    disk_path = os.path.join(patient_dir, disk_name)
    with open(disk_path, "wb") as f:
        f.write(contents)

    document = models.Document(
        PatientId=patient_id,
        ReferralId=None,
        Type="Lab Report",
        UploadedDate=date.today(),
        FileName=safe_name,
        FilePath=os.path.join(str(patient_id), disk_name),
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return schemas.DocumentUploadResponse(document_id=document.DocumentId, filename=document.FileName)


@app.get("/documents/me/{document_id}/download")
def download_my_document(
    document_id: int,
    patient_id: int = Depends(get_patient_id),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(models.Document)
        .filter(models.Document.DocumentId == document_id, models.Document.PatientId == patient_id)
        .first()
    )
    if doc is None or not doc.FilePath:
        raise HTTPException(status_code=404, detail="Document not found")
    full_path = os.path.join(UPLOAD_ROOT, doc.FilePath)
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(full_path, filename=doc.FileName, media_type="application/octet-stream")
