from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from db import Base


class Appointment(Base):
    __tablename__ = "appointments"

    AppointmentId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    ReferralId = Column(Integer, nullable=True, index=True)
    DoctorId = Column(Integer, nullable=False, index=True)
    ScheduledDate = Column(DateTime, nullable=False)
    Location = Column(String, nullable=False)
    Status = Column(String, nullable=False)  # "Scheduled" | "Completed" | "Cancelled"
