import logging
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from db import Base, engine, get_db
from models import Medication, Prescription, DispensingRecord
from schemas import (
    MedicationRead,
    MedicationCreate,
    PrescriptionRead,
    PrescriptionDetailRead,
    PrescriptionCreate,
    PrescriptionUpdate,
    DispensingRecordRead,
    DispenseRequest,
    DispenseResponse,
    LowStockResponse,
)
from seed import seed_if_empty
from clients import update_patient_medication, record_notification

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Pharmacy Service",
    description="Prescription and medication inventory management",
    version="1.0.0",
)

# Create database tables
Base.metadata.create_all(bind=engine)


# ============ STARTUP EVENT ============

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed sample data."""
    logger.info("🚀 Pharmacy Service starting up...")
    db = next(get_db())
    try:
        seed_if_empty(db)
        logger.info("✅ Pharmacy Service ready!")
    finally:
        db.close()


# ============ HEALTH CHECK ============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "pharmacy"}


# ============ MEDICATION ENDPOINTS ============

@app.get("/medications", response_model=List[MedicationRead])
async def list_medications(
    low_stock: Optional[bool] = Query(False, description="Filter to low-stock items only"),
    db: Session = Depends(get_db),
):
    """
    List all medications with optional low-stock filtering.

    - **low_stock**: If true, only return medications below MinStockLevel
    """
    query = db.query(Medication)

    if low_stock:
        query = query.filter(Medication.StockLevel < Medication.MinStockLevel)

    medications = query.all()
    return medications


@app.get("/medications/{medication_id}", response_model=MedicationRead)
async def get_medication(
    medication_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific medication by ID."""
    medication = db.query(Medication).filter(
        Medication.MedicationId == medication_id
    ).first()

    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    return medication


@app.post("/medications", response_model=MedicationRead, status_code=201)
async def create_medication(
    medication: MedicationCreate,
    db: Session = Depends(get_db),
):
    """Create a new medication in inventory."""
    db_medication = Medication(**medication.model_dump())
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)

    logger.info(f"Created medication: {db_medication.Name} (ID: {db_medication.MedicationId})")
    return db_medication


@app.patch("/medications/{medication_id}", response_model=MedicationRead)
async def update_medication(
    medication_id: int,
    medication_update: MedicationCreate,
    db: Session = Depends(get_db),
):
    """Update an existing medication."""
    db_medication = db.query(Medication).filter(
        Medication.MedicationId == medication_id
    ).first()

    if not db_medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    # Update fields
    for key, value in medication_update.model_dump(exclude_unset=True).items():
        setattr(db_medication, key, value)

    db.commit()
    db.refresh(db_medication)

    logger.info(f"Updated medication: {db_medication.Name} (ID: {medication_id})")
    return db_medication


# ============ PRESCRIPTION ENDPOINTS ============

@app.get("/prescriptions", response_model=List[PrescriptionRead])
async def list_prescriptions(
    status: Optional[str] = Query(None, description="Filter by status (Active, Completed, Voided)"),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    referral_id: Optional[int] = Query(None, description="Filter by referral ID"),
    db: Session = Depends(get_db),
):
    """
    List prescriptions with optional filtering.

    - **status**: Filter by prescription status
    - **patient_id**: Filter by patient ID
    - **referral_id**: Filter by referral ID
    """
    query = db.query(Prescription)

    if status:
        query = query.filter(Prescription.Status == status)
    if patient_id:
        query = query.filter(Prescription.PatientId == patient_id)
    if referral_id:
        query = query.filter(Prescription.ReferralId == referral_id)

    prescriptions = query.order_by(Prescription.CreatedAt.desc()).all()
    return prescriptions


@app.get("/prescriptions/{prescription_id}", response_model=PrescriptionDetailRead)
async def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific prescription with dispensing history."""
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    return prescription


@app.post("/prescriptions", response_model=PrescriptionRead, status_code=201)
async def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new prescription (typically called automatically when referral is accepted).

    Body:
    - **ReferralId**: Referral ID
    - **PatientId**: Patient ID
    - **PrescribingDoctorId**: Doctor ID
    - **Medications**: List of {medication_id, quantity, frequency, instructions}
    """
    db_prescription = Prescription(**prescription.model_dump())
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)

    logger.info(
        f"Created prescription {db_prescription.PrescriptionId} "
        f"for referral {db_prescription.ReferralId}"
    )
    return db_prescription


@app.patch("/prescriptions/{prescription_id}", response_model=PrescriptionRead)
async def update_prescription(
    prescription_id: int,
    prescription_update: PrescriptionUpdate,
    db: Session = Depends(get_db),
):
    """Update prescription status."""
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription_update.Status:
        prescription.Status = prescription_update.Status
        prescription.UpdatedAt = datetime.utcnow()

    db.commit()
    db.refresh(prescription)

    logger.info(
        f"Updated prescription {prescription_id} status to {prescription.Status}"
    )
    return prescription


# ============ DISPENSING ENDPOINTS ============

@app.post("/prescriptions/{prescription_id}/dispense", response_model=DispenseResponse)
async def dispense_medication(
    prescription_id: int,
    dispense_request: DispenseRequest,
    db: Session = Depends(get_db),
):
    """
    Record dispensing of medication from a prescription.

    - Decreases medication stock level
    - Creates dispensing record
    - Updates patient medication list
    """
    # Get prescription
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Get medication
    medication = db.query(Medication).filter(
        Medication.MedicationId == dispense_request.medication_id
    ).first()

    if not medication:
        raise HTTPException(status_code=400, detail="Medication not found")

    # Check stock level
    if medication.StockLevel < dispense_request.quantity_dispensed:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {medication.StockLevel}, Requested: {dispense_request.quantity_dispensed}",
        )

    try:
        # Create dispensing record
        dispensing_record = DispensingRecord(
            PrescriptionId=prescription_id,
            MedicationId=dispense_request.medication_id,
            QuantityDispensed=dispense_request.quantity_dispensed,
            DispensedBy="Pharmacy",
        )
        db.add(dispensing_record)

        # Decrease stock level
        medication.StockLevel -= dispense_request.quantity_dispensed
        db.commit()
        db.refresh(dispensing_record)
        db.refresh(medication)

        logger.info(
            f"Dispensed {dispense_request.quantity_dispensed} units of "
            f"{medication.Name} for prescription {prescription_id}. "
            f"Remaining stock: {medication.StockLevel}"
        )

        # Update patient medication list (async, non-blocking)
        patient_medication_data = {
            "Name": medication.Name,
            "Dosage": medication.Dosage,
            "PrescriptionId": prescription_id,
            "Active": True,
        }

        # Fire-and-forget async call to patient service
        import asyncio
        asyncio.create_task(
            update_patient_medication(prescription.PatientId, patient_medication_data)
        )

        # Record notification (optional)
        asyncio.create_task(
            record_notification(
                prescription.ReferralId,
                "PrescriptionDispensed",
                f"{medication.Name} ({dispense_request.quantity_dispensed} units) dispensed for prescription #{prescription_id}",
            )
        )

        return DispenseResponse(
            success=True,
            dispensing_id=dispensing_record.DispensingId,
            remaining_stock=medication.StockLevel,
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Error dispensing medication: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error dispensing medication: {str(e)}")


@app.get("/prescriptions/{prescription_id}/dispensing-history", response_model=List[DispensingRecordRead])
async def get_dispensing_history(
    prescription_id: int,
    db: Session = Depends(get_db),
):
    """Get dispensing history for a prescription."""
    # Verify prescription exists
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Get dispensing records
    records = db.query(DispensingRecord).filter(
        DispensingRecord.PrescriptionId == prescription_id
    ).order_by(DispensingRecord.DispensedAt.desc()).all()

    return records


# ============ INVENTORY ENDPOINTS ============

@app.get("/inventory/low-stock", response_model=LowStockResponse)
async def get_low_stock_items(db: Session = Depends(get_db)):
    """Get all medications with stock below minimum level."""
    low_stock_items = db.query(Medication).filter(
        Medication.StockLevel < Medication.MinStockLevel
    ).order_by(Medication.StockLevel.asc()).all()

    return LowStockResponse(
        medications=low_stock_items,
        count=len(low_stock_items),
    )


# ============ ROOT ENDPOINT ============

@app.get("/")
async def root():
    """API documentation and health check."""
    return {
        "service": "Pharmacy Service",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs",
    }
