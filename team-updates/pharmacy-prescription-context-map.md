# ReferralIQ Context Map — Pharmacy & Prescription Feature

## Architectural Overview

### Service Topology

```
Frontend (Angular 4200)
    ↓
Gateway (8000)
    ├─ /api/patients/* → Patient Service (8001)
    ├─ /api/doctors/* → Doctors Service (8002)
    ├─ /api/referrals/* → Referral Service (8003)
    ├─ /api/documents/* → Document Service (8004)
    ├─ /api/notifications/* → Notification Service (8005)
    ├─ /api/prescriptions/* → Prescription Service (8007) [NEW - THIS WEEK]
    └─ /api/pharmacy/* → Pharmacy Service (8006) [NEW - NEXT WEEK]
```

## New Services Rationale

### Prescription Service (8007) — This Week
- **Owner:** Prescription lifecycle (doctors create, patients view, pharmacy fulfills)
- **Owns:** Prescription, PrescriptionLine, RefillRequest entities
- **Calls:** Patient Service (validate patient), Doctor Service (validate doctor), Notification Service (alert pharmacy)
- **Database:** `prescription.db` (SQLite, seeded with sample data)

### Pharmacy Service (8006) — Next Week
- **Owner:** Pharmacy operations (inventory, dispensing, stock management)
- **Owns:** PharmacyLocation, InventoryItem, InventoryTransaction, StockAlert entities
- **Calls:** Notification Service (alert on low stock)
- **Database:** `pharmacy.db` (SQLite, seeded with sample locations & meds)

---

## Scope: This Week vs. Next

### THIS WEEK: Prescription Service MVP
**Goal:** Build a working, testable prescription creation and status tracking system.

**Build:**
- ✅ Prescription Service fully functional (port 8007)
- ✅ Core endpoints: create, list, get, update status
- ✅ Multi-line prescriptions (multiple medications per prescription)
- ✅ Prescription ↔ Referral linking
- ✅ Doctor/Patient validation
- ✅ Status transitions: draft → issued → fulfilled → expired
- ✅ Notification on prescription issued
- ✅ Integration with existing services (Patient, Doctor, Notification)
- ✅ Docker Compose setup
- ✅ Gateway routing
- ✅ Sample seed data

**Do NOT build:**
- ❌ Pharmacy Service (next week)
- ❌ Dispensing records (next week)
- ❌ Pharmacy inventory management (next week)
- ❌ Refill workflow (endpoints exist but no approval logic)
- ❌ Frontend UI (next week)
- ❌ Refill endpoint implementation (next week)

**Deliverables:**
- Prescription Service running and accessible via gateway
- Prescriptions linkable to referrals and patients
- Can create multi-medication prescriptions
- Status tracking works end-to-end
- Example: `POST /api/prescriptions` → doctor issues prescription for patient → pharmacy gets notified

**Test Coverage:**
- Unit: status transitions, validation
- Integration: patient/doctor lookup, notification dispatch
- Manual: create prescription via gateway, verify notification sent

---

### NEXT WEEK: Pharmacy Service & Dispensing
**Goal:** Complete the pharmacy operations loop (receiving, fulfilling, inventory).

**Build:**
- Pharmacy Service fully functional (port 8006)
- Pharmacy locations and inventory management
- Dispensing transaction recording
- Low-stock detection and alerts
- Refill request approval workflow
- Frontend: Doctor prescription form, Pharmacy queue, Patient prescription view
- Integrate prescriptions with pharmacy fulfillment

---

## Service Dependencies (This Week)

```
Prescription Service (8007)
    ├─ depends on: Patient Service (8001) ✓ existing
    ├─ depends on: Doctor Service (8002) ✓ existing
    └─ depends on: Notification Service (8005) ✓ existing
```

No new external dependencies. Prescription Service uses existing services for validation and notifications.

---

## Files to Create (This Week)

```
services/prescription/
├── main.py              # FastAPI endpoints
├── models.py            # SQLAlchemy ORM (Prescription, PrescriptionLine, RefillRequest)
├── schemas.py           # Pydantic request/response models
├── db.py                # Database setup (engine, session, get_db)
├── seed.py              # Sample data (3-5 prescriptions)
├── requirements.txt     # Dependencies (fastapi, sqlalchemy, pydantic, httpx, uvicorn)
└── Dockerfile           # Match pattern of other services (python:3.11, uvicorn main:app)
```

---

## Files to Modify (This Week)

1. **docker-compose.yml**
   - Add prescription-service config (build, ports, env vars for patient/doctor/notification URLs)

2. **gateway/main.py**
   - Add route: `/api/prescriptions/*` → prescription-service:8007

3. **SYSTEM_CONTEXT.md**
   - Document Prescription Service architecture
   - Update service list (add 8007)
   - Add to deployment diagram

4. **CLAUDE.md**
   - Update Architecture section to mention new Prescription Service
   - Note that Pharmacy Service is next week

---

## Data Model (This Week)

### Prescription
```
id (UUID, PK)
referral_id (FK, stored as string/int depending on referral system)
doctor_id (FK → Doctor Service)
patient_id (FK → Patient Service)
status (ENUM: draft, issued, fulfilled, partial_fulfilled, expired, cancelled)
issued_at (DateTime, nullable)
expires_at (DateTime, default +365 days)
created_at (DateTime)
updated_at (DateTime)
notes (Text, nullable)
```

### PrescriptionLine
```
id (UUID, PK)
prescription_id (FK)
medication_name (String)
quantity (Integer)
unit (String)
dosage (String)
frequency (String)
duration_days (Integer)
refill_count (Integer, default 0)
notes (Text, nullable)
```

### RefillRequest
```
id (UUID, PK)
prescription_id (FK)
requested_at (DateTime)
approved_at (DateTime, nullable)
status (ENUM: pending, approved, rejected)
requested_by (String)
approved_by (String, nullable)
notes (Text, nullable)
```

(RefillRequest table created but endpoints not implemented this week.)

---

## End-of-Week Success Criteria

- [ ] Prescription Service running on http://localhost:8007
- [ ] Gateway routes `/api/prescriptions` to service correctly
- [ ] Can create prescription with multiple medications via gateway
- [ ] Prescriptions link to referral, doctor, patient
- [ ] Status transitions work (draft → issued → fulfilled)
- [ ] Doctor/Patient validation prevents invalid prescriptions
- [ ] Pharmacy receives notification when prescription issued
- [ ] Sample data seeds on startup
- [ ] No console errors or warnings
- [ ] Ready to hand off to frontend team next week
