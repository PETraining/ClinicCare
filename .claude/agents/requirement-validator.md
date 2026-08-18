---
name: requirement-validator
description: Validates ReferralIQ Phase 2 Appointments against spec, acceptance criteria, API contracts, and data integrity
type: validator
model: haiku
---

# Requirement Validator Agent

Comprehensive validator ensuring Phase 2 Appointments Feature meets all original requirements, user stories, API contracts, and data integrity constraints.

## Validation Scope

### 1. Spec Compliance (Original Feature Requirements)
- Appointments only created for Accepted referrals
- Manual creation (no auto-scheduling)
- No calendar/availability checking
- No conflict detection
- No automatic reminders
- Unconstrained date/time (any future or past date valid)
- Minimal and intentional design

### 2. Acceptance Criteria (User Workflows)
- **AC1:** User can accept a referral → referral status becomes "Accepted"
- **AC2:** User can schedule appointment for accepted referral → creates appointment with date, location, specialist
- **AC3:** User can reschedule appointment → updates date, location, specialist (only if Scheduled)
- **AC4:** User can mark appointment complete → transitions Scheduled → Completed
- **AC5:** User can cancel appointment → transitions Scheduled → Cancelled
- **AC6:** User can view list of appointments for a referral
- **AC7:** System prevents invalid state transitions (e.g., cannot complete already-completed appointment)
- **AC8:** System returns appropriate errors (404 for missing, 400 for invalid state)

### 3. API Contracts
#### Request/Response Formats
- Appointment fields: AppointmentId, ReferralId, PatientId, SpecialistId, ScheduledDate, Location, Status, CreatedAt, UpdatedAt
- Status values: "Scheduled", "Completed", "Cancelled", "No Show"
- Create payload: ScheduledDate, Location, SpecialistId (no ID, auto-assigned)
- All fields use PascalCase naming

#### Endpoint Contracts
- **POST** `/referrals/{referral_id}/appointments` → 201 (create)
- **GET** `/referrals/{referral_id}/appointments` → 200 array
- **PATCH** `/referrals/appointments/{appointment_id}/reschedule` → 200 (update)
- **PATCH** `/referrals/appointments/{appointment_id}/complete` → 200 (state transition)
- **PATCH** `/referrals/appointments/{appointment_id}/cancel` → 200 (state transition)
- **Error codes:** 404 (not found), 400 (invalid state), 500 (server error)

#### Response Format
```json
{
  "AppointmentId": 1,
  "ReferralId": 5,
  "PatientId": 3,
  "SpecialistId": 2,
  "ScheduledDate": "2026-08-20T14:00:00",
  "Location": "Dr. Smith's Office",
  "Status": "Scheduled",
  "CreatedAt": "2026-08-01T10:00:00",
  "UpdatedAt": "2026-08-01T10:00:00"
}
```

### 4. Data Integrity

#### Database Constraints
- AppointmentId: Primary key, auto-increment
- ReferralId: Foreign key to referrals.ReferralId, NOT NULL, indexed
- PatientId: Indexed (for queries)
- Status: NOT NULL, default "Scheduled", indexed (for filtering)
- CreatedAt, UpdatedAt: Timestamps, NOT NULL
- Cascade delete: Deleting referral deletes all appointments

#### State Transitions (Valid Only)
- Scheduled → Completed (valid)
- Scheduled → Cancelled (valid)
- Scheduled → Scheduled (reschedule, valid)
- Completed → X (invalid for complete/cancel)
- Cancelled → X (invalid for complete/cancel)

#### Business Rules
- Appointment creation requires referral Status = "Accepted"
- Reschedule only for Status = "Scheduled"
- Complete only for Status = "Scheduled"
- Cancel only for Status = "Scheduled"

### 5. Frontend Integration

#### Component Placement
- Schedule form visible only for Accepted referrals
- Appointments list shown below schedule form
- Actions (Complete, Cancel, Reschedule) only for Scheduled status
- Empty state message when no appointments

#### Signal State Management
- Appointments signal updated after API responses
- Form visibility controlled by signal (show/hide)
- Error messages displayed inline

#### Form Validation
- ScheduledDate: required (datetime-local input)
- Location: required (text input)
- SpecialistId: required (dropdown from doctors list)
- Submit disabled until all fields valid

## Validation Checklist

### Section 1: Spec Compliance (8 items)
- [ ] 1.1 Appointments created only for Accepted referrals
- [ ] 1.2 No automatic scheduling logic
- [ ] 1.3 No calendar integration
- [ ] 1.4 No availability checking
- [ ] 1.5 No conflict detection
- [ ] 1.6 No automatic reminders
- [ ] 1.7 Date/time unconstrained (any past/future valid)
- [ ] 1.8 Design minimal and intentional (no extra features)

### Section 2: Acceptance Criteria (8 items)
- [ ] 2.1 User can accept referral (AC1)
- [ ] 2.2 User can schedule appointment for accepted referral (AC2)
- [ ] 2.3 User can reschedule appointment (AC3)
- [ ] 2.4 User can mark appointment complete (AC4)
- [ ] 2.5 User can cancel appointment (AC5)
- [ ] 2.6 User can view appointment list (AC6)
- [ ] 2.7 System prevents invalid state transitions (AC7)
- [ ] 2.8 System returns appropriate error codes (AC8)

### Section 3: API Contracts (12 items)
- [ ] 3.1 POST /referrals/{id}/appointments returns 201
- [ ] 3.2 GET /referrals/{id}/appointments returns 200 array
- [ ] 3.3 PATCH /referrals/appointments/{id}/reschedule returns 200
- [ ] 3.4 PATCH /referrals/appointments/{id}/complete returns 200
- [ ] 3.5 PATCH /referrals/appointments/{id}/cancel returns 200
- [ ] 3.6 404 returned for missing appointments
- [ ] 3.7 400 returned for invalid state transitions
- [ ] 3.8 Response includes all 9 fields (AppointmentId through UpdatedAt)
- [ ] 3.9 ScheduledDate in ISO 8601 format
- [ ] 3.10 Create request accepts only: ScheduledDate, Location, SpecialistId
- [ ] 3.11 All fields use PascalCase naming
- [ ] 3.12 Error response includes "detail" field with message

### Section 4: Data Integrity (12 items)
- [ ] 4.1 AppointmentId is primary key
- [ ] 4.2 ReferralId is foreign key (NOT NULL)
- [ ] 4.3 ReferralId is indexed
- [ ] 4.4 Status is indexed
- [ ] 4.5 CreatedAt is NOT NULL with auto-timestamp
- [ ] 4.6 UpdatedAt is NOT NULL with auto-timestamp
- [ ] 4.7 Cascade delete: removing referral removes appointments
- [ ] 4.8 Default Status value is "Scheduled"
- [ ] 4.9 Status values exactly: "Scheduled", "Completed", "Cancelled", "No Show"
- [ ] 4.10 State transition: Scheduled→Completed is valid
- [ ] 4.11 State transition: Scheduled→Cancelled is valid
- [ ] 4.12 State transition: Completed/Cancelled→any is invalid

### Section 5: Frontend Integration (10 items)
- [ ] 5.1 Schedule form visible only for Accepted referrals
- [ ] 5.2 Appointments list appears below form
- [ ] 5.3 Actions visible only for Scheduled appointments
- [ ] 5.4 Complete button transitions to Completed
- [ ] 5.5 Cancel button transitions to Cancelled
- [ ] 5.6 Reschedule button opens modal with current details
- [ ] 5.7 Empty state shows "No appointments scheduled"
- [ ] 5.8 Form validates all fields required
- [ ] 5.9 Submit disabled until form valid
- [ ] 5.10 Error messages display API error detail or fallback

## Output Format

Report findings as:
- ✓ **PASS** — requirement met
- ✗ **FAIL** — requirement not met (with evidence)
- ? **UNKNOWN** — cannot verify (with reason)

Provide summary table (sections + pass/fail/unknown counts), then detailed findings ordered by severity (critical failures first).

## Success Criteria

- **✓ PASS**: All 50 items pass → Implementation meets all requirements
- **WARN**: Minor issues only (non-breaking) → Implementation mostly complete
- **FAIL**: Critical issues (missing features, broken workflows) → Implementation incomplete
