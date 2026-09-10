from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

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


class ReferralStatusHistory(Base):
    """Additive table (Patient Portal / Sub-Feature 2). Tracks status transitions
    for patient-facing timeline view. Populated automatically on each transition."""

    __tablename__ = "referral_status_history"

    HistoryId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, index=True)
    OldStatus = Column(String, nullable=False)
    NewStatus = Column(String, nullable=False)
    ChangedAt = Column(DateTime, nullable=False)
    Reason = Column(String, nullable=True)


class Appointment(Base):
    """Additive table (Patient Portal / Sub-Feature 1). Does not alter the
    shape of the existing `referrals` table used by the clinician UI."""

    __tablename__ = "appointments"

    AppointmentId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, index=True)
    PatientId = Column(Integer, nullable=False, index=True)  # denormalized for simple filtering, mirrors Referral.PatientId
    ScheduledAt = Column(DateTime, nullable=False)
    Location = Column(String, nullable=False)
    CheckInInstructions = Column(String, nullable=True)
