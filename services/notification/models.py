from sqlalchemy import Boolean, Column, DateTime, Integer, String
from datetime import datetime
from db import Base


class Notification(Base):
    __tablename__ = "notifications"

    NotificationId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=False)
    ReferralId = Column(Integer, nullable=True)
    Title = Column(String, nullable=False)
    Message = Column(String, nullable=False)
    Type = Column(String, nullable=False)
    Timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    Read = Column(Boolean, default=False, nullable=False)
