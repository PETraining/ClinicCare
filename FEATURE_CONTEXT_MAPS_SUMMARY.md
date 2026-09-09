# ClinicCare Feature Context Maps — Summary

**Date**: 2026-08-19  
**Purpose**: Quick reference for what each of the 5 features touches (files, endpoints, tables)

---

## 1. Appointments Feature

**Status**: Complete  
**Developer Team**: 4 members (Backend, Frontend x2, QA)  
**Timeline**: 2 weeks

### What It Touches

#### Backend Files
- **Referral Service** (`services/referral/`)
  - `models.py` — New `Appointment` model with relationship to `Referral`
  - `main.py` — 5 new endpoints
  - `schemas.py` — `AppointmentCreate`, `AppointmentRead`, `AppointmentStatus` enum
  - `seed.py` — Sample appointment data

#### Database Tables (Referral Service)
| Table | New Fields |
|-------|-----------|
| `appointment` | AppointmentId (PK), ReferralId (FK), PatientId, SpecialistId, ScheduledDate, Location, Status, CreatedAt, UpdatedAt |
| `referral` | New relationship: `appointments` (one-to-many) |

#### API Endpoints (Referral Service)
```
POST   /referrals/{referral_id}/appointments
GET    /referrals/{referral_id}/appointments
PATCH  /appointments/{appointment_id}/reschedule
PATCH  /appointments/{appointment_id}/complete
PATCH  /appointments/{appointment_id}/cancel
```

#### Frontend Files
- `frontend/src/app/models/appointment.model.ts` — TypeScript interfaces
- `frontend/src/app/core/services/appointment.service.ts` — HTTP service with signals
- `frontend/src/app/features/referrals/appointment-list.component.ts/html/css`
- `frontend/src/app/features/referrals/schedule-appointment.component.ts/html/css`
- `frontend/src/app/features/referrals/referral-tracking.component.ts` — Integration point

#### API Gateway
- Route: `/api/referrals/*` → Referral Service (8003)

---

## 2. Diagnostic Lab Feature

**Status**: Complete + Remediated (2026-08-12)  
**Developer Team**: 4 members (Backend, Frontend x2, QA)  
**Timeline**: 2 weeks

### What It Touches

#### Backend Files
- **Lab Service** (`services/lab/`) — NEW MICROSERVICE
  - `models.py` — `TestCatalog`, `LabOrder`, `LabTest`, `TestResult`, `StatusHistory`
  - `main.py` — 20+ endpoints
  - `schemas.py` — Pydantic models for all entities
  - `seed.py` — 27 tests across 6 specialties
  - `Dockerfile` — Container definition

#### Database Tables (Lab Service)
| Table | Purpose |
|-------|---------|
| `test_catalog` | Test definitions (code, name, specialty, normal range) |
| `lab_order` | Orders linked to referrals (PatientId, ReferralId, DoctorId, Status) |
| `lab_test` | Individual tests within an order (TestId, OrderId, Status) |
| `test_result` | Results for each test (value, flag, datetime) |
| `status_history` | Audit trail of status transitions |

#### API Endpoints (Lab Service on port 8006)
```
GET    /tests                              # List catalog
GET    /tests/{id}                         # Get test details
GET    /tests/code/{code}                  # Search by code
POST   /tests                              # Create test
PATCH  /tests/{id}                         # Update test
DELETE /tests/{id}                         # Delete test

GET    /orders                             # List orders
GET    /orders/{id}                        # Get order details
POST   /orders                             # Create order (validates referral, patient, doctor)
PATCH  /orders/{id}                        # Update order
GET    /orders/{order_id}/tests            # List tests in order
GET    /orders/{order_id}/tests/{test_id}  # Get specific test

POST   /orders/{id}/collect                # Collect sample
PATCH  /orders/{id}/status                 # Update status
GET    /orders/{id}/history                # Status history

GET    /results                            # List results
POST   /results                            # Submit result
PATCH  /results/{id}/review                # Review result

GET    /stats                              # Lab statistics
GET    /orders/stats/specialty/{specialty} # Stats by specialty
```

#### Frontend Files
- **Clinician Interface** (`frontend/src/app/features/lab/`)
  - `lab.service.ts` — HTTP client service
  - `lab-test-catalog.component.ts/html/css` — Browse tests
  - `create-lab-order.component.ts/html/css` — Multi-step order form
  - `lab-orders-list.component.ts/html/css` — Filterable list
  - `lab-results.component.ts/html/css` — View results
  - `lab-results-panel.component.ts` — Embedded in patient chart
  - `app.routes.ts` — Routes: `lab/tests`, `lab/orders`, `lab/orders/new`, `lab/orders/:id`

- **Lab Technician Interface** (`frontend/src/app/features/lab-technician/`)
  - `lab-tech.service.ts` — HTTP client (separate from clinician service)
  - `technician-dashboard.component.ts/html/css` — Overview
  - `sample-tracker.component.ts/html/css` — Track collections
  - `sample-label.component.ts/html/css` — Barcode labels
  - `test-processing.component.ts/html/css` — Process tests & results
  - `result-entry.component.ts/html/css` — Enter results
  - `lab-stats.component.ts/html/css` — Statistics dashboard
  - `app.routes.ts` — Routes: `lab-tech/dashboard`, `lab-tech/samples`, `lab-tech/process`, `lab-tech/stats`

#### API Gateway
- Route: `/api/labs/*` → Lab Service (8006)
- Special handling: Lab Service NOT in `PREFIXED_SERVICES` (uses direct `/api/labs/`)

#### Notification Integration
- Lab Service calls Notification Service (8005) on:
  - `LabOrderCreated`
  - `LabResultCompleted`
  - `LabResultCritical`

#### Known Gaps
- ❌ Role-based access control for `/lab-tech/*` (plan required, not implemented)
- ⚠️ Real-time polling on clinician orders (plan asked for 30s refresh, not implemented)
- ⚠️ Referral detail embedding (currently link-based, not embedded panel)
- ⚠️ CLAUDE.md not updated with Lab Service info

---

## 3. Insurance Eligibility & Prior Authorization Feature

**Status**: Planning/Week 1  
**Developer Team**: 2+ members (Backend, Frontend)  
**Timeline**: 2 weeks

### What It Touches

#### Backend Files
- **Patient Service** (`services/patient/`)
  - `models.py` — New `Insurance` model
  - `main.py` — Insurance CRUD endpoints
  - `schemas.py` — `InsuranceCreate`, `InsuranceRead`
  - `seed.py` — Sample insurance data

- **Referral Service** (`services/referral/`)
  - `models.py` — New `Authorization` model
  - `main.py` — Authorization status endpoints
  - `schemas.py` — `AuthorizationCreate`, `AuthorizationRead`
  - `seed.py` — Sample authorization data

#### Database Tables
**Patient Service**:
| Table | Fields |
|-------|--------|
| `insurance` | InsuranceId (PK), PatientId (FK), CarrierName, PolicyNumber, GroupNumber, EffectiveDate, ExpirationDate, CoverageLevels |

**Referral Service**:
| Table | Fields |
|-------|--------|
| `authorization` | AuthorizationId (PK), ReferralId (FK), Status (Not Required → Pending → Approved/Denied), RequestedAt, ReviewedAt, Reason |

#### API Endpoints

**Patient Service**:
```
GET    /patients/{patient_id}/insurance
POST   /patients/{patient_id}/insurance
PATCH  /insurance/{insurance_id}
DELETE /insurance/{insurance_id}
```

**Referral Service**:
```
GET    /referrals/{referral_id}/authorization
POST   /referrals/{referral_id}/authorization
PATCH  /authorization/{auth_id}/status
GET    /authorization/stats/status-distribution
```

#### Frontend Files (Week 2)
- `frontend/src/app/features/patients/patient-details.component.ts` — Insurance info display
- `frontend/src/app/features/referrals/referral-creation.component.ts` — Auth status badge
- `frontend/src/app/features/referrals/referral-list.component.ts` — Auth status visibility
- New components: `insurance-panel.component.ts`, `authorization-status.component.ts`

#### Notification Integration (Week 2)
- Notification Service emits events when authorization status changes

#### API Gateway
- Routes: `/api/patients/{id}/insurance/*` → Patient Service (8001)
- Routes: `/api/referrals/{id}/authorization/*` → Referral Service (8003)

---

## 4. Pharmacy & Prescription Management Feature

**Status**: Planning/Week 1  
**Developer Team**: 2+ members (Backend, Frontend)  
**Timeline**: 2 weeks

### What It Touches

#### Backend Files
- **Pharmacy Service** (`services/pharmacy/`) — NEW MICROSERVICE (Port 8006)
  - `models.py` — `Medication`, `Prescription`, `DispensingRecord`
  - `main.py` — Medication & prescription endpoints
  - `schemas.py` — Pydantic models
  - `seed.py` — Sample medications (10) and prescriptions (5)
  - `Dockerfile` — Container definition

#### Database Tables (Pharmacy Service)
| Table | Fields |
|-------|--------|
| `medications` | MedicationId (PK), Name, Dosage, StockLevel, MinStockLevel, UnitPrice, CreatedAt |
| `prescriptions` | PrescriptionId (PK), ReferralId (FK), PatientId (FK), PrescribingDoctorId (FK), Medications (JSON), Status, CreatedAt, UpdatedAt |
| `dispensing_records` | DispensingId (PK), PrescriptionId (FK), MedicationId (FK), QuantityDispensed, DispensedAt, DispensedBy |

#### API Endpoints (Pharmacy Service on port 8006)
```
GET    /medications
GET    /medications/{id}
POST   /medications
PATCH  /medications/{id}

GET    /prescriptions
GET    /prescriptions/{id}
POST   /prescriptions              # Auto-created when referral accepted
PATCH  /prescriptions/{id}

POST   /prescriptions/{id}/dispense
GET    /prescriptions/{id}/dispensing-history

GET    /inventory/low-stock
```

#### Frontend Files (Week 2)
- `frontend/src/app/features/pharmacy/`
  - `pharmacy.service.ts` — HTTP client
  - `medication-inventory.component.ts/html/css` — Inventory management
  - `prescription-list.component.ts/html/css` — Prescription tracking
  - `dispense-form.component.ts/html/css` — Dispensing workflow
  - `low-stock-alerts.component.ts/html/css` — Inventory alerts
  - `app.routes.ts` — Routes: `pharmacy/inventory`, `pharmacy/prescriptions`, `pharmacy/dispense`

#### Integration Points
- **Referral Service** calls Pharmacy Service when referral reaches "Accepted" status
  ```
  POST /api/pharmacy/prescriptions
  {
    "ReferralId": 5,
    "PatientId": 2,
    "PrescribingDoctorId": 10,
    "Medications": [...]
  }
  ```

- **Pharmacy Service** calls Patient Service when prescription is dispensed
  ```
  POST /api/patients/{patient_id}/medications
  {
    "Name": "Aspirin",
    "Dosage": "500mg",
    "PrescriptionId": 15,
    "Active": true
  }
  ```

#### API Gateway
- Route: `/api/pharmacy/*` → Pharmacy Service (8006)
- New service registration in `SERVICE_MAP`

#### Notification Integration (Optional)
- Pharmacy Service may emit events to Notification Service on dispensing

---

## Cross-Feature Dependency Matrix

| Feature | Depends On | Called By |
|---------|-----------|-----------|
| **Appointments** | Referral Service (check status) | ReferralTracking UI, Patient Portal |
| **Lab** | Patient Service, Doctor Service, Referral Service | Clinician UI, Tech UI, Referral details |
| **Insurance Eligibility** | Patient Service, Referral Service, Notification Service | Referral creation, Patient details |
| **Pharmacy** | Referral Service, Patient Service, Notification Service | Prescription workflow |

---

## Architecture: Current + Future

### Current System (5 Services)
```
Frontend (4200)
    ↓
API Gateway (8000)
    ↓
[Patient (8001), Doctors (8002), Referral (8003), Document (8004), Notification (8005)]
```

### After All Features (8 Services)
```
Frontend (4200)
    ↓
API Gateway (8000)
    ↓
[Patient (8001), Doctors (8002), Referral (8003), Document (8004), 
 Notification (8005), Lab (8006), Pharmacy (8006), Insurance (embedded)]
```

**Note**: Lab and Pharmacy both on 8006 would be a conflict; actual implementation may use 8007 for one or consolidate.

---

## Summary by Layer

### Database Tables Added

| Service | Tables Added | Count |
|---------|-------------|-------|
| Referral | Appointment | 1 |
| Lab | TestCatalog, LabOrder, LabTest, TestResult, StatusHistory | 5 |
| Patient | Insurance | 1 |
| Referral | Authorization | 1 |
| Pharmacy | Medication, Prescription, DispensingRecord | 3 |
| **Total** | | **11 new tables** |

### API Endpoints Added

| Service | Endpoints | Count |
|---------|-----------|-------|
| Referral (Appointments) | 5 | 5 |
| Lab | 20+ | 20 |
| Patient (Insurance) | 4 | 4 |
| Referral (Authorization) | 4 | 4 |
| Pharmacy | 12 | 12 |
| **Total** | | **55+ endpoints** |

### Frontend Components Added

| Feature | Components | Count |
|---------|-----------|-------|
| Appointments | 2 (List, Schedule) | 2 |
| Lab | 8 (Clinician) + 7 (Technician) | 15 |
| Insurance Eligibility | 2 (Insurance panel, Auth status) | 2 |
| Pharmacy | 5 (Inventory, Prescriptions, Dispense, Alerts, etc.) | 5 |
| **Total** | | **24+ components** |

---

## Document References

- **Appointments**: `FeatureContextMaps/Appoinments-context-map.md`, `Appoinments-plan.md`
- **Diagnostic Lab**: `FeatureContextMaps/DiagnosticLab-context-map.md`, `DiagnosticLab-plan.md`
- **Insurance Eligibility**: `FeatureContextMaps/insurance-eligibility-context-map.md`, `insurance-eligibility-plan.md`
- **Pharmacy**: `FeatureContextMaps/Pharmacy-CONTEXT.md`, `Pharmacy-PLAN.md`, `Pharmacy-prescription-context.md`, `Pharmacy-prescription-plan.md`

---

**Last Updated**: 2026-08-19  
**Next Step**: Review implementation plans for each feature and begin backend development
