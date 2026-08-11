from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentType(str, Enum):
    lab_report = "Lab Report"
    imaging = "Imaging"
    referral_letter = "Referral Letter"
    discharge_summary = "Discharge Summary"


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
    FilePath: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
