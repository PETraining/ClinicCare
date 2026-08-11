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

    authorization = relationship(
        "Authorization", back_populates="referral", uselist=False, cascade="all, delete-orphan"
    )


class Authorization(Base):
    __tablename__ = "authorizations"

    AuthorizationId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, unique=True, index=True)
    Status = Column(String, nullable=False, index=True)
    RequestedDate = Column(DateTime, nullable=True)
    DecisionDate = Column(DateTime, nullable=True)
    DecisionNotes = Column(String, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)
    UpdatedAt = Column(DateTime, nullable=False)

    referral = relationship("Referral", back_populates="authorization")
