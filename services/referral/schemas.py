from datetime import datetime
from enum import Enum

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
