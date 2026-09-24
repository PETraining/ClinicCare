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


class MedicationUpdate(BaseModel):
    """Schema for updating medication (partial fields - all optional)."""
    Name: Optional[str] = None
    Dosage: Optional[str] = None
    StockLevel: Optional[int] = None
    MinStockLevel: Optional[int] = None
    UnitPrice: Optional[float] = None
    IsDiscontinued: Optional[bool] = None
    LastRestockedAt: Optional[datetime] = None


class MedicationRead(MedicationBase):
    """Schema for reading/returning medication data."""
    MedicationId: int
    # PHASE 1: Stock Status Fields
    StockStatus: str  # InStock, LowStock, OutOfStock, Discontinued
    IsDiscontinued: bool = False
    LastRestockedAt: Optional[datetime] = None
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


# ============ REFILL REQUEST SCHEMAS (PHASE 2) - DEFINED EARLY ============

class RefillRequestBase(BaseModel):
    """Base refill request schema."""
    PrescriptionId: int
    PatientId: int


class RefillRequestCreate(RefillRequestBase):
    """Schema for creating a refill request."""
    pass


class RefillRequestRead(RefillRequestBase):
    """Schema for reading/returning refill request data."""
    RefillRequestId: int
    Status: str  # Pending, Approved, Fulfilled, Rejected
    RequestedAt: datetime
    ApprovedAt: Optional[datetime] = None
    ApprovedBy: Optional[int] = None
    FulfilledAt: Optional[datetime] = None
    FulfilledBy: Optional[int] = None
    RejectionReason: Optional[str] = None
    Notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============ PRESCRIPTION SCHEMAS ============

class PrescriptionBase(BaseModel):
    """Base prescription schema with common fields."""
    ReferralId: Optional[int] = None  # Optional - can be null for direct prescriptions
    PatientId: int
    PrescribingDoctorId: int
    Medications: List[dict]  # List of {medication_id, quantity, frequency, instructions}
    # PHASE 2: Refill Fields
    RefillsAllowed: int = 0
    RefillsRemaining: int = 0


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating a new prescription."""
    pass


class PrescriptionRead(PrescriptionBase):
    """Schema for reading/returning prescription data."""
    PrescriptionId: int
    Status: str
    LastRefillDate: Optional[datetime] = None
    CreatedAt: datetime
    UpdatedAt: datetime

    model_config = ConfigDict(from_attributes=True)


class PrescriptionDetailRead(PrescriptionRead):
    """Extended prescription schema with dispensing history and refills."""
    DispensingRecords: List[DispensingRecordRead] = []
    RefillRequests: List[RefillRequestRead] = []

    model_config = ConfigDict(from_attributes=True)


class PrescriptionUpdate(BaseModel):
    """Schema for updating prescription (partial fields)."""
    Status: Optional[str] = None
    RefillsAllowed: Optional[int] = None
    RefillsRemaining: Optional[int] = None


# ============ DISPENSING REQUEST/RESPONSE ============

class DispenseRequest(BaseModel):
    """Schema for dispensing medication request."""
    medication_id: int
    quantity_dispensed: int
    dispensed_by: str = "Pharmacy"  # Pharmacist name or ID


class DispenseResponse(BaseModel):
    """Schema for dispensing response."""
    success: bool
    dispensing_id: int
    remaining_stock: int
    message: str = "Medication dispensed successfully"


# ============ REFILL REQUEST APPROVAL/FULFILLMENT SCHEMAS ============

class RefillRequestApprove(BaseModel):
    """Schema for approving refill request."""
    ApprovedBy: int  # Doctor/Pharmacist ID
    Notes: Optional[str] = None


class RefillRequestFulfill(BaseModel):
    """Schema for fulfilling refill request."""
    FulfilledBy: int  # Pharmacist ID
    Notes: Optional[str] = None


class RefillRequestReject(BaseModel):
    """Schema for rejecting refill request."""
    RejectionReason: str
    RejectedBy: int


# ============ INVENTORY RESPONSE ============

class LowStockResponse(BaseModel):
    """Schema for low-stock inventory items."""
    medications: List[MedicationRead]
    count: int


class StockStatusResponse(BaseModel):
    """Schema for medications by stock status."""
    status: str
    medications: List[MedicationRead]
    count: int
