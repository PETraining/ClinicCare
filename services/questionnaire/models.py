from sqlalchemy import Column, DateTime, Integer, String, Text

from db import Base


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    QuestionnaireId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    ReferralId = Column(Integer, nullable=True, index=True)  # Kept for display context only
    Type = Column(String, nullable=False)  # e.g., "Pre-visit Health History", "Allergy Screening"
    Title = Column(String, nullable=False)
    Description = Column(Text, nullable=True)
    CreatedAt = Column(DateTime, nullable=False)
    CompletedAt = Column(DateTime, nullable=True)  # NULL if not completed
    Status = Column(String, nullable=False)  # "Pending", "Completed"
