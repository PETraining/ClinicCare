from models import Notification
from datetime import datetime


def seed_notifications(db):
    notifications = [
        Notification(
            PatientId=1,
            ReferralId=1,
            Title="Referral Received",
            Message="You have received a new referral to Cardiology",
            Type="info",
            Timestamp=datetime.utcnow(),
            Read=False,
        ),
        Notification(
            PatientId=1,
            ReferralId=None,
            Title="Lab Results Available",
            Message="Your lab test results are ready for review",
            Type="success",
            Timestamp=datetime.utcnow(),
            Read=False,
        ),
        Notification(
            PatientId=2,
            ReferralId=2,
            Title="Appointment Reminder",
            Message="Your appointment with Dr. Smith is tomorrow at 2 PM",
            Type="reminder",
            Timestamp=datetime.utcnow(),
            Read=True,
        ),
    ]
    
    for notif in notifications:
        db.add(notif)
    
    db.commit()
