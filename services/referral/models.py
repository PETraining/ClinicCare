from sqlalchemy import Column, DateTime, Integer, String

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
