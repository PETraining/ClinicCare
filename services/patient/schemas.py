from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AllergyBase(BaseModel):
    Substance: str
    Severity: str


class AllergyCreate(AllergyBase):
    pass


class AllergyRead(AllergyBase):
    model_config = ConfigDict(from_attributes=True)

    AllergyId: int
    PatientId: int


class ChronicConditionBase(BaseModel):
    Name: str
    DiagnosedDate: date


class ChronicConditionCreate(ChronicConditionBase):
    pass


class ChronicConditionRead(ChronicConditionBase):
    model_config = ConfigDict(from_attributes=True)

    ConditionId: int
    PatientId: int


class MedicationBase(BaseModel):
    Name: str
    Dosage: str
    Active: bool = True


class MedicationCreate(MedicationBase):
    pass


class MedicationRead(MedicationBase):
    model_config = ConfigDict(from_attributes=True)

    MedicationId: int
    PatientId: int


class InsuranceBase(BaseModel):
    InsurerName: str
    PolicyNumber: str
    GroupNumber: Optional[str] = None
    MemberId: str
    EffectiveDate: date
    TerminationDate: Optional[date] = None


class InsuranceCreate(InsuranceBase):
    pass


class InsuranceUpdate(InsuranceBase):
    pass


class InsuranceRead(InsuranceBase):
    model_config = ConfigDict(from_attributes=True)

    InsuranceId: int
    PatientId: int


class PatientBase(BaseModel):
    Name: str
    DOB: date
    Gender: str


class PatientCreate(PatientBase):
    allergies: list[AllergyCreate] = []
    conditions: list[ChronicConditionCreate] = []
    medications: list[MedicationCreate] = []
    insurance: list[InsuranceCreate] = []


class PatientRead(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    PatientId: int


class PatientDetail(PatientRead):
    allergies: list[AllergyRead] = []
    conditions: list[ChronicConditionRead] = []
    medications: list[MedicationRead] = []
    insurance: list[InsuranceRead] = []
