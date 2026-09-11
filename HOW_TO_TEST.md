# How to Test - Complete Guide

**Date:** August 18, 2026  
**Purpose:** Test the pharmacy system, workflows, and CI/CD pipeline

---

## Testing Methods

### 1. Manual Testing (Interactive)
### 2. Automated Testing (Test Cases)
### 3. API Testing (Direct Endpoints)
### 4. Frontend Testing (UI)
### 5. CI/CD Testing (GitHub Actions)

---

## 1. Manual Testing (Interactive)

### Start the Application

```bash
cd C:\git\ClinicCare
./start_all.sh
```

This starts:
- ✅ All 6 backend services (ports 8001-8006)
- ✅ API Gateway (port 8000)
- ✅ Frontend dev server (port 4200)

### Access the Application

```
Frontend: http://localhost:4200
Gateway API: http://localhost:8000/docs
Pharmacy Service: http://localhost:8006/docs
```

### Test Complete Workflow

#### Part 1: Create a Referral
```
1. Login to http://localhost:4200
2. Click "Referrals" in navigation
3. Click "Create New Referral"
4. Fill form:
   - Patient: #1
   - Referring Doctor: #6
   - Specialist: #1
   - Reason: "Test referral"
   - Priority: "Routine"
5. Submit referral
✓ Should be in "Draft" status
```

#### Part 2: Submit Referral
```
1. Find the referral you created
2. Click on it
3. Click "Submit" button
✓ Status should change to "Submitted"
```

#### Part 3: Accept Referral
```
1. Click "Accept" button
✓ Status changes to "Accepted"
✓ Prescription auto-created in pharmacy
```

#### Part 4: Verify Prescription Created
```
1. Click "Pharmacy" in navigation
2. Click "View All Prescriptions"
3. Look for new prescription
✓ Should appear with status "Active"
```

#### Part 5: Add Medication to Prescription
```
1. Click on the new prescription
2. Click "+ Add Medication" button
3. Fill form:
   - Medication: #1 (Aspirin)
   - Quantity: 20 units
   - Frequency: "Twice daily"
   - Instructions: "Take after meals"
4. Click "Add Medication"
✓ Stock should decrease (50 → 30)
✓ Success message shown
```

#### Part 6: Dispense Medication
```
1. In same prescription, scroll to "Dispense Medication"
2. Select Medication: #1 (Aspirin)
3. Enter Quantity: 10 units
4. Click "Dispense Medication"
✓ Stock decreases (30 → 20)
✓ Success message shown
✓ Dispensing history updated
```

#### Part 7: Check Inventory
```
1. Click "Pharmacy" → "Manage Inventory"
2. Search for "Aspirin"
✓ Stock shows 20 units
✓ Progress bar updated
✓ Status still "IN STOCK"
```

#### Part 8: Check Low Stock Alerts
```
1. Go to Pharmacy Dashboard
2. Check "Low Stock Items" count
3. Should show count of items below minimum
✓ Omeprazole (2 units) should be CRITICAL
✓ Lisinopril (5 units) should be LOW
```

---

## 2. Automated Testing (Test Cases)

### Run All Test Cases

**Test File:** `TEST_CASES.md`

**Categories:**
- Medication Inventory (4 tests)
- Prescription Management (5 tests)
- Dispensing Workflow (3 tests)
- Low Stock Alerts (4 tests)
- API Endpoints (7 tests)
- Frontend Components (6 tests)
- State Management (3 tests)
- Integration Points (3 tests)
- Stock Reservation (4 tests)
- Error Handling (4 tests)
- End-to-End Workflows (4 tests)

**Total: 70+ test cases**

### How to Follow Test Cases

**Example: TC-MED-001: Create New Medication**

```
Test ID: TC-MED-001
Requirement: Add new medication to inventory
Category: Medication Inventory Management

Steps to Execute:
1. Navigate to Inventory Management page
   → Click "Pharmacy" → "Manage Inventory"
   
2. Click "Add Medication" button
   
3. Enter:
   - Name: "Lisinopril"
   - Dosage: "5mg"
   - StockLevel: 50
   - MinStockLevel: 10
   - UnitPrice: 3.50
   
4. Click Submit

Expected Result:
✓ Medication created in database
✓ Appears in medications list
✓ Available for prescriptions
✓ Stock level shows 50 units

Verification:
✓ Check in Inventory Management page
✓ Search for "Lisinopril"
✓ Verify all fields correct
```

### Test Matrix

Create a spreadsheet and track:

```
Test ID     | Test Name              | Status | Notes
------------|------------------------|---------|---------
TC-MED-001  | Create Medication      | ✓ PASS | 
TC-MED-002  | Update Stock Level     | ✓ PASS |
TC-MED-003  | Track Stock Levels     | ✓ PASS |
TC-MED-004  | Restock Medication     | ✓ PASS |
TC-PRES-001 | Auto-Create from Ref   | ✓ PASS |
TC-PRES-002 | Add Medication         | ✓ PASS |
TC-PRES-003 | Prevent Duplicates     | ✓ PASS |
...
```

---

## 3. API Testing (Direct Endpoints)

### Test via Swagger UI

#### Pharmacy Service Swagger
```
URL: http://localhost:8006/docs
```

**Try It Out:**

**1. GET /medications**
```
1. Click "GET /medications"
2. Click "Try it out"
3. Click "Execute"

Expected Response (200 OK):
[
  {
    "MedicationId": 1,
    "Name": "Aspirin",
    "Dosage": "500mg",
    "StockLevel": 50,
    "MinStockLevel": 10,
    "UnitPrice": 2.5,
    "CreatedAt": "2026-08-18T..."
  },
  ...
]
```

**2. GET /medications?low_stock=true**
```
1. Click "GET /medications" (with parameters)
2. Check "low_stock" checkbox
3. Set to "true"
4. Click "Execute"

Expected Response (200 OK):
[
  {
    "MedicationId": 3,
    "Name": "Lisinopril",
    "StockLevel": 5,
    "MinStockLevel": 10,
    ...
  },
  {
    "MedicationId": 5,
    "Name": "Omeprazole",
    "StockLevel": 2,
    "MinStockLevel": 10,
    ...
  },
  ...
]
```

**3. POST /prescriptions/{id}/dispense**
```
1. Click "POST /prescriptions/{id}/dispense"
2. Enter prescription_id: 1
3. Click "Try it out"
4. Fill request body:
{
  "medication_id": 1,
  "quantity_dispensed": 5
}
5. Click "Execute"

Expected Response (200 OK):
{
  "success": true,
  "dispensing_id": 4,
  "remaining_stock": 45,
  "message": "Medication dispensed successfully"
}
```

**4. GET /inventory/low-stock**
```
1. Click "GET /inventory/low-stock"
2. Click "Try it out"
3. Click "Execute"

Expected Response (200 OK):
{
  "medications": [
    {
      "MedicationId": 5,
      "Name": "Omeprazole",
      "StockLevel": 2,
      "MinStockLevel": 10,
      ...
    },
    ...
  ],
  "count": 3
}
```

### Test via cURL

```bash
# List all medications
curl http://localhost:8006/medications

# Get low-stock items
curl "http://localhost:8006/medications?low_stock=true"

# Get specific medication
curl http://localhost:8006/medications/1

# List prescriptions
curl http://localhost:8006/prescriptions

# Get prescription detail
curl http://localhost:8006/prescriptions/1

# Dispense medication
curl -X POST http://localhost:8006/prescriptions/1/dispense \
  -H "Content-Type: application/json" \
  -d '{"medication_id": 1, "quantity_dispensed": 5}'

# Get low-stock items
curl http://localhost:8006/inventory/low-stock

# Health check
curl http://localhost:8006/health
```

### Test via Gateway

```bash
# Through API Gateway
curl http://localhost:8000/api/pharmacy/medications
curl http://localhost:8000/api/pharmacy/prescriptions
curl http://localhost:8000/api/pharmacy/inventory/low-stock
```

---

## 4. Frontend Testing (UI)

### Test Pharmacy Dashboard

```
1. Navigate to http://localhost:4200
2. Click "Pharmacy" in navigation
3. Verify Dashboard loads with:

Stat Cards:
✓ Pending Prescriptions: shows count
✓ Low Stock Items: shows count
✓ Total Medications: shows 10

Recent Prescriptions Table:
✓ Shows up to 5 prescriptions
✓ Sorted by newest first
✓ "Details" button works

Low Stock Alerts:
✓ Shows critical items in red
✓ Shows warning items in yellow
✓ Each shows name, current, minimum
✓ "Restock Now" button clickable
```

### Test Prescription List

```
1. Click "Pharmacy" → "View All Prescriptions"
2. Verify:

Table Display:
✓ All prescriptions shown
✓ Columns: ID, Patient, Referral, Status, Created, Actions
✓ Data correct

Filters:
✓ Click "All Medications" filter
✓ Click "Low Stock" filter
✓ Results update correctly

Search:
✓ Type medication name
✓ List filters by search

Navigation:
✓ Click "Details" button
✓ Opens prescription detail page
```

### Test Prescription Detail

```
1. Open any active prescription
2. Verify all sections load:

Prescription Header:
✓ ID and status badge correct
✓ Referral link works

Info Cards:
✓ Patient, Doctor, Referral IDs correct
✓ Created/Updated dates shown

Medications Section:
✓ All medications listed
✓ Quantity, frequency, instructions shown
✓ "+ Add Medication" button visible

Dispensing Form (if Active):
✓ Medication dropdown populated
✓ Quantity input works
✓ "Dispense" button clickable

Dispensing History:
✓ All past dispensing records shown
✓ Correct medication, quantity, date
```

### Test Inventory Management

```
1. Click "Pharmacy" → "Manage Inventory"
2. Verify:

Search & Filter:
✓ Search box filters by name
✓ "All Medications" shows 10 items
✓ "Low Stock" shows 2-3 items
✓ "Critical" shows 1 item

Table Display:
✓ All columns visible
✓ Stock progress bars show
✓ Status badges color-coded
✓ Action buttons present

Stock Update:
✓ Click "Edit" on any medication
✓ Change stock level
✓ Click "Save"
✓ Changes reflected immediately

Restock:
✓ Click "+ Restock"
✓ Enter quantity
✓ Stock increases
✓ Low-stock alert updates
```

---

## 5. CI/CD Testing (GitHub Actions)

### Create Test PR

**Step 1: Create test branch**
```bash
cd C:\git\ClinicCare
git checkout -b test/ci-workflow
```

**Step 2: Make a small change**
```bash
echo "# Testing CI/CD Workflow" >> README.md
git add README.md
git commit -m "test: verify GitHub Actions workflow"
git push origin test/ci-workflow
```

**Step 3: Open PR on GitHub**
```
1. Go to https://github.com/yourusername/ClinicCare
2. Click "Compare & pull request"
3. Create PR to main branch
4. Watch tests run
```

**Step 4: Check Results**
```
In GitHub PR:
1. Click "Checks" tab
2. Watch jobs execute (8-12 minutes)

Each job should show:
✓ backend-tests
✓ frontend-tests
✓ api-validation
✓ code-structure-validation
✓ requirements-validation
✓ test-case-count
✓ validation-summary
✓ status-check

Final Result:
✓ All checks passed
✓ PR ready to merge
```

### Interpret Test Results

**Green ✅ = Success**
```
All jobs passed
PR is ready for code review
Safe to merge
```

**Red ❌ = Failed**
```
1. Click failed job name
2. Click "Logs" to see details
3. Find error message
4. Fix locally:
   git add .
   git commit -m "fix: resolve CI issue"
   git push origin test/ci-workflow
5. Tests automatically re-run
```

---

## Testing Checklist

### Before Making a PR

```bash
# 1. Test backend locally
cd services/pharmacy
python -m pytest tests/ -v

# 2. Test frontend builds
cd frontend
npm run build

# 3. Test application runs
./start_all.sh
# Access http://localhost:4200
# Manually test key workflows
```

### When Creating PR

```
1. Push to feature branch (not main)
2. Create PR on GitHub
3. Wait 8-12 minutes for tests
4. Check results in "Checks" tab
5. If red, fix and push again
6. When green, request code review
7. Merge when approved
```

---

## Common Test Scenarios

### Scenario 1: Test Happy Path

**Goal:** Everything works correctly

```
1. Create referral
2. Submit and accept referral
3. Add medication to prescription (stock reserved)
4. Dispense medication (stock decreased further)
5. Check inventory updated
6. Check patient medications updated
7. Check dispensing history recorded

Expected: All operations succeed ✅
```

### Scenario 2: Test Error Handling

**Goal:** System handles errors gracefully

```
1. Try to prescribe more than available stock
   → Should show: "Insufficient stock" ❌
   
2. Try to add duplicate medication
   → Should show: "Already in prescription" ❌
   
3. Try to access non-existent prescription
   → Should return: 404 Not Found ❌
   
4. Try to dispense with invalid quantity
   → Should show: "Quantity must be > 0" ❌

Expected: All errors handled properly ✅
```

### Scenario 3: Test Stock Reservation

**Goal:** Stock decreases when prescribed, not just when dispensed

```
Initial: Aspirin = 50 units

1. Prescribe 20 units
   → Stock should be: 30 units
   ✓ Reserved (not yet dispensed)

2. Dispense 15 units
   → Stock should be: 15 units
   ✓ Further decreased

3. Check inventory
   → Shows: 15 units
   ✓ Accurate

Expected: Stock accurately reflects prescriptions + dispensing ✅
```

### Scenario 4: Test Low-Stock Alerts

**Goal:** Alerts appear and update correctly

```
Initial: Lisinopril = 10 units, min = 10 (IN STOCK)

1. Prescribe 5 units
   → Stock: 5 units
   → Status: LOW
   ✓ Alert appears on dashboard

2. Restock 10 units
   → Stock: 15 units
   → Status: IN STOCK
   ✓ Alert removed

Expected: Alerts accurate and real-time ✅
```

---

## Testing Tools

### Browser Developer Tools

**For Frontend Testing:**
```
1. Open http://localhost:4200
2. Press F12 (Open DevTools)
3. Console tab:
   - Check for JavaScript errors
   - Look for network warnings
   
4. Network tab:
   - Check API calls succeed
   - Look for 404 or 500 errors
   - Verify response times < 1s
   
5. Application tab:
   - Check local storage
   - Verify signals updating
```

### Swagger UI

**For API Testing:**
```
1. Open http://localhost:8006/docs
2. Use "Try it out" on each endpoint
3. Verify requests and responses
4. Check status codes (200, 400, 404, etc.)
```

### Logs

**Check Service Logs:**
```bash
# Pharmacy service logs
docker compose logs -f pharmacy-service

# Gateway logs
docker compose logs -f gateway

# Check for errors or warnings
# Look for: ERROR, WARNING, Exception
```

---

## Debugging Failed Tests

### If Backend Test Fails

```
1. Check Python version:
   python --version  # Should be 3.11+

2. Check dependencies:
   cd services/pharmacy
   pip install -r requirements.txt
   
3. Check models:
   python -c "from models import Medication"
   # Should work without errors
   
4. Run manually:
   python main.py
   # Should start without errors
```

### If Frontend Test Fails

```
1. Check Node version:
   node --version  # Should be 18+
   
2. Clean install:
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   
3. Build locally:
   npm run build
   # Check output for errors
   
4. Check TypeScript:
   npx tsc --noEmit
   # Should report no errors
```

### If API Test Fails

```
1. Check service running:
   curl http://localhost:8006/health
   
2. Check endpoint:
   curl http://localhost:8006/medications
   
3. Check logs:
   docker compose logs pharmacy-service
   
4. Verify database:
   test -f services/pharmacy/pharmacy.db
```

---

## Test Report Template

Use this to document your test results:

```markdown
# Test Report - [Date]

## Manual Testing
- [ ] Create referral - PASS / FAIL
- [ ] Submit referral - PASS / FAIL
- [ ] Accept referral - PASS / FAIL
- [ ] Prescription auto-created - PASS / FAIL
- [ ] Add medication - PASS / FAIL
- [ ] Dispense medication - PASS / FAIL
- [ ] Check inventory - PASS / FAIL
- [ ] Check low-stock alerts - PASS / FAIL

## API Testing
- [ ] GET /medications - PASS / FAIL
- [ ] POST /prescriptions - PASS / FAIL
- [ ] POST /dispense - PASS / FAIL
- [ ] GET /inventory/low-stock - PASS / FAIL

## Frontend Testing
- [ ] Dashboard loads - PASS / FAIL
- [ ] Prescription list displays - PASS / FAIL
- [ ] Dispensing form works - PASS / FAIL
- [ ] Inventory management updates - PASS / FAIL

## CI/CD Testing
- [ ] GitHub Actions workflow triggers - PASS / FAIL
- [ ] All 8 jobs pass - PASS / FAIL
- [ ] Tests run in 8-12 minutes - PASS / FAIL

## Summary
Total Tests: XX
Passed: XX
Failed: XX
Status: ✅ READY / ❌ NEEDS FIXES
```

---

## Success Criteria

### All Tests Passing

```
✅ Manual workflows complete without errors
✅ API endpoints respond correctly
✅ Frontend UI displays all data
✅ Stock tracking accurate
✅ Low-stock alerts working
✅ Dispensing updates inventory
✅ Patient medications updated
✅ Audit trails recorded
✅ CI/CD pipeline passes
✅ No console errors
```

---

## Next Steps

1. **Start Application**
   ```bash
   ./start_all.sh
   ```

2. **Run Manual Tests**
   - Follow "Complete Workflow" above
   - Test each scenario

3. **Test APIs**
   - Use Swagger UI
   - Test endpoints

4. **Test Frontend**
   - Interactive testing at localhost:4200
   - Check browser console

5. **Test CI/CD**
   - Create test PR
   - Watch GitHub Actions run
   - Verify green checkmarks

---

**Happy Testing!** 🧪🚀

