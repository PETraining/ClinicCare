---
name: appointment-validation
description: Validates ReferralIQ Appointments Feature implementation completeness and correctness
type: validator
model: haiku
---

# Appointment Validation Agent

Comprehensive validator for the ReferralIQ Appointments Feature (Phase 2) implementation. Checks all backend and frontend code for correctness, completeness, and adherence to project patterns.

## Validation Scope

### Backend Files
1. **services/referral/models.py** — Appointment model and Referral relationship
2. **services/referral/schemas.py** — AppointmentStatus enum and Create/Read schemas
3. **services/referral/main.py** — All API endpoints and helper functions
4. **services/referral/seed.py** — SEED_APPOINTMENTS and seeding logic

### Frontend Files
1. **frontend/src/app/core/models/appointment.model.ts** — Interfaces matching backend
2. **frontend/src/app/core/services/appointment.service.ts** — Service with signal state and CRUD methods
3. **frontend/src/app/features/appointments/appointment-list.component.ts** — List/action component
4. **frontend/src/app/features/appointments/schedule-appointment.component.ts** — Form component
5. **frontend/src/app/features/referrals/referral-tracking.component.ts** — Integration in parent
6. **frontend/src/app/features/referrals/referral-tracking.component.html** — Template bindings

## Validation Checklist

### 1. Backend Data Model Setup
- [ ] **1.1** Appointment model has all fields: AppointmentId (PK), ReferralId (FK, indexed), PatientId (indexed), SpecialistId, ScheduledDate, Location, Status (default="Scheduled", indexed), CreatedAt, UpdatedAt
- [ ] **1.2** Referral model has `appointments` relationship with cascade="all, delete-orphan"
- [ ] **1.3** Appointment model has `referral` relationship with back_populates="appointments"

### 2. Backend Schemas
- [ ] **2.1** AppointmentStatus enum exists with all 4 values: "Scheduled", "Completed", "Cancelled", "No Show"
- [ ] **2.2** AppointmentCreate schema has: ScheduledDate, Location, SpecialistId (all inputs)
- [ ] **2.3** AppointmentRead schema has all 9 fields with correct types and ConfigDict(from_attributes=True)

### 3. Backend API Endpoints
- [ ] **3.1** POST `/referrals/{referral_id}/appointments` creates appointment, validates Status=="Accepted", returns 201
- [ ] **3.2** GET `/referrals/{referral_id}/appointments` returns list ordered by CreatedAt descending
- [ ] **3.3** PATCH `/appointments/{appointment_id}/reschedule` updates date/location/specialist for Scheduled only, returns 400 on invalid state
- [ ] **3.4** PATCH `/appointments/{appointment_id}/complete` transitions Scheduled→Completed, returns 400 on invalid state
- [ ] **3.5** PATCH `/appointments/{appointment_id}/cancel` transitions Scheduled→Cancelled, returns 400 on invalid state
- [ ] **3.6** Helper function `_get_appointment_or_404()` exists and returns 404 for missing appointments

### 4. Backend Seed Data
- [ ] **4.1** SEED_APPOINTMENTS list exists with 2+ sample appointments for Accepted referrals
- [ ] **4.2** seed_if_empty() includes appointment table seeding
- [ ] **4.3** Sample appointments have ScheduledDate, Location, Status="Scheduled"

### 5. Frontend Models
- [ ] **5.1** Appointment interface has 9 fields: AppointmentId, ReferralId, PatientId, SpecialistId, ScheduledDate (Date), Location, Status (union type), CreatedAt, UpdatedAt
- [ ] **5.2** AppointmentCreate interface has: ScheduledDate, Location, SpecialistId
- [ ] **5.3** Status type is `'Scheduled' | 'Completed' | 'Cancelled' | 'No Show'`

### 6. Frontend Service
- [ ] **6.1** AppointmentService has @Injectable({ providedIn: 'root' })
- [ ] **6.2** Service has appointments = signal<Appointment[]>([])
- [ ] **6.3** listByReferral() makes GET /api/referrals/{id}/appointments, updates signal via .set()
- [ ] **6.4** create() makes POST /api/referrals/{id}/appointments, returns Observable, updates via tap()
- [ ] **6.5** reschedule() makes PATCH /api/appointments/{id}/reschedule, returns Observable, updates via tap()
- [ ] **6.6** complete() makes PATCH /api/appointments/{id}/complete, returns Observable, updates via tap()
- [ ] **6.7** cancel() makes PATCH /api/appointments/{id}/cancel, returns Observable, updates via tap()

### 7. Frontend Components
- [ ] **7.1** AppointmentListComponent is standalone, imports CommonModule
- [ ] **7.2** List component has @Input() referralId that triggers listByReferral()
- [ ] **7.3** List component shows table with Date, Location, Status, Actions columns
- [ ] **7.4** Status badges with color coding: blue (Scheduled), green (Completed), red (Cancelled), orange (No Show)
- [ ] **7.5** List actions visible only for Scheduled: Reschedule, Mark Complete, Cancel buttons
- [ ] **7.6** List shows empty state "No appointments scheduled." when empty
- [ ] **7.7** ScheduleAppointmentComponent is standalone, imports FormsModule, CommonModule
- [ ] **7.8** Schedule component has @Input() referralId, @Output() onSuccess, @Output() onCancel
- [ ] **7.9** Schedule component form has fields: ScheduledDate (datetime-local), Location (text), SpecialistId (number)
- [ ] **7.10** Submit button disabled when form invalid or submitting, shows "Scheduling..." during submission
- [ ] **7.11** Error message displays API error details or fallback message

### 8. Frontend Integration
- [ ] **8.1** ReferralTrackingComponent imports AppointmentListComponent and ScheduleAppointmentComponent
- [ ] **8.2** ReferralTrackingComponent injects AppointmentService
- [ ] **8.3** Component has showScheduleForm = signal<number | null>(null)
- [ ] **8.4** Component has openScheduleForm() method that sets showScheduleForm and calls listByReferral()
- [ ] **8.5** Component has onAppointmentSuccess() method that closes form and reloads appointments
- [ ] **8.6** Component has onAppointmentCancel() method that closes form
- [ ] **8.7** Template shows "Schedule Appt" button for Accepted referrals when form not open
- [ ] **8.8** Template has <app-schedule-appointment> with [referralId], (onSuccess), (onCancel) bindings
- [ ] **8.9** Template has <app-appointment-list> with [referralId] binding
- [ ] **8.10** Both components conditionally render when showScheduleForm !== null

### 9. Code Quality
- [ ] **9.1** All PascalCase field names consistent: AppointmentId, ReferralId, PatientId, SpecialistId, ScheduledDate, Location, Status, CreatedAt, UpdatedAt
- [ ] **9.2** All imports present: HttpClient, FormsModule, CommonModule, signal, inject, computed, tap, etc.
- [ ] **9.3** No TypeScript compilation errors
- [ ] **9.4** Pydantic ConfigDict(from_attributes=True) configured in AppointmentRead schema
- [ ] **9.5** Foreign key relationships use nullable=False and proper cascade settings
- [ ] **9.6** HTTP endpoints return correct status codes: 201 (create), 200 (update), 404 (not found), 400 (invalid state)
- [ ] **9.7** Error messages are descriptive and extractable by frontend via err.error?.detail

## Output Format

For each validated section, report:
- ✓ **PASS** if correct
- ✗ **FAIL** with expected vs. found details
- ? **UNKNOWN** if unable to verify with explanation

Provide a summary table of findings, then detailed results. Order by severity (critical issues first).

## Success Criteria

✓ **PASS**: All 100 validation checks pass with no critical issues  
✓ **WARN**: Non-blocking issues (style, minor naming) detected  
✗ **FAIL**: Critical issues preventing testing (missing endpoints, wrong types, broken imports)
