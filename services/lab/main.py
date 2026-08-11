import logging
from typing import Optional
from datetime import datetime

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
import schemas
from db import Base, SessionLocal, engine, get_db
from seed import seed_if_empty

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lab Service",
    description="Laboratory Management System API",
    version="1.0.0"
)

PATIENT_SERVICE_URL = "http://patient-service:8001"
DOCTORS_SERVICE_URL = "http://doctors-service:8002"
REFERRAL_SERVICE_URL = "http://referral-service:8003"
NOTIFICATION_SERVICE_URL = "http://notification-service:8005"


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
        test_count = db.query(models.Test).count()
        logger.info(f"Lab Service initialized successfully with {test_count} test definitions")
    except Exception as e:
        logger.error(f"Startup error: {e}")
    finally:
        db.close()


# ============ TEST CATALOG ENDPOINTS ============

@app.get("/tests", response_model=list[schemas.TestRead])
def list_tests(
    specialty: Optional[str] = Query(None, description="Filter by test specialty"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum items to return"),
    db: Session = Depends(get_db)
):
    """List all laboratory tests with optional filtering and pagination."""
    query = db.query(models.Test)
    if specialty:
        query = query.filter(models.Test.specialty.ilike(f"%{specialty}%"))

    total = query.count()
    tests = query.order_by(models.Test.test_id).offset(skip).limit(limit).all()

    logger.info(f"Listed {len(tests)} tests (specialty: {specialty}, total: {total})")
    return tests


@app.get("/tests/{test_id}", response_model=schemas.TestRead)
def get_test(test_id: int, db: Session = Depends(get_db)):
    """Get a specific test by ID."""
    test = db.query(models.Test).filter(models.Test.test_id == test_id).first()
    if test is None:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found")
    return test


@app.get("/tests/code/{test_code}", response_model=schemas.TestRead)
def get_test_by_code(test_code: str, db: Session = Depends(get_db)):
    """Get a specific test by code (e.g., CBC, GLU)."""
    test = db.query(models.Test).filter(models.Test.test_code == test_code.upper()).first()
    if test is None:
        raise HTTPException(status_code=404, detail=f"Test with code {test_code} not found")
    return test


@app.post("/tests", response_model=schemas.TestRead, status_code=201)
def create_test(test: schemas.TestCreate, db: Session = Depends(get_db)):
    """Create a new test definition. Test code must be unique."""
    # Validate test code is unique
    existing = db.query(models.Test).filter(models.Test.test_code == test.test_code).first()
    if existing:
        logger.warning(f"Attempt to create duplicate test code: {test.test_code}")
        raise HTTPException(status_code=400, detail=f"Test with code {test.test_code} already exists")

    # Validate range if provided
    if test.normal_range_min is not None and test.normal_range_max is not None:
        if test.normal_range_min > test.normal_range_max:
            raise HTTPException(status_code=400, detail="normal_range_min must be <= normal_range_max")

    db_test = models.Test(**test.model_dump())
    db.add(db_test)
    db.commit()
    db.refresh(db_test)

    logger.info(f"Created test: {test.test_code} (ID: {db_test.test_id})")
    return db_test


@app.patch("/tests/{test_id}", response_model=schemas.TestRead)
def update_test(test_id: int, test_update: schemas.TestCreate, db: Session = Depends(get_db)):
    """Update an existing test definition."""
    db_test = db.query(models.Test).filter(models.Test.test_id == test_id).first()
    if db_test is None:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found")

    update_data = test_update.model_dump(exclude_unset=True)

    # Validate range if both provided
    if "normal_range_min" in update_data and "normal_range_max" in update_data:
        if update_data["normal_range_min"] > update_data["normal_range_max"]:
            raise HTTPException(status_code=400, detail="normal_range_min must be <= normal_range_max")

    for key, value in update_data.items():
        setattr(db_test, key, value)

    db.commit()
    db.refresh(db_test)

    logger.info(f"Updated test: {db_test.test_code} (ID: {test_id})")
    return db_test


@app.delete("/tests/{test_id}", status_code=204)
def delete_test(test_id: int, db: Session = Depends(get_db)):
    """Delete a test definition. Cannot delete if tests are already ordered."""
    db_test = db.query(models.Test).filter(models.Test.test_id == test_id).first()
    if db_test is None:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found")

    # Check if test is already used in any orders
    used_in_orders = db.query(models.OrderTest).filter(models.OrderTest.test_id == test_id).count()
    if used_in_orders > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete test: already used in {used_in_orders} order(s)")

    db.delete(db_test)
    db.commit()

    logger.info(f"Deleted test: {db_test.test_code} (ID: {test_id})")


# ============ LAB ORDER ENDPOINTS ============

async def verify_patient_exists(patient_id: int) -> bool:
    """Verify patient exists by calling Patient Service."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{PATIENT_SERVICE_URL}/patients/{patient_id}")
            if response.status_code == 200:
                logger.debug(f"Patient {patient_id} verified")
                return True
            elif response.status_code == 404:
                logger.debug(f"Patient {patient_id} not found in Patient Service")
                return False
            else:
                logger.warning(f"Unexpected response from Patient Service: {response.status_code}")
                return False
    except httpx.ConnectError as e:
        logger.error(f"Cannot connect to Patient Service: {e}")
        raise HTTPException(status_code=503, detail="Patient Service unavailable")
    except Exception as e:
        logger.error(f"Error verifying patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail="Error verifying patient")


async def verify_referral_exists(referral_id: int) -> bool:
    """Verify referral exists by calling Referral Service."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{REFERRAL_SERVICE_URL}/referrals/{referral_id}")
            if response.status_code == 200:
                logger.debug(f"Referral {referral_id} verified")
                return True
            elif response.status_code == 404:
                logger.debug(f"Referral {referral_id} not found in Referral Service")
                return False
            else:
                logger.warning(f"Unexpected response from Referral Service: {response.status_code}")
                return False
    except httpx.ConnectError as e:
        logger.error(f"Cannot connect to Referral Service: {e}")
        raise HTTPException(status_code=503, detail="Referral Service unavailable")
    except Exception as e:
        logger.error(f"Error verifying referral {referral_id}: {e}")
        raise HTTPException(status_code=500, detail="Error verifying referral")


async def notify_lab_event(event_type: str, data: dict) -> bool:
    """Send notification to Notification Service."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{NOTIFICATION_SERVICE_URL}/notifications",
                json={
                    "event_type": event_type,
                    "source": "lab-service",
                    "data": data
                }
            )
            if response.status_code in [200, 201]:
                logger.debug(f"Notification sent: {event_type}")
                return True
            else:
                logger.warning(f"Notification service returned {response.status_code}")
                return False
    except Exception as e:
        logger.warning(f"Could not send notification ({event_type}): {e}")
        return False


@app.get("/orders", response_model=list[schemas.LabOrderDetail])
def list_orders(
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    referral_id: Optional[int] = Query(None, description="Filter by referral ID"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    priority: Optional[str] = Query(None, description="Filter by priority (routine/stat)"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum items to return"),
    db: Session = Depends(get_db)
):
    """List laboratory orders with optional filtering and pagination."""
    query = db.query(models.LabOrder)

    if patient_id:
        query = query.filter(models.LabOrder.patient_id == patient_id)
    if referral_id:
        query = query.filter(models.LabOrder.referral_id == referral_id)
    if status:
        query = query.filter(models.LabOrder.status == status)
    if priority:
        query = query.filter(models.LabOrder.priority == priority)

    total = query.count()
    orders = query.order_by(desc(models.LabOrder.ordered_date)).offset(skip).limit(limit).all()

    logger.info(f"Listed {len(orders)} orders (filters: patient={patient_id}, referral={referral_id}, status={status}, total={total})")
    return orders


@app.get("/orders/{order_id}", response_model=schemas.LabOrderDetail)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@app.post("/orders", response_model=schemas.LabOrderDetail, status_code=201)
async def create_order(order_data: schemas.LabOrderCreate, db: Session = Depends(get_db)):
    """Create a new lab order for a patient with specified tests."""
    # Validate test_ids is not empty
    if not order_data.test_ids or len(order_data.test_ids) == 0:
        raise HTTPException(status_code=400, detail="At least one test must be ordered")

    # Validate priority
    if order_data.priority not in ["routine", "stat"]:
        raise HTTPException(status_code=400, detail="Priority must be 'routine' or 'stat'")

    # Verify patient exists
    patient_exists = await verify_patient_exists(order_data.patient_id)
    if not patient_exists:
        logger.warning(f"Order creation failed: Patient {order_data.patient_id} not found")
        raise HTTPException(status_code=400, detail=f"Patient {order_data.patient_id} not found")

    # Verify referral exists if provided
    if order_data.referral_id:
        referral_exists = await verify_referral_exists(order_data.referral_id)
        if not referral_exists:
            logger.warning(f"Order creation failed: Referral {order_data.referral_id} not found")
            raise HTTPException(status_code=400, detail=f"Referral {order_data.referral_id} not found")

    # Verify all tests exist and collect test details
    test_ids = order_data.test_ids
    tests = db.query(models.Test).filter(models.Test.test_id.in_(test_ids)).all()
    if len(tests) != len(test_ids):
        missing_ids = set(test_ids) - {t.test_id for t in tests}
        logger.warning(f"Order creation failed: Tests not found: {missing_ids}")
        raise HTTPException(status_code=400, detail=f"Tests not found: {missing_ids}")

    # Create lab order
    db_order = models.LabOrder(
        patient_id=order_data.patient_id,
        referral_id=order_data.referral_id,
        ordered_by=order_data.ordered_by,
        priority=order_data.priority,
        clinical_indication=order_data.clinical_indication,
        status="placed",
        ordered_date=datetime.utcnow()
    )
    db.add(db_order)
    db.flush()

    # Create OrderTest records for each test
    for test_id in test_ids:
        order_test = models.OrderTest(
            order_id=db_order.order_id,
            test_id=test_id,
            order_status="ordered"
        )
        db.add(order_test)

    # Create sample record
    sample = models.LabSample(
        order_id=db_order.order_id,
        sample_type="blood",
        status="pending"
    )
    db.add(sample)

    db.commit()
    db.refresh(db_order)

    logger.info(f"Lab order created: Order#{db_order.order_id} for Patient#{order_data.patient_id} with {len(test_ids)} tests")

    # Send notification (async, fire-and-forget)
    await notify_lab_event(
        "lab_order_created",
        {
            "order_id": db_order.order_id,
            "patient_id": order_data.patient_id,
            "referral_id": order_data.referral_id,
            "test_count": len(test_ids),
            "priority": order_data.priority
        }
    )

    return db_order


@app.patch("/orders/{order_id}", response_model=schemas.LabOrderDetail)
def update_order(order_id: int, order_update: schemas.LabOrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    if order_update.status:
        db_order.status = order_update.status
    if order_update.clinical_indication:
        db_order.clinical_indication = order_update.clinical_indication

    db.commit()
    db.refresh(db_order)
    return db_order


# ============ SAMPLE COLLECTION ENDPOINTS ============

@app.post("/orders/{order_id}/collect")
def collect_sample(
    order_id: int,
    collection_data: dict,
    db: Session = Depends(get_db)
):
    """Mark a sample as collected with collection details."""
    order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    sample = db.query(models.LabSample).filter(models.LabSample.order_id == order_id).first()
    if sample is None:
        raise HTTPException(status_code=400, detail=f"No sample found for order {order_id}")

    # Update sample with collection info
    sample.collection_date = datetime.utcnow()
    sample.collected_by = collection_data.get("collected_by")
    sample.sample_label = f"LAB-{datetime.utcnow().strftime('%Y-%m-%d')}-{order_id:03d}"
    sample.status = "collected"

    # Update order status
    order.status = "collected"

    # Create status history for sample collection
    for order_test in order.order_tests:
        history = models.StatusHistory(
            order_test_id=order_test.order_test_id,
            old_status=order_test.order_status,
            new_status="sample_collected",
            changed_at=datetime.utcnow(),
            changed_by=collection_data.get("collected_by")
        )
        order_test.order_status = "sample_collected"
        db.add(history)

    db.commit()

    logger.info(f"Sample collected for Order#{order_id}: {sample.sample_label}")

    return {
        "sample_id": sample.sample_id,
        "order_id": order_id,
        "sample_type": sample.sample_type,
        "collection_date": sample.collection_date,
        "collected_by": sample.collected_by,
        "sample_label": sample.sample_label,
        "status": sample.status
    }


# ============ STATUS TRACKING ENDPOINTS ============

@app.patch("/orders/{order_id}/tests/{test_id}/status")
def update_test_status(
    order_id: int,
    test_id: int,
    status_update: dict,
    db: Session = Depends(get_db)
):
    """Update the status of a specific test in an order."""
    order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order_test = (
        db.query(models.OrderTest)
        .filter(
            models.OrderTest.order_id == order_id,
            models.OrderTest.test_id == test_id
        )
        .first()
    )
    if order_test is None:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found in order {order_id}")

    new_status = status_update.get("new_status")
    valid_statuses = ["ordered", "sample_collected", "in_progress", "completed"]

    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    # Validate state transition
    old_status = order_test.order_status
    status_transitions = {
        "ordered": ["sample_collected"],
        "sample_collected": ["in_progress"],
        "in_progress": ["completed"],
        "completed": []
    }

    if new_status not in status_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {old_status} to {new_status}"
        )

    # Update test status
    order_test.order_status = new_status

    # Record status change
    history = models.StatusHistory(
        order_test_id=order_test.order_test_id,
        old_status=old_status,
        new_status=new_status,
        changed_at=datetime.utcnow(),
        changed_by=status_update.get("changed_by")
    )
    db.add(history)

    # Update order status based on all tests
    all_completed = all(ot.order_status == "completed" for ot in order.order_tests)
    if all_completed:
        order.status = "completed"
    elif any(ot.order_status == "in_progress" for ot in order.order_tests):
        order.status = "processing"

    db.commit()

    logger.info(f"Test status updated: Order#{order_id}, Test#{test_id}: {old_status} → {new_status}")

    return {
        "order_test_id": order_test.order_test_id,
        "order_id": order_id,
        "test_id": test_id,
        "old_status": old_status,
        "new_status": new_status
    }


@app.get("/orders/{order_id}/history")
def get_order_history(order_id: int, db: Session = Depends(get_db)):
    """Get complete status history for an order."""
    order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    history = (
        db.query(models.StatusHistory)
        .join(models.OrderTest)
        .filter(models.OrderTest.order_id == order_id)
        .order_by(models.StatusHistory.changed_at)
        .all()
    )

    return [
        {
            "history_id": h.history_id,
            "order_test_id": h.order_test_id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "changed_at": h.changed_at,
            "changed_by": h.changed_by
        }
        for h in history
    ]


# ============ TEST RESULTS ENDPOINTS ============

@app.post("/orders/{order_id}/tests/{test_id}/result")
async def submit_test_result(
    order_id: int,
    test_id: int,
    result_data: dict,
    db: Session = Depends(get_db)
):
    """Submit a test result with automatic abnormal flagging."""
    order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order_test = (
        db.query(models.OrderTest)
        .filter(
            models.OrderTest.order_id == order_id,
            models.OrderTest.test_id == test_id
        )
        .first()
    )
    if order_test is None:
        raise HTTPException(status_code=404, detail=f"Test {test_id} not found in order {order_id}")

    test = db.query(models.Test).filter(models.Test.test_id == test_id).first()
    if test is None:
        raise HTTPException(status_code=404, detail=f"Test definition {test_id} not found")

    result_value = result_data.get("result_value")
    if not result_value:
        raise HTTPException(status_code=400, detail="result_value is required")

    # Determine if result is abnormal/critical
    is_abnormal = False
    is_critical = False

    try:
        numeric_value = float(result_value)

        if test.normal_range_min is not None and test.normal_range_max is not None:
            if numeric_value < test.normal_range_min or numeric_value > test.normal_range_max:
                is_abnormal = True

            # Critical if outside 1.5x range
            if numeric_value > test.normal_range_max * 1.5 or numeric_value < test.normal_range_min * 0.5:
                is_critical = True
    except ValueError:
        # Non-numeric result, use provided flags or defaults
        is_abnormal = result_data.get("is_abnormal", False)
        is_critical = result_data.get("is_critical", False)

    # Create result
    result = models.TestResult(
        order_test_id=order_test.order_test_id,
        result_value=str(result_value),
        result_date=datetime.utcnow(),
        is_abnormal=is_abnormal,
        is_critical=is_critical,
        notes=result_data.get("notes")
    )
    db.add(result)

    # Update test status to completed
    old_status = order_test.order_status
    order_test.order_status = "completed"

    # Record status change
    history = models.StatusHistory(
        order_test_id=order_test.order_test_id,
        old_status=old_status,
        new_status="completed",
        changed_at=datetime.utcnow(),
        changed_by=result_data.get("submitted_by")
    )
    db.add(history)

    db.commit()
    db.refresh(result)

    logger.info(
        f"Result submitted: Order#{order_id}, Test#{test_id}, Value={result_value}, "
        f"Abnormal={is_abnormal}, Critical={is_critical}"
    )

    # Send notification for results (especially critical)
    if is_critical:
        await notify_lab_event(
            "lab_result_critical",
            {
                "order_id": order_id,
                "test_id": test_id,
                "result_value": result_value,
                "normal_range_min": test.normal_range_min,
                "normal_range_max": test.normal_range_max,
                "unit": test.unit
            }
        )
    else:
        await notify_lab_event(
            "lab_result_completed",
            {
                "order_id": order_id,
                "test_id": test_id,
                "is_abnormal": is_abnormal
            }
        )

    return {
        "result_id": result.result_id,
        "order_test_id": order_test.order_test_id,
        "result_value": result.result_value,
        "result_date": result.result_date,
        "is_abnormal": result.is_abnormal,
        "is_critical": result.is_critical,
        "notes": result.notes
    }


@app.get("/orders/{order_id}/results")
def get_order_results(order_id: int, db: Session = Depends(get_db)):
    """Get all results for an order."""
    order = db.query(models.LabOrder).filter(models.LabOrder.order_id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    results = (
        db.query(models.TestResult)
        .join(models.OrderTest)
        .filter(models.OrderTest.order_id == order_id)
        .order_by(models.TestResult.result_date)
        .all()
    )

    return [
        {
            "result_id": r.result_id,
            "order_test_id": r.order_test_id,
            "result_value": r.result_value,
            "result_date": r.result_date,
            "reviewed_date": r.reviewed_date,
            "reviewed_by": r.reviewed_by,
            "is_abnormal": r.is_abnormal,
            "is_critical": r.is_critical,
            "notes": r.notes
        }
        for r in results
    ]


@app.patch("/results/{result_id}/review")
def review_result(result_id: int, review_data: dict, db: Session = Depends(get_db)):
    """Mark a result as reviewed by a clinician."""
    result = db.query(models.TestResult).filter(models.TestResult.result_id == result_id).first()
    if result is None:
        raise HTTPException(status_code=404, detail=f"Result {result_id} not found")

    result.reviewed_date = datetime.utcnow()
    result.reviewed_by = review_data.get("reviewed_by")

    db.commit()
    db.refresh(result)

    logger.info(f"Result reviewed: Result#{result_id} by Doctor#{result.reviewed_by}")

    return {
        "result_id": result.result_id,
        "order_test_id": result.order_test_id,
        "result_value": result.result_value,
        "reviewed_date": result.reviewed_date,
        "reviewed_by": result.reviewed_by,
        "is_abnormal": result.is_abnormal,
        "is_critical": result.is_critical
    }


# ============ STATISTICS & DASHBOARD ============

@app.get("/stats")
def get_lab_statistics(db: Session = Depends(get_db)):
    """Get lab operations statistics and metrics."""
    total_orders = db.query(models.LabOrder).count()

    orders_by_status = {}
    for status in ["draft", "placed", "collected", "processing", "completed"]:
        count = db.query(models.LabOrder).filter(models.LabOrder.status == status).count()
        orders_by_status[status] = count

    total_tests = db.query(models.Test).count()

    test_status_counts = {}
    for status in ["ordered", "sample_collected", "in_progress", "completed"]:
        count = db.query(models.OrderTest).filter(models.OrderTest.order_status == status).count()
        test_status_counts[status] = count

    # Count critical results
    critical_results = db.query(models.TestResult).filter(models.TestResult.is_critical == True).count()
    abnormal_results = db.query(models.TestResult).filter(models.TestResult.is_abnormal == True).count()
    reviewed_results = db.query(models.TestResult).filter(models.TestResult.reviewed_by.isnot(None)).count()
    total_results = db.query(models.TestResult).count()

    logger.info("Lab statistics retrieved")

    return {
        "orders": {
            "total": total_orders,
            "by_status": orders_by_status
        },
        "tests": {
            "catalog_total": total_tests,
            "by_status": test_status_counts
        },
        "results": {
            "total": total_results,
            "abnormal": abnormal_results,
            "critical": critical_results,
            "reviewed": reviewed_results
        }
    }


@app.get("/orders/stats/specialty/{specialty}")
def get_specialty_stats(specialty: str, db: Session = Depends(get_db)):
    """Get statistics for orders by specialty."""
    orders = db.query(models.LabOrder).all()

    matching_orders = []
    for order in orders:
        for order_test in order.order_tests:
            if order_test.test.specialty and specialty.lower() in order_test.test.specialty.lower():
                matching_orders.append(order)
                break

    status_breakdown = {}
    for order in matching_orders:
        status = order.status
        status_breakdown[status] = status_breakdown.get(status, 0) + 1

    return {
        "specialty": specialty,
        "total_orders": len(matching_orders),
        "by_status": status_breakdown
    }


# ============ HEALTH CHECK ============

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Check service health and database connectivity."""
    try:
        # Test database connection
        test_count = db.query(models.Test).count()
        order_count = db.query(models.LabOrder).count()

        return {
            "status": "healthy",
            "service": "lab-service",
            "version": "1.0.0",
            "database": {
                "connected": True,
                "tests": test_count,
                "orders": order_count
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "lab-service",
            "error": str(e)
        }, 503
