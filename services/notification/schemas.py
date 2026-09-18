from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventType(str, Enum):
    submitted = "Submitted"
    accepted = "Accepted"
    rejected = "Rejected"
    completed = "Completed"
    authorization_updated = "AuthorizationUpdated"
    lab_order_created = "LabOrderCreated"
    lab_result_critical = "LabResultCritical"
    lab_result_completed = "LabResultCompleted"


class NotificationBase(BaseModel):
    PatientId: Optional[int] = None
    # Optional because not every event (e.g. lab-service events) is tied to a referral.
    ReferralId: Optional[int] = None
    EventType: EventType
    Message: str
<<<<<<< HEAD
    Source: Optional[str] = None
=======
    PatientId: Optional[int] = None
>>>>>>> c8c0ad3c4d321465544637502323626ca3f53fe6
    Read: bool = False


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    NotificationId: int
    Timestamp: datetime


class NotificationUpdate(BaseModel):
    Read: bool
