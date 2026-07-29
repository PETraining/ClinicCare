from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class EventType(str, Enum):
    submitted = "Submitted"
    accepted = "Accepted"
    rejected = "Rejected"
    completed = "Completed"


class NotificationBase(BaseModel):
    ReferralId: int
    EventType: EventType
    Message: str


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    NotificationId: int
    Timestamp: datetime
