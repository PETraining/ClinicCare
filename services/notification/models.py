<<<<<<< HEAD
﻿from sqlalchemy import Boolean, Column, DateTime, Integer, String
=======
from sqlalchemy import Boolean, Column, DateTime, Integer, String
>>>>>>> c8c0ad3c4d321465544637502323626ca3f53fe6

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
<<<<<<< HEAD
    Source = Column(String, nullable=True)
    Read = Column(Boolean, default=False, nullable=False)
=======
    PatientId = Column(Integer, nullable=True, index=True)
    Read = Column(Boolean, nullable=False, default=False)
>>>>>>> c8c0ad3c4d321465544637502323626ca3f53fe6
