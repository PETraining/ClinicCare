from datetime import date

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


class PatientBase(BaseModel):
    Name: str
    DOB: date
    Gender: str


class PatientCreate(PatientBase):
    allergies: list[AllergyCreate] = []
    conditions: list[ChronicConditionCreate] = []
    medications: list[MedicationCreate] = []


class PatientRead(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    PatientId: int
    IsReferralPatient: bool = False  # Indicates if patient came from a referral
    LastReferralId: int | None = None  # Latest referral ID


class PatientDetail(PatientRead):
    allergies: list[AllergyRead] = []
    conditions: list[ChronicConditionRead] = []
    medications: list[MedicationRead] = []
