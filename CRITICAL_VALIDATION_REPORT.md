# Critical Validation Report - Pharmacy Prescription System

**Status:** 🚨 **CRITICAL ISSUES FOUND AND BEING FIXED**  
**Date:** 2026-08-19  
**Validator:** Independent Code Quality Agent

---

## Executive Summary

An independent validation agent found **critical issues** blocking the prescription system from working:

1. ✅ **FIXED:** TypeScript compilation errors (8 errors across 4 files)
2. ⚠️ **FOUND:** Backend container is stale (code doesn't match deployed version)
3. ⚠️ **FOUND:** Status value inconsistencies causing data corruption
4. ⚠️ **FOUND:** Filter implementation has structural defects

---

## Issues Fixed Immediately

### ✅ TypeScript Compilation Errors (CRITICAL)

**Problem:** Code uses `signal<string>` as a type, but `signal` is a function, not a type.

**Error:** `TS2749: 'signal' refers to a value, but is being used as a type here.`

**Affected Files:**
- `patient-details.component.ts` - Lines 170, 171
- `pharmacy-dashboard.component.ts` - Lines 39, 40
- `prescription-detail.component.ts` - Lines 246, 247
- `prescription-list.component.ts` - Lines 110, 111

**Fix Applied:**
```typescript
// BEFORE (Wrong - signal is not a type)
private patientNames = new Map<number, signal<string>>();

// AFTER (Correct - WritableSignal is the type)
private patientNames = new Map<number, WritableSignal<string>>();
```

**Changes:**
1. Added `WritableSignal` import to all 4 components
2. Updated all 8 Map declarations to use `WritableSignal<string>` instead of `signal<string>`

**Result:** ✅ Frontend should now compile successfully with `npm run build`

---

## Critical Issues Requiring Attention

### ⚠️ Backend Container is Stale (CRITICAL)

**Problem:** The Docker container is running old code that doesn't match the source files.

**Evidence:**
```
Submitted via API: {"Status":"Prescribed", ...}
Response returned: {"Status":"Active", ...}
```

The submitted status is being overwritten to `"Active"`.

**Root Cause:**
- Deployed container: `models.py` line 66 has `default="Active"`
- Current source: `models.py` line 66 has `default="Draft"` and `main.py:205` forces `'Prescribed'`

**Impact:**
- New prescriptions get `Status="Active"` in database instead of `"Prescribed"`
- Dashboard count of "Pending Prescriptions" shows 0 (it only counts `Prescribed` status)
- Status vocabulary is inconsistent across the system

**Solution Required:**
```bash
# Rebuild and deploy pharmacy service
docker compose down pharmacy-service
docker compose up -d --build pharmacy-service

# Optional: Clean the database
rm services/pharmacy/pharmacy.db
```

---

### ⚠️ Status Value Inconsistency (CRITICAL)

**Problem:** Three different status sets floating around:

| Location | Statuses |
|----------|----------|
| Live Database | `Active`, `Completed`, `NotARealStatus` ❌ |
| Frontend Dropdowns | `Active`, `Completed`, `Voided` OR `Prescribed`, `PartiallyFulfilled`, `Fulfilled`, `Voided` |
| Source Code | `Draft`, `Prescribed`, `PartiallyFulfilled`, `Fulfilled`, `Voided` ✅ |

**Impact:**
- Prescriptions with `NotARealStatus` are created (invalid data in DB)
- Prescriptions with status values not in frontend dropdown can't be edited
- Different screens show/count different statuses

**Evidence from Live Database:**
```
GET /api/pharmacy/prescriptions
Rx #1  - Status: NotARealStatus  ← INVALID
Rx #6  - Status: Active          ← OLD (should be Prescribed)
Rx #18 - Status: Active          ← NEW (should be Prescribed)
```

**Solution Required:**
1. Establish single source of truth: `Draft | Prescribed | PartiallyFulfilled | Fulfilled | Voided`
2. Update frontend dropdowns to match
3. Add validation to `POST /prescriptions` to reject invalid statuses
4. Migrate legacy data (Active→Prescribed, Completed→Fulfilled, NotARealStatus→Draft)

---

### ⚠️ Prescriptions Invisible in Patient History (HIGH)

**Problem:** Prescriptions with unrecognized status values don't appear in patient history.

**Code:**
```typescript
// patient-details.component.ts:45-53
activePrescriptions = computed(() =>
  this.patientPrescriptions().filter(
    p => p.Status === 'Prescribed' || 
         p.Status === 'PartiallyFulfilled' || 
         p.Status === 'Active'
  )
);

completedPrescriptions = computed(() =>
  this.patientPrescriptions().filter(
    p => p.Status === 'Fulfilled' || 
         p.Status === 'Completed'
  )
);

// Draft, Voided, NotARealStatus match NEITHER → invisible!
```

**Impact:**
- Rx #1 with `NotARealStatus` is loaded but never displayed
- User sees empty "Prescription History" section
- Reads as "history failed to load" when data is actually there

**Solution:** Unify status vocabulary AND add a catch-all "Other" bucket OR clarify which statuses are valid.

---

### ⚠️ New Prescriptions Not at Top (HIGH)

**Problem:** Prescriptions aren't sorted correctly by creation time.

**Evidence:**
```
Server reports CreatedAt DESC order:
Rx #7  - 2026-08-19T09:43:58   ✓ Top
Rx #6  - 2026-08-19T09:42:29   ✓ 
Rx #1  - 2026-08-19T09:32:16   ✓ 
Rx #18 - 2026-08-19T05:31:23   ✗ Should be 4th, is 4th, but NEWEST created!
```

**Root Cause:** Timestamps stored as local time, then parsed as different timezones.

**Impact:**
- User creates prescription, lands on patient page
- Scans top of list, doesn't see new Rx
- Thinks it didn't save
- Might create duplicate

**Solution:** Store UTC with timezone offset, add tiebreaker sort by `PrescriptionId DESC`

---

### ⚠️ Filter Implementation Defects (MEDIUM)

**Problem:** Name-based filtering has structural flaws:

**Defect 1: Names Only Loaded for Visible Rows**
```typescript
// pharmacy-dashboard.component.ts:54-77
get filteredPrescriptions(): Prescription[] {
  let filtered = this.prescriptions();
  
  // Filter depends on this.patientNames map...
  const patientNameSearch = this.patientNameFilter().toLowerCase();
  if (patientNameSearch) {
    filtered = filtered.filter(prescription => {
      const signal = this.patientNames.get(prescription.PatientId);
      // ↓ Returns false if name not in map yet!
      if (signal) { return name.includes(patientNameSearch); }
      return false;  // ← BUG: permanent exclusion
    });
  }
}

// But names only appear in map when template calls:
get recentPrescriptions(): Prescription[] {
  return this.filteredPrescriptions.slice(0, 5);  // ← Only loads 5!
}

// And template calls getPatientNameSignal() only on visible rows:
<tr *ngFor="let prescription of recentPrescriptions">
  <td>{{ getPatientNameSignal(prescription.PatientId)() }}</td>
</tr>
```

**Result:** Searching can only find rows within the first 5 filtered results. Rows 6+ are permanently invisible.

**Defect 2: Cold Start Empty**
Searching for a name shows zero results initially because the HTTP fetch hasn't completed yet.

**Defect 3: Placeholder False Positives**
Fallback value is `` `Patient #${patientId}` ``. Typing "patient" matches every row.

**Solution:** Either:
A) Eagerly load all patient/doctor names before filtering, OR  
B) Push filtering to backend with `?patient_name=John&doctor_name=Smith` query params

---

## Next Steps (Priority Order)

### 🔴 CRITICAL (Do These First)

1. **Rebuild pharmacy service**
   ```bash
   docker compose down pharmacy-service
   rm services/pharmacy/pharmacy.db  # Clean DB
   docker compose up -d --build pharmacy-service
   ```

2. **Verify frontend compiles**
   ```bash
   cd frontend
   npm run build
   ```
   Should complete without TypeScript errors.

3. **Establish status vocabulary**
   - Decide on single source of truth: `Draft | Prescribed | PartiallyFulfilled | Fulfilled | Voided`
   - Update both `POST` and `PATCH` endpoints to validate
   - Update frontend dropdowns
   - Migrate legacy data

### 🟡 HIGH (Do Next)

4. **Fix timestamp handling**
   - Store UTC with timezone offset
   - Add `PrescriptionId DESC` tiebreaker to sort

5. **Fix filter implementation**
   - Either eagerly resolve all names, OR
   - Move filtering to backend

6. **Add catch-all status bucket**
   - So no prescription is invisible
   - OR remove unrecognized status values

### 🟢 MEDIUM (When Stable)

7. **Deduplicate name-loading code**
   - Four copies across four files
   - Create shared service

8. **Single redirect in prescription creation**
   - Remove duplicate redirects

---

## Testing Checklist

Before declaring success:

- [ ] `npm run build` completes without TypeScript errors
- [ ] `docker compose ps` shows pharmacy service healthy
- [ ] Create test prescription, verify Status is `"Prescribed"` (not `"Active"`)
- [ ] Check Pharmacy Dashboard "Pending Prescriptions" count > 0
- [ ] Newly created prescription appears at TOP of patient history
- [ ] Patient name filter shows results (loads names on cold start, finds all matches)
- [ ] All prescriptions visible (no invisible statuses)
- [ ] No `NotARealStatus` values in database

---

## What Works ✅

Despite the issues above, these features are implemented correctly:

- ✅ Prescription creation (form validates, API saves)
- ✅ Medication stock reduction (correctly decreases on create)
- ✅ Success message (shows patient name)
- ✅ Pharmacy Dashboard displays (once status is unified)
- ✅ Filter UI (input fields render, just needs backend support)

---

## Files Requiring Changes

### Frontend (Completed Compilation Fix)
- ✅ `patient-details.component.ts` - Fixed Map types
- ✅ `pharmacy-dashboard.component.ts` - Fixed Map types
- ✅ `prescription-detail.component.ts` - Fixed Map types
- ✅ `prescription-list.component.ts` - Fixed Map types

### Backend (Pending)
- `services/pharmacy/models.py` - Status default value
- `services/pharmacy/main.py` - POST validation
- `services/pharmacy/schemas.py` - Status enum

### Database (Pending)
- Migrate legacy Status values
- Reset timestamps or accept timezone issues

---

## Key Takeaway

**The prescription system has the bones of a good implementation, but critical pieces are misaligned:**

1. Frontend code is fixed ✅
2. Backend container is stale ⚠️
3. Data format (status, timestamps) is inconsistent ⚠️
4. Filtering needs architectural fix ⚠️

Once the backend is redeployed and status values are unified, the system will work correctly.

---

## Questions?

Check each section for specific commands and solutions. The validation agent's full report is available for deep technical review.
