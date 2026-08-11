from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class QuestionType(str, Enum):
    text = "text"
    choice = "choice"


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    QuestionId: int
    QuestionText: str
    Type: QuestionType
    Choices: Optional[list[str]] = None
    ExistingAnswer: Optional[str] = None


class QuestionnaireRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    QuestionnaireId: int
    PatientId: int
    ReferralId: Optional[int] = None
    Title: str
    Status: str


class QuestionnaireDetailRead(QuestionnaireRead):
    questions: list[QuestionRead]


class AnswerSubmit(BaseModel):
    question_id: int
    answer: str
