from datetime import date, datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class DocumentType(str, Enum):
    lab_report = "Lab Report"
    imaging = "Imaging"
    referral_letter = "Referral Letter"
    discharge_summary = "Discharge Summary"
    pre_visit_form = "Pre-Visit Form"


class UploadedByEnum(str, Enum):
    clinician = "Clinician"
    patient = "Patient"


class DocumentBase(BaseModel):
    PatientId: int
    ReferralId: Optional[int] = None
    Type: DocumentType
    UploadedDate: date
    FileName: str


class DocumentCreate(DocumentBase):
    pass


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    DocumentId: int
    StoragePath: Optional[str] = None
    UploadedBy: UploadedByEnum = UploadedByEnum.clinician


class QuestionnaireRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    QuestionnaireId: int
    Title: str
    Description: Optional[str] = None
    QuestionsJson: str


class QuestionnaireResponseCreate(BaseModel):
    QuestionnaireId: int
    PatientId: int
    ReferralId: Optional[int] = None
    AnswersJson: str


class QuestionnaireResponseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ResponseId: int
    QuestionnaireId: int
    PatientId: int
    ReferralId: Optional[int] = None
    SubmittedAt: datetime
    AnswersJson: str
