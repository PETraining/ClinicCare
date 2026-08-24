from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db import Base, get_db
from main import app


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create(client, patient_id: int = 1, status: str = "Pending", **kwargs) -> dict:
    payload = {
        "PatientId": patient_id,
        "Type": "Health History",
        "Title": f"Questionnaire for patient {patient_id}",
        "CreatedAt": _now(),
        "Status": status,
        **kwargs,
    }
    resp = client.post("/questionnaires", json=payload)
    assert resp.status_code == 201
    return resp.json()


# ── list filters ──────────────────────────────────────────────────────────────

def test_list_by_patient_id(client):
    _create(client, patient_id=1)
    _create(client, patient_id=2)

    resp = client.get("/questionnaires", params={"patientId": 1})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["PatientId"] == 1


def test_list_by_status(client):
    _create(client, patient_id=1, status="Pending")
    _create(client, patient_id=1, status="Completed")

    resp = client.get("/questionnaires", params={"status": "Pending"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["Status"] == "Pending"


def test_list_combined_patient_and_status_filter(client):
    _create(client, patient_id=1, status="Completed")
    _create(client, patient_id=1, status="Pending")
    _create(client, patient_id=2, status="Completed")

    resp = client.get("/questionnaires", params={"patientId": 1, "status": "Completed"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["PatientId"] == 1
    assert data[0]["Status"] == "Completed"


def test_list_returns_empty_array_when_no_match(client):
    resp = client.get("/questionnaires", params={"patientId": 999})
    assert resp.status_code == 200
    assert resp.json() == []


# ── get by id ─────────────────────────────────────────────────────────────────

def test_get_questionnaire_by_id(client):
    created = _create(client)
    qid = created["QuestionnaireId"]

    resp = client.get(f"/questionnaires/{qid}")
    assert resp.status_code == 200
    assert resp.json()["QuestionnaireId"] == qid


def test_get_questionnaire_not_found(client):
    resp = client.get("/questionnaires/9999")
    assert resp.status_code == 404


# ── create ────────────────────────────────────────────────────────────────────

def test_create_questionnaire_defaults_to_pending(client):
    resp = client.post("/questionnaires", json={
        "PatientId": 1,
        "Type": "Allergy Screening",
        "Title": "Allergy Q",
        "CreatedAt": _now(),
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["Status"] == "Pending"
    assert data["CompletedAt"] is None


# ── patch ─────────────────────────────────────────────────────────────────────

def test_patch_marks_questionnaire_completed(client):
    qid = _create(client)["QuestionnaireId"]

    resp = client.patch(f"/questionnaires/{qid}", json={
        "Status": "Completed",
        "CompletedAt": _now(),
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["Status"] == "Completed"
    assert data["CompletedAt"] is not None


def test_patch_persists_completed_at_timestamp(client):
    qid = _create(client)["QuestionnaireId"]
    fixed_time = "2025-06-15T10:30:00"

    client.patch(f"/questionnaires/{qid}", json={"Status": "Completed", "CompletedAt": fixed_time})

    resp = client.get(f"/questionnaires/{qid}")
    assert resp.json()["CompletedAt"] is not None


def test_patch_questionnaire_not_found(client):
    resp = client.patch("/questionnaires/9999", json={"Status": "Completed"})
    assert resp.status_code == 404
