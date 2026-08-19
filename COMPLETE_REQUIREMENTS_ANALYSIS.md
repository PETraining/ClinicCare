# 📋 COMPLETE PHARMACY REQUIREMENTS ANALYSIS

**Date:** August 19, 2026  
**Status:** Gap Analysis & Implementation Plan  
**Priority:** Critical for full functionality

---

## ✅ REQUIREMENTS PROVIDED BY USER

1. ✅ Doctors create prescriptions after patient consultations
2. ✅ Prescriptions linked to Patients & Referrals/Consultations
3. ✅ Single prescription with multiple medications
4. ⚠️ **Medication stock status: in stock / out of stock / not available**
5. ✅ Pharmacy staff view and fulfill pending prescriptions
6. ✅ Dispensing recorded with date, quantity, dispenser details
7. ❌ **Refill requests and refill history tracked**
8. ✅ Inventory auto-updated when dispensed
9. ✅ Low-stock alerts for replenishment

---

## 📊 CURRENT IMPLEMENTATION vs REQUIREMENTS

### 1. Doctors Create Prescriptions After Consultation
**Status:** ✅ **IMPLEMENTED**
```
✅ Direct prescription creation (Doctor → Patient)
✅ Referral-based prescriptions (Doctor → Referral → Prescription)
✅ Both workflows operational
```

### 2. Prescriptions Linked to Patients & Referrals
**Status:** ✅ **IMPLEMENTED**
```python
class Prescription:
    PatientId = Column(Integer, nullable=False)        # ✅ Required
    ReferralId = Column(Integer, nullable=True)        # ✅ Optional (our fix)
```

### 3. Multiple Medications Per Prescription
**Status:** ✅ **IMPLEMENTED**
```python
Medications = Column(JSON)  # Array of medication objects
# Example:
[
  {"medication_id": 1, "quantity": 30, "frequency": "Once daily"},
  {"medication_id": 2, "quantity": 60, "frequency": "Twice daily"}
]
```

### 4. Medication Stock Status Indication
**Status:** ❌ **NOT IMPLEMENTED - NEEDS WORK**

**Current Model:**
```python
class Medication:
    StockLevel: int          # Just a number
    MinStockLevel: int       # Threshold
    # Missing: Stock Status enum
```

**Missing:**
- No explicit "in stock" / "out of stock" / "not available" status
- Need to derive this from StockLevel vs MinStockLevel
- No indication of pharmacy availability

**What's Needed:**
```python
class Medication:
    StockLevel: int
    MinStockLevel: int
    StockStatus: Enum  # "InStock" | "LowStock" | "OutOfStock" | "Discontinued"
    AvailablePharmacies: List[int]  # Which pharmacies have it
```

### 5. Pharmacy Staff View Pending Prescriptions
**Status:** ✅ **IMPLEMENTED**
```
GET /prescriptions?status=Active
Returns all pending prescriptions ready for fulfillment
```

### 6. Dispensing Recorded with Date, Quantity, Dispenser
**Status:** ✅ **IMPLEMENTED**
```python
class DispensingRecord:
    DispensedAt: DateTime         # ✅ Date
    QuantityDispensed: int        # ✅ Quantity
    DispensedBy: str              # ✅ Dispenser
```

### 7. Refill Requests & Refill History
**Status:** ❌ **NOT IMPLEMENTED - HIGH PRIORITY**

**Missing:**
- No refill request mechanism
- No refill limit tracking
- No refill history
- Cannot track "how many refills remaining"

**What's Needed:**
```python
class Prescription:
    RefillsAllowed: int = 0           # How many times can be refilled
    RefillsRemaining: int = 0         # How many left
    LastRefillDate: Optional[DateTime] # When was it last refilled

class RefillRequest:
    PrescriptionId: int
    RequestedBy: int  # Patient ID or Doctor ID
    RequestedAt: DateTime
    Status: str  # Pending, Approved, Rejected, Fulfilled
    FulfilledAt: Optional[DateTime]
```

### 8. Inventory Auto-Updated on Dispensing
**Status:** ✅ **IMPLEMENTED**
```python
# In dispense_medication():
medication.StockLevel -= dispense_request.quantity_dispensed
db.commit()  # Auto-updated
```

### 9. Low-Stock Alerts
**Status:** ✅ **IMPLEMENTED**
```
GET /inventory/low-stock
Returns medications where: StockLevel < MinStockLevel
Alerts shown in dashboard
```

---

## 🔴 CRITICAL GAPS TO ADDRESS

### GAP 1: Medication Stock Status Enum
**Severity:** HIGH  
**Impact:** Can't easily determine if medication is available  
**Effort:** 2-3 hours

**Implementation:**
```python
from enum import Enum

class StockStatus(str, Enum):
    IN_STOCK = "InStock"              # StockLevel > MinStockLevel
    LOW_STOCK = "LowStock"            # MinStockLevel >= StockLevel > 0
    OUT_OF_STOCK = "OutOfStock"       # StockLevel == 0
    DISCONTINUED = "Discontinued"      # No longer available

class Medication(Base):
    StockLevel: int
    MinStockLevel: int
    StockStatus: Enum  # New field
```

**Database Change:**
```sql
ALTER TABLE medications ADD COLUMN StockStatus VARCHAR(20) DEFAULT 'OutOfStock';
```

### GAP 2: Refill Tracking System
**Severity:** CRITICAL  
**Impact:** Cannot track prescription refills  
**Effort:** 8-10 hours

**Required Tables:**
```python
class Prescription:
    RefillsAllowed: int = 0           # 0 = no refills, -1 = unlimited
    RefillsRemaining: int = 0
    LastRefillDate: Optional[DateTime]

class RefillRequest(Base):
    RefillRequestId: int (PK)
    PrescriptionId: int (FK)
    PatientId: int
    RequestedAt: DateTime
    Status: str  # "Pending", "Approved", "Fulfilled", "Rejected"
    ApprovedAt: Optional[DateTime]
    FulfilledAt: Optional[DateTime]
    ApprovedBy: Optional[int]  # Doctor/Pharmacist ID
    FulfilledBy: Optional[int]  # Pharmacist ID
    Notes: Optional[str]

class RefillHistory(Base):
    RefillHistoryId: int (PK)
    PrescriptionId: int (FK)
    RefillDate: DateTime
    QuantityDispensed: int
    DispensedBy: int
    RefillsRemaining: int
```

---

## 📋 DETAILED IMPLEMENTATION PLAN

### PHASE 1: Medication Stock Status (2-3 hours)

**Step 1: Update Medication Model**
```python
# File: services/pharmacy/models.py

from enum import Enum

class StockStatus(str, Enum):
    IN_STOCK = "InStock"
    LOW_STOCK = "LowStock"
    OUT_OF_STOCK = "OutOfStock"
    DISCONTINUED = "Discontinued"

class Medication(Base):
    __tablename__ = "medications"
    
    MedicationId = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True, nullable=False)
    Dosage = Column(String, nullable=False)
    StockLevel = Column(Integer, default=0)
    MinStockLevel = Column(Integer, default=10)
    UnitPrice = Column(Float, default=0.0)
    
    # NEW FIELDS
    StockStatus = Column(String, default=StockStatus.OUT_OF_STOCK)
    IsDiscontinued = Column(Boolean, default=False)
    
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    LastRestockedAt = Column(DateTime, nullable=True)
```

**Step 2: Add Computed Property**
```python
@property
def current_stock_status(self) -> StockStatus:
    """Calculate stock status based on levels"""
    if self.IsDiscontinued:
        return StockStatus.DISCONTINUED
    elif self.StockLevel == 0:
        return StockStatus.OUT_OF_STOCK
    elif self.StockLevel < self.MinStockLevel:
        return StockStatus.LOW_STOCK
    else:
        return StockStatus.IN_STOCK
```

**Step 3: Add API Endpoint**
```python
@app.get("/medications/by-status/{status}")
async def get_medications_by_status(status: str, db: Session = Depends(get_db)):
    """Get medications filtered by stock status"""
    medications = db.query(Medication).all()
    return [m for m in medications if m.current_stock_status == status]

# Example usage:
# GET /medications/by-status/LowStock
# GET /medications/by-status/OutOfStock
# GET /medications/by-status/InStock
```

**Step 4: Update Frontend Model**
```typescript
// frontend/src/app/core/models/pharmacy.model.ts

export type StockStatus = 'InStock' | 'LowStock' | 'OutOfStock' | 'Discontinued';

export interface Medication {
  MedicationId: number;
  Name: string;
  Dosage: string;
  StockLevel: number;
  MinStockLevel: number;
  StockStatus: StockStatus;  // NEW
  IsDiscontinued: boolean;   // NEW
  UnitPrice?: number;
  CreatedAt?: string;
}
```

**Step 5: Update Frontend UI**
```typescript
// Color-code medications by status
getStatusColor(status: StockStatus): string {
  switch(status) {
    case 'InStock': return 'green';
    case 'LowStock': return 'orange';
    case 'OutOfStock': return 'red';
    case 'Discontinued': return 'gray';
  }
}

// Show status badge
<span class="status" [ngClass]="'status-' + medication.StockStatus">
  {{ medication.StockStatus }}
</span>
```

---

### PHASE 2: Refill System (8-10 hours)

**Step 1: Add Refill Fields to Prescription**
```python
# Update Prescription model
class Prescription(Base):
    __tablename__ = "prescriptions"
    
    PrescriptionId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, index=True, nullable=True)
    PatientId = Column(Integer, index=True, nullable=False)
    PrescribingDoctorId = Column(Integer, nullable=False)
    Medications = Column(JSON, nullable=False)
    Status = Column(String, default="Active", index=True)
    
    # NEW REFILL FIELDS
    RefillsAllowed = Column(Integer, default=0)      # 0=no refill, -1=unlimited
    RefillsRemaining = Column(Integer, default=0)    # How many left
    LastRefillDate = Column(DateTime, nullable=True) # Last refill date
    
    CreatedAt = Column(DateTime, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Step 2: Create RefillRequest Table**
```python
class RefillRequest(Base):
    """Track refill requests from patients"""
    __tablename__ = "refill_requests"
    
    RefillRequestId = Column(Integer, primary_key=True, index=True)
    PrescriptionId = Column(Integer, ForeignKey("prescriptions.PrescriptionId"), nullable=False)
    PatientId = Column(Integer, nullable=False)
    RequestedAt = Column(DateTime, default=datetime.utcnow)
    Status = Column(String, default="Pending")  # Pending, Approved, Fulfilled, Rejected
    
    ApprovedAt = Column(DateTime, nullable=True)
    ApprovedBy = Column(Integer, nullable=True)  # Doctor/Pharmacist ID
    
    FulfilledAt = Column(DateTime, nullable=True)
    FulfilledBy = Column(Integer, nullable=True)  # Pharmacist ID
    
    RejectionReason = Column(String, nullable=True)
    Notes = Column(String, nullable=True)
    
    # Relationships
    Prescription = relationship("Prescription", back_populates="RefillRequests")
```

**Step 3: Add Refill API Endpoints**
```python
@app.post("/prescriptions/{prescription_id}/request-refill")
async def request_refill(
    prescription_id: int,
    patient_id: int,
    db: Session = Depends(get_db)
):
    """Patient requests refill of prescription"""
    prescription = db.query(Prescription).filter(
        Prescription.PrescriptionId == prescription_id
    ).first()
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    if prescription.RefillsRemaining <= 0 and prescription.RefillsAllowed != -1:
        raise HTTPException(status_code=400, detail="No refills remaining")
    
    refill_request = RefillRequest(
        PrescriptionId=prescription_id,
        PatientId=patient_id,
        Status="Pending"
    )
    db.add(refill_request)
    db.commit()
    
    return {"RefillRequestId": refill_request.RefillRequestId, "Status": "Pending"}

@app.get("/prescriptions/{prescription_id}/refill-history")
async def get_refill_history(prescription_id: int, db: Session = Depends(get_db)):
    """Get refill history for prescription"""
    requests = db.query(RefillRequest).filter(
        RefillRequest.PrescriptionId == prescription_id
    ).all()
    return requests

@app.post("/refill-requests/{refill_request_id}/approve")
async def approve_refill(
    refill_request_id: int,
    approved_by: int,  # Doctor/Pharmacist ID
    db: Session = Depends(get_db)
):
    """Approve refill request"""
    refill = db.query(RefillRequest).filter(
        RefillRequest.RefillRequestId == refill_request_id
    ).first()
    
    if not refill:
        raise HTTPException(status_code=404, detail="Refill request not found")
    
    refill.Status = "Approved"
    refill.ApprovedAt = datetime.utcnow()
    refill.ApprovedBy = approved_by
    
    db.commit()
    return refill

@app.post("/refill-requests/{refill_request_id}/fulfill")
async def fulfill_refill(
    refill_request_id: int,
    fulfilled_by: int,  # Pharmacist ID
    db: Session = Depends(get_db)
):
    """Fulfill refill request"""
    refill = db.query(RefillRequest).filter(
        RefillRequest.RefillRequestId == refill_request_id
    ).first()
    
    if refill.Status != "Approved":
        raise HTTPException(status_code=400, detail="Refill not approved")
    
    prescription = refill.Prescription
    
    # Decrease refills remaining
    if prescription.RefillsAllowed != -1:
        prescription.RefillsRemaining -= 1
    
    # Update last refill date
    prescription.LastRefillDate = datetime.utcnow()
    
    # Record fulfillment
    refill.Status = "Fulfilled"
    refill.FulfilledAt = datetime.utcnow()
    refill.FulfilledBy = fulfilled_by
    
    db.commit()
    return {"Status": "Fulfilled", "RefillsRemaining": prescription.RefillsRemaining}
```

**Step 4: Update Prescription Schemas**
```python
class PrescriptionBase(BaseModel):
    ReferralId: Optional[int] = None
    PatientId: int
    PrescribingDoctorId: int
    Medications: List[dict]
    RefillsAllowed: int = 0        # NEW
    RefillsRemaining: int = 0      # NEW

class PrescriptionRead(PrescriptionBase):
    PrescriptionId: int
    Status: str
    LastRefillDate: Optional[datetime] = None
    CreatedAt: datetime
    UpdatedAt: datetime

class RefillRequestRead(BaseModel):
    RefillRequestId: int
    PrescriptionId: int
    PatientId: int
    Status: str
    RequestedAt: datetime
    ApprovedAt: Optional[datetime]
    FulfilledAt: Optional[datetime]
```

---

## 🎯 IMPLEMENTATION PRIORITY

### PRIORITY 1 (DO IMMEDIATELY) - 2-3 hours
```
✅ Add StockStatus enum to Medication model
✅ Add IsDiscontinued flag
✅ Add computed property for stock status
✅ Update API endpoints
✅ Update frontend model
✅ Color-code UI by status
```

### PRIORITY 2 (DO NEXT) - 8-10 hours
```
⏳ Add RefillsAllowed/RefillsRemaining to Prescription
⏳ Create RefillRequest table
⏳ Add refill request endpoints
⏳ Add refill approval workflow
⏳ Add refill fulfillment workflow
⏳ Create frontend refill UI
```

### PRIORITY 3 (FUTURE) - Optional enhancements
```
⏳ Auto-refill based on schedule
⏳ Refill reminder notifications
⏳ Refill history reports
⏳ Pharmacy restock alerts from refill data
⏳ Patient refill portal
```

---

## 📊 WHAT WILL BE COMPLETE AFTER IMPLEMENTATION

After both phases, the system will have:

✅ **Phase 1 Complete:**
- Medications show stock status (InStock, LowStock, OutOfStock, Discontinued)
- Pharmacy staff can filter by status
- Patients see medication availability
- Accurate stock status calculations

✅ **Phase 2 Complete:**
- Patients can request refills
- Doctors/Pharmacists can approve refills
- Refill history is tracked
- Refills remaining is tracked
- Cannot refill when no refills left
- Complete audit trail of all refills

✅ **Overall System Will:**
- Support complete prescription lifecycle
- Track all dispensing activities
- Manage inventory accurately
- Handle medication refills properly
- Provide stock status visibility
- Maintain complete audit trail

---

## 📋 FILES TO CREATE/MODIFY

### Phase 1: Stock Status
```
services/pharmacy/models.py          - Add StockStatus enum, update Medication
services/pharmacy/schemas.py         - Add StockStatus to schemas
services/pharmacy/main.py            - Add status-based endpoints
frontend/src/app/core/models/pharmacy.model.ts - Add StockStatus
frontend/src/app/features/pharmacy/*.component.ts - Update UI
```

### Phase 2: Refill System
```
services/pharmacy/models.py          - Add Prescription refill fields, RefillRequest table
services/pharmacy/schemas.py         - Add RefillRequest schemas
services/pharmacy/main.py            - Add refill endpoints
frontend/src/app/core/services/pharmacy.service.ts - Add refill methods
frontend/src/app/features/pharmacy/*.component.ts - Add refill UI
frontend/src/app/features/patients/*.component.ts - Add patient refill interface
```

---

## ✅ VERIFICATION CHECKLIST

**Phase 1:**
- [ ] StockStatus enum created
- [ ] Medication model updated
- [ ] API endpoints working
- [ ] Frontend shows status
- [ ] Color coding applied
- [ ] Tests passing
- [ ] Database migrated

**Phase 2:**
- [ ] RefillsAllowed/RefillsRemaining fields added
- [ ] RefillRequest table created
- [ ] Refill request endpoint works
- [ ] Approve refill endpoint works
- [ ] Fulfill refill endpoint works
- [ ] Refill history retrievable
- [ ] Frontend refill UI working
- [ ] Tests passing

---

## 🎯 SUMMARY

| Requirement | Current | Phase 1 | Phase 2 | Final Status |
|------------|---------|---------|---------|--------------|
| Doctor create prescriptions | ✅ | ✅ | ✅ | ✅ Complete |
| Prescriptions linked to Patient | ✅ | ✅ | ✅ | ✅ Complete |
| Prescriptions linked to Referral | ✅ | ✅ | ✅ | ✅ Complete |
| Multiple meds per prescription | ✅ | ✅ | ✅ | ✅ Complete |
| Stock status (in/out/unavailable) | ❌ | ✅ | ✅ | ✅ Complete |
| Pharmacy view pending Rx | ✅ | ✅ | ✅ | ✅ Complete |
| Dispensing recorded | ✅ | ✅ | ✅ | ✅ Complete |
| Refill requests tracked | ❌ | ❌ | ✅ | ✅ Complete |
| Refill history tracked | ❌ | ❌ | ✅ | ✅ Complete |
| Inventory auto-update | ✅ | ✅ | ✅ | ✅ Complete |
| Low-stock alerts | ✅ | ✅ | ✅ | ✅ Complete |

---

**Next Action:** Shall I implement Phase 1 (Stock Status) first?

