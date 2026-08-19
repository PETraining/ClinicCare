# Pharmacy & Prescription Management - Implementation Plan

This document outlines the step-by-step implementation plan for the Pharmacy & Prescription Management feature.

**Timeline:** This Week (MVP)  
**Status:** Ready for Implementation

---

## Phase 1: Backend Service Setup

### Step 1.1: Create Pharmacy Service Structure
- [ ] Create directory: `services/pharmacy/`
- [ ] Copy template files from `services/patient/`:
  - [ ] `db.py` → Update database path to `pharmacy.db`
  - [ ] `models.py` → Replace with pharmacy models
  - [ ] `schemas.py` → Replace with pharmacy schemas
  - [ ] `main.py` → Replace with pharmacy endpoints
  - [ ] `seed.py` → Create pharmacy seed data
  - [ ] `Dockerfile` → Update port to 8006
  - [ ] `requirements.txt` → Use same dependencies

**Files to Create:**
```
services/pharmacy/
├── __init__.py
├── main.py
├── db.py
├── models.py
├── schemas.py
├── seed.py
├── clients.py
├── Dockerfile
└── requirements.txt
```

### Step 1.2: Implement Database Models (`services/pharmacy/models.py`)
- [ ] Create `Medication` table
  - [ ] MedicationId (PK, Integer)
  - [ ] Name (String, indexed)
  - [ ] Dosage (String)
  - [ ] StockLevel (Integer, default=0)
  - [ ] MinStockLevel (Integer, default=10)
  - [ ] UnitPrice (Float, default=0.0)
  - [ ] CreatedAt (DateTime, default=utcnow)
  - [ ] Relationship to DispensingRecords

- [ ] Create `Prescription` table
  - [ ] PrescriptionId (PK, Integer)
  - [ ] ReferralId (Integer, indexed)
  - [ ] PatientId (Integer, indexed)
  - [ ] PrescribingDoctorId (Integer)
  - [ ] Medications (JSON - list of {medication_id, quantity, frequency, instructions})
  - [ ] Status (String, default="Active", indexed)
  - [ ] CreatedAt (DateTime, default=utcnow)
  - [ ] UpdatedAt (DateTime, default=utcnow, onupdate=utcnow)
  - [ ] Relationship to DispensingRecords with cascade delete

- [ ] Create `DispensingRecord` table
  - [ ] DispensingId (PK, Integer)
  - [ ] PrescriptionId (Integer, FK to Prescription)
  - [ ] MedicationId (Integer, indexed)
  - [ ] QuantityDispensed (Integer)
  - [ ] DispensedAt (DateTime, default=utcnow)
  - [ ] DispensedBy (String, default="Pharmacy")

### Step 1.3: Implement Pydantic Schemas (`services/pharmacy/schemas.py`)
- [ ] Create `MedicationBase` schema
- [ ] Create `MedicationCreate` schema
- [ ] Create `MedicationRead` schema (with config from_attributes=True)
- [ ] Create `DispensingRecordRead` schema
- [ ] Create `MedicationInPrescription` nested schema (for medications in prescription)
- [ ] Create `PrescriptionBase` schema
- [ ] Create `PrescriptionCreate` schema
- [ ] Create `PrescriptionRead` schema
- [ ] Create `PrescriptionDetailRead` schema (includes dispensing history)

### Step 1.4: Create HTTP Client for Inter-service Communication (`services/pharmacy/clients.py`)
- [ ] Import httpx and create AsyncClient
- [ ] Create function to update patient medications:
  - [ ] `async def update_patient_medication(patient_id, medication_data)`
  - [ ] POST to `http://patient-service:8001/patients/{patient_id}/medications`
  - [ ] Handle errors gracefully (log warnings, don't raise)
- [ ] Create function to call referral service (optional for verification)
- [ ] Add timeouts and error handling

### Step 1.5: Implement FastAPI Endpoints (`services/pharmacy/main.py`)

**Medication Endpoints:**
- [ ] `GET /medications` - List all medications with filters
  - [ ] Query param: `low_stock` (boolean) - filter to items below minimum
  - [ ] Return: List[MedicationRead]
  - [ ] Status: 200

- [ ] `GET /medications/{medication_id}` - Get specific medication
  - [ ] Return: MedicationRead
  - [ ] Status: 200 or 404

- [ ] `POST /medications` - Add new medication (admin)
  - [ ] Body: MedicationCreate
  - [ ] Return: MedicationRead
  - [ ] Status: 201

- [ ] `PATCH /medications/{medication_id}` - Update medication
  - [ ] Body: Partial MedicationCreate
  - [ ] Return: MedicationRead
  - [ ] Status: 200 or 404

**Prescription Endpoints:**
- [ ] `GET /prescriptions` - List prescriptions with filters
  - [ ] Query params: `status`, `patientId`, `referralId`
  - [ ] Return: List[PrescriptionRead]
  - [ ] Status: 200

- [ ] `GET /prescriptions/{prescription_id}` - Get prescription detail
  - [ ] Return: PrescriptionDetailRead (includes dispensing history)
  - [ ] Status: 200 or 404

- [ ] `POST /prescriptions` - Create prescription (from referral acceptance)
  - [ ] Body: PrescriptionCreate
  - [ ] Return: PrescriptionRead
  - [ ] Status: 201
  - [ ] Validate referral exists (optional, log if not found)

- [ ] `PATCH /prescriptions/{prescription_id}` - Update prescription
  - [ ] Body: Partial update (only status)
  - [ ] Return: PrescriptionRead
  - [ ] Status: 200 or 404

**Dispensing Endpoints:**
- [ ] `POST /prescriptions/{prescription_id}/dispense` - Record dispensing
  - [ ] Body: {medication_id, quantity_dispensed}
  - [ ] Actions:
    - [ ] Create DispensingRecord
    - [ ] Decrease medication stock level
    - [ ] Call patient service to update medication list
  - [ ] Return: {success: true, dispensing_id, remaining_stock}
  - [ ] Status: 200 or 400/404

- [ ] `GET /prescriptions/{prescription_id}/dispensing-history` - View dispensing records
  - [ ] Return: List[DispensingRecord]
  - [ ] Status: 200 or 404

**Inventory Endpoints:**
- [ ] `GET /inventory/low-stock` - Get medications below minimum level
  - [ ] Return: List[MedicationRead] (filtered to MinStockLevel > StockLevel)
  - [ ] Status: 200

**Health Endpoint:**
- [ ] `GET /health` - Health check for docker-compose (optional)
  - [ ] Return: {status: "healthy"}
  - [ ] Status: 200

### Step 1.6: Implement Seed Data (`services/pharmacy/seed.py`)
- [ ] Create `seed_if_empty(db)` function
- [ ] Seed 10 medications:
  - [ ] Mix of common medications (Aspirin, Metformin, Lisinopril, etc.)
  - [ ] Vary stock levels (some at 50, some at 5, some at 2)
  - [ ] Ensure at least 3 items below MinStockLevel (10) for testing low-stock
  - [ ] Set realistic unit prices
- [ ] Seed 5 prescriptions linked to existing referrals:
  - [ ] Use referral IDs 1-5 (assumes referral service has seeded these)
  - [ ] Use patient IDs 1-5
  - [ ] Use doctor IDs from seed
  - [ ] Status: "Active" for some, "Completed" for others
- [ ] Seed 3 dispensing records for completed prescriptions

### Step 1.7: Configure Database (`services/pharmacy/db.py`)
- [ ] Create SQLAlchemy engine with `sqlite:///./pharmacy.db`
- [ ] Create SessionLocal with autocommit=False, autoflush=False
- [ ] Create Base declarative class
- [ ] Implement `get_db()` dependency generator
- [ ] Add `Base.metadata.create_all(bind=engine)` call in main.py startup

### Step 1.8: Docker Configuration
- [ ] Create `services/pharmacy/Dockerfile`
  - [ ] Use `python:3.11-slim` as base
  - [ ] WORKDIR `/app`
  - [ ] Copy requirements.txt and install
  - [ ] Copy service files
  - [ ] EXPOSE 8006
  - [ ] CMD: `uvicorn main:app --host 0.0.0.0 --port 8006`

- [ ] Create `services/pharmacy/requirements.txt`
  - [ ] fastapi==0.115.0
  - [ ] uvicorn[standard]==0.30.6
  - [ ] sqlalchemy==2.0.35
  - [ ] pydantic==2.9.2
  - [ ] httpx==0.27.2

---

## Phase 2: Backend Integration

### Step 2.1: Update docker-compose.yml
- [ ] Add pharmacy service definition:
  ```yaml
  pharmacy-service:
    build: ./services/pharmacy
    ports:
      - "8006:8006"
    environment:
      PATIENT_SERVICE_URL: http://patient-service:8001
    depends_on:
      - patient-service
  ```
- [ ] Update gateway depends_on to include pharmacy-service

### Step 2.2: Update API Gateway (`gateway/main.py`)
- [ ] Add route for pharmacy service:
  - [ ] Pattern: `/api/pharmacy/*` → `http://pharmacy-service:8006`
  - [ ] Follow existing routing pattern
  - [ ] Test routing is correct

### Step 2.3: Update Referral Service Integration

**File: `services/referral/clients.py`**
- [ ] Add import for httpx
- [ ] Create `async def create_prescription_from_referral(referral_data):`
  - [ ] POST to `http://pharmacy-service:8006/prescriptions`
  - [ ] Handle errors gracefully

**File: `services/referral/main.py`**
- [ ] In the `complete_transition` endpoint, after referral transitions to "Accepted":
  - [ ] Extract referral data (ReferralId, PatientId, PrescribingDoctorId)
  - [ ] Call `create_prescription_from_referral()` async
  - [ ] Log any errors but don't fail the referral status change
  - [ ] Test that prescription is created after referral acceptance

### Step 2.4: Test Backend Locally
- [ ] Run: `docker compose up -d --build`
- [ ] Verify all services start: `docker compose ps`
- [ ] Check pharmacy logs: `docker compose logs -f pharmacy-service`
- [ ] Test endpoints via Swagger:
  - [ ] http://localhost:8006/docs - Pharmacy Swagger
  - [ ] GET /medications - verify 10 items seeded
  - [ ] GET /prescriptions - verify 5 items seeded
  - [ ] Create referral via http://localhost:8003/docs
  - [ ] Accept referral → check prescription auto-created
  - [ ] Dispense medication → verify inventory decreased
  - [ ] Verify patient medication updated via Patient service

---

## Phase 3: Frontend Service & Models

### Step 3.1: Create Pharmacy Models (`frontend/src/app/core/models/pharmacy.model.ts`)
- [ ] Create `Medication` interface
  - [ ] MedicationId: number
  - [ ] Name: string
  - [ ] Dosage: string
  - [ ] StockLevel: number
  - [ ] MinStockLevel: number
  - [ ] UnitPrice?: number

- [ ] Create `MedicationInPrescription` interface
  - [ ] medication_id: number
  - [ ] quantity: number
  - [ ] frequency: string
  - [ ] instructions?: string

- [ ] Create `Prescription` interface
  - [ ] PrescriptionId: number
  - [ ] ReferralId: number
  - [ ] PatientId: number
  - [ ] PrescribingDoctorId: number
  - [ ] Medications: MedicationInPrescription[]
  - [ ] Status: 'Active' | 'Completed' | 'Voided'
  - [ ] CreatedAt: string
  - [ ] UpdatedAt: string

- [ ] Create `DispensingRecord` interface
  - [ ] DispensingId: number
  - [ ] PrescriptionId: number
  - [ ] MedicationId: number
  - [ ] QuantityDispensed: number
  - [ ] DispensedAt: string
  - [ ] DispensedBy: string

- [ ] Create `PrescriptionDetail` interface (extends Prescription)
  - [ ] Add DispensingHistory: DispensingRecord[]

### Step 3.2: Create Pharmacy Service (`frontend/src/app/core/services/pharmacy.service.ts`)
- [ ] Create injectable service with `providedIn: 'root'`
- [ ] Inject HttpClient and other dependencies
- [ ] Define state signals:
  - [ ] `medications = signal<Medication[]>([])`
  - [ ] `prescriptions = signal<Prescription[]>([])`
  - [ ] `selectedPrescription = signal<PrescriptionDetail | null>(null)`
  - [ ] `lowStockItems = signal<Medication[]>([])`
  - [ ] `loading = signal<boolean>(false)`

- [ ] Implement methods:
  - [ ] `loadMedications()` - GET /medications, update signal
  - [ ] `getMedicationById(id)` - GET /medications/{id}
  - [ ] `loadPrescriptions(filters?)` - GET /prescriptions with optional filters
  - [ ] `getPrescriptionById(id)` - GET /prescriptions/{id}
  - [ ] `createPrescription(data)` - POST /prescriptions (for manual creation if needed)
  - [ ] `dispenseMedication(prescriptionId, medicationId, quantity)` - POST /prescriptions/{id}/dispense
  - [ ] `loadLowStockItems()` - GET /inventory/low-stock
  - [ ] `getPrescriptionHistory(id)` - GET /prescriptions/{id}/dispensing-history

---

## Phase 4: Frontend Components

### Step 4.1: Create Pharmacy Dashboard (`features/pharmacy/pharmacy-dashboard.component.ts`)
- [ ] Create component with:
  - [ ] Inject PharmacyService
  - [ ] Load pending prescriptions and low-stock items on init
  - [ ] Display:
    - [ ] Count of active prescriptions
    - [ ] Count of low-stock medications
    - [ ] List of 5 most recent prescriptions
    - [ ] List of low-stock items (alert style)
  - [ ] Navigation links to prescription list and inventory

**Template (`pharmacy-dashboard.component.html`):**
- [ ] Header: "Pharmacy Dashboard"
- [ ] Stats row: Pending Prescriptions | Low Stock Items
- [ ] Recent Prescriptions table (PatientId, ReferralId, Status, CreatedAt)
- [ ] Low Stock Alerts table (Name, Current Stock, Minimum, Alert color)
- [ ] Action buttons: "View All Prescriptions", "Manage Inventory"

### Step 4.2: Create Prescription List (`features/pharmacy/prescription-list.component.ts`)
- [ ] Create component with:
  - [ ] Inject PharmacyService
  - [ ] Load prescriptions on init
  - [ ] Add filters:
    - [ ] By Status (Active, Completed, All)
    - [ ] By PatientId (search)
  - [ ] Display table:
    - [ ] PrescriptionId, PatientId, ReferralId, Status, CreatedAt
  - [ ] Row click → Navigate to detail view

**Template (`prescription-list.component.html`):**
- [ ] Header: "Prescriptions"
- [ ] Filter controls (status dropdown, patient search)
- [ ] Table with columns: ID, Patient, Referral, Status, Created, Actions
- [ ] "View Details" button for each row

### Step 4.3: Create Prescription Detail (`features/pharmacy/prescription-detail.component.ts`)
- [ ] Create component with:
  - [ ] Inject PharmacyService, ActivatedRoute
  - [ ] Get prescription ID from route params
  - [ ] Load prescription detail on init
  - [ ] Display:
    - [ ] Prescription info (ID, Patient, Doctor, ReferralId, Status)
    - [ ] Medications in prescription (name, dosage, quantity, frequency)
    - [ ] Dispensing history (list of past dispensing records)
  - [ ] Dispense form:
    - [ ] Dropdown to select medication (from prescription medications)
    - [ ] Input for quantity to dispense
    - [ ] "Dispense" button
    - [ ] On success: Show confirmation, reload data

**Template (`prescription-detail.component.html`):**
- [ ] Header: "Prescription #{id}"
- [ ] Info section: Patient, Doctor, Referral, Status
- [ ] Medications section: Table of medications with dosage, quantity, frequency
- [ ] Dispensing form:
  - [ ] Select medication
  - [ ] Input quantity
  - [ ] "Dispense" button
- [ ] Dispensing history table: DateDisp ensed, Medication, Quantity, DispensedBy

### Step 4.4: Create Components File Structure
```
frontend/src/app/features/pharmacy/
├── pharmacy-dashboard.component.ts
├── pharmacy-dashboard.component.html
├── pharmacy-list.component.ts
├── prescription-list.component.html
├── prescription-detail.component.ts
└── prescription-detail.component.html
```

---

## Phase 5: Frontend Routing & Navigation

### Step 5.1: Update App Routes (`frontend/src/app/app.routes.ts`)
- [ ] Add pharmacy routes under authenticated shell:
  ```typescript
  {
    path: 'pharmacy',
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: PharmacyDashboardComponent },
      { path: 'prescriptions', component: PrescriptionListComponent },
      { path: 'prescriptions/:id', component: PrescriptionDetailComponent },
    ]
  }
  ```
- [ ] Test navigation works

### Step 5.2: Update Navigation (`frontend/src/app/app.component.html`)
- [ ] Add pharmacy link to main navigation menu
- [ ] Link: `/pharmacy/dashboard`
- [ ] Label: "Pharmacy"
- [ ] Position: After "Referrals" link
- [ ] Test link navigation

---

## Phase 6: End-to-End Testing

### Step 6.1: Manual Integration Testing
- [ ] Start all services: `./start_all.sh`
- [ ] Wait for frontend to load: `http://localhost:4200`

**Test Workflow:**
1. [ ] Navigate to Referrals → Create new referral → Fill form → Submit
2. [ ] List referrals → Find the one just created (should be in "Draft")
3. [ ] Click → Submit referral (transitions to "Submitted")
4. [ ] Click → Accept referral (transitions to "Accepted")
5. [ ] Navigate to Pharmacy → Dashboard
6. [ ] Verify prescription appears in "Recent Prescriptions"
7. [ ] Click "View All Prescriptions" → See the new prescription
8. [ ] Click prescription → Open detail view
9. [ ] Fill dispense form: select medication, quantity 5
10. [ ] Click "Dispense"
11. [ ] Verify:
    - [ ] Dispensing record appears in history
    - [ ] Pharmacy dashboard low-stock count updates
    - [ ] Go to Patient Profile → Medications → New medication appears
12. [ ] Test low-stock alerts:
    - [ ] Check inventory for items below minimum
    - [ ] Verify they appear on dashboard with alert styling

### Step 6.2: API Testing (via Swagger)
- [ ] Pharmacy Swagger: `http://localhost:8006/docs`
- [ ] Test each endpoint:
  - [ ] GET /medications - verify 10 seeded items
  - [ ] GET /medications?low_stock=true - verify 3+ items
  - [ ] POST /prescriptions - create manual prescription
  - [ ] POST /prescriptions/{id}/dispense - record dispensing
  - [ ] GET /prescriptions - list with filters
  - [ ] GET /inventory/low-stock - verify low items

### Step 6.3: Error Handling Tests
- [ ] Try dispensing more than available stock → Error
- [ ] Try dispensing non-existent prescription → 404
- [ ] Try dispensing non-existent medication → 400
- [ ] Test with patient service unavailable (stop it):
  - [ ] Dispense medication → Pharmacy updates locally
  - [ ] Log shows patient update failed but prescription recorded

---

## Phase 7: Verification Checklist

### Backend Verification
- [ ] Pharmacy service starts without errors: `docker compose logs pharmacy-service`
- [ ] Database file created: `ls services/pharmacy/pharmacy.db`
- [ ] Sample data seeded: Check Swagger for 10 medications, 5 prescriptions
- [ ] All endpoints respond: Test via Swagger
- [ ] Inter-service calls work: Referral acceptance creates prescription
- [ ] Inventory tracking works: Dispensing decreases stock
- [ ] Patient updates work: Dispensing updates patient medications

### Frontend Verification
- [ ] Pharmacy service loads without console errors
- [ ] Dashboard displays pending count and low-stock items
- [ ] Prescription list loads and displays prescriptions
- [ ] Prescription detail shows medications and dispensing history
- [ ] Dispense form works and updates data
- [ ] Navigation links work
- [ ] Route guards work (can't access pharmacy without auth)

### Integration Verification
- [ ] End-to-end workflow: Referral → Prescription → Dispensing → Updates
- [ ] Data consistency: Check database directly if needed
- [ ] Error handling: Services recover gracefully from errors
- [ ] Performance: No significant delays on any endpoint

---

## Success Criteria (MVP Complete)

✅ **Backend**
- [ ] Pharmacy service running on port 8006
- [ ] All 6 endpoints working (medications CRUD, prescriptions CRUD, dispense)
- [ ] Inventory tracking functional
- [ ] Patient updates on dispensing
- [ ] Referral integration working
- [ ] Seed data present

✅ **Frontend**
- [ ] Pharmacy dashboard showing pending and low-stock
- [ ] Prescription list with filtering
- [ ] Prescription detail with dispensing capability
- [ ] Navigation integrated
- [ ] No console errors

✅ **Integration**
- [ ] End-to-end: Accept referral → See prescription → Dispense → Inventory decreases
- [ ] Patient medication list updated after dispensing
- [ ] All services communicate correctly
- [ ] Error handling working

---

## Notes & Reminders

- **Docker:** After modifying files, rebuild: `docker compose up -d --build`
- **Database:** To reset pharmacy DB, delete `services/pharmacy/pharmacy.db` and restart service
- **Ports:** Ensure ports 8006 not in use before starting
- **Async:** All inter-service calls are async for non-blocking behavior
- **Error Handling:** Pharmacy service is resilient to patient service failures
- **Next Week:** Refill management, partial dispensing, and advanced features deferred

---

## Files Checklist

**Backend (New):**
- [ ] `services/pharmacy/main.py`
- [ ] `services/pharmacy/models.py`
- [ ] `services/pharmacy/schemas.py`
- [ ] `services/pharmacy/db.py`
- [ ] `services/pharmacy/seed.py`
- [ ] `services/pharmacy/clients.py`
- [ ] `services/pharmacy/Dockerfile`
- [ ] `services/pharmacy/requirements.txt`

**Backend (Modified):**
- [ ] `docker-compose.yml`
- [ ] `gateway/main.py`
- [ ] `services/referral/main.py`
- [ ] `services/referral/clients.py`

**Frontend (New):**
- [ ] `frontend/src/app/core/services/pharmacy.service.ts`
- [ ] `frontend/src/app/core/models/pharmacy.model.ts`
- [ ] `frontend/src/app/features/pharmacy/pharmacy-dashboard.component.ts`
- [ ] `frontend/src/app/features/pharmacy/pharmacy-dashboard.component.html`
- [ ] `frontend/src/app/features/pharmacy/prescription-list.component.ts`
- [ ] `frontend/src/app/features/pharmacy/prescription-list.component.html`
- [ ] `frontend/src/app/features/pharmacy/prescription-detail.component.ts`
- [ ] `frontend/src/app/features/pharmacy/prescription-detail.component.html`

**Frontend (Modified):**
- [ ] `frontend/src/app/app.routes.ts`
- [ ] `frontend/src/app/app.component.html`

---

## Estimated Time Breakdown

- **Backend Setup (Steps 1.1 - 1.8):** 2-3 hours
- **Backend Integration (Steps 2.1 - 2.4):** 1-2 hours
- **Frontend Models & Service (Steps 3.1 - 3.2):** 1 hour
- **Frontend Components (Steps 4.1 - 4.4):** 2-3 hours
- **Routing & Navigation (Step 5):** 30 minutes
- **Testing (Step 6):** 1-2 hours
- **Total:** 8-12 hours

**Status:** ✅ Ready for implementation

---

**Created:** 2026-08-12  
**Feature Branch:** F4-Pharmacy-Ann  
**Base Branch:** master
