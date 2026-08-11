from datetime import date

from sqlalchemy.orm import Session

from models import Allergy, ChronicCondition, Insurance, Medication, Patient

# Patients are seeded in this order, so PatientId assignments are:
# 1=Anjali Verma, 2=Rajesh Kumar, 3=Divya Menon, 4=Suresh Iyengar, 5=Neha Bhatt
SEED_PATIENTS = [
    dict(
        patient=dict(Name="Anjali Verma", DOB=date(1980, 4, 12), Gender="Female"),
        allergies=[dict(Substance="Penicillin", Severity="Severe")],
        conditions=[dict(Name="Type 2 Diabetes", DiagnosedDate=date(2015, 3, 1))],
        medications=[dict(Name="Metformin", Dosage="500mg", Active=True)],
        insurance=[
            dict(
                InsurerName="Star Health",
                PolicyNumber="SH-100234",
                GroupNumber="GRP-01",
                MemberId="MEM-100234",
                EffectiveDate=date(2024, 1, 1),
                TerminationDate=None,
            )
        ],
    ),
    dict(
        patient=dict(Name="Rajesh Kumar", DOB=date(1965, 9, 23), Gender="Male"),
        allergies=[dict(Substance="Peanuts", Severity="Mild")],
        conditions=[dict(Name="Hypertension", DiagnosedDate=date(2010, 6, 15))],
        medications=[dict(Name="Lisinopril", Dosage="10mg", Active=True)],
        insurance=[
            dict(
                InsurerName="HDFC Ergo",
                PolicyNumber="HE-556677",
                GroupNumber=None,
                MemberId="MEM-556677",
                EffectiveDate=date(2023, 6, 1),
                TerminationDate=None,
            )
        ],
    ),
    dict(
        patient=dict(Name="Divya Menon", DOB=date(1992, 1, 30), Gender="Female"),
        allergies=[dict(Substance="Latex", Severity="Moderate")],
        conditions=[dict(Name="Asthma", DiagnosedDate=date(2000, 5, 10))],
        medications=[dict(Name="Albuterol Inhaler", Dosage="90mcg/actuation", Active=True)],
        insurance=[
            dict(
                InsurerName="ICICI Lombard",
                PolicyNumber="IL-882910",
                GroupNumber="GRP-04",
                MemberId="MEM-882910",
                EffectiveDate=date(2022, 3, 15),
                TerminationDate=date(2026, 3, 14),
            )
        ],
    ),
    dict(
        patient=dict(Name="Suresh Iyengar", DOB=date(1978, 11, 5), Gender="Male"),
        allergies=[],
        conditions=[dict(Name="Coronary Artery Disease", DiagnosedDate=date(2020, 2, 20))],
        medications=[
            dict(Name="Atorvastatin", Dosage="20mg", Active=True),
            dict(Name="Aspirin", Dosage="81mg", Active=True),
        ],
        insurance=[
            dict(
                InsurerName="Star Health",
                PolicyNumber="SH-334455",
                GroupNumber="GRP-01",
                MemberId="MEM-334455",
                EffectiveDate=date(2021, 9, 1),
                TerminationDate=None,
            )
        ],
    ),
    dict(
        patient=dict(Name="Neha Bhatt", DOB=date(2001, 7, 18), Gender="Female"),
        allergies=[],
        conditions=[],
        medications=[],
        insurance=[],
    ),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Patient).count() > 0:
        return
    for row in SEED_PATIENTS:
        patient = Patient(**row["patient"])
        db.add(patient)
        db.flush()
        for a in row["allergies"]:
            db.add(Allergy(PatientId=patient.PatientId, **a))
        for c in row["conditions"]:
            db.add(ChronicCondition(PatientId=patient.PatientId, **c))
        for m in row["medications"]:
            db.add(Medication(PatientId=patient.PatientId, **m))
        for i in row["insurance"]:
            db.add(Insurance(PatientId=patient.PatientId, **i))
    db.commit()
