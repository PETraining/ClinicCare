from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from models import PrescriptionStatus, RefillRequestStatus


class PrescriptionLineCreate(BaseModel):
    medication_name: str
    quantity: int
    unit: str
    dosage: str
    frequency: str
    duration_days: int
    refill_count: int = 0
    notes: Optional[str] = None


class PrescriptionLineRead(BaseModel):
    id: int
    prescription_id: int
    medication_name: str
    quantity: int
    unit: str
    dosage: str
    frequency: str
    duration_days: int
    refill_count: int
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PrescriptionCreate(BaseModel):
    referral_id: str
    doctor_id: int
    patient_id: int
    lines: List[PrescriptionLineCreate]
    notes: Optional[str] = None


class PrescriptionRead(BaseModel):
    id: int
    referral_id: str
    doctor_id: int
    patient_id: int
    status: PrescriptionStatus
    issued_at: Optional[datetime] = None
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
    lines: List[PrescriptionLineRead] = []

    model_config = ConfigDict(from_attributes=True)


class PrescriptionStatusUpdate(BaseModel):
    status: PrescriptionStatus


class RefillRequestCreate(BaseModel):
    prescription_id: int
    requested_by: str
    notes: Optional[str] = None


class RefillRequestRead(BaseModel):
    id: int
    prescription_id: int
    requested_at: datetime
    approved_at: Optional[datetime] = None
    status: RefillRequestStatus
    requested_by: str
    approved_by: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
