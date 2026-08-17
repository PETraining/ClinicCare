import os
import tempfile
from datetime import datetime

# main.py runs `Base.metadata.create_all(bind=engine)` at import time against a
# relative sqlite file path ("./referrals.db"). Move cwd to a throwaway dir
# *before* importing main/db so test runs never write into the repo.
os.chdir(tempfile.mkdtemp())

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import clients  # noqa: E402
import db  # noqa: E402
import main  # noqa: E402
import models  # noqa: E402


async def _fake_doctor_exists(doctor_id: int) -> bool:
    return True


@pytest.fixture()
def db_session_factory():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db.Base.metadata.create_all(bind=engine)
    yield testing_session_local
    db.Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(db_session_factory):
    session = db_session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session_factory, monkeypatch):
    def override_get_db():
        session = db_session_factory()
        try:
            yield session
        finally:
            session.close()

    monkeypatch.setattr(clients, "doctor_exists", _fake_doctor_exists)
    main.app.dependency_overrides[db.get_db] = override_get_db
    with TestClient(main.app) as test_client:
        yield test_client
    main.app.dependency_overrides.clear()


@pytest.fixture()
def notification_log(monkeypatch):
    """Captures every payload the referral service would have POSTed to the
    Notification Service, without making a real HTTP call."""
    log: list[dict] = []

    async def _fake_record_notification(referral_id, event_type, message):
        log.append({"ReferralId": referral_id, "EventType": event_type, "Message": message})

    monkeypatch.setattr(clients, "record_notification", _fake_record_notification)
    return log


@pytest.fixture()
def make_referral(db_session):
    """Inserts a referral (and optionally its authorization) directly via the
    ORM so tests can set up states the HTTP state machine wouldn't otherwise
    let you reach in one call (e.g. a Submitted referral with a Denied auth)."""

    def _make(status="Draft", authorization_status=None, **overrides):
        now = datetime.utcnow()
        referral = models.Referral(
            PatientId=overrides.get("PatientId", 1),
            ReferringDoctorId=overrides.get("ReferringDoctorId", 6),
            SpecialistId=overrides.get("SpecialistId", 1),
            Reason=overrides.get("Reason", "Test reason"),
            Priority=overrides.get("Priority", "Routine"),
            Status=status,
            CreatedAt=now,
            UpdatedAt=now,
        )
        db_session.add(referral)
        db_session.flush()
        if authorization_status is not None:
            db_session.add(
                models.Authorization(
                    ReferralId=referral.ReferralId,
                    Status=authorization_status,
                    RequestedDate=now,
                    DecisionDate=now,
                    DecisionNotes=None,
                    CreatedAt=now,
                    UpdatedAt=now,
                )
            )
        db_session.commit()
        db_session.refresh(referral)
        return referral

    return _make
