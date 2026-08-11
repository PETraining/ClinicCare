# Validation Reference Guide
## Insurance Eligibility & Prior Authorization Feature

This guide maps feature requirements to implementation files and validation points.

---

## Phase 1: Backend Foundation (Week 1)

### 1. Patient Service - Insurance Data Model

**Requirement**: Store insurance information with patient records

**Files to Check**:
- `services/patient/models.py` - Insurance ORM class definition
- `services/patient/db.py` - Database initialization

**Validation Checklist**:
- [ ] Class `Insurance` exists
- [ ] Fields present: `insurance_id` (PK), `patient_id` (FK), `insurer_name`, `policy_number`, `group_number`, `member_id`, `effective_date`, `termination_date`
- [ ] `patient_id` is a foreign key to `Patient` table
- [ ] Cascade delete configured on patient deletion
- [ ] Relationship `Patient.insurance` is one-to-many
- [ ] Table created on app startup (via SQLAlchemy metadata.create_all)

**Test Command**:
```bash
curl -X GET http://localhost:8000/api/patients/1/insurance
```

**Expected Response** (200 OK):
```json
[
  {
    "insuranceId": 1,
    "patientId": 1,
    "insurerName": "Blue Cross",
    "policyNumber": "BC-123456",
    "groupNumber": "GRP789",
    "memberId": "MEM001",
    "effectiveDate": "2024-01-01",
    "terminationDate": null
  }
]
```

---

### 2. Patient Service - Insurance Endpoints

**Requirement**: CRUD endpoints for insurance records

**Files to Check**:
- `services/patient/main.py` - Route handlers
- `services/patient/schemas.py` - Request/response validation

**Validation Checklist**:
- [ ] Endpoint: `POST /patients/{patient_id}/insurance`
  - Accepts: InsuranceCreate schema (insurer_name, policy_number, etc.)
  - Returns: 201 Created with InsuranceResponse
  - Creates record in database
  
- [ ] Endpoint: `GET /patients/{patient_id}/insurance`
  - Returns: 200 OK with list of InsuranceResponse objects
  - Filters by patient_id
  - Empty list if no insurance records
  
- [ ] Endpoint: `GET /patients/{patient_id}/insurance/{insurance_id}`
  - Returns: 200 OK with single InsuranceResponse
  - Returns: 404 Not Found if insurance doesn't exist
  
- [ ] Endpoint: `PUT /patients/{patient_id}/insurance/{insurance_id}`
  - Accepts: InsuranceUpdate schema
  - Returns: 200 OK with updated InsuranceResponse
  - Validates date ordering (effective_date < termination_date)
  
- [ ] Endpoint: `DELETE /patients/{patient_id}/insurance/{insurance_id}`
  - Returns: 204 No Content on success
  - Returns: 404 Not Found if insurance doesn't exist
  
- [ ] All schemas defined in `schemas.py`
- [ ] Input validation on dates, required fields
- [ ] Proper error messages (400, 404, 500)

**Test Commands**:
```bash
# Create insurance
curl -X POST http://localhost:8000/api/patients/1/insurance \
  -H "Content-Type: application/json" \
  -d '{
    "insurerName": "Aetna",
    "policyNumber": "ATN-999",
    "groupNumber": "GRP001",
    "memberId": "MEM123",
    "effectiveDate": "2025-01-01",
    "terminationDate": null
  }'

# Get all insurance for patient
curl -X GET http://localhost:8000/api/patients/1/insurance

# Update insurance
curl -X PUT http://localhost:8000/api/patients/1/insurance/1 \
  -H "Content-Type: application/json" \
  -d '{"terminationDate": "2026-12-31"}'

# Delete insurance
curl -X DELETE http://localhost:8000/api/patients/1/insurance/1
```

---

### 3. Referral Service - Authorization Model

**Requirement**: Track authorization status with 4 states

**Files to Check**:
- `services/referral/models.py` - Authorization ORM class
- `services/referral/db.py` - Database initialization

**Validation Checklist**:
- [ ] Class `Authorization` exists
- [ ] Fields present: `authorization_id` (PK), `referral_id` (FK, UNIQUE), `status`, `requested_date`, `decision_date`, `decision_notes`, `created_at`, `updated_at`
- [ ] `status` field is enum with exactly 4 values:
  - "Not Required"
  - "Pending"
  - "Approved"
  - "Denied"
- [ ] `referral_id` is foreign key to `Referral` table with cascade delete
- [ ] `created_at` and `updated_at` are automatic timestamps
- [ ] `requested_date` and `decision_date` are nullable
- [ ] `decision_notes` is nullable text field
- [ ] Relationship `Referral.authorization` is one-to-one
- [ ] Table created on app startup

**Test Command**:
```bash
curl -X GET http://localhost:8000/api/referrals/1/authorization
```

**Expected Response** (200 OK):
```json
{
  "authorizationId": 1,
  "referralId": 1,
  "status": "Pending",
  "requestedDate": "2026-08-11",
  "decisionDate": null,
  "decisionNotes": null,
  "createdAt": "2026-08-11T10:30:00Z",
  "updatedAt": "2026-08-11T10:30:00Z"
}
```

---

### 4. Referral Service - Authorization Endpoints

**Requirement**: CRUD endpoints for authorization tracking

**Files to Check**:
- `services/referral/main.py` - Route handlers
- `services/referral/schemas.py` - Request/response validation

**Validation Checklist**:
- [ ] Endpoint: `POST /referrals/{referral_id}/authorization`
  - Accepts: AuthorizationCreate schema (status, requested_date, decision_notes)
  - Returns: 201 Created with AuthorizationResponse
  - Creates or updates authorization record
  
- [ ] Endpoint: `GET /referrals/{referral_id}/authorization`
  - Returns: 200 OK with AuthorizationResponse
  - Returns: 404 Not Found if no authorization
  
- [ ] Endpoint: `PUT /referrals/{referral_id}/authorization`
  - Accepts: AuthorizationUpdate schema (status, decision_date, decision_notes)
  - Returns: 200 OK with updated AuthorizationResponse
  - Validates status is one of 4 valid values
  - If status changes to "Approved" or "Denied", set decision_date to now
  
- [ ] Schemas validate:
  - Status is one of: "Not Required", "Pending", "Approved", "Denied"
  - decision_date only set when status is "Approved" or "Denied"
  - decision_notes optional but recommended for "Denied"
  
- [ ] Error handling:
  - 400 Bad Request for invalid status
  - 404 Not Found if referral doesn't exist
  - 422 Unprocessable Entity for validation errors

**Test Commands**:
```bash
# Create authorization request (status: Pending)
curl -X POST http://localhost:8000/api/referrals/1/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Pending",
    "requestedDate": "2026-08-11",
    "decisionNotes": null
  }'

# Get authorization status
curl -X GET http://localhost:8000/api/referrals/1/authorization

# Update to Approved
curl -X PUT http://localhost:8000/api/referrals/1/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "decisionDate": "2026-08-12",
    "decisionNotes": "Auto-approved for specialty referral"
  }'

# Update to Denied
curl -X PUT http://localhost:8000/api/referrals/1/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Denied",
    "decisionDate": "2026-08-12",
    "decisionNotes": "Prior authorization not covered for this procedure"
  }'
```

---

### 5. API Gateway Routes

**Requirement**: Route insurance and authorization requests to services

**Files to Check**:
- `services/api-gateway/main.py` - Proxy routes

**Validation Checklist**:
- [ ] Route configured: `/api/patients/{patient_id}/insurance*` → Patient Service (8001)
- [ ] Route configured: `/api/referrals/{referral_id}/authorization*` → Referral Service (8003)
- [ ] CORS headers properly forwarded
- [ ] Hop-by-hop headers removed (Connection, Keep-Alive, Transfer-Encoding, etc.)
- [ ] Response status codes preserved
- [ ] Error responses from services passed through correctly

**Test Command**:
```bash
# Test gateway routes insurance to patient service
curl -X GET http://localhost:8000/api/patients/1/insurance -v

# Test gateway routes authorization to referral service
curl -X GET http://localhost:8000/api/referrals/1/authorization -v
```

---

## Phase 2: Frontend & Integration (Week 2)

### 6. Frontend - Patient Details Component

**Requirement**: Display insurance information on patient details page

**Files to Check**:
- `frontend/src/app/features/patients/patient-details.component.ts`
- `frontend/src/app/features/patients/patient-details.component.html`

**Validation Checklist**:
- [ ] Component fetches insurance list via HTTP service
- [ ] Insurance displayed in list format with columns:
  - Insurer Name
  - Policy Number
  - Member ID
  - Effective Date
  - Termination Date (if present)
  - Status (Active/Inactive based on termination date)
  
- [ ] Action buttons for Add/Edit/Delete insurance
- [ ] Add insurance modal/form with fields:
  - Insurer Name (required)
  - Policy Number (required)
  - Group Number (optional)
  - Member ID (required)
  - Effective Date (required)
  - Termination Date (optional)
  
- [ ] Edit insurance pre-populates existing values
- [ ] Delete insurance with confirmation dialog
- [ ] Error handling displays user-friendly messages
- [ ] Loading state shown while fetching insurance
- [ ] Empty state message if no insurance records

**Test Steps** (Manual):
1. Navigate to patient details page
2. Verify insurance section is visible
3. Click "Add Insurance" → form opens
4. Fill in insurance details → submit
5. Verify new insurance appears in list
6. Click Edit on insurance → pre-populated form opens
7. Modify fields → submit
8. Verify changes reflected in list
9. Click Delete on insurance → confirmation shown
10. Confirm delete → insurance removed from list

---

### 7. Frontend - Referral Creation Component

**Requirement**: Block referral creation if authorization is Denied

**Files to Check**:
- `frontend/src/app/features/referrals/referral-creation.component.ts`
- `frontend/src/app/features/referrals/referral-creation.component.html`

**Validation Checklist**:
- [ ] Before submitting referral, check authorization status via API
- [ ] Display authorization status badge with icon:
  - ✓ Approved (green)
  - ⏳ Pending (yellow)
  - ✗ Denied (red)
  - \- Not Required (gray)
  
- [ ] If status is "Denied":
  - Submit button is disabled
  - Message explains why: "Cannot create referral. Insurance authorization has been denied. Please contact insurance provider or choose alternative care provider."
  
- [ ] If status is "Pending":
  - Warning message shows: "Insurance authorization is still pending. You may proceed, but claim may be denied if not approved."
  - Submit button enabled (user can proceed at their own risk)
  
- [ ] If status is "Approved" or "Not Required":
  - No warning
  - Submit button enabled
  
- [ ] If no authorization record exists:
  - Check with patient service if insurance exists
  - If insurance exists, allow proceeding with message: "No prior authorization required for this specialty"
  - If no insurance, warn: "No insurance on file. Verify patient details before proceeding"
  
- [ ] Loading state while fetching authorization status

**Test Steps** (Manual):
1. Create referral form with patient with:
   - Insurance + Approved authorization → Submit should work
   - Insurance + Pending authorization → Submit with warning
   - Insurance + Denied authorization → Submit button disabled
   - No insurance → Warning message shown
2. Verify each state shows correct badge color and message
3. Verify only Denied state blocks submission

---

### 8. Frontend - Referral Tracking Component

**Requirement**: Show authorization status and disable Accept if authorization problematic

**Files to Check**:
- `frontend/src/app/features/referrals/referral-tracking.component.ts`
- `frontend/src/app/features/referrals/referral-tracking.component.html`

**Validation Checklist**:
- [ ] Authorization status badge displayed next to each referral
- [ ] Badge styling:
  - ✓ Approved (green, checkmark)
  - ⏳ Pending (yellow, hourglass)
  - ✗ Denied (red, X)
  - \- Not Required (gray, dash)
  
- [ ] Accept action button has guard:
  - Disabled if authorization status is "Pending" or "Denied"
  - Disabled button shows tooltip explaining why
  
- [ ] Filter/sort by authorization status available
- [ ] "Accept" button only shown and enabled when:
  - Referral is in "Submitted" status AND
  - Authorization is "Approved", "Not Required", or no authorization on record
  
- [ ] List view shows authorization status in table column
- [ ] Referral detail view shows full authorization info:
  - Status
  - Requested Date
  - Decision Date
  - Decision Notes

**Test Steps** (Manual):
1. View referral list with mixed authorization statuses
2. Verify all 4 status badges display correctly
3. Try to click Accept on:
   - Referral with Approved auth → should work
   - Referral with Pending auth → button disabled with tooltip
   - Referral with Denied auth → button disabled with tooltip
4. Click on referral to open detail view
5. Verify authorization info section shows:
   - Status
   - Dates
   - Notes (if any)

---

### 9. Notification Service Integration

**Requirement**: Emit events when authorization status changes

**Files to Check**:
- `services/notification/main.py`
- `services/notification/models.py` (if applicable)

**Validation Checklist**:
- [ ] Event type "authorization_status_changed" defined
- [ ] Event emitted when authorization status updated via PUT endpoint
- [ ] Event contains:
  - `event_type`: "authorization_status_changed"
  - `referral_id`: ID of affected referral
  - `old_status`: Previous status
  - `new_status`: New status
  - `timestamp`: When change occurred
  - `changed_by`: User/system making change (if tracked)
  
- [ ] Event logged in notification/event store
- [ ] Event can be subscribed to by frontend (via WebSocket or polling)
- [ ] Frontend receives and updates UI when event received

**Test Command**:
```bash
# Update authorization (which should trigger event)
curl -X PUT http://localhost:8000/api/referrals/1/authorization \
  -H "Content-Type: application/json" \
  -d '{"status": "Approved", "decisionDate": "2026-08-12"}'

# Check notification service logs
docker compose logs notification
```

**Expected Log Output**:
```
[2026-08-12 10:30:45] Event: authorization_status_changed
  referral_id: 1
  old_status: Pending
  new_status: Approved
  timestamp: 2026-08-12T10:30:45Z
```

---

## Integration Test Scenarios

### Scenario 1: Happy Path (Authorization Approved)
1. Create patient with insurance information
2. Create referral with that patient
3. Create authorization request (status: Pending)
4. Update authorization to Approved
5. Staff creates specialist appointment (referral acceptance)
6. **Expected**: Everything succeeds without warnings

### Scenario 2: Authorization Denied
1. Create patient with insurance information
2. Create referral
3. Create authorization request (status: Pending)
4. Update authorization to Denied with notes
5. Staff tries to create specialist appointment
6. **Expected**: Referral creation blocked with error message

### Scenario 3: Authorization Pending (Staff Override)
1. Create patient with insurance information
2. Create referral
3. Create authorization request (status: Pending)
4. Staff creates appointment despite pending status
5. Later, authorization approved
6. **Expected**: Appointment proceeds normally; no claim issues

### Scenario 4: No Authorization Required
1. Create patient with insurance information
2. Create referral
3. Create authorization with status: "Not Required"
4. Staff creates specialist appointment
5. **Expected**: Appointment proceeds without warnings

---

## Quick Reference: Validation Commands

```bash
# Test Patient Service Insurance Endpoints
curl -X GET http://localhost:8000/api/patients/1/insurance
curl -X POST http://localhost:8000/api/patients/1/insurance -H "Content-Type: application/json" -d '{...}'
curl -X PUT http://localhost:8000/api/patients/1/insurance/1 -H "Content-Type: application/json" -d '{...}'
curl -X DELETE http://localhost:8000/api/patients/1/insurance/1

# Test Referral Service Authorization Endpoints
curl -X GET http://localhost:8000/api/referrals/1/authorization
curl -X POST http://localhost:8000/api/referrals/1/authorization -H "Content-Type: application/json" -d '{...}'
curl -X PUT http://localhost:8000/api/referrals/1/authorization -H "Content-Type: application/json" -d '{...}'

# Check database schemas (from container)
docker compose exec patient-service sqlite3 /app/patient.db ".schema insurance"
docker compose exec referral-service sqlite3 /app/referral.db ".schema authorizations"

# View service logs
docker compose logs -f patient-service
docker compose logs -f referral-service
docker compose logs -f notification-service

# Frontend verification (manual browser testing)
# 1. http://localhost:4200/patients/1 → check insurance display
# 2. http://localhost:4200/referrals/create → check authorization blocking
# 3. http://localhost:4200/referrals → check tracking status badges
```

---

**Last Updated**: 2026-08-11  
**Purpose**: Provide step-by-step validation procedures for Insurance Eligibility feature  
**Scope**: ClinicCare microservices + Angular frontend
