from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class PrescriptionStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    FULFILLED = "fulfilled"
    PARTIAL_FULFILLED = "partial_fulfilled"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class RefillRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True)
    referral_id = Column(String, nullable=False)
    doctor_id = Column(Integer, nullable=False)
    patient_id = Column(Integer, nullable=False)
    status = Column(SQLEnum(PrescriptionStatus), default=PrescriptionStatus.DRAFT, nullable=False)
    issued_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)


class PrescriptionLine(Base):
    __tablename__ = "prescription_lines"

    id = Column(Integer, primary_key=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    medication_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    refill_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)


class RefillRequest(Base):
    __tablename__ = "refill_requests"

    id = Column(Integer, primary_key=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(RefillRequestStatus), default=RefillRequestStatus.PENDING, nullable=False)
    requested_by = Column(String, nullable=False)
    approved_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
