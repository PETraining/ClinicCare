from datetime import date

from sqlalchemy.orm import Session

from models import Allergy, ChronicCondition, Medication, Patient

# Patients are seeded in this order, so PatientId assignments are:
# 1=Anjali Verma, 2=Rajesh Kumar, 3=Divya Menon, 4=Suresh Iyengar, 5=Neha Bhatt
SEED_PATIENTS = [
    dict(
        patient=dict(Name="Anjali Verma", DOB=date(1980, 4, 12), Gender="Female"),
        allergies=[dict(Substance="Penicillin", Severity="Severe")],
        conditions=[dict(Name="Type 2 Diabetes", DiagnosedDate=date(2015, 3, 1))],
        medications=[dict(Name="Metformin", Dosage="500mg", Active=True)],
    ),
    dict(
        patient=dict(Name="Rajesh Kumar", DOB=date(1965, 9, 23), Gender="Male"),
        allergies=[dict(Substance="Peanuts", Severity="Mild")],
        conditions=[dict(Name="Hypertension", DiagnosedDate=date(2010, 6, 15))],
        medications=[dict(Name="Lisinopril", Dosage="10mg", Active=True)],
    ),
    dict(
        patient=dict(Name="Divya Menon", DOB=date(1992, 1, 30), Gender="Female"),
        allergies=[dict(Substance="Latex", Severity="Moderate")],
        conditions=[dict(Name="Asthma", DiagnosedDate=date(2000, 5, 10))],
        medications=[dict(Name="Albuterol Inhaler", Dosage="90mcg/actuation", Active=True)],
    ),
    dict(
        patient=dict(Name="Suresh Iyengar", DOB=date(1978, 11, 5), Gender="Male"),
        allergies=[],
        conditions=[dict(Name="Coronary Artery Disease", DiagnosedDate=date(2020, 2, 20))],
        medications=[
            dict(Name="Atorvastatin", Dosage="20mg", Active=True),
            dict(Name="Aspirin", Dosage="81mg", Active=True),
        ],
    ),
    dict(
        patient=dict(Name="Neha Bhatt", DOB=date(2001, 7, 18), Gender="Female"),
        allergies=[],
        conditions=[],
        medications=[],
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
    db.commit()
