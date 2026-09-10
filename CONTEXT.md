# Pharmacy & Prescription Management - Context & Architecture

## Where This Lives in ClinicCare

The Pharmacy & Prescription Management feature is a **new microservice** integrated into the existing ClinicCare architecture.

### Service Architecture

**Current System (5 Services):**
```
Frontend (Angular 18, port 4200)
    ↓
API Gateway (FastAPI, port 8000)
    ↓
[Patient (8001), Doctors (8002), Referral (8003), Document (8004), Notification (8005)]
```

**After Pharmacy Implementation (6 Services):**
```
Frontend (Angular 18, port 4200)
    ↓
API Gateway (FastAPI, port 8000)
    ↓
[Patient (8001), Doctors (8002), Referral (8003), Document (8004), Notification (8005), Pharmacy (8006)]
```

### How Pharmacy Service Integrates

**Pharmacy Service (Port 8006)** receives requests from:
1. **Referral Service** - When a referral is accepted, referral service creates a prescription in pharmacy
2. **Frontend UI** - Pharmacy staff access pharmacy dashboard and UI to manage prescriptions
3. **API Gateway** - All frontend requests route through gateway

**Pharmacy Service calls:**
1. **Patient Service** - When prescription is dispensed, pharmacy updates patient's medication list
2. **Notification Service** - Optional: Record dispensing events

### Database Design

**Pharmacy Service has its own SQLite database** (`pharmacy.db`) with three tables:

```sql
-- Medications in inventory
medications (
  MedicationId INT PRIMARY KEY,
  Name VARCHAR,
  Dosage VARCHAR,
  StockLevel INT,           -- Current quantity available
  MinStockLevel INT = 10,   -- Low-stock threshold
  UnitPrice FLOAT,
  CreatedAt TIMESTAMP
)

-- Prescriptions created from referrals
prescriptions (
  PrescriptionId INT PRIMARY KEY,
  ReferralId INT,           -- Links to Referral Service
  PatientId INT,            -- Links to Patient Service
  PrescribingDoctorId INT,  -- Links to Doctors Service
  Medications JSON,         -- [{medication_id, quantity, frequency, instructions}]
  Status VARCHAR,           -- "Active", "Completed", "Voided"
  CreatedAt TIMESTAMP,
  UpdatedAt TIMESTAMP
)

-- Records of dispensed medications (audit trail)
dispensing_records (
  DispensingId INT PRIMARY KEY,
  PrescriptionId INT,       -- Links to prescription
  MedicationId INT,         -- Which medication was dispensed
  QuantityDispensed INT,    -- How much
  DispensedAt TIMESTAMP,
  DispensedBy VARCHAR       -- Who dispensed it
)
```

**Key Design Decision:** Each service has its own independent database. Pharmacy doesn't share data with other services at the schema level; only through HTTP API calls.

### API Contract

**Pharmacy Service Endpoints (called via gateway at `/api/pharmacy/*`):**

```
GET    /medications
GET    /medications/{id}
POST   /medications
PATCH  /medications/{id}

GET    /prescriptions
GET    /prescriptions/{id}
POST   /prescriptions
PATCH  /prescriptions/{id}

POST   /prescriptions/{id}/dispense
GET    /prescriptions/{id}/dispensing-history

GET    /inventory/low-stock
```

**Referral Service Integration:**
When referral reaches "Accepted" state, referral service POSTs to pharmacy:
```
POST /api/pharmacy/prescriptions
{
  "ReferralId": 5,
  "PatientId": 2,
  "PrescribingDoctorId": 10,
  "Medications": [
    {"medication_id": 1, "quantity": 30, "frequency": "Once daily", "instructions": "Take with food"}
  ]
}
```

**Patient Service Integration:**
When prescription is dispensed, pharmacy POSTs to patient service:
```
POST /api/patients/{patient_id}/medications
{
  "Name": "Aspirin",
  "Dosage": "500mg",
  "PrescriptionId": 15,
  "Active": true
}
```

## Scope: This Week vs. Next Week

### THIS WEEK (MVP - Minimal Viable Product)

**Goal:** Establish the core prescription-to-dispensing workflow

#### Backend (Pharmacy Service)
- ✅ Create new microservice on port 8006 following established patterns
- ✅ Implement Medication inventory management:
  - List medications with current stock levels
  - Track low-stock items
- ✅ Implement Prescription management:
  - Auto-create prescriptions when referrals are accepted
  - List prescriptions by status and patient
  - Record dispensing actions
- ✅ Update inventory when prescriptions are dispensed:
  - Decrease stock level automatically
  - Flag items below minimum level
- ✅ Update patient medication list when prescription is dispensed
- ✅ Seed sample data (10 medications, 5 prescriptions)
- ✅ Add pharmacy service to docker-compose.yml

#### Gateway & Integration
- ✅ Add pharmacy routing to API gateway (`/api/pharmacy/*`)
- ✅ Update referral service to call pharmacy when referral is accepted
- ✅ Update docker-compose.yml with pharmacy service

#### Frontend
- ✅ Create PharmacyService in core/services for HTTP communication
- ✅ Create models/interfaces for Medication, Prescription, DispensingRecord
- ✅ Build pharmacy dashboard showing:
  - Count of pending prescriptions
  - List of low-stock medications
- ✅ Build prescription list view (filterable by status)
- ✅ Build prescription detail view with dispense form
- ✅ Add routing for `/pharmacy/dashboard` and `/pharmacy/prescriptions`
- ✅ Add "Pharmacy" navigation link

#### Testing (Manual)
- Test via Swagger: Create medications, list them, verify stock tracking
- Test workflow: Accept referral → prescription auto-created → dispense → inventory updated
- Verify patient medication list updated after dispensing

### NEXT WEEK (Deferred Features)

**Goal:** Add advanced features for complex pharmacy workflows

#### Deferred Backend Features
1. **Refill Management**
   - Track refill history per prescription
   - Auto-refill workflow
   - Refill requests from patients

2. **Advanced Dispensing**
   - Partial dispensing (dispense less than prescribed)
   - Multiple medication tracking per prescription
   - Individual tracking of each medication in a multi-drug prescription

3. **Prescription Lifecycle**
   - Prescription voiding/cancellation with audit trail
   - Prescription renewal workflows
   - Expiration date tracking

4. **Access Control**
   - Pharmacy staff role-based permissions
   - Audit logging for all modifications

5. **Integration**
   - Prescription PDF generation
   - Document service linking
   - Insurance/pricing data

#### Deferred Frontend Features
1. **Inventory Management UI**
   - Full inventory page with add/restock functionality
   - Stock level graphs and trends
   - Automatic low-stock alerts

2. **Advanced Prescription Views**
   - Detailed prescription history
   - Refill request management
   - Prescription templates

3. **Pharmacy Analytics**
   - Most dispensed medications
   - Dispensing trends over time
   - Inventory value tracking

**Reason for Deferral:** These features add complexity that would slow down getting the MVP to production. The MVP focuses on the critical path: referral → prescription → dispensing → inventory update. Once this is working end-to-end, advanced features can be layered in without architectural changes.

## File Organization

### Backend Structure

**New Files to Create:**
```
services/pharmacy/
├── main.py              # FastAPI app with all endpoints
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic request/response schemas
├── db.py                # Database connection and session management
├── seed.py              # Sample data initialization
├── clients.py           # HTTP clients for inter-service calls
├── Dockerfile
└── requirements.txt
```

**Files to Modify:**
```
docker-compose.yml       # Add pharmacy service
gateway/main.py          # Add pharmacy routing
services/referral/main.py     # Add pharmacy call on referral acceptance
services/referral/clients.py   # Add pharmacy client
```

### Frontend Structure

**New Files to Create:**
```
frontend/src/app/
├── core/
│   ├── services/
│   │   └── pharmacy.service.ts
│   └── models/
│       └── pharmacy.model.ts
└── features/
    └── pharmacy/
        ├── pharmacy-dashboard.component.ts
        ├── pharmacy-dashboard.component.html
        ├── prescription-list.component.ts
        ├── prescription-list.component.html
        ├── prescription-detail.component.ts
        └── prescription-detail.component.html
```

**Files to Modify:**
```
frontend/src/app/app.routes.ts           # Add pharmacy routes
frontend/src/app/app.component.html      # Add pharmacy nav link
```

## Dependencies & Tech Stack

**Pharmacy Service uses (same as other services):**
- Python 3.11
- FastAPI 0.115.0
- SQLAlchemy 2.0.35
- Pydantic 2.9.2
- SQLite (embedded database)
- httpx (for inter-service HTTP calls)

**Frontend uses:**
- Angular 18
- Angular signals for state
- RxJS for observables
- TypeScript 5.5

## Workflow Diagram

```
┌─────────────────┐
│  Doctor Creates │
│    Referral     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Referral in   │
│   "Submitted"   │
│      State      │
└────────┬────────┘
         │ Doctor accepts
         ▼
┌─────────────────────────────────────┐
│  Referral Transitions to "Accepted" │
│  [Trigger] Pharmacy Service Called  │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Pharmacy Service Creates            │
│  Prescription (auto)                 │
│  Status: "Active"                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Pharmacy Staff Views Prescription   │
│  in Dashboard                        │
└────────┬─────────────────────────────┘
         │ Dispense action
         ▼
┌──────────────────────────────────────┐
│  Pharmacy Dispenses Medication       │
│  • Inventory stock -1                │
│  • Patient medication list updated   │
│  • Dispensing record created         │
└──────────────────────────────────────┘
```

## Key Architectural Decisions

1. **Separate Microservice, Not Extension**
   - Pharmacy is a NEW microservice (port 8006), not added to referral service
   - Allows independent scaling, deployment, and maintenance

2. **Fire-and-Forget Inter-service Calls**
   - Referral service doesn't wait for pharmacy response
   - If pharmacy is temporarily unavailable, referral still completes
   - Provides resilience

3. **Service Independence**
   - Pharmacy has its own database (no shared schema)
   - Services communicate only through APIs
   - Each service can evolve independently

4. **Async Communication**
   - All inter-service calls are async (no blocking)
   - Uses httpx.AsyncClient for efficiency

5. **MVP Scope**
   - Single medication per prescription (for now)
   - No refill logic this week
   - Basic dispensing (one action, one record)
   - No partial dispensing

This approach allows getting the core workflow to production quickly while maintaining the flexibility to add complexity later without architectural changes.
