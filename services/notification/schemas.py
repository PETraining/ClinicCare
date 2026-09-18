from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import Optional


class NotificationCreate(BaseModel):
    PatientId: int
    ReferralId: Optional[int] = None
    Title: str
    Message: str
    Type: str


class NotificationUpdate(BaseModel):
    Read: Optional[bool] = None


class NotificationRead(BaseModel):
    NotificationId: int
    PatientId: int
    ReferralId: Optional[int] = None
    Title: str
    Message: str
    Type: str
    Timestamp: datetime
    Read: bool

    class Config:
        from_attributes = True
