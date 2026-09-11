import os
import tempfile
from datetime import date

# main.py runs `Base.metadata.create_all(bind=engine)` at import time against a
# relative sqlite file path ("./patients.db"). Move cwd to a throwaway dir
# *before* importing main/db so test runs never write into the repo.
os.chdir(tempfile.mkdtemp())

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import db  # noqa: E402
import main  # noqa: E402
import models  # noqa: E402


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
def client(db_session_factory):
    def override_get_db():
        session = db_session_factory()
        try:
            yield session
        finally:
            session.close()

    main.app.dependency_overrides[db.get_db] = override_get_db
    with TestClient(main.app) as test_client:
        yield test_client
    main.app.dependency_overrides.clear()


@pytest.fixture()
def make_patient(db_session):
    def _make(name="Test Patient", dob=date(1990, 1, 1), gender="F"):
        patient = models.Patient(Name=name, DOB=dob, Gender=gender)
        db_session.add(patient)
        db_session.commit()
        db_session.refresh(patient)
        return patient

    return _make


@pytest.fixture()
def make_insurance(db_session):
    def _make(patient_id, **overrides):
        insurance = models.Insurance(
            PatientId=patient_id,
            InsurerName=overrides.get("InsurerName", "Acme Health"),
            PolicyNumber=overrides.get("PolicyNumber", "POL-1"),
            GroupNumber=overrides.get("GroupNumber", "GRP-1"),
            MemberId=overrides.get("MemberId", "MEM-1"),
            EffectiveDate=overrides.get("EffectiveDate", date(2026, 1, 1)),
            TerminationDate=overrides.get("TerminationDate"),
        )
        db_session.add(insurance)
        db_session.commit()
        db_session.refresh(insurance)
        return insurance

    return _make
