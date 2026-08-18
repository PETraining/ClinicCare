from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AppointmentStatus(str, Enum):
    scheduled = "Scheduled"
    completed = "Completed"
    cancelled = "Cancelled"


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    AppointmentId: int
    PatientId: int
    ReferralId: Optional[int] = None
    DoctorId: int
    ScheduledDate: datetime
    Location: str
    Status: str
