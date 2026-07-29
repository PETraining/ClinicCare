from datetime import datetime

from sqlalchemy.orm import Session

from models import Notification

# Hand-authored to mirror the Referral Service's seeded referrals/statuses
# (referral IDs 1-9). Kept in sync manually since services never read each
# other's databases, even at seed time.
SEED_NOTIFICATIONS = [
    dict(ReferralId=3, EventType="Submitted", Timestamp=datetime(2026, 7, 20, 9, 15), Message="Referral #3 submitted for review."),
    dict(ReferralId=4, EventType="Submitted", Timestamp=datetime(2026, 7, 22, 11, 0), Message="Referral #4 submitted for review."),
    dict(ReferralId=5, EventType="Submitted", Timestamp=datetime(2026, 7, 10, 10, 30), Message="Referral #5 submitted for review."),
    dict(ReferralId=5, EventType="Accepted", Timestamp=datetime(2026, 7, 12, 14, 0), Message="Referral #5 accepted by specialist."),
    dict(ReferralId=6, EventType="Submitted", Timestamp=datetime(2026, 7, 11, 8, 45), Message="Referral #6 submitted for review."),
    dict(ReferralId=6, EventType="Accepted", Timestamp=datetime(2026, 7, 14, 16, 20), Message="Referral #6 accepted by specialist."),
    dict(ReferralId=7, EventType="Submitted", Timestamp=datetime(2026, 6, 15, 9, 0), Message="Referral #7 submitted for review."),
    dict(ReferralId=7, EventType="Accepted", Timestamp=datetime(2026, 6, 17, 13, 30), Message="Referral #7 accepted by specialist."),
    dict(ReferralId=7, EventType="Completed", Timestamp=datetime(2026, 6, 25, 15, 0), Message="Referral #7 marked completed."),
    dict(ReferralId=8, EventType="Submitted", Timestamp=datetime(2026, 6, 18, 9, 0), Message="Referral #8 submitted for review."),
    dict(ReferralId=8, EventType="Accepted", Timestamp=datetime(2026, 6, 20, 10, 15), Message="Referral #8 accepted by specialist."),
    dict(ReferralId=8, EventType="Completed", Timestamp=datetime(2026, 6, 28, 11, 45), Message="Referral #8 marked completed."),
    dict(ReferralId=9, EventType="Submitted", Timestamp=datetime(2026, 7, 5, 9, 30), Message="Referral #9 submitted for review."),
    dict(ReferralId=9, EventType="Rejected", Timestamp=datetime(2026, 7, 7, 12, 0), Message="Referral #9 rejected by specialist."),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Notification).count() > 0:
        return
    for row in SEED_NOTIFICATIONS:
        db.add(Notification(**row))
    db.commit()
