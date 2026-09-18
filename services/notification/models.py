
﻿from sqlalchemy import Boolean, Column, DateTime, Integer, String

from sqlalchemy import Boolean, Column, DateTime, Integer, String


from db import Base


class Notification(Base):
    __tablename__ = "notifications"

    NotificationId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=True, index=True)
    # Nullable: not every event (e.g. lab-service events) is tied to a referral.
    ReferralId = Column(Integer, nullable=True, index=True)
    EventType = Column(String, nullable=False)
    Timestamp = Column(DateTime, nullable=False)
    Message = Column(String, nullable=False)

    Source = Column(String, nullable=True)
    Read = Column(Boolean, default=False, nullable=False)

    PatientId = Column(Integer, nullable=True, index=True)
    Read = Column(Boolean, nullable=False, default=False)

