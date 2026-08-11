from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
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


def get_patient_id(x_patient_id: Optional[int] = Header(None, alias="X-Patient-Id")) -> int:
    if x_patient_id is None:
        raise HTTPException(status_code=400, detail="X-Patient-Id header is required")
    return x_patient_id


def _question_to_read(q: models.Question, answers_by_qid: dict[int, str]) -> schemas.QuestionRead:
    return schemas.QuestionRead(
        QuestionId=q.QuestionId,
        QuestionText=q.QuestionText,
        Type=q.Type,
        Choices=q.Choices.split(",") if q.Choices else None,
        ExistingAnswer=answers_by_qid.get(q.QuestionId),
    )


@app.get("/questionnaires/me", response_model=list[schemas.QuestionnaireRead])
def list_my_questionnaires(patient_id: int = Depends(get_patient_id), db: Session = Depends(get_db)):
    return (
        db.query(models.Questionnaire)
        .filter(models.Questionnaire.PatientId == patient_id)
        .order_by(models.Questionnaire.QuestionnaireId)
        .all()
    )


@app.get("/questionnaires/me/{questionnaire_id}", response_model=schemas.QuestionnaireDetailRead)
def get_my_questionnaire(
    questionnaire_id: int,
    patient_id: int = Depends(get_patient_id),
    db: Session = Depends(get_db),
):
    qn = (
        db.query(models.Questionnaire)
        .filter(models.Questionnaire.QuestionnaireId == questionnaire_id, models.Questionnaire.PatientId == patient_id)
        .first()
    )
    if qn is None:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    question_ids = [q.QuestionId for q in qn.questions]
    existing = (
        db.query(models.PatientAnswer)
        .filter(models.PatientAnswer.QuestionId.in_(question_ids), models.PatientAnswer.PatientId == patient_id)
        .all()
    )
    answers_by_qid = {a.QuestionId: a.Answer for a in existing}

    return schemas.QuestionnaireDetailRead(
        QuestionnaireId=qn.QuestionnaireId,
        PatientId=qn.PatientId,
        ReferralId=qn.ReferralId,
        Title=qn.Title,
        Status=qn.Status,
        questions=[_question_to_read(q, answers_by_qid) for q in qn.questions],
    )


@app.post("/questionnaires/{questionnaire_id}/submit")
def submit_answers(
    questionnaire_id: int,
    payload: list[schemas.AnswerSubmit],
    patient_id: int = Depends(get_patient_id),
    db: Session = Depends(get_db),
):
    qn = (
        db.query(models.Questionnaire)
        .filter(models.Questionnaire.QuestionnaireId == questionnaire_id, models.Questionnaire.PatientId == patient_id)
        .first()
    )
    if qn is None:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    valid_question_ids = {q.QuestionId for q in qn.questions}

    for item in payload:
        if item.question_id not in valid_question_ids:
            raise HTTPException(status_code=400, detail=f"Question {item.question_id} does not belong to this questionnaire")
        existing = (
            db.query(models.PatientAnswer)
            .filter(models.PatientAnswer.QuestionId == item.question_id, models.PatientAnswer.PatientId == patient_id)
            .first()
        )
        if existing:
            existing.Answer = item.answer
        else:
            db.add(models.PatientAnswer(QuestionId=item.question_id, PatientId=patient_id, Answer=item.answer))

    qn.Status = "Completed"
    db.commit()
    return {"status": "submitted", "questionnaire_id": questionnaire_id}
