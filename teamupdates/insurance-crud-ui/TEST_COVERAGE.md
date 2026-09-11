# Insurance CRUD UI — Test Coverage

This document describes the unit tests for the insurance-crud-ui feature.

## Frontend Tests

### Patient Details Component (`frontend/src/app/features/patients/patient-details.component.spec.ts`)

**Scope:** Tests the insurance CRUD UI interactions, form validation, button visibility, and error handling.

**Test Groups:**
1. **Add Insurance — Button Visibility**
   - Hides "Add Insurance" button when patient has insurance
   - Shows "Add Insurance" button when patient has no insurance

2. **Add Insurance — Form Interaction**
   - `startAddInsurance()` resets form and shows it
   - `startAddInsurance()` clears previous errors
   - `submitInsurance()` calls `createInsurance()` when editing is null
   - `submitInsurance()` hides form and clears state on success
   - `submitInsurance()` sets `insuranceError` on failure
   - `cancelInsuranceForm()` hides form and clears error

3. **Edit Insurance**
   - `startEditInsurance()` populates form with record data
   - `submitInsurance()` calls `updateInsurance()` when editing is set

4. **Delete Insurance**
   - `deleteInsuranceRecord()` shows confirmation with warning message: "Are you sure? This patient will have no insurance on file."
   - `deleteInsuranceRecord()` calls `deleteInsurance()` when confirmed
   - `deleteInsuranceRecord()` does not call `deleteInsurance()` when cancelled
   - `deleteInsuranceRecord()` sets `insuranceError` on failure

5. **Template — Insurance Section**
   - Renders insurance record when it exists
   - Shows "No insurance on record" when empty
   - Renders Edit and Delete buttons for existing record
   - Shows inline form when `showInsuranceForm` is true
   - Hides inline form when `showInsuranceForm` is false
   - Displays error message when `insuranceError` is set
   - Does not display error when `insuranceError` is null
   - Submit button shows "Add Insurance" when not editing
   - Submit button shows "Save Changes" when editing
   - Submit button shows "Saving..." when submitting

6. **One Insurance Per Patient Constraint**
   - Only allows one insurance record to be displayed
   - Uses first insurance record if multiple exist

**Run Tests:**
```bash
cd frontend
npm test -- --include='**/patient-details.component.spec.ts'
```

### Patient Service (`frontend/src/app/core/services/patient.service.spec.ts`)

**Scope:** Tests the HTTP calls to the backend CRUD endpoints and signal updates.

**Test Groups:**
1. **createInsurance()**
   - POST to `/api/patients/{id}/insurance` with payload
   - Updates `selected` signal with insurance record on success

2. **updateInsurance()**
   - PUT to `/api/patients/{id}/insurance/{insuranceId}` with payload
   - Updates `selected` signal with new values on success
   - Handles full-replace semantics (nulls optional fields)

3. **deleteInsurance()**
   - DELETE to `/api/patients/{id}/insurance/{insuranceId}`
   - Removes insurance record from `selected` signal on success
   - Handles 204 No Content response

4. **Error Handling**
   - `createInsurance()` propagates 404 error
   - `updateInsurance()` propagates 404 error for stale insurance ID
   - `deleteInsurance()` propagates 404 error

**Run Tests:**
```bash
cd frontend
npm test -- --include='**/patient.service.spec.ts'
```

## Backend Tests

### Insurance CRUD Endpoints (`services/patient/tests/test_insurance_crud.py`)

**Scope:** Tests the HTTP endpoints and database operations.

**Test Groups:**
1. **Create Insurance** (existing tests)
   - `test_create_insurance_success` — POST returns 201
   - `test_create_insurance_404_when_patient_missing` — 404 for non-existent patient
   - `test_create_insurance_422_when_required_field_missing` — 422 for missing fields

2. **Read Insurance** (existing tests)
   - `test_list_insurance_scoped_to_patient` — GET returns only patient's records
   - `test_patient_detail_embeds_insurance` — GET /patients/{id} includes insurance

3. **Update Insurance** (existing tests)
   - `test_update_insurance_changes_fields` — PUT updates all fields
   - `test_update_insurance_omitted_optional_field_is_cleared` — PUT nulls optional fields (full-replace semantics)
   - `test_update_insurance_404_when_insurance_not_for_that_patient` — 404 for mismatched patient/insurance

4. **Delete Insurance** (existing tests)
   - `test_delete_insurance_removes_record` — DELETE removes record
   - `test_delete_insurance_404_when_already_gone` — 404 for non-existent record

5. **One Insurance Per Patient Constraint — Frontend Only** (new tests)
   - `test_create_multiple_insurance_per_patient_allowed_backend` — Backend allows multiple insurances per patient (constraint is frontend-only)
   - `test_patient_detail_returns_all_insurance_records` — GET /patients/{id} returns all insurance records if multiple exist

**Run Tests:**
```bash
cd services/patient
pytest tests/test_insurance_crud.py -v
```

Or run all patient service tests:
```bash
cd services/patient
pytest tests/ -v
```

## Coverage Summary

| Component | Test File | Test Count | Coverage |
|-----------|-----------|-----------|----------|
| patient-details.component | patient-details.component.spec.ts | 26 | Button visibility, form interactions, add/edit/delete workflows, template rendering, one-insurance constraint |
| PatientService | patient.service.spec.ts | 13 | HTTP calls, signal updates, error handling, full-replace semantics |
| Backend CRUD | test_insurance_crud.py | 14 | Create, read, update, delete, validation, 404 errors, multiple insurances allowed |
| **Total** | — | **53** | End-to-end coverage of add, edit, delete workflows + constraint enforcement |

## Key Test Scenarios

### Frontend-Only One-Insurance-Per-Patient Constraint
- The backend allows multiple insurances per patient (tests verify this)
- The frontend hides the "Add Insurance" button when one exists
- The frontend displays only the first insurance record if multiple exist
- This constraint is enforced by template logic and component state, not by the backend

### Full-Replace Update Semantics
- The `InsuranceUpdate` schema is identical to `InsuranceCreate` (no partial patches)
- If a form submits without an optional field, it is nulled out on the server
- Tests verify this behavior and ensure the frontend always submits all fields

### Error Handling
- 404 errors (patient/insurance not found) are surfaced to the user in the form
- 422 errors (validation failures) are caught by backend validation
- Tests verify error messages are propagated to the UI

## Running All Tests

**Frontend:**
```bash
cd frontend
npm test
```

**Backend:**
```bash
cd services/patient
pytest tests/ -v
```

**Both:**
```bash
./test_all.sh  # if this script exists
# Or manually run both commands above
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Ensure:
1. Angular test runner is configured (Karma + Jasmine)
2. Python test runner is configured (pytest)
3. Both are included in your CI/CD pipeline before merging

## Known Constraints & Design Decisions

1. **One insurance per patient is frontend-only** — the backend does not enforce this, only the UI does
2. **Full-replace update semantics** — the edit form must submit all 6 fields, or optional fields will be nulled
3. **Native `confirm()` for delete** — no custom dialog component is used
4. **In-place signal mutation for refresh** — after create/update/delete, the `selected` signal's insurance array is updated in-place, not fully reloaded
