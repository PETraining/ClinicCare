import logging
from datetime import datetime
from sqlalchemy.orm import Session
from models import Medication, Prescription, DispensingRecord

logger = logging.getLogger(__name__)


def seed_if_empty(db: Session) -> None:
    """
    Seed database with sample data if empty.

    Args:
        db: Database session
    """
    # Check if data already exists
    if db.query(Medication).first() is not None:
        logger.info("Database already seeded, skipping seed data creation")
        return

    logger.info("Seeding pharmacy database with sample data...")

    try:
        # ============ SEED MEDICATIONS ============
        medications = [
            Medication(
                Name="Aspirin",
                Dosage="500mg",
                StockLevel=50,
                MinStockLevel=10,
                UnitPrice=2.50,
            ),
            Medication(
                Name="Metformin",
                Dosage="1000mg",
                StockLevel=45,
                MinStockLevel=10,
                UnitPrice=3.75,
            ),
            Medication(
                Name="Lisinopril",
                Dosage="10mg",
                StockLevel=5,  # Low stock
                MinStockLevel=10,
                UnitPrice=4.20,
            ),
            Medication(
                Name="Amoxicillin",
                Dosage="500mg",
                StockLevel=30,
                MinStockLevel=10,
                UnitPrice=5.00,
            ),
            Medication(
                Name="Omeprazole",
                Dosage="20mg",
                StockLevel=2,  # Low stock
                MinStockLevel=10,
                UnitPrice=3.50,
            ),
            Medication(
                Name="Ibuprofen",
                Dosage="200mg",
                StockLevel=100,
                MinStockLevel=20,
                UnitPrice=1.50,
            ),
            Medication(
                Name="Atorvastatin",
                Dosage="20mg",
                StockLevel=8,  # Low stock
                MinStockLevel=10,
                UnitPrice=6.75,
            ),
            Medication(
                Name="Sertraline",
                Dosage="50mg",
                StockLevel=40,
                MinStockLevel=10,
                UnitPrice=4.99,
            ),
            Medication(
                Name="Levothyroxine",
                Dosage="50mcg",
                StockLevel=35,
                MinStockLevel=15,
                UnitPrice=2.99,
            ),
            Medication(
                Name="Ciprofloxacin",
                Dosage="500mg",
                StockLevel=20,
                MinStockLevel=10,
                UnitPrice=7.50,
            ),
        ]

        db.add_all(medications)
        db.commit()
        logger.info("Successfully seeded 10 medications")

        # ============ SEED PRESCRIPTIONS ============
        # Assuming referral service has seeded referrals 1-5
        prescriptions = [
            Prescription(
                ReferralId=1,
                PatientId=1,
                PrescribingDoctorId=10,
                Medications=[
                    {
                        "medication_id": 1,
                        "quantity": 30,
                        "frequency": "Once daily",
                        "instructions": "Take with food",
                    }
                ],
                Status="Active",
            ),
            Prescription(
                ReferralId=2,
                PatientId=2,
                PrescribingDoctorId=11,
                Medications=[
                    {
                        "medication_id": 2,
                        "quantity": 60,
                        "frequency": "Twice daily",
                        "instructions": "Take before meals",
                    }
                ],
                Status="Active",
            ),
            Prescription(
                ReferralId=3,
                PatientId=3,
                PrescribingDoctorId=12,
                Medications=[
                    {
                        "medication_id": 3,
                        "quantity": 30,
                        "frequency": "Once daily",
                        "instructions": "Take in the morning",
                    }
                ],
                Status="Completed",
            ),
            Prescription(
                ReferralId=4,
                PatientId=4,
                PrescribingDoctorId=10,
                Medications=[
                    {
                        "medication_id": 4,
                        "quantity": 14,
                        "frequency": "Twice daily for 7 days",
                        "instructions": "Complete full course",
                    }
                ],
                Status="Completed",
            ),
            Prescription(
                ReferralId=5,
                PatientId=5,
                PrescribingDoctorId=13,
                Medications=[
                    {
                        "medication_id": 8,
                        "quantity": 30,
                        "frequency": "Once daily",
                        "instructions": "Take at bedtime",
                    }
                ],
                Status="Active",
            ),
        ]

        db.add_all(prescriptions)
        db.commit()
        logger.info("Successfully seeded 5 prescriptions")

        # ============ SEED DISPENSING RECORDS ============
        dispensing_records = [
            DispensingRecord(
                PrescriptionId=3,
                MedicationId=3,
                QuantityDispensed=30,
                DispensedBy="PharmacyStaff_001",
            ),
            DispensingRecord(
                PrescriptionId=4,
                MedicationId=4,
                QuantityDispensed=14,
                DispensedBy="PharmacyStaff_002",
            ),
            DispensingRecord(
                PrescriptionId=4,
                MedicationId=4,
                QuantityDispensed=14,
                DispensedBy="PharmacyStaff_001",
            ),
        ]

        db.add_all(dispensing_records)
        db.commit()
        logger.info("Successfully seeded 3 dispensing records")

        logger.info("✅ Pharmacy database seeding complete!")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error seeding pharmacy database: {str(e)}")
        raise
