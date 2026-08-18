from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


# ============ MEDICATION SCHEMAS ============

class MedicationBase(BaseModel):
    """Base medication schema with common fields."""
    Name: str
    Dosage: str
    StockLevel: int
    MinStockLevel: int = 10
    UnitPrice: float = 0.0


class MedicationCreate(MedicationBase):
    """Schema for creating a new medication."""
    pass


class MedicationRead(MedicationBase):
    """Schema for reading/returning medication data."""
    MedicationId: int
    CreatedAt: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ MEDICATION IN PRESCRIPTION ============

class MedicationInPrescription(BaseModel):
    """Schema for medications within a prescription."""
    medication_id: int
    quantity: int
    frequency: str
    instructions: Optional[str] = None


# ============ DISPENSING RECORD SCHEMAS ============

class DispensingRecordBase(BaseModel):
    """Base dispensing record schema."""
    MedicationId: int
    QuantityDispensed: int


class DispensingRecordCreate(DispensingRecordBase):
    """Schema for creating a dispensing record."""
    pass


class DispensingRecordRead(DispensingRecordBase):
    """Schema for reading/returning dispensing record data."""
    DispensingId: int
    PrescriptionId: int
    DispensedAt: datetime
    DispensedBy: str

    model_config = ConfigDict(from_attributes=True)


# ============ PRESCRIPTION SCHEMAS ============

class PrescriptionBase(BaseModel):
    """Base prescription schema with common fields."""
    ReferralId: int
    PatientId: int
    PrescribingDoctorId: int
    Medications: List[dict]  # List of {medication_id, quantity, frequency, instructions}


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating a new prescription."""
    pass


class PrescriptionRead(PrescriptionBase):
    """Schema for reading/returning prescription data."""
    PrescriptionId: int
    Status: str
    CreatedAt: datetime
    UpdatedAt: datetime

    model_config = ConfigDict(from_attributes=True)


class PrescriptionDetailRead(PrescriptionRead):
    """Extended prescription schema with dispensing history."""
    DispensingRecords: List[DispensingRecordRead] = []

    model_config = ConfigDict(from_attributes=True)


class PrescriptionUpdate(BaseModel):
    """Schema for updating prescription (partial fields)."""
    Status: Optional[str] = None


# ============ DISPENSING REQUEST/RESPONSE ============

class DispenseRequest(BaseModel):
    """Schema for dispensing medication request."""
    medication_id: int
    quantity_dispensed: int


class DispenseResponse(BaseModel):
    """Schema for dispensing response."""
    success: bool
    dispensing_id: int
    remaining_stock: int
    message: str = "Medication dispensed successfully"


# ============ INVENTORY RESPONSE ============

class LowStockResponse(BaseModel):
    """Schema for low-stock inventory items."""
    medications: List[MedicationRead]
    count: int
