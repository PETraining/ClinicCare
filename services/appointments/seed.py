from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Appointment


def seed_if_empty(db: Session) -> None:
    if db.query(Appointment).count() > 0:
        return

    appointments = [
        Appointment(
            PatientId=3,
            ReferralId=5,
            DoctorId=3,
            ScheduledDate=datetime(2026, 8, 25, 14, 0),
            Location="Dermatology Clinic, Room 201",
            Status="Scheduled",
        ),
        Appointment(
            PatientId=2,
            ReferralId=6,
            DoctorId=2,
            ScheduledDate=datetime(2026, 8, 28, 10, 30),
            Location="Orthopedic Surgery, Room 105",
            Status="Scheduled",
        ),
        Appointment(
            PatientId=4,
            ReferralId=7,
            DoctorId=1,
            ScheduledDate=datetime(2026, 6, 25, 15, 0),
            Location="Cardiology Center, Room 304",
            Status="Completed",
        ),
        Appointment(
            PatientId=4,
            ReferralId=8,
            DoctorId=4,
            ScheduledDate=datetime(2026, 6, 28, 11, 45),
            Location="Neurology Clinic, Room 202",
            Status="Completed",
        ),
    ]

    db.add_all(appointments)
    db.commit()
