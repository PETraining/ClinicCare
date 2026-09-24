import logging
from datetime import datetime
from sqlalchemy.orm import Session
from models import Medication, Prescription, DispensingRecord, StockStatus

logger = logging.getLogger(__name__)


def seed_if_empty(db: Session) -> None:
    """
    Seed database with sample data if empty.
    Includes PHASE 1 (Stock Status) and PHASE 2 (Refill System) data.

    Args:
        db: Database session
    """
    # Check if data already exists
    if db.query(Medication).first() is not None:
        logger.info("Database already seeded, skipping seed data creation")
        return

    logger.info("Seeding pharmacy database with sample data (PHASE 1 + PHASE 2)...")

    try:
        # ============ SEED MEDICATIONS (WITH PHASE 1: STOCK STATUS) ============
        medications = [
            Medication(
                Name="Aspirin",
                Dosage="500mg",
                StockLevel=50,
                MinStockLevel=10,
                UnitPrice=2.50,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Metformin",
                Dosage="1000mg",
                StockLevel=45,
                MinStockLevel=10,
                UnitPrice=3.75,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Lisinopril",
                Dosage="10mg",
                StockLevel=5,  # Low stock
                MinStockLevel=10,
                UnitPrice=4.20,
                StockStatus=StockStatus.LOW_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Amoxicillin",
                Dosage="500mg",
                StockLevel=30,
                MinStockLevel=10,
                UnitPrice=5.00,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Omeprazole",
                Dosage="20mg",
                StockLevel=2,  # Low stock
                MinStockLevel=10,
                UnitPrice=3.50,
                StockStatus=StockStatus.LOW_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Ibuprofen",
                Dosage="200mg",
                StockLevel=100,
                MinStockLevel=20,
                UnitPrice=1.50,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Atorvastatin",
                Dosage="20mg",
                StockLevel=8,  # Low stock
                MinStockLevel=10,
                UnitPrice=6.75,
                StockStatus=StockStatus.LOW_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Sertraline",
                Dosage="50mg",
                StockLevel=40,
                MinStockLevel=10,
                UnitPrice=4.99,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Levothyroxine",
                Dosage="50mcg",
                StockLevel=35,
                MinStockLevel=15,
                UnitPrice=2.99,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
            Medication(
                Name="Ciprofloxacin",
                Dosage="500mg",
                StockLevel=20,
                MinStockLevel=10,
                UnitPrice=7.50,
                StockStatus=StockStatus.IN_STOCK,
                IsDiscontinued=False,
            ),
        ]

        db.add_all(medications)
        db.commit()
        logger.info("✅ Successfully seeded 10 medications with stock status (PHASE 1)")

        # ============ SEED PRESCRIPTIONS (WITH PHASE 2: REFILL FIELDS) ============
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
                # PHASE 2: Refill fields
                RefillsAllowed=3,  # Can be refilled 3 times
                RefillsRemaining=3,
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
                # PHASE 2: Refill fields
                RefillsAllowed=-1,  # Unlimited refills
                RefillsRemaining=-1,
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
                # PHASE 2: Refill fields
                RefillsAllowed=0,  # No refills
                RefillsRemaining=0,
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
                # PHASE 2: Refill fields
                RefillsAllowed=0,  # No refills (short course)
                RefillsRemaining=0,
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
                # PHASE 2: Refill fields
                RefillsAllowed=5,  # Can be refilled 5 times
                RefillsRemaining=5,
            ),
        ]

        db.add_all(prescriptions)
        db.commit()
        logger.info("✅ Successfully seeded 5 prescriptions with refill tracking (PHASE 2)")

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
        logger.info("✅ Successfully seeded 3 dispensing records")

        logger.info("✅ PHARMACY DATABASE SEEDING COMPLETE!")
        logger.info("   • PHASE 1: Stock Status System - Active")
        logger.info("   • PHASE 2: Refill Tracking System - Active")
        logger.info("   • 10 medications | 5 prescriptions | 3 dispensing records")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error seeding pharmacy database: {str(e)}")
        raise
