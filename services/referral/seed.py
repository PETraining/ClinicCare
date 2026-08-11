from datetime import datetime

from sqlalchemy.orm import Session

from models import Authorization, Referral

# PatientId refs: 1=Anjali Verma, 2=Rajesh Kumar, 3=Divya Menon, 4=Suresh Iyengar, 5=Neha Bhatt
# DoctorId refs: 1=Krishnan/Cardiology, 2=Reddy/Ortho, 3=Nair/Derm, 4=Malhotra/Neuro, 5=Iyer/Endo,
#                6=Sharma/Family Medicine (referring doctor on all), 7=Desai/GI
#
# Statuses/timestamps are hand-kept in sync with the Notification Service's
# seed data (services don't share a DB, even at seed time).
# Each row's optional "Authorization" dict is popped off before constructing the
# Referral row and applied afterward, once ReferralId is known from the flush.
SEED_REFERRALS = [
    dict(PatientId=1, ReferringDoctorId=6, SpecialistId=1, Reason="Evaluate new-onset chest pain and possible cardiac workup",
         Priority="Urgent", Status="Draft", CreatedAt=datetime(2026, 7, 25, 9, 0), UpdatedAt=datetime(2026, 7, 25, 9, 0),
         Authorization=dict(Status="Not Required", RequestedDate=None, DecisionDate=None, DecisionNotes=None,
                             CreatedAt=datetime(2026, 7, 25, 9, 5), UpdatedAt=datetime(2026, 7, 25, 9, 5))),
    dict(PatientId=3, ReferringDoctorId=6, SpecialistId=7, Reason="Persistent abdominal pain, rule out GI pathology",
         Priority="Routine", Status="Draft", CreatedAt=datetime(2026, 7, 26, 10, 0), UpdatedAt=datetime(2026, 7, 26, 10, 0)),
    dict(PatientId=2, ReferringDoctorId=6, SpecialistId=4, Reason="Recurrent headaches with neurological symptoms",
         Priority="Routine", Status="Submitted", CreatedAt=datetime(2026, 7, 19, 8, 0), UpdatedAt=datetime(2026, 7, 20, 9, 15),
         Authorization=dict(Status="Pending", RequestedDate=datetime(2026, 7, 20, 9, 20), DecisionDate=None, DecisionNotes=None,
                             CreatedAt=datetime(2026, 7, 20, 9, 20), UpdatedAt=datetime(2026, 7, 20, 9, 20))),
    dict(PatientId=1, ReferringDoctorId=6, SpecialistId=5, Reason="Poorly controlled Type 2 Diabetes, needs endocrinology management",
         Priority="Urgent", Status="Submitted", CreatedAt=datetime(2026, 7, 21, 9, 0), UpdatedAt=datetime(2026, 7, 22, 11, 0),
         Authorization=dict(Status="Denied", RequestedDate=datetime(2026, 7, 22, 11, 5), DecisionDate=datetime(2026, 7, 23, 14, 0),
                             DecisionNotes="Insurer requires step therapy documentation before approving specialist visit.",
                             CreatedAt=datetime(2026, 7, 22, 11, 5), UpdatedAt=datetime(2026, 7, 23, 14, 0))),
    dict(PatientId=3, ReferringDoctorId=6, SpecialistId=3, Reason="Suspicious skin lesion for evaluation",
         Priority="Routine", Status="Accepted", CreatedAt=datetime(2026, 7, 9, 9, 0), UpdatedAt=datetime(2026, 7, 12, 14, 0),
         Authorization=dict(Status="Approved", RequestedDate=datetime(2026, 7, 9, 9, 30), DecisionDate=datetime(2026, 7, 10, 10, 0),
                             DecisionNotes="Approved for one specialist visit.",
                             CreatedAt=datetime(2026, 7, 9, 9, 30), UpdatedAt=datetime(2026, 7, 10, 10, 0))),
    dict(PatientId=2, ReferringDoctorId=6, SpecialistId=2, Reason="Chronic knee pain, evaluate for orthopedic intervention",
         Priority="Routine", Status="Accepted", CreatedAt=datetime(2026, 7, 10, 8, 0), UpdatedAt=datetime(2026, 7, 14, 16, 20),
         Authorization=dict(Status="Approved", RequestedDate=datetime(2026, 7, 10, 8, 30), DecisionDate=datetime(2026, 7, 11, 9, 0),
                             DecisionNotes="Approved.", CreatedAt=datetime(2026, 7, 10, 8, 30), UpdatedAt=datetime(2026, 7, 11, 9, 0))),
    dict(PatientId=4, ReferringDoctorId=6, SpecialistId=1, Reason="Post-MI follow up and risk stratification",
         Priority="Urgent", Status="Completed", CreatedAt=datetime(2026, 6, 14, 9, 0), UpdatedAt=datetime(2026, 6, 25, 15, 0),
         Authorization=dict(Status="Approved", RequestedDate=datetime(2026, 6, 14, 9, 30), DecisionDate=datetime(2026, 6, 15, 10, 0),
                             DecisionNotes="Approved.", CreatedAt=datetime(2026, 6, 14, 9, 30), UpdatedAt=datetime(2026, 6, 15, 10, 0))),
    dict(PatientId=4, ReferringDoctorId=6, SpecialistId=4, Reason="Evaluate transient numbness in extremities",
         Priority="Routine", Status="Completed", CreatedAt=datetime(2026, 6, 17, 9, 0), UpdatedAt=datetime(2026, 6, 28, 11, 45),
         Authorization=dict(Status="Not Required", RequestedDate=None, DecisionDate=None, DecisionNotes=None,
                             CreatedAt=datetime(2026, 6, 17, 9, 5), UpdatedAt=datetime(2026, 6, 17, 9, 5))),
    dict(PatientId=5, ReferringDoctorId=6, SpecialistId=7, Reason="Routine GI screening referral",
         Priority="Routine", Status="Rejected", CreatedAt=datetime(2026, 7, 4, 9, 0), UpdatedAt=datetime(2026, 7, 7, 12, 0)),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Referral).count() > 0:
        return
    for row in SEED_REFERRALS:
        row = dict(row)
        authorization = row.pop("Authorization", None)
        referral = Referral(**row)
        db.add(referral)
        db.flush()
        if authorization is not None:
            db.add(Authorization(ReferralId=referral.ReferralId, **authorization))
    db.commit()
