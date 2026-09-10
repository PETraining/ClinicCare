from sqlalchemy import Column, Date, DateTime, Integer, String

from db import Base


class Document(Base):
    __tablename__ = "documents"

    DocumentId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    ReferralId = Column(Integer, nullable=True, index=True)
    Type = Column(String, nullable=False)
    UploadedDate = Column(Date, nullable=False)
    FileName = Column(String, nullable=False)
    StoragePath = Column(String, nullable=True)
    UploadedBy = Column(String, nullable=False, default="Clinician")


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    QuestionnaireId = Column(Integer, primary_key=True, index=True)
    Title = Column(String, nullable=False)
    Description = Column(String, nullable=True)
    QuestionsJson = Column(String, nullable=False)


class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"

    ResponseId = Column(Integer, primary_key=True, index=True)
    QuestionnaireId = Column(Integer, nullable=False, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    ReferralId = Column(Integer, nullable=True, index=True)
    SubmittedAt = Column(DateTime, nullable=False)
    AnswersJson = Column(String, nullable=False)
