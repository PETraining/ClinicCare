from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from db import Base


class Medication(Base):
    """Medication inventory model."""
    __tablename__ = "medications"

    MedicationId = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True, nullable=False)
    Dosage = Column(String, nullable=False)
    StockLevel = Column(Integer, default=0)
    MinStockLevel = Column(Integer, default=10)
    UnitPrice = Column(Float, default=0.0)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    # Relationships
    DispensingRecords = relationship(
        "DispensingRecord",
        back_populates="Medication",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Medication(MedicationId={self.MedicationId}, Name={self.Name}, StockLevel={self.StockLevel})>"


class Prescription(Base):
    """Prescription model - created from referrals."""
    __tablename__ = "prescriptions"

    PrescriptionId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, index=True, nullable=False)
    PatientId = Column(Integer, index=True, nullable=False)
    PrescribingDoctorId = Column(Integer, nullable=False)
    Medications = Column(JSON, nullable=False)  # [{medication_id, quantity, frequency, instructions}]
    Status = Column(String, default="Active", index=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    DispensingRecords = relationship(
        "DispensingRecord",
        back_populates="Prescription",
        cascade="all, delete-orphan",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_referral_id", "ReferralId"),
        Index("idx_patient_id", "PatientId"),
        Index("idx_status", "Status"),
    )

    def __repr__(self):
        return f"<Prescription(PrescriptionId={self.PrescriptionId}, ReferralId={self.ReferralId}, Status={self.Status})>"


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
