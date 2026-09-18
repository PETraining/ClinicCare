import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Service")

STORAGE_DIR = Path("./storage")
STORAGE_DIR.mkdir(exist_ok=True)


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
        UploadedBy="Clinician",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@app.post("/documents/upload", response_model=schemas.DocumentRead, status_code=201)
async def upload_document(
    PatientId: int = Form(...),
    Type: str = Form(...),
    ReferralId: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    file_content = await file.read()

    filename_with_patient = f"patient_{PatientId}_{file.filename}"
    storage_path = STORAGE_DIR / filename_with_patient

    storage_path.write_bytes(file_content)

    document = models.Document(
        PatientId=PatientId,
        ReferralId=ReferralId,
        Type=Type,
        UploadedDate=datetime.now().date(),
        FileName=file.filename,
        StoragePath=str(storage_path),
        UploadedBy="Patient",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@app.get("/documents/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.DocumentId == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if not document.StoragePath:
        raise HTTPException(status_code=400, detail="Document has no file storage (metadata-only)")
    if not os.path.exists(document.StoragePath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=document.StoragePath,
        filename=document.FileName,
        media_type="application/octet-stream",
    )


@app.get("/questionnaires", response_model=list[schemas.QuestionnaireRead])
def list_questionnaires(db: Session = Depends(get_db)):
    return db.query(models.Questionnaire).order_by(models.Questionnaire.QuestionnaireId).all()


@app.post("/questionnaire-responses", response_model=schemas.QuestionnaireResponseRead, status_code=201)
def create_questionnaire_response(
    payload: schemas.QuestionnaireResponseCreate,
    db: Session = Depends(get_db),
):
    questionnaire = db.query(models.Questionnaire).filter(
        models.Questionnaire.QuestionnaireId == payload.QuestionnaireId
    ).first()
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    response = models.QuestionnaireResponse(
        QuestionnaireId=payload.QuestionnaireId,
        PatientId=payload.PatientId,
        ReferralId=payload.ReferralId,
        SubmittedAt=datetime.now(),
        AnswersJson=payload.AnswersJson,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@app.get("/questionnaire-responses", response_model=list[schemas.QuestionnaireResponseRead])
def list_questionnaire_responses(
    patientId: int,
    db: Session = Depends(get_db),
):
    return db.query(models.QuestionnaireResponse).filter(
        models.QuestionnaireResponse.PatientId == patientId
    ).order_by(models.QuestionnaireResponse.ResponseId).all()
