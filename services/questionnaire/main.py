from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Questionnaire Service")


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


@app.get("/questionnaires", response_model=list[schemas.QuestionnaireRead])
def list_questionnaires(
    patientId: Optional[int] = None,
    referralId: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Questionnaire)
    if patientId is not None:
        query = query.filter(models.Questionnaire.PatientId == patientId)
    if referralId is not None:
        query = query.filter(models.Questionnaire.ReferralId == referralId)
    if status is not None:
        query = query.filter(models.Questionnaire.Status == status)
    return query.order_by(models.Questionnaire.QuestionnaireId).all()


@app.get("/questionnaires/{questionnaire_id}", response_model=schemas.QuestionnaireRead)
def get_questionnaire(questionnaire_id: int, db: Session = Depends(get_db)):
    questionnaire = db.get(models.Questionnaire, questionnaire_id)
    if questionnaire is None:
        raise HTTPException(
            status_code=404, detail=f"Questionnaire {questionnaire_id} not found"
        )
    return questionnaire


@app.post("/questionnaires", response_model=schemas.QuestionnaireRead, status_code=201)
def create_questionnaire(
    payload: schemas.QuestionnaireCreate, db: Session = Depends(get_db)
):
    questionnaire = models.Questionnaire(**payload.model_dump())
    db.add(questionnaire)
    db.commit()
    db.refresh(questionnaire)
    return questionnaire


@app.patch("/questionnaires/{questionnaire_id}", response_model=schemas.QuestionnaireRead)
def update_questionnaire(
    questionnaire_id: int,
    payload: schemas.QuestionnaireUpdate,
    db: Session = Depends(get_db),
):
    questionnaire = db.get(models.Questionnaire, questionnaire_id)
    if questionnaire is None:
        raise HTTPException(
            status_code=404, detail=f"Questionnaire {questionnaire_id} not found"
        )
    questionnaire.Status = payload.Status
    if payload.CompletedAt:
        questionnaire.CompletedAt = payload.CompletedAt
    db.commit()
    db.refresh(questionnaire)
    return questionnaire
