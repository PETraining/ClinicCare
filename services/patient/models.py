from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Patient(Base):
    __tablename__ = "patients"

    PatientId = Column(Integer, primary_key=True, index=True)
    Name = Column(String, nullable=False, index=True)
    DOB = Column(Date, nullable=False)
    Gender = Column(String, nullable=False)

    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    conditions = relationship("ChronicCondition", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")


class Allergy(Base):
    __tablename__ = "allergies"

    AllergyId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, ForeignKey("patients.PatientId"), nullable=False)
    Substance = Column(String, nullable=False)
    Severity = Column(String, nullable=False)

    patient = relationship("Patient", back_populates="allergies")


class ChronicCondition(Base):
    __tablename__ = "chronic_conditions"

    ConditionId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, ForeignKey("patients.PatientId"), nullable=False)
    Name = Column(String, nullable=False)
    DiagnosedDate = Column(Date, nullable=False)

    patient = relationship("Patient", back_populates="conditions")


class Medication(Base):
    __tablename__ = "medications"

    MedicationId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, ForeignKey("patients.PatientId"), nullable=False)
    Name = Column(String, nullable=False)
    Dosage = Column(String, nullable=False)
    Active = Column(Boolean, nullable=False, default=True)

    patient = relationship("Patient", back_populates="medications")
