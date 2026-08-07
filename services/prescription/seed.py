from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models


def seed_if_empty(db: Session) -> None:
    if db.query(models.Prescription).first() is not None:
        return

    expires_at = datetime.utcnow() + timedelta(days=365)

    presc1 = models.Prescription(
        referral_id="ref-001",
        doctor_id=1,
        patient_id=1,
        status=models.PrescriptionStatus.ISSUED,
        issued_at=datetime.utcnow(),
        expires_at=expires_at,
        notes="Post-consultation prescription",
    )
    db.add(presc1)
    db.flush()

    line1 = models.PrescriptionLine(
        prescription_id=presc1.id,
        medication_name="Amoxicillin",
        quantity=30,
        unit="tablets",
        dosage="500mg",
        frequency="1x daily",
        duration_days=10,
        refill_count=2,
        notes="Take with food",
    )
    db.add(line1)

    presc2 = models.Prescription(
        referral_id="ref-002",
        doctor_id=2,
        patient_id=2,
        status=models.PrescriptionStatus.DRAFT,
        expires_at=expires_at,
        notes="For follow-up consultation",
    )
    db.add(presc2)
    db.flush()

    line2 = models.PrescriptionLine(
        prescription_id=presc2.id,
        medication_name="Ibuprofen",
        quantity=20,
        unit="tablets",
        dosage="200mg",
        frequency="2x daily",
        duration_days=5,
        notes="For pain management",
    )
    db.add(line2)

    presc3 = models.Prescription(
        referral_id="ref-003",
        doctor_id=1,
        patient_id=3,
        status=models.PrescriptionStatus.ISSUED,
        issued_at=datetime.utcnow(),
        expires_at=expires_at,
    )
    db.add(presc3)
    db.flush()

    line3a = models.PrescriptionLine(
        prescription_id=presc3.id,
        medication_name="Metformin",
        quantity=60,
        unit="tablets",
        dosage="500mg",
        frequency="2x daily",
        duration_days=30,
    )
    db.add(line3a)

    line3b = models.PrescriptionLine(
        prescription_id=presc3.id,
        medication_name="Lisinopril",
        quantity=30,
        unit="tablets",
        dosage="10mg",
        frequency="1x daily",
        duration_days=30,
    )
    db.add(line3b)

    db.commit()
