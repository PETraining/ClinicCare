from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class QuestionnaireBase(BaseModel):
    PatientId: int
    ReferralId: Optional[int] = None
    Type: str
    Title: str
    Description: Optional[str] = None


class QuestionnaireCreate(QuestionnaireBase):
    CreatedAt: datetime
    Status: str = "Pending"


class QuestionnaireRead(QuestionnaireBase):
    model_config = ConfigDict(from_attributes=True)

    QuestionnaireId: int
    CreatedAt: datetime
    CompletedAt: Optional[datetime] = None
    Status: str


class QuestionnaireUpdate(BaseModel):
    Status: str
    CompletedAt: Optional[datetime] = None
