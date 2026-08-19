from datetime import datetime

from sqlalchemy.orm import Session

from models import Questionnaire

SEED_QUESTIONNAIRES = [
    dict(
        PatientId=3,
        ReferralId=5,
        Type="Pre-visit Health History",
        Title="Dermatology Pre-visit Questionnaire",
        Description="Please complete this health history form before your dermatology appointment.",
        CreatedAt=datetime(2026, 8, 15, 9, 0),
        CompletedAt=None,
        Status="Pending",
    ),
    dict(
        PatientId=2,
        ReferralId=6,
        Type="Pre-visit Health History",
        Title="Orthopedic Pre-visit Questionnaire",
        Description="Please complete this health history form before your orthopedic appointment.",
        CreatedAt=datetime(2026, 8, 16, 10, 0),
        CompletedAt=datetime(2026, 8, 18, 14, 30),
        Status="Completed",
    ),
    dict(
        PatientId=4,
        ReferralId=7,
        Type="Post-visit Follow-up",
        Title="Cardiology Follow-up Questionnaire",
        Description="Please answer these questions about your recovery and current symptoms.",
        CreatedAt=datetime(2026, 6, 26, 9, 0),
        CompletedAt=datetime(2026, 6, 26, 10, 15),
        Status="Completed",
    ),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Questionnaire).count() == 0:
        for row in SEED_QUESTIONNAIRES:
            db.add(Questionnaire(**row))
        db.commit()
