# Feature Context Maps Summary

## Overview
This document summarizes the 4 major features documented in `FeatureContextMaps/`, showing what files, endpoints, and database tables each feature touches.

---

## 1. 📅 **Appointments** Feature

### Files Modified/Created

**Backend:**
- `services/referral/models.py` - Add Appointment model
- `services/referral/main.py` - Add appointment endpoints
- `services/referral/schemas.py` - Add appointment schemas

**Frontend:**
- `frontend/src/app/features/appointments/` - New feature directory
- `frontend/src/app/core/services/appointment.service.ts` - HTTP client

### Database Tables

**New Table in Referral Service:**
```sql
appointments (
  AppointmentId INT PRIMARY KEY,
  ReferralId INT FOREIGN KEY,
  PatientId INT,                    -- Denormalized from referral
  SpecialistId INT,
  ScheduledDate DATETIME,
  Location VARCHAR,
  Status VARCHAR,                   -- Scheduled, Completed, Cancelled, No Show
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP
)
```

### API Endpoints

```
POST   /referrals/{referralId}/appointments              - Create appointment
GET    /referrals/{referralId}/appointments              - List appointments for referral
PATCH  /appointments/{appointmentId}/reschedule          - Reschedule
PATCH  /appointments/{appointmentId}/complete            - Mark completed
PATCH  /appointments/{appointmentId}/cancel              - Mark cancelled
```

### Key Dependencies
- **Referral Service** - Appointments are tightly coupled to referrals
- **Frontend** - Display on referral tracking and patient details screens

### Status
✅ Fully designed and documented

---

## 2. 🧪 **Diagnostic Lab** Feature

### Files Modified/Created

**Backend:**
- `services/lab/main.py` - Lab endpoints
- `services/lab/models.py` - Lab data models
- `services/lab/schemas.py` - Lab API schemas
- `services/lab/seed.py` - 27 sample lab tests
- `services/lab/Dockerfile` - Container configuration
- `gateway/main.py` - Lab service routing

**Frontend - Clinician Interface:**
- `frontend/src/app/features/lab/lab-test-catalog.component.ts/html/css`
- `frontend/src/app/features/lab/create-lab-order.component.ts/html/css`
- `frontend/src/app/features/lab/lab-orders-list.component.ts/html/css`
- `frontend/src/app/features/lab/lab-results.component.ts/html/css`
- `frontend/src/app/features/lab/lab-results-panel.component.ts/html/css`

**Frontend - Lab Technician Interface:**
- `frontend/src/app/features/lab-technician/technician-dashboard.component.ts/html/css`
- `frontend/src/app/features/lab-technician/sample-tracker.component.ts/html/css`
- `frontend/src/app/features/lab-technician/test-processing.component.ts/html/css`
- `frontend/src/app/features/lab-technician/result-entry.component.ts/html/css`
- `frontend/src/app/features/lab-technician/sample-label.component.ts/html/css`
- `frontend/src/app/features/lab-technician/lab-stats.component.ts/html/css`
- `frontend/src/app/core/services/lab.service.ts` - Clinician HTTP client
- `frontend/src/app/core/services/lab-tech.service.ts` - Technician HTTP client

### Database Tables

**Lab Service (SQLite `lab.db`):**
```sql
test_catalog (
  TestId INT PRIMARY KEY,
  TestCode VARCHAR UNIQUE,
  TestName VARCHAR,
  Specialty VARCHAR,
  RequiresSample BOOLEAN,
  NormalRange VARCHAR,
  CreatedAt TIMESTAMP
)

lab_orders (
  OrderId INT PRIMARY KEY,
  PatientId INT,
  ReferralId INT,
  OrderedByDoctorId INT,
  OrderedDate TIMESTAMP,
  Status VARCHAR,                   -- pending, collected, in_progress, completed, cancelled
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP
)

order_tests (
  OrderTestId INT PRIMARY KEY,
  OrderId INT FOREIGN KEY,
  TestId INT FOREIGN KEY,
  Status VARCHAR,
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP,
  UNIQUE(OrderId, TestId)
)

lab_samples (
  SampleId INT PRIMARY KEY,
  OrderId INT FOREIGN KEY,
  SampleType VARCHAR,
  CollectedAt TIMESTAMP,
  CollectedBy VARCHAR,
  BarCode VARCHAR UNIQUE,
  CreatedAt TIMESTAMP
)

test_results (
  ResultId INT PRIMARY KEY,
  OrderTestId INT FOREIGN KEY,
  SampleId INT FOREIGN KEY,
  Value VARCHAR,
  Unit VARCHAR,
  IsAbnormal BOOLEAN,
  ReviewedBy VARCHAR,
  ReviewedAt TIMESTAMP,
  CreatedAt TIMESTAMP
)

status_history (
  HistoryId INT PRIMARY KEY,
  OrderId INT FOREIGN KEY,
  Status VARCHAR,
  ChangedAt TIMESTAMP,
  ChangedBy VARCHAR
)
```

### API Endpoints

**Test Catalog:**
```
GET    /tests                       - List tests
GET    /tests/{testId}              - Get specific test
GET    /tests/code/{testCode}       - Get by code
POST   /tests                       - Create test
PATCH  /tests/{testId}              - Update test
DELETE /tests/{testId}              - Delete test
```

**Lab Orders:**
```
POST   /orders                      - Create order
GET    /orders                      - List orders
GET    /orders/{orderId}            - Get order detail
PATCH  /orders/{orderId}            - Update order
GET    /orders/{orderId}/tests      - Get tests in order
```

**Sample Collection:**
```
POST   /orders/{orderId}/collect    - Record sample collection
GET    /orders/{orderId}/samples    - Get samples
```

**Test Results:**
```
POST   /orders/{orderId}/results    - Submit result
GET    /results/{resultId}          - Get result detail
PATCH  /results/{resultId}/review   - Review result
GET    /orders/{orderId}/history    - Get status history
```

**Statistics:**
```
GET    /stats                       - Overall stats
GET    /orders/stats/specialty/{specialty} - By specialty
```

### Key Dependencies
- **Referral Service** - Lab orders link to referrals
- **Doctors Service** - Doctor validation
- **Notification Service** - Order/result events
- **Patient Service** - Patient data

### Status
✅ MVP complete (with 10 documented gaps for Phase 2)
- ⚠️ Missing: Role-based access for technician role
- ⚠️ Missing: Real-time polling on clinician dashboard
- ⚠️ Missing: Embedded lab panel in referral view (currently navigation-based)

---

## 3. 🏥 **Appointments** Feature (Same as #1 above)

See Appointments section above.

---

## 4. 💳 **Insurance Eligibility & Prior Authorization** Feature

### Files Modified/Created

**Backend:**
- `services/patient/models.py` - Add Insurance model
- `services/patient/main.py` - Add insurance endpoints
- `services/patient/schemas.py` - Add insurance schemas
- `services/referral/models.py` - Add Authorization model
- `services/referral/main.py` - Add authorization endpoints
- `services/referral/schemas.py` - Add authorization schemas
- `gateway/main.py` - Route insurance/auth requests

**Frontend:**
- `frontend/src/app/features/patients/patient-details.component.ts` - Show insurance info
- `frontend/src/app/features/referrals/referral-creation.component.ts` - Check authorization
- `frontend/src/app/features/referrals/referral-list.component.ts` - Show auth status
- `frontend/src/app/core/services/insurance.service.ts` - HTTP client (new)

### Database Tables

**Patient Service (SQLite `patient.db`):**
```sql
insurance (
  InsuranceId INT PRIMARY KEY,
  PatientId INT FOREIGN KEY,
  InsuranceProvider VARCHAR,
  PolicyNumber VARCHAR,
  GroupNumber VARCHAR,
  MemberId VARCHAR,
  CoverageType VARCHAR,           -- HMO, PPO, EPO, etc.
  EffectiveDate DATE,
  TerminationDate DATE,
  IsPrimary BOOLEAN,
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP
)
```

**Referral Service (SQLite `referral.db`):**
```sql
authorization (
  AuthorizationId INT PRIMARY KEY,
  ReferralId INT FOREIGN KEY,
  InsuranceId INT,                -- Which insurance policy
  Status VARCHAR,                 -- Not Required, Pending, Approved, Denied
  RequestDate TIMESTAMP,
  ApprovalDate TIMESTAMP,
  AuthCode VARCHAR,
  AuthNumber VARCHAR,
  DenialReason VARCHAR,
  RequestedBy VARCHAR,
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP
)
```

### API Endpoints

**Insurance Management:**
```
POST   /patients/{patientId}/insurance           - Add insurance
GET    /patients/{patientId}/insurance           - List insurance
PATCH  /patients/{patientId}/insurance/{id}     - Update insurance
DELETE /patients/{patientId}/insurance/{id}     - Delete insurance
```

**Authorization Tracking:**
```
POST   /referrals/{referralId}/authorization    - Request authorization
GET    /referrals/{referralId}/authorization    - Get auth status
PATCH  /referrals/{referralId}/authorization    - Update status
```

### Key Dependencies
- **Patient Service** - Insurance tied to patients
- **Referral Service** - Authorization tied to referrals
- **Notification Service** - Auth status change events
- **Frontend** - Display during referral creation and patient details

### Status
📋 **Designed but not yet implemented**
- Week 1: Backend APIs for insurance & authorization
- Week 2: Frontend display and blocking referrals with denied authorization

---

## 5. 💊 **Pharmacy & Prescription Management** Feature

### Files Modified/Created

**Backend:**
- `services/pharmacy/main.py` - Pharmacy endpoints
- `services/pharmacy/models.py` - Pharmacy data models
- `services/pharmacy/schemas.py` - Pharmacy API schemas
- `services/pharmacy/seed.py` - Sample medications
- `services/pharmacy/Dockerfile` - Container configuration
- `gateway/main.py` - Pharmacy service routing

**Frontend:**
- `frontend/src/app/features/pharmacy/pharmacy-dashboard.component.ts/html/css`
- `frontend/src/app/features/pharmacy/prescription-create.component.ts/html/css`
- `frontend/src/app/features/pharmacy/prescription-detail.component.ts/html/css`
- `frontend/src/app/features/pharmacy/prescription-list.component.ts/html/css`
- `frontend/src/app/core/services/pharmacy.service.ts` - HTTP client

### Database Tables

**Pharmacy Service (SQLite `pharmacy.db`):**
```sql
medications (
  MedicationId INT PRIMARY KEY,
  Name VARCHAR,
  Dosage VARCHAR,
  StockLevel INT,                 -- Current quantity available
  MinStockLevel INT DEFAULT 10,   -- Low-stock threshold
  UnitPrice FLOAT,
  CreatedAt TIMESTAMP
)

prescriptions (
  PrescriptionId INT PRIMARY KEY,
  ReferralId INT,                 -- Links to Referral Service
  PatientId INT,                  -- Links to Patient Service
  PrescribingDoctorId INT,        -- Links to Doctors Service
  Medications JSON,               -- [{medication_id, quantity, frequency, instructions}]
  Status VARCHAR,                 -- Prescribed, PartiallyFulfilled, Fulfilled, Voided
  RefillsAllowed INT,
  RefillsRemaining INT,
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP
)

dispensing_records (
  DispensingId INT PRIMARY KEY,
  PrescriptionId INT FOREIGN KEY,
  MedicationId INT,
  QuantityDispensed INT,
  DispensedAt TIMESTAMP,
  DispensedBy VARCHAR
)

refill_requests (
  RefillRequestId INT PRIMARY KEY,
  PrescriptionId INT FOREIGN KEY,
  PatientId INT,
  Status VARCHAR,                 -- Pending, Approved, Fulfilled, Rejected
  RequestedAt TIMESTAMP,
  ApprovedAt TIMESTAMP,
  ApprovedBy VARCHAR,
  RejectionReason VARCHAR,
  RejectedBy VARCHAR,
  CreatedAt TIMESTAMP
)
```

### API Endpoints

**Medication Management:**
```
GET    /medications                - List medications
GET    /medications/{id}           - Get medication
POST   /medications                - Create medication
PATCH  /medications/{id}           - Update medication
```

**Prescription Management:**
```
POST   /prescriptions              - Create prescription
GET    /prescriptions              - List prescriptions
GET    /prescriptions/{id}         - Get prescription detail
PATCH  /prescriptions/{id}         - Update status
```

**Dispensing:**
```
POST   /prescriptions/{id}/dispense         - Record dispensing
GET    /prescriptions/{id}/dispensing-history - Get audit trail
```

**Refill Requests:**
```
POST   /prescriptions/{id}/request-refill  - Request refill
GET    /refill-requests                    - List refill requests
POST   /refill-requests/{id}/approve       - Approve refill
POST   /refill-requests/{id}/fulfill       - Fulfill refill
POST   /refill-requests/{id}/reject        - Reject refill
```

**Inventory:**
```
GET    /inventory/low-stock        - Low stock alerts
GET    /inventory/stock-status     - Overall inventory
```

### Key Dependencies
- **Referral Service** - Prescriptions created when referrals accepted
- **Patient Service** - Patient medication records updated on dispensing
- **Doctors Service** - Doctor validation
- **Notification Service** - Prescription/refill events

### Status
✅ **Fully implemented** (This is the feature we just completed!)
- 50+ automated test cases
- GitHub Actions CI/CD with requirement validation
- Comprehensive documentation

---

## Summary Comparison Table

| Feature | Backend Files | Frontend Files | DB Tables | Endpoints | Status |
|---------|---------------|----------------|-----------|-----------|--------|
| **Appointments** | 3 | ~5 | 1 | 5 | 📋 Designed |
| **Diagnostic Lab** | 6 | 11 | 6 | 20+ | ✅ MVP Complete |
| **Insurance Eligibility** | 4 | 3 | 2 | 6 | 📋 Designed |
| **Pharmacy** | 5 | 5 | 4 | 15+ | ✅ Complete |

---

## Service Dependencies Overview

```
Patient Service (8001)
├── Insurance (NEW)
└── Medications (via Pharmacy)

Doctors Service (8002)
├── Referrals
├── Lab Orders
├── Appointments
└── Prescriptions

Referral Service (8003)
├── Appointments (NEW)
├── Authorization (NEW)
└── Prescriptions (created when accepted)

Notification Service (8005)
├── Lab events
├── Authorization changes
└── Prescription/Refill events

Pharmacy Service (8006)
├── Prescriptions
├── Dispensing Records
├── Refill Requests
└── Medications
```

---

## Files Summary by Service

### Patient Service Changes
- `models.py` - Insurance model
- `main.py` - Insurance CRUD endpoints
- `schemas.py` - Insurance schemas

### Referral Service Changes
- `models.py` - Appointment, Authorization models
- `main.py` - Appointment, Authorization endpoints
- `schemas.py` - Appointment, Authorization schemas

### Pharmacy Service (NEW)
- All files related to medications and prescriptions

### Lab Service (NEW)
- All files related to tests, orders, and results

### Frontend Changes (Multiple)
- Patient Details - Insurance display
- Referral Creation - Authorization checking
- Referral List - Authorization status badges
- Appointments module (NEW)
- Lab module (NEW)
- Pharmacy module (NEW)

---

## Implementation Status Legend

- ✅ **Complete** - Fully implemented and tested
- 📋 **Designed** - Context map and plan created, ready for implementation
- 🚧 **In Progress** - Currently being built
- ⚠️ **Partial** - MVP done, gaps documented
- ❌ **Not Started** - No work begun
