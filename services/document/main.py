from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Service")


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
