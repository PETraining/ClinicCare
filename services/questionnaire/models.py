from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from db import Base


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    QuestionnaireId = Column(Integer, primary_key=True, index=True)
    # PatientId is stored directly here (rather than resolved via ReferralId -> Referral.PatientId)
    # to avoid introducing cross-service HTTP calls; ReferralId is kept for display only.
    PatientId = Column(Integer, nullable=False, index=True)
    ReferralId = Column(Integer, nullable=True, index=True)
    Title = Column(String, nullable=False)
    Status = Column(String, nullable=False)  # "Pending" | "Completed"

    questions = relationship("Question", back_populates="questionnaire", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    QuestionId = Column(Integer, primary_key=True, index=True)
    QuestionnaireId = Column(Integer, ForeignKey("questionnaires.QuestionnaireId"), nullable=False, index=True)
    QuestionText = Column(String, nullable=False)
    Type = Column(String, nullable=False)  # "text" | "choice"
    Choices = Column(String, nullable=True)  # comma-separated options, only set when Type == "choice"

    questionnaire = relationship("Questionnaire", back_populates="questions")


class PatientAnswer(Base):
    __tablename__ = "patient_answers"

    AnswerId = Column(Integer, primary_key=True, index=True)
    QuestionId = Column(Integer, ForeignKey("questions.QuestionId"), nullable=False, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    Answer = Column(String, nullable=False)
