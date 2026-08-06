# Pharmacy & Prescription Management System — Implementation Plan

**Owner**: Ann Mary Charly (UST, IN)
**Sprint**: 2026-08-05 to 2026-08-09 (1 Week MVP)
**Stack**: Java (Spring Boot) + Angular + MySQL

---

## Database Schema

```sql
-- Team 1 Tables
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('DOCTOR', 'PATIENT', 'PHARMACIST', 'ADMIN'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
  patient_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  dob DATE,
  contact VARCHAR(20),
  address TEXT,
  user_id INT REFERENCES users(user_id)
);

-- Team 2 Tables
CREATE TABLE referrals (
  referral_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT REFERENCES patients(patient_id),
  doctor_id INT REFERENCES users(user_id),
  reason TEXT,
  referral_date DATE
);

CREATE TABLE medications (
  medication_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  form VARCHAR(50),
  manufacturer VARCHAR(255),
  UNIQUE(name, dosage)
);

CREATE TABLE prescriptions (
  prescription_id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT REFERENCES patients(patient_id),
  doctor_id INT REFERENCES users(user_id),
  referral_id INT REFERENCES referrals(referral_id),
  prescription_date DATE NOT NULL,
  status ENUM('PENDING', 'FILLED', 'CANCELLED') DEFAULT 'PENDING'
);

CREATE TABLE prescription_medications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_id INT REFERENCES prescriptions(prescription_id),
  medication_id INT REFERENCES medications(medication_id),
  quantity INT,
  dosage VARCHAR(100),
  frequency VARCHAR(100)
);

-- Team 3 Tables
CREATE TABLE inventory (
  inventory_id INT PRIMARY KEY AUTO_INCREMENT,
  medication_id INT REFERENCES medications(medication_id),
  quantity_on_hand INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  UNIQUE(medication_id)
);

CREATE TABLE inventory_alerts (
  alert_id INT PRIMARY KEY AUTO_INCREMENT,
  medication_id INT REFERENCES medications(medication_id),
  alert_type ENUM('LOW_STOCK', 'OUT_OF_STOCK'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL
);

-- Team 4 Tables
CREATE TABLE dispensing (
  dispensing_id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_id INT REFERENCES prescriptions(prescription_id),
  pharmacy_user_id INT REFERENCES users(user_id),
  dispensed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  qty_dispensed INT,
  notes TEXT
);
```

---

## Team 1: User & Patient Management

**Deadline**: Day 1-2 (Auth) | Day 3-4 (Patient Management) | Day 5 (Integration)

### Backend Components (Java)
| Class | Responsibility |
|-------|---------------|
| `UserController` | Registration, login endpoints |
| `UserService` | Business logic for users |
| `UserRepository` | Database operations |
| `PatientController` | Patient CRUD endpoints |
| `PatientService` | Patient business logic |
| `PatientRepository` | Patient database operations |
| `AuthenticationInterceptor` | JWT validation (shared by all teams) |
| `PasswordHashingUtil` | Secure password hashing (BCrypt) |

### Frontend Components (Angular)
- Login page (email/password form)
- Register page (role selection: Doctor / Patient / Pharmacist)
- User dashboard (post-login landing page)
- Patient management screen (create/edit/search)
- Profile edit page
- Navigation header with logout

### API Endpoints
```
POST   /api/auth/register       Create new user account
POST   /api/auth/login          Authenticate and return JWT
POST   /api/auth/logout         Invalidate session
GET    /api/auth/me             Get current logged-in user
PUT    /api/users/{id}          Update user profile
GET    /api/patients            List all patients
POST   /api/patients            Create new patient
GET    /api/patients/{id}       View patient details
PUT    /api/patients/{id}       Edit patient details
```

### Success Criteria
- [ ] User can register with email, password, and role selection
- [ ] User can login and receive a valid JWT token
- [ ] Role is properly assigned (DOCTOR, PATIENT, PHARMACIST)
- [ ] Patient profiles can be created and linked to users
- [ ] Logout properly invalidates session
- [ ] All endpoints reject requests without a valid JWT

---

## Team 2: Prescriptions & Referrals

**Deadline**: Day 2-3 (Backend) | Day 4-5 (Frontend & Integration)

### Backend Components (Java)
| Class | Responsibility |
|-------|---------------|
| `PrescriptionController` | Prescription CRUD & search |
| `PrescriptionService` | Prescription business logic |
| `PrescriptionRepository` | Database operations |
| `ReferralController` | Referral management endpoints |
| `ReferralService` | Referral business logic |
| `ReferralRepository` | Referral database operations |
| `PrescriptionMedicationService` | Link medications to prescriptions |
| `PrescriptionValidationService` | Validate prescription data |
| `MedicationService` | Access medication master (Team 3 data) |

### Frontend Components (Angular)
- Doctor prescription creation form (patient selection, medications, dosage, frequency)
- Add multiple medications interface (dynamic list)
- Prescription list page (doctor view, filterable)
- Prescription detail page (full info view)
- Prescription search/filter (by patient, date, status)
- Patient prescription view page (patient portal)
- Prescription history timeline (patient view)

### API Endpoints
```
POST   /api/prescriptions                        Doctor creates new prescription
GET    /api/prescriptions                        List prescriptions (role-filtered)
GET    /api/prescriptions/{id}                   View prescription details
POST   /api/prescriptions/{id}/medications       Add medication to prescription
DELETE /api/prescriptions/{id}/medications/{id}  Remove medication from prescription
PUT    /api/prescriptions/{id}/status            Update prescription status
POST   /api/referrals                            Create new referral
GET    /api/referrals                            List referrals
GET    /api/medications                          Get all medications in catalog
```

### Success Criteria
- [ ] Doctor can create a prescription with one or more medications
- [ ] Prescription is linked to a patient and a referral
- [ ] Each medication has quantity, dosage, and frequency
- [ ] Patient can view their own prescriptions
- [ ] Prescription history is searchable by date/status
- [ ] Prescription is saved with `PENDING` status by default

---

## Team 3: Inventory Management

**Deadline**: Day 2 (Schema & API) | Day 3-4 (Frontend) | Day 5 (Integration & Alerts)

### Backend Components (Java)
| Class | Responsibility |
|-------|---------------|
| `MedicationController` | Medication master CRUD |
| `MedicationService` | Medication management logic |
| `MedicationRepository` | Database operations |
| `InventoryController` | Stock management endpoints |
| `InventoryService` | Inventory business logic |
| `InventoryRepository` | Inventory database operations |
| `InventoryAlertService` | Generate and manage low-stock alerts |
| `StockCalculationService` | Quantity math & safety checks |
| `LowStockThresholdChecker` | Trigger alerts when stock < reorder_level |

### Frontend Components (Angular)
- Medication master list (all drugs in catalog)
- Add/edit medication form
- Inventory dashboard (current stock levels with color-coding)
- Low-stock alerts page (active alerts list)
- Inventory search/filter (by name, dosage, manufacturer)
- Reorder form (mark items for reorder)

### API Endpoints
```
POST   /api/medications                      Add medication to master
GET    /api/medications                      List all medications
GET    /api/medications/{id}                 View medication details
PUT    /api/medications/{id}                 Edit medication
POST   /api/inventory                        Add stock entry
GET    /api/inventory                        View all inventory
GET    /api/inventory/{medication_id}        View stock for specific medication
PUT    /api/inventory/{medication_id}        Update stock/threshold
GET    /api/inventory/alerts                 List low-stock alerts
POST   /api/inventory/alerts/{id}/resolve    Mark alert as resolved
POST   /api/inventory/{medication_id}/decrement   Decrease stock (called by Team 4)
```

### Success Criteria
- [ ] Medications can be added to the master catalog
- [ ] Stock levels display accurately
- [ ] Low-stock threshold can be customized per medication
- [ ] Alerts generate automatically when `quantity_on_hand < reorder_level`
- [ ] Inventory search works by name, dosage, and manufacturer
- [ ] Decrement endpoint correctly handles insufficient stock

---

## Team 4: Dispensing & Fulfillment

**Deadline**: Day 2-3 (Schema & Backend) | Day 4-5 (Frontend & Integration)

### Backend Components (Java)
| Class | Responsibility |
|-------|---------------|
| `DispensingController` | Fulfillment operation endpoints |
| `DispensingService` | Dispensing business logic |
| `DispensingRepository` | Database operations |
| `PharmacyQueueService` | Filter PENDING prescriptions for queue |
| `ReceiptGenerationService` | Generate dispensing receipt |
| `InventoryUpdateService` | Calls Team 3 to decrement stock |
| `DispensingValidationService` | Validate quantity ≤ prescribed amount |

### Frontend Components (Angular)
- Pharmacy fulfillment queue page (PENDING prescriptions list)
- Prescription detail view (in queue context)
- Dispensing form (record quantity, confirm fill)
- Quantity input with validation (must not exceed prescribed amount)
- Dispensing confirmation page
- Dispensing receipt view/print
- Dispense history page (audit trail)
- Low-stock alerts display (from Team 3)

### API Endpoints
```
GET    /api/pharmacy/queue           Get pending prescriptions for pharmacy
POST   /api/dispensing               Record new dispensing
GET    /api/dispensing/{id}          View dispensing details
GET    /api/dispensing/history       View all dispensing records
POST   /api/dispensing/{id}/receipt  Generate receipt
PUT    /api/prescriptions/{id}/status        Update status to FILLED (Team 2)
POST   /api/inventory/{med_id}/decrement     Decrement stock (Team 3)
```

### Success Criteria
- [ ] Pharmacy sees only `PENDING` prescriptions in the queue
- [ ] Can mark a prescription as dispensed/filled
- [ ] Inventory auto-decrements after dispensing
- [ ] Receipt generated with all dispensing details
- [ ] Prescription status updates to `FILLED`
- [ ] Low-stock alerts trigger if inventory falls below threshold
- [ ] Dispensing history is queryable for audit purposes

---

## Daily Development Timeline

| Day | Team 1 | Team 2 | Team 3 | Team 4 |
|-----|--------|--------|--------|--------|
| **D1** | Spring Boot setup + Auth framework + JWT | User entity + Prescription/Referral schema | Medication master schema | Dispensing schema + Review T2/T3 APIs |
| **D2** | JWT interceptor + RBAC middleware | Prescription creation API + Referral API | Inventory APIs + stock tracking | Queue service + Dispensing service |
| **D3** | Login/Register frontend | Medication add-to-Rx API + Unit tests | Inventory alert logic + Unit tests | Dispense recording + API contract alignment |
| **D4** | Patient management screens | Prescription frontend + Patient Rx view | Inventory dashboard + Low-stock view | Pharmacy queue page + Dispensing form |
| **D5** | Integration + Bug fixes | History page + Integration testing | Alert generation + Final tests | Inventory decrement + Receipt + E2E |

**EOD Friday**: MVP complete, integrated, and deployed to staging

---

## Cross-Team Integration Checklist

### Team 1 → All Teams
- [ ] `AuthenticationInterceptor` available by EOD Day 1
- [ ] JWT validation & role extraction documented
- [ ] Other teams verify their endpoints reject unauthorized requests

### Team 2 ↔ Team 3
- [ ] Medication API contract agreed on Day 1
- [ ] Team 2 calls `GET /api/medications` to validate before saving Rx
- [ ] Test: Create Rx with non-existent medication → should fail

### Team 2 ↔ Team 4
- [ ] Prescriptions saved with `PENDING` status visible in pharmacy queue
- [ ] Test: Doctor creates Rx → verify it appears in `GET /api/pharmacy/queue`

### Team 4 ↔ Team 3
- [ ] Team 4 calls `POST /api/inventory/{med_id}/decrement` after dispensing
- [ ] Team 3 handles insufficient stock gracefully (return error, not crash)
- [ ] Test: Dispense Rx → verify inventory decrements correctly

---

## E2E Test Checklist (Friday)

- [ ] Register as Doctor, Patient, and Pharmacist
- [ ] Login with each role; verify role-based access control
- [ ] Doctor creates prescription with multiple medications
- [ ] Prescription appears in pharmacy queue with `PENDING` status
- [ ] Patient views their prescription
- [ ] Pharmacist dispenses prescription
- [ ] Inventory quantity decrements
- [ ] Low-stock alert generates (if applicable)
- [ ] Dispensing receipt generated
- [ ] Prescription status updates to `FILLED`

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Medication data mismatch between T2 & T3 | Define medication API contract on Day 1 |
| Inventory decrement race conditions | Use DB transactions; optimistic locking on inventory |
| Auth delays blocking all teams | Team 1 delivers auth by EOD Day 1 (critical path) |
| Frontend/backend API mismatch | Use Swagger/OpenAPI; mock backend for frontend dev |
| Scope creep | All enhancements deferred to next week |
| Schema conflicts | Team lead approves all schema changes; no ad-hoc changes |

---

## End-of-Week Deliverables

**Code**:
- Fully functional Spring Boot backend (Java)
- Fully functional Angular frontend (TypeScript/HTML/CSS)
- MySQL database with all tables and relationships
- All endpoints documented (Javadoc/JSDoc)

**Documentation**:
- API Reference (all endpoints, parameters, responses)
- Database Schema Diagram
- E2E Test Checklist (completed)
- Deployment Instructions
- README with setup steps

**Testing**:
- Unit tests for all services (minimum 80% coverage)
- Integration tests for cross-team APIs
- All E2E scenarios passing

**Repository**:
- Feature branches per team member
- All branches merged to main by Friday
- Clean commit history with meaningful messages

---

*Document Version: 1.0 | Last Updated: 2026-08-05 | Contact: annmary.charly@ust.com*
