from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Referral(Base):
    __tablename__ = "referrals"

    ReferralId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    ReferringDoctorId = Column(Integer, nullable=False)
    SpecialistId = Column(Integer, nullable=False)
    Reason = Column(String, nullable=False)
    Priority = Column(String, nullable=False)
    Status = Column(String, nullable=False, index=True)
    CreatedAt = Column(DateTime, nullable=False)
    UpdatedAt = Column(DateTime, nullable=False)

    appointments = relationship("Appointment", back_populates="referral", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    AppointmentId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    SpecialistId = Column(Integer, nullable=False)
    ScheduledDate = Column(DateTime, nullable=False)
    Location = Column(String, nullable=False)
    Status = Column(String, nullable=False, default="Scheduled", index=True)
    CreatedAt = Column(DateTime, nullable=False)
    UpdatedAt = Column(DateTime, nullable=False)

    referral = relationship("Referral", back_populates="appointments")
