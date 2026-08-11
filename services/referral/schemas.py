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


class AuthorizationStatus(str, Enum):
    not_required = "Not Required"
    pending = "Pending"
    approved = "Approved"
    denied = "Denied"


class AuthorizationCreate(BaseModel):
    Status: AuthorizationStatus = AuthorizationStatus.pending
    DecisionNotes: Optional[str] = None


class AuthorizationUpdate(BaseModel):
    Status: AuthorizationStatus
    DecisionNotes: Optional[str] = None


class AuthorizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    AuthorizationId: int
    ReferralId: int
    Status: AuthorizationStatus
    RequestedDate: Optional[datetime] = None
    DecisionDate: Optional[datetime] = None
    DecisionNotes: Optional[str] = None
    CreatedAt: datetime
    UpdatedAt: datetime


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
    authorization: Optional[AuthorizationRead] = None
