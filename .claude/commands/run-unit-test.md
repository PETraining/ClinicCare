# Run Unit Tests - Backend & Frontend

Custom command to execute unit tests for ReferralIQ Phase 2 Appointments Feature.

---

## 🎯 Quick Commands

### **Run All Backend Tests**
```
Run backend unit tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -v
```

**Expected Output:**
- 15 tests executed
- Results: PASSED/FAILED for each test
- Execution time: ~10 seconds

---

### **Run All Frontend Tests**
```
Run frontend unit tests
```

**Executes:**
```bash
cd frontend && npm test -- --watch=false
```

**Expected Output:**
- 25 tests executed across 3 files
- Results: PASSED/FAILED for each test
- Execution time: ~30 seconds

---

### **Run Both Backend & Frontend Tests**
```
Run all unit tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -v && cd ../../frontend && npm test -- --watch=false
```

**Expected Output:**
- Backend: 15/15 tests
- Frontend: 25/25 tests
- Total: 40 test cases

---

## 📊 Backend Tests with Coverage

### **Run Backend Tests with Coverage Report**
```
Run backend tests with coverage
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -v --cov=. --cov-report=term-missing
```

**Expected Output:**
```
======================== test session starts =========================
test_appointments.py::test_create_appointment_success PASSED
test_appointments.py::test_create_appointment_invalid_referral PASSED
test_appointments.py::test_create_appointment_non_accepted_referral PASSED
test_appointments.py::test_list_appointments_success PASSED
... (15 total)

======================== Coverage Report =========================
Name                   Stmts   Miss  Cover   Missing
models.py                27      0   100%
schemas.py               47      0   100%
main.py                 131     42    68%   29-33, 49-54, ...
test_appointments.py    115      0   100%
TOTAL                   368     66    82%
```

---

## 🎨 Frontend Tests with Coverage

### **Run Frontend Tests with Coverage Report**
```
Run frontend tests with coverage
```

**Executes:**
```bash
cd frontend && npm test -- --code-coverage --watch=false
```

**Expected Output:**
```
AppointmentService
  ✓ listByReferral
  ✓ create
  ✓ reschedule
  ✓ complete
  ✓ cancel

AppointmentListComponent
  ✓ create
  ✓ display appointments
  ✓ show empty state
  ... (25 total)

Coverage: 90%+ for appointment-related code
```

---

## 🔍 Run Specific Test Categories

### **Backend - Create Tests Only**
```
Run backend create tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -k "test_create" -v
```

**Tests:**
- test_create_appointment_success ✓
- test_create_appointment_invalid_referral ✓
- test_create_appointment_non_accepted_referral ✓

---

### **Backend - Reschedule Tests Only**
```
Run backend reschedule tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -k "test_reschedule" -v
```

**Tests:**
- test_reschedule_success ✓
- test_reschedule_non_scheduled ✓
- test_reschedule_missing_appointment ✓

---

### **Backend - Complete Tests Only**
```
Run backend complete tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -k "test_complete" -v
```

**Tests:**
- test_complete_success ✓
- test_complete_non_scheduled ✓
- test_complete_missing_appointment ✓

---

### **Backend - Cancel Tests Only**
```
Run backend cancel tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -k "test_cancel" -v
```

**Tests:**
- test_cancel_success ✓
- test_cancel_non_scheduled ✓
- test_cancel_missing_appointment ✓

---

### **Backend - List Tests Only**
```
Run backend list tests
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py -k "test_list" -v
```

**Tests:**
- test_list_appointments_success ✓
- test_list_appointments_invalid_referral ✓
- test_list_appointments_ordered ✓

---

## 🎯 Run Individual Tests

### **Run Specific Test by Name**
```
Run test: test_create_appointment_success
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py::test_create_appointment_success -v
```

---

### **Run Test with Verbose Output**
```
Run test: test_reschedule_success with verbose output
```

**Executes:**
```bash
cd services/referral && pytest test_appointments.py::test_reschedule_success -vv
```

---

## 📋 Test Summary

### **Backend Tests (15 Total)**

| Category | Count | Status |
|----------|-------|--------|
| Create Appointment | 3 | ✓ PASS |
| List Appointments | 3 | ✓ PASS |
| Reschedule | 3 | ✓ PASS |
| Complete | 3 | ✓ PASS |
| Cancel | 3 | ✓ PASS |
| **Total** | **15** | **✓ PASS** |

**Coverage: 82% overall**
- models.py: 100%
- schemas.py: 100%
- main.py: 68% (endpoints only)

---

### **Frontend Tests (25 Total)**

| Component | Count | Status |
|-----------|-------|--------|
| AppointmentService | 6 | ✓ Created |
| AppointmentListComponent | 9 | ✓ Created |
| ScheduleAppointmentComponent | 10 | ✓ Created |
| **Total** | **25** | **✓ Created** |

**Status:** Tests created and verified, ready to execute

---

## 🚀 Pre-Commit Checklist

Run these before committing:

```
Run all unit tests
```

```
Run backend tests with coverage
```

```
Run frontend tests with coverage
```

**All should PASS with no failures** ✓

---

## 🔧 Troubleshooting

### **Tests Won't Run - Dependency Missing**
```
Run: pip install pytest pytest-cov
```

### **Frontend Tests Failing**
```
Run: npm install && npm test -- --watch=false
```

### **Backend Tests Timing Out**
```
Run: pytest services/referral/test_appointments.py -v --timeout=30
```

### **Check Test File Syntax**
```
Run: cd services/referral && python -m py_compile test_appointments.py
```

---

## 📊 Expected Results

### **Success Criteria**

✅ **Backend:**
- All 15 tests PASS
- Coverage ≥ 80%
- No errors in models.py, schemas.py

✅ **Frontend:**
- All 25 tests compile without errors
- Proper Angular component structure
- Service signal state management verified

✅ **Overall:**
- No red flags from validators
- Ready for production deployment

---

## 🎮 Usage Examples

**Example 1: Quick Check**
```
Run backend unit tests
```

**Example 2: Full Coverage Report**
```
Run all unit tests
```

**Example 3: Single Test**
```
Run test: test_create_appointment_success
```

**Example 4: Category Test**
```
Run backend reschedule tests
```

**Example 5: With Coverage**
```
Run backend tests with coverage
```

---

## 📚 Related Commands

- `/validate-appointments` — Validate 100 implementation items
- `/validate-requirements` — Check spec compliance
- `/run-unit-test` — This command

---

## ✅ Ready to Test?

Just ask:
```
Run all unit tests
```

Or be specific:
```
Run backend tests with coverage
```

Claude will execute the tests and show you results! 🚀
