from sqlalchemy import Column, Date, Integer, String

from db import Base


class Document(Base):
    __tablename__ = "documents"

    DocumentId = Column(Integer, primary_key=True, index=True)
    PatientId = Column(Integer, nullable=False, index=True)
    ReferralId = Column(Integer, nullable=True, index=True)
    Type = Column(String, nullable=False)
    UploadedDate = Column(Date, nullable=False)
    FileName = Column(String, nullable=False)
