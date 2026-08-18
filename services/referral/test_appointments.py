import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from main import app, get_db
from models import Base, Referral, Appointment
from schemas import AppointmentStatus

# Use file-based SQLite for testing
test_db_path = "test_appointments.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{test_db_path}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create tables once at startup
Base.metadata.create_all(bind=engine)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def cleanup():
    """Clean up test database file after all tests"""
    yield
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except (PermissionError, OSError):
            pass

@pytest.fixture(autouse=True)
def setup_test_data():
    """Create test data before each test and clean up after"""
    # Clear data before each test
    db = TestingSessionLocal()
    db.query(Appointment).delete()
    db.query(Referral).delete()
    db.commit()
    db.close()

    # Create fresh test data
    db = TestingSessionLocal()

    # Create test referrals
    ref_accepted = Referral(
        ReferralId=1,
        PatientId=1,
        ReferringDoctorId=1,
        SpecialistId=1,
        Reason="Test referral",
        Priority="Routine",
        Status="Accepted",
        CreatedAt=datetime.utcnow(),
        UpdatedAt=datetime.utcnow()
    )
    ref_draft = Referral(
        ReferralId=2,
        PatientId=2,
        ReferringDoctorId=2,
        SpecialistId=2,
        Reason="Draft referral",
        Priority="Routine",
        Status="Draft",
        CreatedAt=datetime.utcnow(),
        UpdatedAt=datetime.utcnow()
    )

    db.add(ref_accepted)
    db.add(ref_draft)
    db.flush()

    # Create test appointment
    apt = Appointment(
        AppointmentId=1,
        ReferralId=1,
        PatientId=1,
        SpecialistId=1,
        ScheduledDate=datetime(2026, 8, 20, 10, 0),
        Location="Test Location",
        Status="Scheduled",
        CreatedAt=datetime.utcnow(),
        UpdatedAt=datetime.utcnow()
    )
    db.add(apt)
    db.commit()
    db.close()

    yield


# ============== CREATE APPOINTMENT TESTS ==============

def test_create_appointment_success():
    """Test creating an appointment for an Accepted referral"""
    response = client.post(
        "/referrals/1/appointments",
        json={"ScheduledDate": "2026-08-25T14:00:00", "Location": "Office A", "SpecialistId": 2}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["ReferralId"] == 1
    assert data["Location"] == "Office A"
    assert data["Status"] == "Scheduled"


def test_create_appointment_invalid_referral():
    """Test creating appointment for non-existent referral"""
    response = client.post(
        "/referrals/999/appointments",
        json={"ScheduledDate": "2026-08-25T14:00:00", "Location": "Office A", "SpecialistId": 1}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_appointment_non_accepted_referral():
    """Test creating appointment for non-Accepted referral"""
    response = client.post(
        "/referrals/2/appointments",
        json={"ScheduledDate": "2026-08-25T14:00:00", "Location": "Office A", "SpecialistId": 1}
    )
    assert response.status_code == 400
    assert "Accepted" in response.json()["detail"]


# ============== LIST APPOINTMENTS TESTS ==============

def test_list_appointments_success():
    """Test listing appointments for a referral"""
    response = client.get("/referrals/1/appointments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["ReferralId"] == 1


def test_list_appointments_invalid_referral():
    """Test listing appointments for non-existent referral"""
    response = client.get("/referrals/999/appointments")
    assert response.status_code == 404


def test_list_appointments_ordered():
    """Test appointments are ordered by CreatedAt descending"""
    # Create second appointment
    client.post(
        "/referrals/1/appointments",
        json={"ScheduledDate": "2026-08-26T15:00:00", "Location": "Office B", "SpecialistId": 1}
    )

    response = client.get("/referrals/1/appointments")
    assert response.status_code == 200
    data = response.json()
    # Most recent should be first
    assert data[0]["CreatedAt"] >= data[-1]["CreatedAt"]


# ============== RESCHEDULE TESTS ==============

def test_reschedule_success():
    """Test rescheduling a scheduled appointment keeps the specialist locked to the referral"""
    response = client.patch(
        "/referrals/appointments/1/reschedule",
        json={"ScheduledDate": "2026-09-01T16:00:00", "Location": "New Office", "SpecialistId": 3}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ScheduledDate"] == "2026-09-01T16:00:00"
    assert data["Location"] == "New Office"
    assert data["SpecialistId"] == 1


def test_reschedule_non_scheduled():
    """Test rescheduling a non-Scheduled appointment"""
    # First complete the appointment
    client.patch("/referrals/appointments/1/complete")

    # Try to reschedule
    response = client.patch(
        "/referrals/appointments/1/reschedule",
        json={"ScheduledDate": "2026-09-01T16:00:00", "Location": "Office", "SpecialistId": 1}
    )
    assert response.status_code == 400
    assert "cannot reschedule" in response.json()["detail"].lower()


def test_reschedule_missing_appointment():
    """Test rescheduling non-existent appointment"""
    response = client.patch(
        "/referrals/appointments/999/reschedule",
        json={"ScheduledDate": "2026-09-01T16:00:00", "Location": "Office", "SpecialistId": 1}
    )
    assert response.status_code == 404


# ============== COMPLETE TESTS ==============

def test_complete_success():
    """Test completing a scheduled appointment"""
    response = client.patch("/referrals/appointments/1/complete")
    assert response.status_code == 200
    data = response.json()
    assert data["Status"] == "Completed"


def test_complete_non_scheduled():
    """Test completing a non-Scheduled appointment"""
    # Create and complete once
    client.patch("/referrals/appointments/1/complete")

    # Try to complete again
    response = client.patch("/referrals/appointments/1/complete")
    assert response.status_code == 400
    assert "cannot complete" in response.json()["detail"].lower()


def test_complete_missing_appointment():
    """Test completing non-existent appointment"""
    response = client.patch("/referrals/appointments/999/complete")
    assert response.status_code == 404


# ============== CANCEL TESTS ==============

def test_cancel_success():
    """Test cancelling a scheduled appointment"""
    response = client.patch("/referrals/appointments/1/cancel")
    assert response.status_code == 200
    data = response.json()
    assert data["Status"] == "Cancelled"


def test_cancel_non_scheduled():
    """Test cancelling a non-Scheduled appointment"""
    # First complete it
    client.patch("/referrals/appointments/1/complete")

    # Try to cancel
    response = client.patch("/referrals/appointments/1/cancel")
    assert response.status_code == 400
    assert "cannot cancel" in response.json()["detail"].lower()


def test_cancel_missing_appointment():
    """Test cancelling non-existent appointment"""
    response = client.patch("/referrals/appointments/999/cancel")
    assert response.status_code == 404
