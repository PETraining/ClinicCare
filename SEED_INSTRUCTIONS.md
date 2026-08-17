# Seed Data Instructions

**Version**: 1.0  
**Date**: 2026-08-17  
**Status**: Active

---

## Overview

This document explains how to seed data across all ClinicCare microservices to unblock parallel team work on the Patient Portal feature. Seeding ensures:

- ✅ **Data consistency** across services (Patient, Referral, Document, Notification)
- ✅ **Parallel development** — Teams 2 & 3 can work while Team 1 builds APIs
- ✅ **Test data ready** — No manual database setup needed
- ✅ **Frontend mockups** — UI teams can build against real-looking data

---

## Quick Start (5 minutes)

### 1. Seed All Services

```bash
cd d:\training\ClinicCare
python scripts/seed_all.py
```

### 2. Verify Seeds Loaded

```bash
# Patient Service (8001)
curl http://localhost:8001/api/patients/1

# Referral Service (8003)
curl http://localhost:8003/api/referrals/patient/1

# Document Service (8004)
curl http://localhost:8004/api/documents/1

# Notification Service (8005)
curl http://localhost:8005/api/notifications/patient/1
```

### 3. View Seed Data

All seeded data is in:
```
services/
├── patient/seed.py          # 5 patients
├── referral/seed.py         # 9 referrals, 3 appointments
├── document/seed.py         # 12 documents
├── notification/seed.py     # 14 notifications
└── doctors/seed.py          # 7 doctors
```

---

## Seeded Data Summary

### Patients (5)

| ID | Name | DOB | Gender | Key Condition |
|----|----|-----|--------|---------------|
| 1 | Anjali Verma | 1980-04-12 | Female | Type 2 Diabetes |
| 2 | Rajesh Kumar | 1965-09-23 | Male | Hypertension |
| 3 | Divya Menon | 1992-01-30 | Female | Asthma |
| 4 | Suresh Iyengar | 1978-11-05 | Male | Coronary Artery Disease |
| 5 | Neha Bhatt | 2001-07-18 | Female | None |

**Source**: `services/patient/seed.py` lines 9-43

---

### Doctors/Specialists (7)

| ID | Name | Specialty |
|----|----|-----------|
| 1 | Dr. Krishnan | Cardiology |
| 2 | Dr. Reddy | Orthopedics |
| 3 | Dr. Nair | Dermatology |
| 4 | Dr. Malhotra | Neurology |
| 5 | Dr. Iyer | Endocrinology |
| 6 | Dr. Sharma | Family Medicine (Referring) |
| 7 | Dr. Desai | Gastroenterology |

**Source**: `services/doctors/seed.py`

---

### Referrals (9)

| ID | Patient | Specialist | Status | Priority | Created | Reason |
|----|---------|-----------|--------|----------|---------|--------|
| 1 | Anjali (1) | Dr. Krishnan (1) | Draft | Urgent | 2026-07-25 | Chest pain evaluation |
| 2 | Divya (3) | Dr. Desai (7) | Draft | Routine | 2026-07-26 | Abdominal pain |
| 3 | Rajesh (2) | Dr. Malhotra (4) | Submitted | Routine | 2026-07-19 | Recurrent headaches |
| 4 | Anjali (1) | Dr. Iyer (5) | Submitted | Urgent | 2026-07-21 | Diabetes management |
| 5 | Divya (3) | Dr. Nair (3) | **Accepted** | Routine | 2026-07-09 | Skin lesion evaluation |
| 6 | Rajesh (2) | Dr. Reddy (2) | **Accepted** | Routine | 2026-07-10 | Knee pain evaluation |
| 7 | Suresh (4) | Dr. Krishnan (1) | **Completed** | Urgent | 2026-06-14 | Post-MI follow-up |
| 8 | Suresh (4) | Dr. Malhotra (4) | **Completed** | Routine | 2026-06-17 | Numbness evaluation |
| 9 | Neha (5) | Dr. Desai (7) | **Rejected** | Routine | 2026-07-04 | GI screening |

**Key Notes**:
- Referral IDs 5, 6, 7 have **Appointments** scheduled
- Referral IDs 3-9 have **Notification history**
- Referral IDs 3-9 have **Documents** linked

**Source**: `services/referral/seed.py` lines 13-32

---

### Appointments (3)

| ID | Referral | Patient | Scheduled | Location | Instructions |
|----|----------|---------|-----------|----------|--------------|
| 1 | 5 | Divya (3) | 2026-08-20 10:00 | Downtown Clinic - Derm | Arrive 15 min early |
| 2 | 6 | Rajesh (2) | 2026-08-25 14:30 | Westside Ortho Center | Bring X-ray images |
| 3 | 7 | Suresh (4) | 2026-06-25 09:00 | City Heart Institute | Fasting required |

**Source**: `services/referral/seed.py` lines 40-47

---

### Documents (12)

| ID | Patient | Referral | Type | Date | File |
|----|---------|----------|------|------|------|
| 1 | Rajesh (2) | 3 | Referral Letter | 2026-07-20 | referral_letter_r3.pdf |
| 2 | Anjali (1) | 4 | Referral Letter | 2026-07-22 | referral_letter_r4.pdf |
| 3 | Divya (3) | 5 | Referral Letter | 2026-07-12 | referral_letter_r5.pdf |
| 4 | Rajesh (2) | 6 | Referral Letter | 2026-07-14 | referral_letter_r6.pdf |
| 5 | Suresh (4) | 7 | Referral Letter | 2026-06-17 | referral_letter_r7.pdf |
| 6 | Suresh (4) | 7 | Discharge Summary | 2026-06-25 | discharge_summary_r7.pdf |
| 7 | Suresh (4) | 8 | Referral Letter | 2026-06-20 | referral_letter_r8.pdf |
| 8 | Suresh (4) | 8 | Discharge Summary | 2026-06-28 | discharge_summary_r8.pdf |
| 9 | Neha (5) | 9 | Referral Letter | 2026-07-07 | referral_letter_r9.pdf |
| 10 | Anjali (1) | None | Lab Report | 2026-07-05 | anjali_a1c_labs.pdf |
| 11 | Suresh (4) | None | Lab Report | 2026-06-10 | suresh_lipid_panel.pdf |
| 12 | Divya (3) | None | Imaging | 2026-06-01 | divya_chest_xray.pdf |

**Key Notes**:
- Documents 1-9 linked to referrals
- Documents 10-12 standalone (not linked to referral)
- Types: Referral Letter, Discharge Summary, Lab Report, Imaging

**Source**: `services/document/seed.py` lines 8-21

---

### Notifications (14)

| ID | Referral | Event Type | Timestamp | Message |
|----|----------|-----------|-----------|---------|
| 1 | 3 | Submitted | 2026-07-20 09:15 | Referral #3 submitted |
| 2 | 4 | Submitted | 2026-07-22 11:00 | Referral #4 submitted |
| 3 | 5 | Submitted | 2026-07-10 10:30 | Referral #5 submitted |
| 4 | 5 | Accepted | 2026-07-12 14:00 | Referral #5 accepted |
| 5 | 6 | Submitted | 2026-07-11 08:45 | Referral #6 submitted |
| 6 | 6 | Accepted | 2026-07-14 16:20 | Referral #6 accepted |
| 7 | 7 | Submitted | 2026-06-15 09:00 | Referral #7 submitted |
| 8 | 7 | Accepted | 2026-06-17 13:30 | Referral #7 accepted |
| 9 | 7 | Completed | 2026-06-25 15:00 | Referral #7 completed |
| 10 | 8 | Submitted | 2026-06-18 09:00 | Referral #8 submitted |
| 11 | 8 | Accepted | 2026-06-20 10:15 | Referral #8 accepted |
| 12 | 8 | Completed | 2026-06-28 11:45 | Referral #8 completed |
| 13 | 9 | Submitted | 2026-07-05 09:30 | Referral #9 submitted |
| 14 | 9 | Rejected | 2026-07-07 12:00 | Referral #9 rejected |

**Key Notes**:
- Timeline shows status progression per referral
- Notifications 1-14 correspond to referrals 3-9
- Timestamps manually synced with Referral Service

**Source**: `services/notification/seed.py` lines 10-25

---

## Seeding Process

### Dependency Order

Seeds must run in this order to respect foreign key constraints:

```
1. Patient Service (8001)      ← No dependencies
2. Doctors Service             ← No dependencies  
3. Referral Service (8003)     ← Depends on Patient, Doctors
4. Document Service (8004)     ← Depends on Patient, Referral
5. Notification Service (8005) ← Depends on Referral
```

### Manual Seeding Per Service

**Option A: Automatic (Recommended)**

```bash
# Seeds all services in order
python scripts/seed_all.py
```

**Option B: Manual Per Service**

```bash
# 1. Patient Service
cd services/patient
python -c "from database import engine, Base; from seed import seed_if_empty; from sqlalchemy.orm import sessionmaker; Base.metadata.create_all(engine); db = sessionmaker(bind=engine)(); seed_if_empty(db)"

# 2. Doctors Service  
cd services/doctors
python -c "from database import engine, Base; from seed import seed_if_empty; from sqlalchemy.orm import sessionmaker; Base.metadata.create_all(engine); db = sessionmaker(bind=engine)(); seed_if_empty(db)"

# 3. Referral Service
cd services/referral
python -c "from database import engine, Base; from seed import seed_if_empty; from sqlalchemy.orm import sessionmaker; Base.metadata.create_all(engine); db = sessionmaker(bind=engine)(); seed_if_empty(db)"

# 4. Document Service
cd services/document
python -c "from database import engine, Base; from seed import seed_if_empty; from sqlalchemy.orm import sessionmaker; Base.metadata.create_all(engine); db = sessionmaker(bind=engine)(); seed_if_empty(db)"

# 5. Notification Service
cd services/notification
python -c "from database import engine, Base; from seed import seed_if_empty; from sqlalchemy.orm import sessionmaker; Base.metadata.create_all(engine); db = sessionmaker(bind=engine)(); seed_if_empty(db)"
```

**Option C: Via Service Startup**

Each service calls `seed_if_empty()` on startup if tables are empty:

```python
# services/referral/main.py (example)
from database import engine, Base
from seed import seed_if_empty
from sqlalchemy.orm import sessionmaker

Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
seed_if_empty(db)

@app.on_event("startup")
async def startup():
    # Seed is already called above
    pass
```

Just start each service and seeds load automatically.

---

## For Each Team Member

### Team 1: Referral & Appointment View

**Use this seed data**:
- Referrals 1-9 from `services/referral/seed.py`
- Appointments 1-3 from `services/referral/seed.py`
- Patients 1-5 from `services/patient/seed.py`

**Your implementation**:
```python
# services/referral/main.py
@app.get("/api/referrals/patient/{patient_id}")
def get_patient_referrals(patient_id: int):
    return db.query(Referral).filter(Referral.PatientId == patient_id).all()

@app.get("/api/appointments/patient/{patient_id}")
def get_patient_appointments(patient_id: int):
    return db.query(Appointment).filter(Appointment.PatientId == patient_id).all()
```

**Frontend can call**:
```typescript
// frontend/src/app/portal/dashboard.component.ts
this.referralService.getPatientReferrals(patientId).subscribe(referrals => {
  this.referrals = referrals;  // Will have 9 referrals with seed data
});
```

---

### Team 2: Document & Form Management

**Use this seed data**:
- Documents 1-12 from `services/document/seed.py`
- ReferralId references 3-9 (to link docs to referrals)
- PatientId references 1-5

**Unblock strategy** (if Team 1 APIs not ready):
```python
# services/document/main.py
from mock_referral_client import MockReferralClient

@app.get("/api/documents/patient/{patient_id}")
def get_documents(patient_id: int):
    # Option 1: Call Team 1 API (once ready)
    # referrals = httpx.get(f"http://referral-service:8003/api/referrals?patientId={patient_id}")
    
    # Option 2: Use mock until Team 1 ready
    referrals = MockReferralClient.get_patient_referrals(patient_id)
    
    documents = db.query(Document).filter(Document.PatientId == patient_id).all()
    return {"documents": documents, "referrals": referrals}
```

**Frontend can call**:
```typescript
// frontend/src/app/portal/documents.component.ts
this.documentService.getDocuments(patientId).subscribe(data => {
  this.documents = data.documents;  // Will have 3-4 documents per patient
});
```

---

### Team 3: Referral Progress Tracking

**Use this seed data**:
- Notifications 1-14 from `services/notification/seed.py`
- ReferralId references 3-9
- EventType values: "Submitted", "Accepted", "Completed", "Rejected"

**Unblock strategy** (if Team 1 APIs not ready):
```python
# services/notification/main.py
from mock_referral_client import MockReferralClient

@app.get("/api/notifications/referral/{referral_id}/timeline")
def get_referral_timeline(referral_id: int):
    # Get referral info (mock or real)
    referral = MockReferralClient.get_referral(referral_id)
    
    # Get notification history
    timeline = db.query(Notification).filter(
        Notification.ReferralId == referral_id
    ).order_by(Notification.Timestamp).all()
    
    return {"referral": referral, "timeline": timeline}
```

**Frontend can call**:
```typescript
// frontend/src/app/portal/referral-timeline.component.ts
this.notificationService.getReferralTimeline(referralId).subscribe(data => {
  this.timeline = data.timeline;  // Will have 2-3 status changes per referral
});
```

---

## Verifying Seeds Are Loaded

### 1. Check Database Directly

```bash
# Connect to PostgreSQL (example)
psql -U cliniccare -d cliniccare_referral

# Inside psql:
SELECT COUNT(*) FROM referral;  -- Should be 9
SELECT COUNT(*) FROM appointment;  -- Should be 3
SELECT * FROM referral WHERE PatientId = 1;  -- Shows Anjali's referrals
```

### 2. Check via API

```bash
# Get Anjali's referrals (PatientId=1)
curl -X GET http://localhost:8003/api/referrals/patient/1

# Expected output:
[
  {
    "id": 1,
    "patientId": 1,
    "specialty": "Cardiology",
    "status": "Draft",
    ...
  },
  {
    "id": 4,
    "patientId": 1,
    "specialty": "Endocrinology",
    "status": "Submitted",
    ...
  }
]
```

### 3. Check via Frontend

Start the frontend app and log in as a patient:
- Username: `patient@example.com` (Patient 1: Anjali)
- Should see 2 referrals and 0 appointments
- Should see links to documents

---

## Adding More Seed Data

### To Add a New Referral

Edit `services/referral/seed.py`:

```python
SEED_REFERRALS = [
    # ... existing ...
    dict(PatientId=1, ReferringDoctorId=6, SpecialistId=2, Reason="New referral reason",
         Priority="Routine", Status="Draft", CreatedAt=datetime(2026, 8, 10, 9, 0), UpdatedAt=datetime(2026, 8, 10, 9, 0)),
]
```

Then reseed:
```bash
# Clear existing data (be careful in dev only!)
# DELETE FROM referral; -- in psql

python scripts/seed_all.py
```

### To Add a New Document

Edit `services/document/seed.py`:

```python
SEED_DOCUMENTS = [
    # ... existing ...
    dict(PatientId=1, ReferralId=10, Type="Pre-visit Form", UploadedDate=date(2026, 8, 15), FileName="previsit_form.pdf"),
]
```

### To Add a New Notification

Edit `services/notification/seed.py`:

```python
SEED_NOTIFICATIONS = [
    # ... existing ...
    dict(ReferralId=10, EventType="Submitted", Timestamp=datetime(2026, 8, 15, 10, 0), Message="Referral #10 submitted."),
]
```

**Important**: Keep timestamps in sync across services!

---

## Troubleshooting

### Issue: "Foreign Key Constraint Violation"

**Cause**: Seeds ran out of order (e.g., Document before Referral)

**Fix**: Run seeds in correct order:
```bash
python scripts/seed_all.py  # Always runs in order
```

---

### Issue: "Duplicate Key Violation"

**Cause**: Seeds already loaded, trying to insert again

**Fix**: Check if seeds exist first (this is handled by `seed_if_empty()`):
```python
def seed_if_empty(db: Session) -> None:
    if db.query(Referral).count() > 0:
        return  # Already seeded, skip
    # Insert seed data...
```

---

### Issue: "No Such Table"

**Cause**: Database tables not created yet

**Fix**: Ensure `Base.metadata.create_all(engine)` runs before seeding:
```python
from database import engine, Base
Base.metadata.create_all(engine)  # Create tables first
seed_if_empty(db)  # Then seed
```

---

### Issue: Referral API Returns Empty

**Cause**: Referral Service DB seeded, but API not returning data

**Fix**: Check API implementation:
```python
@app.get("/api/referrals/patient/{patient_id}")
def get_patient_referrals(patient_id: int, db: Session = Depends(get_db)):
    # MUST pass db session, don't use global!
    return db.query(Referral).filter(Referral.PatientId == patient_id).all()
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **Seed all services** | `python scripts/seed_all.py` |
| **View Patient seed** | `cat services/patient/seed.py` |
| **View Referral seed** | `cat services/referral/seed.py` |
| **Check Referral count** | `curl http://localhost:8003/api/referrals` |
| **Get Patient 1 referrals** | `curl http://localhost:8003/api/referrals/patient/1` |
| **Get Patient 1 documents** | `curl http://localhost:8004/api/documents/1` |
| **Get Referral 5 timeline** | `curl http://localhost:8005/api/notifications/referral/5/timeline` |

---

## References

- **README.md** — Feature overview and requirements
- **Referral Service** — `services/referral/seed.py`
- **Patient Service** — `services/patient/seed.py`
- **Document Service** — `services/document/seed.py`
- **Notification Service** — `services/notification/seed.py`

---

## FAQ

**Q: Can I modify seed data in production?**  
A: No. Seed data is for **dev/test only**. In production, use data migrations and API endpoints.

**Q: Why are notifications manually synced with referrals?**  
A: Services don't share databases. Timestamps must match manually to simulate real events.

**Q: Can Teams 2 & 3 work while Team 1 builds?**  
A: Yes! Use mock API clients or seed data directly. Once Team 1's APIs are ready, swap mock for real calls.

**Q: What if I need different seed data?**  
A: Edit the `SEED_*` lists in `seed.py` and re-run `seed_all.py`. Changes only apply to **dev databases**.

---

**Last Updated**: 2026-08-17  
**Maintained By**: Architecture Team  
**Questions?**: Ask in standup or check README.md
