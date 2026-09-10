from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class Priority(str, Enum):
    routine = "Routine"
    urgent = "Urgent"
    emergent = "Emergent"


class Status(str, Enum):
    draft = "Draft"
    submitted = "Submitted"
    accepted = "Accepted"
    rejected = "Rejected"
    completed = "Completed"


class ReferralBase(BaseModel):
    PatientId: int
    ReferringDoctorId: int
    SpecialistId: int
    Reason: str
    Priority: Priority


class ReferralCreate(ReferralBase):
    pass


class ReferralRead(ReferralBase):
    model_config = ConfigDict(from_attributes=True)

    ReferralId: int
    Status: Status
    CreatedAt: datetime
    UpdatedAt: datetime


class AppointmentBase(BaseModel):
    ReferralId: int
    PatientId: int
    ScheduledAt: datetime
    Location: str
    CheckInInstructions: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentRead(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    AppointmentId: int


class ReferralStatusHistoryBase(BaseModel):
    ReferralId: int
    OldStatus: str
    NewStatus: str
    ChangedAt: datetime
    Reason: Optional[str] = None


class ReferralStatusHistoryRead(ReferralStatusHistoryBase):
    model_config = ConfigDict(from_attributes=True)

    HistoryId: int
