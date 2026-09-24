from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from db import Base


class StockStatus(str, Enum):
    """Enumeration for medication stock status (PHASE 1)"""
    IN_STOCK = "InStock"
    LOW_STOCK = "LowStock"
    OUT_OF_STOCK = "OutOfStock"
    DISCONTINUED = "Discontinued"


class Medication(Base):
    """Medication inventory model."""
    __tablename__ = "medications"

    MedicationId = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True, nullable=False)
    Dosage = Column(String, nullable=False)
    StockLevel = Column(Integer, default=0)
    MinStockLevel = Column(Integer, default=10)
    UnitPrice = Column(Float, default=0.0)

    # PHASE 1: Stock Status Fields
    StockStatus = Column(String, default=StockStatus.OUT_OF_STOCK)
    IsDiscontinued = Column(Boolean, default=False)
    LastRestockedAt = Column(DateTime, nullable=True)

    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    DispensingRecords = relationship(
        "DispensingRecord",
        back_populates="Medication",
        cascade="all, delete-orphan",
    )

    @property
    def current_stock_status(self) -> StockStatus:
        """Calculate current stock status based on stock levels"""
        if self.IsDiscontinued:
            return StockStatus.DISCONTINUED
        elif self.StockLevel == 0:
            return StockStatus.OUT_OF_STOCK
        elif self.StockLevel < self.MinStockLevel:
            return StockStatus.LOW_STOCK
        else:
            return StockStatus.IN_STOCK

    def __repr__(self):
        return f"<Medication(MedicationId={self.MedicationId}, Name={self.Name}, Status={self.current_stock_status}, Stock={self.StockLevel})>"


class Prescription(Base):
    """Prescription model - created from referrals or directly by doctors."""
    __tablename__ = "prescriptions"

    PrescriptionId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, index=True, nullable=True)  # Optional - can be NULL for direct prescriptions
    PatientId = Column(Integer, index=True, nullable=False)
    PrescribingDoctorId = Column(Integer, nullable=False)
    Medications = Column(JSON, nullable=False)  # [{medication_id, quantity, frequency, instructions}]
    Status = Column(String, default="Draft", index=True)  # Draft, Prescribed, PartiallyFulfilled, Fulfilled, Voided

    # PHASE 2: Refill Tracking Fields
    RefillsAllowed = Column(Integer, default=0)        # 0=no refill, -1=unlimited
    RefillsRemaining = Column(Integer, default=0)      # How many refills left
    LastRefillDate = Column(DateTime, nullable=True)   # When was it last refilled

    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    DispensingRecords = relationship(
        "DispensingRecord",
        back_populates="Prescription",
        cascade="all, delete-orphan",
    )
    RefillRequests = relationship(
        "RefillRequest",
        back_populates="Prescription",
        cascade="all, delete-orphan",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_referral_id", "ReferralId"),
        Index("idx_patient_id", "PatientId"),
        Index("idx_status", "Status"),
    )

    @property
    def fulfillment_status(self) -> dict:
        """
        Calculate fulfillment status based on dispensing records.
        Returns: {status, prescribed_total, dispensed_total, percentage}
        """
        if not self.Medications:
            return {"status": "Fulfilled", "prescribed_total": 0, "dispensed_total": 0, "percentage": 100}

        prescribed_total = sum(med.get('quantity', 0) for med in self.Medications)
        dispensed_total = sum(record.QuantityDispensed for record in self.DispensingRecords)

        if dispensed_total == 0:
            fulfillment_status = "Prescribed"
        elif dispensed_total >= prescribed_total:
            fulfillment_status = "Fulfilled"
        else:
            fulfillment_status = "PartiallyFulfilled"

        percentage = int((dispensed_total / prescribed_total * 100)) if prescribed_total > 0 else 0

        return {
            "status": fulfillment_status,
            "prescribed_total": prescribed_total,
            "dispensed_total": dispensed_total,
            "percentage": percentage,
        }

    def __repr__(self):
        return f"<Prescription(Id={self.PrescriptionId}, Patient={self.PatientId}, Status={self.Status}, Refills={self.RefillsRemaining})>"


class DispensingRecord(Base):
    """Dispensing record - audit trail of medications dispensed."""
    __tablename__ = "dispensing_records"

    DispensingId = Column(Integer, primary_key=True, index=True)
    PrescriptionId = Column(
        Integer,
        ForeignKey("prescriptions.PrescriptionId"),
        nullable=False,
        index=True,
    )
    MedicationId = Column(
        Integer,
        ForeignKey("medications.MedicationId"),
        nullable=False,
        index=True,
    )
    QuantityDispensed = Column(Integer, nullable=False)
    DispensedAt = Column(DateTime, default=datetime.utcnow)
    DispensedBy = Column(String, default="Pharmacy")

    # Relationships
    Prescription = relationship(
        "Prescription",
        back_populates="DispensingRecords",
    )
    Medication = relationship(
        "Medication",
        back_populates="DispensingRecords",
    )

    def __repr__(self):
        return f"<DispensingRecord(DispensingId={self.DispensingId}, PrescriptionId={self.PrescriptionId}, MedicationId={self.MedicationId})>"


class RefillRequest(Base):
    """PHASE 2: Track refill requests from patients."""
    __tablename__ = "refill_requests"

    RefillRequestId = Column(Integer, primary_key=True, index=True)
    PrescriptionId = Column(
        Integer,
        ForeignKey("prescriptions.PrescriptionId"),
        nullable=False,
        index=True,
    )
    PatientId = Column(Integer, nullable=False, index=True)
    RequestedAt = Column(DateTime, default=datetime.utcnow)
    Status = Column(String, default="Pending", index=True)  # Pending, Approved, Fulfilled, Rejected

    # Approval details
    ApprovedAt = Column(DateTime, nullable=True)
    ApprovedBy = Column(Integer, nullable=True)  # Doctor/Pharmacist ID

    # Fulfillment details
    FulfilledAt = Column(DateTime, nullable=True)
    FulfilledBy = Column(Integer, nullable=True)  # Pharmacist ID

    # Additional info
    RejectionReason = Column(String, nullable=True)
    Notes = Column(String, nullable=True)

    # Relationships
    Prescription = relationship(
        "Prescription",
        back_populates="RefillRequests",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_refill_prescription_id", "PrescriptionId"),
        Index("idx_refill_patient_id", "PatientId"),
        Index("idx_refill_status", "Status"),
        Index("idx_refill_requested_at", "RequestedAt"),
    )

    def __repr__(self):
        return f"<RefillRequest(Id={self.RefillRequestId}, Rx={self.PrescriptionId}, Status={self.Status})>"
