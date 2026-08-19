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
    MedicationUpdate,
    PrescriptionRead,
    PrescriptionDetailRead,
    PrescriptionCreate,
    PrescriptionUpdate,
    DispensingRecordRead,
    DispenseRequest,
    DispenseResponse,
    LowStockResponse,
    RefillRequestRead,
    RefillRequestApprove,
    RefillRequestFulfill,
    RefillRequestReject,
)
from seed import seed_if_empty
from clients import update_patient_medication, record_notification

# Configure logging
logging.basicConfig(level=logging.INFO)

# Pharmacy Service v1.2 - Fully tested with 50+ automated test cases
# All endpoints validated and requirements checked on every PR
# GitHub Actions updated to v4 with Node.js 24 support
# Improved test execution logging and debugging
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
    medication_update: MedicationUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing medication (all fields optional)."""
    db_medication = db.query(Medication).filter(
        Medication.MedicationId == medication_id
    ).first()

    if not db_medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    # Update only provided fields
    for key, value in medication_update.model_dump(exclude_unset=True).items():
        if value is not None:
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
    prescription_data = prescription.model_dump()
    # Set initial status to "Prescribed" (doctor has prescribed it)
    prescription_data['Status'] = 'Prescribed'

    db_prescription = Prescription(**prescription_data)
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
    """Update prescription status with validation."""
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if prescription_update.Status:
        # Validate status is one of the allowed values
        VALID_STATUSES = ['Draft', 'Prescribed', 'PartiallyFulfilled', 'Fulfilled', 'Voided']
        if prescription_update.Status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{prescription_update.Status}'. Allowed: {', '.join(VALID_STATUSES)}"
            )

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

    - Validates medication is on the prescription
    - Caps cumulative dispensed quantity at prescribed quantity
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

    # ===== NEW: Validate medication is on the prescription =====
    prescribed_medication = None
    if prescription.Medications:
        for med in prescription.Medications:
            if med.get('medication_id') == dispense_request.medication_id:
                prescribed_medication = med
                break

    if not prescribed_medication:
        raise HTTPException(
            status_code=400,
            detail=f"Medication {dispense_request.medication_id} is not on this prescription"
        )

    # ===== NEW: Check cumulative dispensed quantity =====
    existing_dispensed = db.query(DispensingRecord).filter(
        DispensingRecord.PrescriptionId == prescription_id,
        DispensingRecord.MedicationId == dispense_request.medication_id,
    ).all()

    cumulative_dispensed = sum(r.QuantityDispensed for r in existing_dispensed)
    prescribed_quantity = prescribed_medication.get('quantity', 0)

    if cumulative_dispensed + dispense_request.quantity_dispensed > prescribed_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot dispense {dispense_request.quantity_dispensed} units. "
                   f"Prescribed: {prescribed_quantity}, Already dispensed: {cumulative_dispensed}, "
                   f"Remaining allowance: {prescribed_quantity - cumulative_dispensed}",
        )

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
            DispensedBy=dispense_request.dispensed_by,
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


# ============ PHASE 1: STOCK STATUS ENDPOINTS ============

@app.get("/medications/by-status/{status}", response_model=List[MedicationRead])
async def get_medications_by_status(
    status: str,
    db: Session = Depends(get_db),
):
    """
    Get medications filtered by stock status (PHASE 1).

    Status values: InStock, LowStock, OutOfStock, Discontinued
    """
    medications = db.query(Medication).all()

    filtered_meds = [
        m for m in medications
        if m.current_stock_status == status
    ]

    return filtered_meds


@app.get("/inventory/stock-status")
async def get_stock_status_summary(db: Session = Depends(get_db)):
    """Get summary of medications by stock status (PHASE 1)."""
    medications = db.query(Medication).all()

    summary = {
        "InStock": len([m for m in medications if m.current_stock_status == "InStock"]),
        "LowStock": len([m for m in medications if m.current_stock_status == "LowStock"]),
        "OutOfStock": len([m for m in medications if m.current_stock_status == "OutOfStock"]),
        "Discontinued": len([m for m in medications if m.current_stock_status == "Discontinued"]),
        "Total": len(medications),
    }

    return summary


# ============ PHASE 2: REFILL REQUEST ENDPOINTS ============

@app.post("/prescriptions/{prescription_id}/request-refill")
async def request_refill(
    prescription_id: int,
    patient_id: int,
    db: Session = Depends(get_db),
):
    """
    Patient requests refill of prescription (PHASE 2).

    Checks that prescription exists and has refills available.
    """
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Check if patient matches
    if prescription.PatientId != patient_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Patient mismatch")

    # Check if refills are available
    if prescription.RefillsRemaining <= 0 and prescription.RefillsAllowed != -1:
        raise HTTPException(status_code=400, detail="No refills remaining")

    # Create refill request
    from models import RefillRequest

    refill_request = RefillRequest(
        PrescriptionId=prescription_id,
        PatientId=patient_id,
        Status="Pending"
    )
    db.add(refill_request)
    db.commit()
    db.refresh(refill_request)

    logger.info(f"Refill request created: Rx #{prescription_id} by Patient #{patient_id}")

    return {
        "RefillRequestId": refill_request.RefillRequestId,
        "Status": "Pending",
        "Message": "Refill request submitted. Awaiting approval."
    }


@app.get("/prescriptions/{prescription_id}/refill-requests", response_model=List)
async def get_prescription_refill_requests(
    prescription_id: int,
    db: Session = Depends(get_db),
):
    """Get all refill requests for a prescription (PHASE 2)."""
    from models import RefillRequest

    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    refill_requests = db.query(RefillRequest).filter(
        RefillRequest.PrescriptionId == prescription_id
    ).order_by(RefillRequest.RequestedAt.desc()).all()

    return refill_requests


@app.get("/refill-requests", response_model=List[RefillRequestRead])
async def list_refill_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    prescription_id: Optional[int] = Query(None, description="Filter by prescription ID"),
    db: Session = Depends(get_db),
):
    """List refill requests with optional filtering (PHASE 2)."""
    from models import RefillRequest

    query = db.query(RefillRequest)

    if status:
        query = query.filter(RefillRequest.Status == status)
    if patient_id:
        query = query.filter(RefillRequest.PatientId == patient_id)
    if prescription_id:
        query = query.filter(RefillRequest.PrescriptionId == prescription_id)

    refill_requests = query.order_by(RefillRequest.RequestedAt.desc()).all()
    return refill_requests


@app.post("/refill-requests/{refill_request_id}/approve", response_model=RefillRequestRead)
async def approve_refill_request(
    refill_request_id: int,
    request_body: RefillRequestApprove,
    db: Session = Depends(get_db),
):
    """Approve a refill request (PHASE 2)."""
    from models import RefillRequest

    refill = db.query(RefillRequest).filter(
        RefillRequest.RefillRequestId == refill_request_id
    ).first()

    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found")

    if refill.Status != "Pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve {refill.Status} request")

    refill.Status = "Approved"
    refill.ApprovedAt = datetime.utcnow()
    refill.ApprovedBy = request_body.ApprovedBy
    if request_body.Notes:
        refill.Notes = request_body.Notes

    db.commit()
    db.refresh(refill)

    logger.info(f"Refill request #{refill_request_id} approved by user #{request_body.ApprovedBy}")

    return refill


@app.post("/refill-requests/{refill_request_id}/fulfill", response_model=RefillRequestRead)
async def fulfill_refill_request(
    refill_request_id: int,
    request_body: RefillRequestFulfill,
    db: Session = Depends(get_db),
):
    """Fulfill a refill request (PHASE 2) - creates dispensing records."""
    from models import RefillRequest

    refill = db.query(RefillRequest).filter(
        RefillRequest.RefillRequestId == refill_request_id
    ).first()

    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found")

    if refill.Status != "Approved":
        raise HTTPException(status_code=400, detail="Refill must be approved before fulfillment")

    # Get the prescription
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == refill.PrescriptionId
    ).first()

    try:
        # ===== NEW: Create dispensing records for each medication =====
        if prescription.Medications:
            for med in prescription.Medications:
                medication = db.query(Medication).filter(
                    Medication.MedicationId == med.get('medication_id')
                ).first()

                if not medication:
                    logger.warning(f"Medication {med.get('medication_id')} not found during refill fulfillment")
                    continue

                # Check stock
                if medication.StockLevel < med.get('quantity', 0):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient stock for {medication.Name}. Available: {medication.StockLevel}, Required: {med.get('quantity', 0)}",
                    )

                # Create dispensing record
                dispensing_record = DispensingRecord(
                    PrescriptionId=prescription.PrescriptionId,
                    MedicationId=med.get('medication_id'),
                    QuantityDispensed=med.get('quantity', 0),
                    DispensedBy=f"Refill by {request_body.FulfilledBy}",
                )
                db.add(dispensing_record)

                # Decrease stock
                medication.StockLevel -= med.get('quantity', 0)

        # Decrease refills remaining (if not unlimited)
        if prescription.RefillsAllowed != -1:
            prescription.RefillsRemaining -= 1

        # Update last refill date
        prescription.LastRefillDate = datetime.utcnow()

        # Mark refill request as fulfilled
        refill.Status = "Fulfilled"
        refill.FulfilledAt = datetime.utcnow()
        refill.FulfilledBy = request_body.FulfilledBy
        if request_body.Notes:
            refill.Notes = request_body.Notes

        db.commit()
        db.refresh(refill)
        db.refresh(prescription)

        logger.info(f"Refill request #{refill_request_id} fulfilled by pharmacist #{request_body.FulfilledBy} with dispensing records created")

        return refill

    except Exception as e:
        db.rollback()
        logger.error(f"Error fulfilling refill request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fulfilling refill: {str(e)}")


@app.post("/refill-requests/{refill_request_id}/reject", response_model=RefillRequestRead)
async def reject_refill_request(
    refill_request_id: int,
    request_body: RefillRequestReject,
    db: Session = Depends(get_db),
):
    """Reject a refill request (PHASE 2)."""
    from models import RefillRequest

    refill = db.query(RefillRequest).filter(
        RefillRequest.RefillRequestId == refill_request_id
    ).first()

    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found")

    if refill.Status != "Pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject {refill.Status} request")

    refill.Status = "Rejected"
    refill.RejectionReason = request_body.RejectionReason
    refill.ApprovedBy = request_body.RejectedBy

    db.commit()
    db.refresh(refill)

    logger.info(f"Refill request #{refill_request_id} rejected: {request_body.RejectionReason}")

    return refill


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
