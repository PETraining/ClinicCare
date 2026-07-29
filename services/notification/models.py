from sqlalchemy import Column, DateTime, Integer, String

from db import Base


class Notification(Base):
    __tablename__ = "notifications"

    NotificationId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, nullable=False, index=True)
    EventType = Column(String, nullable=False)
    Timestamp = Column(DateTime, nullable=False)
    Message = Column(String, nullable=False)
