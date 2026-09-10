from datetime import datetime
from enum import Enum
from typing import Optional

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
    PatientId: Optional[int] = None
    Read: bool = False


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    NotificationId: int
    Timestamp: datetime
