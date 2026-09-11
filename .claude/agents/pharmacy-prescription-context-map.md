# Pharmacy-Prescription Context Map

## Business Requirements

### Core Features
1. **Medication Inventory Management**
   - Track medication stock levels
   - Set minimum stock thresholds
   - Alert on low stock conditions
   - Update inventory on dispensing

2. **Prescription Management**
   - Auto-create prescriptions from accepted referrals
   - Track prescription status (Active, Completed, Voided)
   - Link to patient, doctor, and referral
   - Store medication list with dosage and frequency

3. **Dispensing Workflow**
   - Record medication dispensing events
   - Update inventory automatically
   - Update patient medication list
   - Maintain audit trail

4. **Low Stock Alerts**
   - Identify medications below minimum threshold
   - Display alerts on dashboard
   - Support filtering by low stock

### Data Requirements
- Medications: ID, Name, Dosage, StockLevel, MinStockLevel, UnitPrice, CreatedAt
- Prescriptions: ID, ReferralId, PatientId, DoctorId, Medications (JSON), Status, CreatedAt, UpdatedAt
- DispensingRecords: ID, PrescriptionId, MedicationId, QuantityDispensed, DispensedAt, DispensedBy

## Technical Architecture

### Backend
- **Service:** Pharmacy Microservice (Port 8006)
- **Framework:** FastAPI with Python 3.11
- **Database:** SQLite (pharmacy.db)
- **Dependencies:** SQLAlchemy, Pydantic, httpx

### API Endpoints (15 total)
**Medications (4):**
- GET /medications (with optional low_stock filter)
- GET /medications/{id}
- POST /medications
- PATCH /medications/{id}

**Prescriptions (5):**
- GET /prescriptions (with status, patientId, referralId filters)
- GET /prescriptions/{id}
- POST /prescriptions
- PATCH /prescriptions/{id}

**Dispensing (2):**
- POST /prescriptions/{id}/dispense
- GET /prescriptions/{id}/dispensing-history

**Inventory (1):**
- GET /inventory/low-stock

**Health (1):**
- GET /health

**Info (1):**
- GET /docs (Swagger)

### Frontend
- **Framework:** Angular 18
- **State Management:** Angular Signals
- **Components:** 3 (Dashboard, PrescriptionList, PrescriptionDetail)
- **Service:** PharmacyService (HTTP client)
- **Models:** TypeScript interfaces

### Integration Points
1. **Referral Service → Pharmacy:**
   - Trigger: Referral transitions to "Accepted"
   - Action: Auto-create prescription in pharmacy service
   - Method: HTTP POST to `/prescriptions`

2. **Pharmacy → Patient Service:**
   - Trigger: Medication dispensed
   - Action: Update patient medication list
   - Method: HTTP POST to patient service

3. **API Gateway:**
   - Route: `/api/pharmacy/*` → `http://pharmacy-service:8006/*`

## Design Constraints

### Data Integrity
- Foreign keys between DispensingRecord ↔ Prescription, Medication
- Cascade deletes for referential integrity
- JSON storage for medication details in prescriptions

### Resilience
- Fire-and-forget pattern for inter-service calls
- Non-blocking async operations
- Graceful error handling on service failures

### Scalability
- Independent database per service
- Horizontal scaling of pharmacy service possible
- Stateless API design

## Validation Criteria

### Code Structure
- [ ] Service directory exists: `services/pharmacy/`
- [ ] All files present: main.py, models.py, schemas.py, db.py, seed.py, clients.py, Dockerfile, requirements.txt, __init__.py
- [ ] Frontend directory exists: `frontend/src/app/features/pharmacy/`
- [ ] All components implemented: dashboard, prescription-list, prescription-detail
- [ ] Core service exists: `frontend/src/app/core/services/pharmacy.service.ts`
- [ ] Models file exists: `frontend/src/app/core/models/pharmacy.model.ts`

### Database Models
- [ ] Medication table: MedicationId (PK), Name, Dosage, StockLevel, MinStockLevel, UnitPrice, CreatedAt
- [ ] Prescription table: PrescriptionId (PK), ReferralId (FK), PatientId, DoctorId, Medications (JSON), Status, CreatedAt, UpdatedAt
- [ ] DispensingRecord table: DispensingId (PK), PrescriptionId (FK), MedicationId (FK), QuantityDispensed, DispensedAt, DispensedBy
- [ ] Relationships defined with back_populates
- [ ] Cascade deletes configured
- [ ] Indexes on frequently queried columns

### API Endpoints
- [ ] All 15 endpoints implemented
- [ ] Request/response schemas defined with Pydantic
- [ ] Query parameters supported (low_stock, status, patientId, referralId)
- [ ] Error handling with appropriate HTTP status codes
- [ ] CORS headers correct
- [ ] Swagger documentation generated

### Frontend Components
- [ ] PharmacyDashboardComponent loads and displays:
  - [ ] Pending prescriptions count
  - [ ] Low stock items count
  - [ ] Recent prescriptions list (5 items, sorted by date)
  - [ ] Low stock alerts with visual styling
- [ ] PrescriptionListComponent shows:
  - [ ] All prescriptions in table format
  - [ ] Filtering by status and patient
  - [ ] Navigation to detail view
- [ ] PrescriptionDetailComponent displays:
  - [ ] Prescription metadata (ID, Patient, Doctor, Referral)
  - [ ] Medications list with dosage, quantity, frequency
  - [ ] Dispensing form (select medication, enter quantity)
  - [ ] Dispensing history table

### State Management
- [ ] PharmacyService has signals for: medications, prescriptions, selectedPrescription, lowStockItems, loading, error
- [ ] Computed signals for: pendingPrescriptionsCount, lowStockCount
- [ ] Methods for: loadMedications, loadPrescriptions, dispenseMedication, loadLowStockItems

### Integration
- [ ] API Gateway routes /api/pharmacy/* correctly
- [ ] Referral service calls pharmacy on acceptance
- [ ] Pharmacy service calls patient service on dispensing
- [ ] Error handling for failed inter-service calls
- [ ] Database seeding creates 10 medications, 5 prescriptions, 3 dispensing records

### Configuration
- [ ] docker-compose.yml includes pharmacy-service definition
- [ ] Environment variables for service URLs
- [ ] Dependencies specified in docker-compose.yml
- [ ] Port 8006 exposed correctly
- [ ] app.routes.ts includes pharmacy routes
- [ ] Navigation menu includes pharmacy link

### Documentation
- [ ] CLAUDE.md updated with pharmacy architecture
- [ ] INTENT.md documents feature purpose
- [ ] PLAN.md has implementation checklist
- [ ] INSTALLATION_GUIDE.md covers setup
- [ ] PHARMACY_TEST_REPORT.md provides testing guide

### Error Handling
- [ ] 404 errors for non-existent resources
- [ ] 400 errors for invalid requests
- [ ] 500 errors logged properly
- [ ] Client errors handled gracefully
- [ ] Service unavailability handled

### Testing
- [ ] All endpoints respond with correct data types
- [ ] Database seeding works correctly
- [ ] Low-stock filtering works (items with stock < minStock)
- [ ] Relationships between tables are correct
- [ ] Inter-service communication functions properly

## Success Metrics

| Category | Metric | Target |
|----------|--------|--------|
| **Completeness** | Feature implementation | 100% |
| **Correctness** | API response accuracy | 100% |
| **Integration** | Service communication success rate | 100% |
| **Performance** | Response time | < 200ms |
| **Reliability** | Error recovery | Graceful |
| **Documentation** | Coverage | 100% |

## Known Issues Log

### Issue #1: Gateway Routing (FIXED)
- **Status:** RESOLVED
- **Cause:** Duplicate service name in path (/pharmacy/prescriptions)
- **Fix:** Remove segment from path before appending to base_url
- **Validation:** Endpoint returns correct data

### Issue #2: DispensingRecord ForeignKey (FIXED)
- **Status:** RESOLVED
- **Cause:** Missing ForeignKey on MedicationId column
- **Fix:** Added ForeignKey("medications.MedicationId") constraint
- **Validation:** Service starts without SQLAlchemy errors

## Test Cases

### Positive Tests
1. Create medication and verify it appears in list
2. Create prescription and verify it links to referral/patient
3. Dispense medication and verify inventory decreases
4. Filter low-stock items and verify correct results
5. Update prescription status and verify change

### Negative Tests
1. Dispense more than available stock → error
2. Reference non-existent prescription → 404
3. Update with invalid status → 400
4. Patient service unavailable → log warning, continue

### Integration Tests
1. Accept referral → prescription auto-creates
2. Dispense medication → patient medications update
3. Low-stock alert → appears on dashboard
4. Multiple services concurrent requests → all succeed
