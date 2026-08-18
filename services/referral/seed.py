from datetime import datetime

from sqlalchemy.orm import Session

from models import Appointment, Referral

# PatientId refs: 1=Anjali Verma, 2=Rajesh Kumar, 3=Divya Menon, 4=Suresh Iyengar, 5=Neha Bhatt
# DoctorId refs: 1=Krishnan/Cardiology, 2=Reddy/Ortho, 3=Nair/Derm, 4=Malhotra/Neuro, 5=Iyer/Endo,
#                6=Sharma/Family Medicine (referring doctor on all), 7=Desai/GI
#
# Statuses/timestamps are hand-kept in sync with the Notification Service's
# seed data (services don't share a DB, even at seed time).
# Appointments are linked to Accepted referrals (ReferralIds 5, 6)
SEED_APPOINTMENTS = [
    dict(ReferralId=5, PatientId=3, SpecialistId=3, ScheduledDate=datetime(2026, 8, 15, 10, 0),
         Location="Dermatology Clinic, Building A, Room 201", Status="Scheduled", CreatedAt=datetime(2026, 7, 25, 11, 0), UpdatedAt=datetime(2026, 7, 25, 11, 0)),
    dict(ReferralId=6, PatientId=2, SpecialistId=2, ScheduledDate=datetime(2026, 8, 20, 14, 30),
         Location="Orthopedic Center, Suite 300", Status="Scheduled", CreatedAt=datetime(2026, 7, 26, 9, 30), UpdatedAt=datetime(2026, 7, 26, 9, 30)),
]

SEED_REFERRALS = [
    dict(PatientId=1, ReferringDoctorId=6, SpecialistId=1, Reason="Evaluate new-onset chest pain and possible cardiac workup",
         Priority="Urgent", Status="Draft", CreatedAt=datetime(2026, 7, 25, 9, 0), UpdatedAt=datetime(2026, 7, 25, 9, 0)),
    dict(PatientId=3, ReferringDoctorId=6, SpecialistId=7, Reason="Persistent abdominal pain, rule out GI pathology",
         Priority="Routine", Status="Draft", CreatedAt=datetime(2026, 7, 26, 10, 0), UpdatedAt=datetime(2026, 7, 26, 10, 0)),
    dict(PatientId=2, ReferringDoctorId=6, SpecialistId=4, Reason="Recurrent headaches with neurological symptoms",
         Priority="Routine", Status="Submitted", CreatedAt=datetime(2026, 7, 19, 8, 0), UpdatedAt=datetime(2026, 7, 20, 9, 15)),
    dict(PatientId=1, ReferringDoctorId=6, SpecialistId=5, Reason="Poorly controlled Type 2 Diabetes, needs endocrinology management",
         Priority="Urgent", Status="Submitted", CreatedAt=datetime(2026, 7, 21, 9, 0), UpdatedAt=datetime(2026, 7, 22, 11, 0)),
    dict(PatientId=3, ReferringDoctorId=6, SpecialistId=3, Reason="Suspicious skin lesion for evaluation",
         Priority="Routine", Status="Accepted", CreatedAt=datetime(2026, 7, 9, 9, 0), UpdatedAt=datetime(2026, 7, 12, 14, 0)),
    dict(PatientId=2, ReferringDoctorId=6, SpecialistId=2, Reason="Chronic knee pain, evaluate for orthopedic intervention",
         Priority="Routine", Status="Accepted", CreatedAt=datetime(2026, 7, 10, 8, 0), UpdatedAt=datetime(2026, 7, 14, 16, 20)),
    dict(PatientId=4, ReferringDoctorId=6, SpecialistId=1, Reason="Post-MI follow up and risk stratification",
         Priority="Urgent", Status="Completed", CreatedAt=datetime(2026, 6, 14, 9, 0), UpdatedAt=datetime(2026, 6, 25, 15, 0)),
    dict(PatientId=4, ReferringDoctorId=6, SpecialistId=4, Reason="Evaluate transient numbness in extremities",
         Priority="Routine", Status="Completed", CreatedAt=datetime(2026, 6, 17, 9, 0), UpdatedAt=datetime(2026, 6, 28, 11, 45)),
    dict(PatientId=5, ReferringDoctorId=6, SpecialistId=7, Reason="Routine GI screening referral",
         Priority="Routine", Status="Rejected", CreatedAt=datetime(2026, 7, 4, 9, 0), UpdatedAt=datetime(2026, 7, 7, 12, 0)),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Referral).count() > 0:
        return
    for row in SEED_REFERRALS:
        db.add(Referral(**row))
    db.commit()

    if db.query(Appointment).count() == 0:
        for row in SEED_APPOINTMENTS:
            db.add(Appointment(**row))
        db.commit()
