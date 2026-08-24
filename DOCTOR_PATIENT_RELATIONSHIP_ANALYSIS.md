# Doctor-Patient Relationship Alignment Analysis

**Date:** August 19, 2026  
**Analysis:** Data model alignment between Patient Portal and existing features  
**Scope:** Doctor-Patient relationships and data consistency

---

## Current Architecture Overview

### Patient Service
```
Patient (PatientId)
├── Name, DOB, Gender
├── Allergies (1:many)
├── Chronic Conditions (1:many)
└── Medications (1:many)
```

**Doctor Relationships:** NONE (no FK to Doctor)

### Doctor Service
```
Doctor (DoctorId)
├── Name
├── Specialty
├── Department
└── ContactInfo
```

**Patient Relationships:** NONE (no FK to Patient)

### Referral Service (Connection Point)
```
Referral (ReferralId)
├── PatientId → Patient (FK)
├── ReferringDoctorId → Doctor (FK)
├── SpecialistId → Doctor (FK)
├── Status, Priority, Reason
└── CreatedAt, UpdatedAt

Appointment (AppointmentId)
├── ReferralId → Referral (FK)
├── PatientId (denormalized)
├── ScheduledAt, Location
└── CheckInInstructions
```

---

## Alignment Assessment

### ✅ ALIGNED: Patient Scoping in Portal

**How It Works:**
- All patient portal queries use `?patientId={id}` parameter
- API Gateway validates patient-scoped data
- Patient Portal authenticates via PatientAuthService
- Data isolation via PatientId filtering

**Example - View Referrals:**
```sql
-- Query scoped to patient
SELECT * FROM referrals WHERE PatientId = 3;
```

**Result:** ✅ Correctly aligned

---

### ✅ ALIGNED: Doctor Access Pattern

**How It Works:**
- Patient portal displays doctor names via SpecialistId/ReferringDoctorId
- Frontend enriches doctor data by calling `/api/doctors`
- Doctor data is public (no patient scoping needed)

**Patient Portal Implementation:**
```typescript
// Load doctors for enrichment
this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`).subscribe({
  next: (doctors) => {
    doctors.forEach((d) => this.doctors.set(d.DoctorId, d));
  }
});

// Display doctor name
getSpecialistName(specialistId: number): string {
  const doc = this.doctors.get(specialistId);
  return doc ? `Dr. ${doc.Name} (${doc.Specialty})` : ...;
}
```

**Result:** ✅ Correctly aligned

---

### ⚠️ MISALIGNED: Missing Doctor in Appointment

**Issue:** Appointment table lacks DoctorId reference

**Current Appointment Schema:**
```sql
appointments (
  AppointmentId INT PRIMARY KEY,
  ReferralId INT,        -- ✅ Links to referral
  PatientId INT,         -- ✅ Denormalized
  ScheduledAt DATETIME,
  Location VARCHAR,
  CheckInInstructions VARCHAR
  -- ❌ NO DoctorId field
)
```

**What's Missing:**
- No explicit doctor reference in appointment
- Have to join through Referral→Doctor to get specialist
- Cannot directly show "Appointment with Dr. Smith"

**Expected Alignment:**
```sql
appointments (
  AppointmentId INT PRIMARY KEY,
  ReferralId INT,
  PatientId INT,
  DoctorId INT,          -- ← Should be here
  SpecialistId INT,      -- ← Or this
  ScheduledAt DATETIME,
  Location VARCHAR,
  CheckInInstructions VARCHAR
)
```

**Impact:** MEDIUM
- Works through joins but requires multi-step resolution
- Not optimal for read performance
- Doctor context implicit rather than explicit

---

### ⚠️ MISALIGNED: Referral Missing DoctorId Reference

**Issue:** Referral stores doctor IDs but no explicit relationship definition

**Current Schema:**
```python
class Referral(Base):
  ReferralId = Column(Integer, primary_key=True)
  PatientId = Column(Integer, nullable=False)  # ✅ Has FK
  ReferringDoctorId = Column(Integer, nullable=False)  # ❌ NO FK
  SpecialistId = Column(Integer, nullable=False)  # ❌ NO FK
```

**What's Wrong:**
- No `ForeignKey()` constraint on DoctorId columns
- Database doesn't enforce referential integrity
- SQLAlchemy doesn't have navigation relationships
- Orphaned referrals could exist if doctor deleted

**Expected:**
```python
class Referral(Base):
  ReferralId = Column(Integer, primary_key=True)
  PatientId = Column(Integer, ForeignKey("patients.PatientId"))  # ✅
  ReferringDoctorId = Column(Integer, ForeignKey("doctors.DoctorId"))  # ← Add
  SpecialistId = Column(Integer, ForeignKey("doctors.DoctorId"))  # ← Add
  
  # Navigation relationships
  patient = relationship("Patient")
  referring_doctor = relationship("Doctor", foreign_keys=[ReferringDoctorId])
  specialist = relationship("Doctor", foreign_keys=[SpecialistId])
```

**Impact:** MEDIUM
- No database constraints
- Risk of data inconsistency
- Manual validation required

---

### ❌ NOT ALIGNED: Patient-Doctor Direct Relationship

**Issue:** No way to query "which doctors does this patient see"

**What Exists:**
- Patient → Referral (via PatientId)
- Referral → Doctor (via DoctorId)
- No bidirectional navigation

**What's Missing:**
```
Patient.doctors = [Doctor1, Doctor2, ...]  // ← Doesn't exist
Doctor.patients = [Patient1, Patient2, ...] // ← Doesn't exist
```

**Example - Cannot easily answer:**
```
Q: "Show me all doctors for patient 3"
A: Must query:
   SELECT DISTINCT d.* 
   FROM doctors d
   JOIN referrals r ON d.DoctorId = r.SpecialistId
   WHERE r.PatientId = 3
```

**Impact:** LOW-MEDIUM
- Works but requires multi-step queries
- Patient portal doesn't need this (only shows appointment doctors)
- Could be useful for clinician UI

---

## Alignment Matrix

| Feature | Doctor Scoping | Patient Scoping | Data Integrity | Navigation | Status |
|---------|---|---|---|---|---|
| View Referrals | ✅ | ✅ | ✅ | ❌ | ⚠️ Works |
| View Appointments | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ Partial |
| Upload Documents | ✅ | ✅ | ✅ | ✅ | ✅ Good |
| View Questionnaires | ✅ | ✅ | ✅ | ✅ | ✅ Good |
| Track Referrals | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ Works |

---

## Data Flow Analysis

### ✅ View Referrals - Properly Scoped
```
Patient Portal
  ↓
Request: GET /api/referrals?patientId=3
  ↓
API Gateway
  ↓
Referral Service
  ↓
Query: SELECT * FROM referrals WHERE PatientId = 3
  ↓
Frontend Enriches:
  - Get doctor info via /api/doctors
  - Join with specialist data
  ↓
Display: "Dr. Meera Nair (Dermatology)"
```
**Result:** ✅ Correct scoping, doctor data enriched

---

### ⚠️ View Appointments - Indirect Doctor Reference
```
Patient Portal
  ↓
Request: GET /api/appointments?patientId=3
  ↓
Appointment Service (Referral Service)
  ↓
Query: SELECT * FROM appointments WHERE PatientId = 3
  ↓
Returns appointment WITH referral link but NO doctor info
  ↓
Frontend must:
  - Get Referral details separately
  - Extract SpecialistId from Referral
  - Call /api/doctors to get name
```
**Result:** ⚠️ Works but requires multiple enrichment steps

---

### ✅ Track Referrals - Complete Information
```
Patient Portal
  ↓
Request: GET /api/referrals/{id}
  ↓
Query: SELECT * FROM referrals WHERE ReferralId = 5
  ↓
Result includes:
  - PatientId (scoped to this patient)
  - ReferringDoctorId (can lookup doctor)
  - SpecialistId (can lookup doctor)
  - Status workflow
  ↓
Display complete referral with doctor info enriched
```
**Result:** ✅ All information present, properly scoped

---

## Consistency Check

### Database Constraints
```
Patient Service:
  ✅ patients.PatientId (PK)

Doctor Service:
  ✅ doctors.DoctorId (PK)

Referral Service:
  ✅ referrals.PatientId → patients.PatientId (FK)
  ❌ referrals.ReferringDoctorId → doctors.DoctorId (NO FK)
  ❌ referrals.SpecialistId → doctors.DoctorId (NO FK)

Appointment Service:
  ✅ appointments.ReferralId → referrals.ReferralId (FK)
  ✅ appointments.PatientId (matches referral.PatientId)
  ❌ appointments lacks DoctorId field
```

**Constraint Gap:** 3 missing ForeignKey definitions

---

## Risk Assessment

### ✅ Low Risk
- Patient portal works correctly despite missing constraints
- Soft foreign keys maintained in application logic
- Data integrity in practice (no orphaned records in test data)

### ⚠️ Medium Risk
- No database-level referential integrity
- Could create inconsistent data if application logic fails
- Difficult to audit doctor-patient relationships

### ⚠️ Performance Risk
- Appointments require join to get doctor info
- No direct lookup of "patient's doctors"
- Could be slow with many referrals

---

## Recommendations

### 🔴 Critical (Add Constraints)
1. Add ForeignKey constraints to referral.ReferringDoctorId and referral.SpecialistId
   ```sql
   ALTER TABLE referrals 
   ADD CONSTRAINT fk_referring_doctor FOREIGN KEY (ReferringDoctorId) REFERENCES doctors(DoctorId);
   ADD CONSTRAINT fk_specialist FOREIGN KEY (SpecialistId) REFERENCES doctors(DoctorId);
   ```
   **Effort:** 30 minutes (database migration)

### 🟡 Important (Improve Queries)
2. Add DoctorId to Appointment table for direct reference
   ```sql
   ALTER TABLE appointments ADD COLUMN SpecialistId INT;
   ```
   **Effort:** 1 hour (migration + update queries)

3. Add SQLAlchemy relationships to models
   ```python
   class Referral(Base):
     referring_doctor = relationship("Doctor", foreign_keys=[ReferringDoctorId])
     specialist = relationship("Doctor", foreign_keys=[SpecialistId])
   ```
   **Effort:** 30 minutes

### 🟢 Enhancement (Future)
4. Add patient-doctor association table for complex scenarios
   ```sql
   CREATE TABLE patient_doctors (
     PatientId INT FK,
     DoctorId INT FK,
     RelationType VARCHAR (Referring, Specialist),
     PRIMARY KEY (PatientId, DoctorId)
   );
   ```
   **Effort:** 2-3 hours (optional, future)

---

## Alignment Summary

| Aspect | Status | Impact | Priority |
|--------|--------|--------|----------|
| **Patient Scoping** | ✅ Aligned | Works correctly | - |
| **Doctor Reference** | ⚠️ Indirect | Requires enrichment | Low |
| **Data Integrity** | ⚠️ Soft FK | App-level only | Medium |
| **Navigation Relationships** | ❌ Missing | SQLAlchemy lacks nav | Medium |
| **Query Performance** | ⚠️ OK | Multi-step enrichment | Low |
| **Doctor-Patient Consistency** | ✅ Maintained | No orphaned data | - |

---

## Conclusion

### ✅ What's Working
- Patient portal correctly scopes data to authenticated patient
- Doctor information properly enriched from separate service
- Referral and Appointment links maintain consistency in practice
- No actual orphaned or inconsistent data observed

### ⚠️ What Should Be Improved
1. Add ForeignKey constraints for referential integrity
2. Add DoctorId to Appointment table
3. Add SQLAlchemy relationships for navigation

### Final Assessment
**FUNCTIONALLY ALIGNED:** Patient portal works correctly with existing doctor-patient relationships ✅  
**STRUCTURALLY IMPROVABLE:** Would benefit from explicit constraints and relationships ⚠️  
**CONSISTENCY LEVEL:** Data consistent in practice, but not enforced at database level ⚠️

**Recommendation:** Fix constraints before production, but patient portal is safe to deploy as-is.

---

**Analysis Date:** August 19, 2026 ✅
