# Appointment Scheduling — Intent

## Purpose

Enables clinical teams to schedule and track patient visits within the platform, linking appointments to accepted referrals so visits are captured in-system instead of tracked via phone and email.

## ADDED Requirements

### Requirement: Create appointment for accepted referral

The system SHALL allow users to create an appointment linked to an accepted referral. An appointment can only be created if the referenced referral exists and has Accepted status.

#### Scenario: Successful appointment creation
- **WHEN** user submits appointment creation request with ReferralId, ScheduledDate, Location, and SpecialistId for a referral in Accepted status
- **THEN** system creates the appointment, assigns initial status Scheduled, records CreatedAt timestamp, and returns appointment details with AppointmentId

#### Scenario: Reject creation for non-existent referral
- **WHEN** user attempts to create appointment with non-existent ReferralId
- **THEN** system returns 404 error

#### Scenario: Reject creation for non-Accepted referral
- **WHEN** user attempts to create appointment for referral with status Draft, Submitted, Rejected, or Completed
- **THEN** system returns 400 error with message "Appointment can only be created for Accepted referrals"

### Requirement: List appointments for a referral

The system SHALL return all appointments linked to a referral, in reverse chronological order by CreatedAt (newest first).

#### Scenario: Retrieve appointments
- **WHEN** user requests appointments for a given ReferralId
- **THEN** system returns list of appointment records, each with AppointmentId, ReferralId, ScheduledDate, Location, SpecialistId, Status, and CreatedAt

#### Scenario: Empty list for referral with no appointments
- **WHEN** user requests appointments for referral with no scheduled appointments
- **THEN** system returns empty list (not an error)

### Requirement: Reschedule appointment

The system SHALL allow users to update the ScheduledDate, Location, and SpecialistId of a Scheduled appointment before completion or cancellation.

#### Scenario: Successful reschedule
- **WHEN** user submits reschedule request with AppointmentId, new ScheduledDate, Location, SpecialistId for appointment in Scheduled status
- **THEN** system updates the appointment, records UpdatedAt timestamp, and returns updated appointment details

#### Scenario: Reject reschedule for completed appointment
- **WHEN** user attempts to reschedule appointment with status Completed
- **THEN** system returns 400 error with message "Cannot reschedule completed appointment"

#### Scenario: Reject reschedule for cancelled appointment
- **WHEN** user attempts to reschedule appointment with status Cancelled
- **THEN** system returns 400 error with message "Cannot reschedule cancelled appointment"

#### Scenario: Reject reschedule for non-existent appointment
- **WHEN** user attempts to reschedule non-existent AppointmentId
- **THEN** system returns 404 error

### Requirement: Cancel appointment

The system SHALL allow users to cancel a Scheduled appointment, transitioning it to Cancelled status.

#### Scenario: Successful cancellation
- **WHEN** user submits cancel request for appointment in Scheduled status
- **THEN** system sets status to Cancelled, records UpdatedAt timestamp, and returns updated appointment details

#### Scenario: Reject cancellation of completed appointment
- **WHEN** user attempts to cancel appointment with status Completed
- **THEN** system returns 400 error with message "Cannot cancel completed appointment"

#### Scenario: Reject cancellation of already-cancelled appointment
- **WHEN** user attempts to cancel appointment already in Cancelled status
- **THEN** system returns 400 error with message "Appointment is already cancelled"

### Requirement: Mark appointment as completed

The system SHALL allow users to mark a Scheduled appointment as Completed, recording completion without modifying the original scheduled details.

#### Scenario: Successful completion
- **WHEN** user submits completion request for appointment in Scheduled status
- **THEN** system sets status to Completed, records UpdatedAt timestamp, and returns updated appointment details

#### Scenario: Reject completion of cancelled appointment
- **WHEN** user attempts to complete appointment with status Cancelled
- **THEN** system returns 400 error with message "Cannot complete cancelled appointment"

### Requirement: Track appointment status

The system SHALL maintain appointment status as one of: Scheduled, Completed, Cancelled, or No Show.

#### Scenario: Status field is queryable
- **WHEN** user retrieves an appointment
- **THEN** system returns Status field with one of the four allowed values

#### Scenario: No Show status can be set by admin
- **WHEN** administrative user sets appointment status to No Show
- **THEN** system accepts the status change and records UpdatedAt timestamp

### Requirement: Appointment data model

Each appointment SHALL contain:
- **AppointmentId** (unique identifier)
- **ReferralId** (foreign key to referral)
- **PatientId** (denormalized from referral for query efficiency)
- **SpecialistId** (assigned specialist doctor)
- **ScheduledDate** (date and time of the visit)
- **Location** (physical location of the visit)
- **Status** (one of Scheduled, Completed, Cancelled, No Show)
- **CreatedAt** (timestamp when appointment was created)
- **UpdatedAt** (timestamp when appointment was last modified)

#### Scenario: Appointment persists with all fields
- **WHEN** appointment is created and retrieved
- **THEN** all fields are returned unchanged from what was submitted

### Requirement: Appointments visible on referral and patient screens

The system SHALL display created appointments on the Referral Tracking and Patient Details screens, showing status and allowing inline actions to reschedule, mark complete, or cancel.

#### Scenario: Appointments display on Referral Tracking
- **WHEN** user views a referral in Referral Tracking screen
- **THEN** system displays list of linked appointments below referral details with columns for ScheduledDate, Location, SpecialistName, Status, and Actions

#### Scenario: Schedule Appointment button available for Accepted referrals
- **WHEN** user views a referral in Accepted status
- **THEN** system displays "Schedule Appointment" button that opens appointment creation form

#### Scenario: Actions available for Scheduled appointments
- **WHEN** user views a Scheduled appointment
- **THEN** system displays "Reschedule", "Mark Complete", and "Cancel" actions

## Context

ReferralIQ currently uses a microservices architecture with a Referral Service managing referral lifecycle. The system includes an API Gateway routing frontend requests to backend services, each with its own SQLAlchemy ORM database and Pydantic schemas.

Referrals currently end at Accepted status with no defined next step, causing accepted referrals to drop out of the system for visibility and scheduling. Appointments need to be added as a new capability within the existing Referral Service (not as a new microservice) to maintain data locality and simplify the referral-appointment relationship.

See proposal.md for motivation and requirements from the spec documents.

## Goals / Non-Goals

**Goals:**
- Add appointment scheduling as a first-class feature within the Referral Service
- Allow clinical teams to schedule visits immediately after referral acceptance
- Track appointment status (Scheduled, Completed, Cancelled, No Show) within the platform
- Support rescheduling and cancellation of scheduled appointments
- Display appointments on referral and patient detail screens
- Maintain data consistency between referrals and appointments (appointments can only exist for accepted referrals)

**Non-Goals:**
- Calendar integration (Google Calendar, Outlook, etc.)
- Automated reminders or notifications (could be added later; Notification Service exists separately)
- Doctor availability checking or double-booking prevention
- Recurring or recurring-template appointments
- Real-time appointment conflict detection
- SMS/email appointment notifications (out of scope for Phase 2)

## Decisions

### 1. Appointments live in Referral Service, not as a new service

**Decision**: Add Appointment model, schemas, and endpoints to the existing Referral Service. Do not create a new microservice.

**Rationale**:
- Appointments are tightly coupled to referrals—every appointment needs a referral context
- Queries and updates often involve both referrals and appointments together
- Keeping them in one service avoids inter-service calls and distributed transaction complexity
- The Referral Service is already managing reference data (doctors, patients); appointments fit naturally

**Alternatives considered**:
- Create a dedicated Appointment Service—rejected because it would require upstream calls to validate referral state and add network latency for common operations
- Store appointments in a separate database but same service—unnecessary complexity; one database per service is the established pattern

### 2. Appointment model with denormalized PatientId

**Decision**: Appointment table includes AppointmentId, ReferralId (FK), PatientId, SpecialistId, ScheduledDate, Location, Status, CreatedAt, UpdatedAt.

**Rationale**:
- PatientId is denormalized from the referral for query efficiency (avoid join to fetch patient-level appointment lists)
- ScheduledDate and Location are plain datetime/string fields with no validation (minimalist design per spec)
- Status is stored as string (not enum in database) to allow admin flexibility for No Show transitions
- UpdatedAt tracks rescheduling and status changes

**Alternatives considered**:
- Store Status as a database enum—rejected to allow admin to manually set No Show status without code changes
- Normalize PatientId by always joining through Referral—rejected because common UI queries (e.g., "show all appointments for this patient") would require join on every lookup

### 3. API endpoints follow Referral Service patterns

**Decision**:
- POST `/referrals/{referralId}/appointments` — create
- GET `/referrals/{referralId}/appointments` — list
- PATCH `/appointments/{appointmentId}/reschedule` — reschedule (update date/location/specialist)
- PATCH `/appointments/{appointmentId}/complete` — mark completed
- PATCH `/appointments/{appointmentId}/cancel` — mark cancelled

**Rationale**:
- Nesting create/list under /referrals/{referralId} makes the referral context explicit and enforces the referral validation at the HTTP level
- State transitions (complete, cancel) use separate PATCH endpoints rather than a generic PATCH with a body state field, matching Referral Service patterns (e.g., `/referrals/{id}/accept`, `/referrals/{id}/reject`)
- Reschedule as a separate endpoint rather than generic PATCH makes the intent clear and allows specific validation

**Alternatives considered**:
- Generic PATCH `/appointments/{id}` with request body state field—rejected to match existing Referral Service patterns and make intent explicit
- PUT for reschedule—rejected because only some fields change (date/location/specialist); PATCH is more appropriate

### 4. Validation: Appointments only for Accepted referrals

**Decision**: `create_appointment` endpoint checks that referral exists and `referral.Status == "Accepted"` before creating the appointment. Return 404 if referral not found, 400 if not Accepted.

**Rationale**:
- Enforces the semantic constraint that only accepted referrals can have appointments scheduled
- Prevents orphaned appointments for draft or rejected referrals
- Validation at the service layer ensures consistency

**Alternatives considered**:
- Database foreign key constraint only—rejected because HTTP errors are more informative to clients than database-level rejections
- Allow appointments for any referral status—rejected because it violates the spec and business logic (appointments should only be for referrals that have been formally accepted)

### 5. Frontend components: separate list and schedule form

**Decision**:
- Create `AppointmentListComponent` to display appointments with status and inline actions (Reschedule, Mark Complete, Cancel)
- Create `ScheduleAppointmentComponent` as a form for creating new appointments
- Integrate both into the existing ReferralTrackingComponent, showing the schedule form only when Accepted status and form not yet submitted

**Rationale**:
- Separation of concerns (display vs. creation) makes components reusable
- List component can be embedded on Patient Details or Referral Tracking pages without forcing a single view
- Schedule form can be modal-like (show/hide) without full route navigation
- Follows existing Angular patterns in the codebase (e.g., CreateReferralComponent and ReferralTrackingComponent are separate)

**Alternatives considered**:
- Single component handling both list and form—rejected because it mixes concerns and makes reuse harder
- New route `/appointments/:id`—rejected because appointments are semantically sub-resources of referrals; inline integration is more natural

### 6. AppointmentService uses signals for state management

**Decision**:
- Inject `AppointmentService` with `@Injectable({ providedIn: 'root' })`
- Use `signal<Appointment[]>()` to store appointments
- Methods call HTTP endpoints and update the signal via `tap()` operator

**Rationale**:
- Follows Angular 18 signal-based state pattern used elsewhere in the codebase
- Updates are automatic when state changes (no manual change detection)
- Computed derived state is easy (e.g., filtering appointments by status)

**Alternatives considered**:
- RxJS observables only—rejected because signals are the modern Angular pattern and the codebase already uses them
- Store in component-local state—rejected because appointments may be fetched by multiple views; a service-level signal allows sharing

### 7. No automatic notifications on appointment creation

**Decision**: Appointment creation does not trigger notifications. The Notification Service is not called when an appointment is created.

**Rationale**:
- Spec explicitly marks notifications as out of scope for Phase 2
- Notification wiring can be added later as a separate capability without changing the appointment data model or API
- Keeps appointment logic independent and testable

**Alternatives considered**:
- Call Notification Service on create—rejected because it's explicitly out of scope and adds a dependency

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **PatientId denormalization in Appointment table** — If patient info changes or referral is updated, appointments don't auto-reflect. | PatientId is read-only once appointment created; patient info lives on the Patient record. Appointments serve as historical record, not source of truth for patient data. This is acceptable for Phase 2. |
| **No availability checking** — Specialist might be double-booked or unavailable at the scheduled time. | Explicitly out of scope per spec. Could be added in Phase 3 as a validation service without changing appointment model. |
| **Status field is manual** — No automatic transition from Scheduled→No Show; admin must manually set it. | Acceptable by design; No Show is rare and manual capture allows time for rescheduling/cancellation before the visit actually occurs. |
| **Rescheduling discards old date/time** — No audit trail of previous appointment times. | Acceptable for Phase 2; if audit trail needed later, add `PreviousScheduledDate`, `RescheduledAt` fields without breaking existing records. |
| **Cross-service consistency** — If Referral Service is down, appointments can't be created; if Patient Service is down, appointment creation still succeeds but denormalized PatientId might be stale. | Acceptable because Referral Service is required (referral must exist); Patient Service updates don't affect existing appointment records. |

## Open Questions

1. **No Show handling**: Should No Show be set by admin manually, or should there be a scheduled job that auto-transitions past appointments to No Show? (Deferred—can be added in Phase 3.)
2. **Cascade delete**: If a referral is deleted, should linked appointments be deleted automatically, or remain as historical records? (Deferred—current design assumes referrals don't get deleted; can be decided if deletion becomes a feature.)
3. **Appointment notes/comments**: Should appointments have a free-text notes field for additional visit context? (Deferred—spec doesn't require it; can be added later if clinical teams request it.)

# Developer Stories — Appointment Scheduling Feature (4-Person Team)

Four developers working in parallel with minimal blocking dependencies.

---

## Story 1: Backend API & Data Model (Developer 1 - Backend Engineer)

**Title**: Implement Appointment data model and REST API endpoints

**Story Points**: 13

**Description**:
Add appointment scheduling to the Referral Service. Covers the entire backend layer: SQLAlchemy models, Pydantic schemas, and 4 new REST endpoints with validation.

**Acceptance Criteria**:

### Setup
- [ ] Appointment model created with AppointmentId (PK), ReferralId (FK), PatientId, SpecialistId, ScheduledDate, Location, Status, CreatedAt, UpdatedAt
- [ ] Referral model updated with `appointments` relationship (cascade delete)
- [ ] Fields properly indexed (ReferralId, Status)

### Schemas & Validation
- [ ] AppointmentStatus enum (Scheduled, Completed, Cancelled, No Show)
- [ ] AppointmentCreate schema (input: ScheduledDate, Location, SpecialistId)
- [ ] AppointmentRead schema (output: all appointment fields)
- [ ] `_get_appointment_or_404()` helper function

### Endpoints
- [ ] POST `/referrals/{referral_id}/appointments` — create (validate referral exists & Status == "Accepted")
- [ ] GET `/referrals/{referral_id}/appointments` — list (ordered by CreatedAt descending)
- [ ] PATCH `/appointments/{appointment_id}/reschedule` — update (validate Status == "Scheduled")
- [ ] PATCH `/appointments/{appointment_id}/complete` — complete (Scheduled → Completed)
- [ ] PATCH `/appointments/{appointment_id}/cancel` — cancel (Scheduled → Cancelled)

### Seed Data & Testing
- [ ] SEED_APPOINTMENTS added with sample data
- [ ] Service rebuilt and tested:
  - POST create (success/invalid referral/invalid status)
  - GET list (success/empty)
  - PATCH operations (success/invalid state)
- [ ] All error codes and messages verified

### Definition of Done
- APIs tested manually (curl/Postman)
- Code follows Referral Service patterns
- No linting errors
- Ready for frontend integration

---

## Story 2: Frontend Service & Appointment List (Developer 2 - Frontend Engineer 1)

**Title**: Build AppointmentService and appointment list component

**Story Points**: 9

**Description**:
Create the Angular service layer for appointment management and the list component for displaying appointments with actions. The service handles HTTP communication; the list component displays appointments and triggers actions.

**Acceptance Criteria**:

### Data Models
- [ ] `appointment.model.ts` created with Appointment and AppointmentCreate interfaces
- [ ] Interfaces match backend schemas

### AppointmentService
- [ ] Service created with `@Injectable({ providedIn: 'root' })`
- [ ] `appointments = signal<Appointment[]>([])`
- [ ] `listByReferral(referralId)` — GET, updates signal
- [ ] `create(referralId, payload): Observable<Appointment>` — POST, updates signal via tap()
- [ ] `reschedule(appointmentId, payload): Observable<Appointment>` — PATCH /reschedule
- [ ] `complete(appointmentId): Observable<Appointment>` — PATCH /complete
- [ ] `cancel(appointmentId): Observable<Appointment>` — PATCH /cancel

### AppointmentListComponent
- [ ] Standalone component with CommonModule
- [ ] Input: `@Input() referralId: number` — triggers `listByReferral()` on set
- [ ] Displays table: Date & Time | Location | Status | Actions
- [ ] Status badges: Scheduled (blue), Completed (green), Cancelled (red), No Show (orange)
- [ ] Actions for Scheduled: "Reschedule", "Mark Complete", "Cancel" buttons
- [ ] Empty state: "No appointments scheduled."
- [ ] Date formatting: "MMM d, y, h:mm a"
- [ ] Professional styling and layout

### Testing
- [ ] Start frontend: `npm start`
- [ ] Service can be injected and called
- [ ] Component renders table when appointments provided
- [ ] Empty state displays correctly
- [ ] Actions buttons visible for Scheduled appointments
- [ ] Status badges display with correct colors
- [ ] No TypeScript compilation errors

### Definition of Done
- Component independently testable
- Service ready for other components
- Ready for Dev 3 to build reschedule/schedule forms

---

## Story 3: Frontend Schedule Form & Integration (Developer 3 - Frontend Engineer 2)

**Title**: Build schedule form component and integrate all components into referral page

**Story Points**: 11

**Description**:
Create the appointment scheduling form component and integrate both appointment components (from Dev 2) into the Referral Tracking page. Wire up state management, navigation, and user flows.

**Acceptance Criteria**:

### ScheduleAppointmentComponent
- [ ] Standalone component with FormsModule
- [ ] Input: `@Input() referralId: number`
- [ ] Template-driven form:
  - ScheduledDate: `<input type="datetime-local">` required
  - Location: `<input type="text">` required
  - SpecialistId field required
- [ ] Form validation: submit button disabled if invalid or submitting
- [ ] Submit button text: "Scheduling..." or "Schedule Appointment"
- [ ] Cancel button: clears form
- [ ] Error display: shows API error messages
- [ ] @Output events:
  - `onSuccess = new EventEmitter<Appointment>()`
  - `onCancel = new EventEmitter<void>()`
- [ ] Styling: professional form layout

### Referral Tracking Integration
- [ ] Import AppointmentListComponent and ScheduleAppointmentComponent
- [ ] Add `showScheduleForm = signal(false)` for form visibility
- [ ] Template updates:
  - Show "Schedule Appointment" button when Status === 'Accepted' && !showScheduleForm
  - Show ScheduleAppointmentComponent when showScheduleForm
  - Show AppointmentListComponent always
- [ ] Wire outputs:
  - onSuccess: hide form, reload list
  - onCancel: hide form
- [ ] Pass referralId to both components

### Frontend Testing
- [ ] Navigate to Accepted referral
  - Button visible
  - List component visible
- [ ] Click "Schedule Appointment"
  - Form opens
  - 3 input fields visible
- [ ] Fill and submit
  - Form closes
  - Appointment appears in list
  - Status is "Scheduled"
- [ ] Test actions:
  - Reschedule: updates list
  - Mark Complete: status changes
  - Cancel: status changes
- [ ] Test persistence: refresh page, data persists
- [ ] No console errors

### Definition of Done
- Components integrated and working
- State management wired
- Ready for Dev 4's E2E testing

---

## Story 4: E2E Testing & UAT (Developer 4 - QA/Test Engineer)

**Title**: E2E testing, test automation, and user acceptance testing

**Story Points**: 10

**Description**:
Write comprehensive E2E tests, verify the full feature workflow, document results, and prepare for user acceptance testing. Can start test planning in parallel while Dev 1-3 build.

**Acceptance Criteria**:

### Test Planning & Preparation (CAN START IMMEDIATELY)
- [ ] Write E2E test scenarios (documented):
  - Create appointment for Accepted referral
  - Reschedule appointment
  - Mark appointment complete
  - Cancel appointment
  - Verify persistence on refresh
  - Test error cases (invalid referral, invalid status)
- [ ] Create test data fixtures
- [ ] Set up test environment and tools
- [ ] Document test environment requirements

### E2E Test Execution (START AFTER DEV 1-3 FINISH)
- [ ] Start full stack: `./start_all.sh`
- [ ] Test happy path:
  - Create patient → referral → accept → schedule appointment
  - Verify appointment in system
  - Reschedule it
  - Mark complete
  - Verify persistence on refresh
- [ ] Test validation:
  - Cannot schedule for Draft/Submitted/Rejected referral (400 error)
  - Cannot reschedule Completed/Cancelled (400 error)
  - Invalid referral returns 404
- [ ] Test state transitions:
  - Scheduled → Completed
  - Scheduled → Cancelled
  - No Show status (if admin settable)
- [ ] Test concurrent operations:
  - Multiple appointments per referral
  - Multiple referrals per patient
- [ ] Test UI/UX:
  - Form validation works
  - Error messages clear
  - Status badges display correctly
  - Actions appear/disappear appropriately
- [ ] Test data persistence:
  - Refresh browser
  - Navigate away and back
  - All data persists

### Bug Tracking & Sign-Off
- [ ] Document any bugs found with:
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots/video if applicable
- [ ] Verify all bugs fixed or logged
- [ ] Sign off on feature readiness for UAT
- [ ] Create test summary report

### Definition of Done
- All E2E tests passing
- Bugs documented and assigned
- Feature ready for user acceptance testing
- Test cases documented for regression testing

---

## Week 1 Activity: Build

**Days 1-2 — Kickoff & scaffolding**
- **Dev 1 (Backend)**: Design Appointment model, schemas, and `appointments` relationship on Referral; write seed data plan.
- **Dev 2 (Frontend 1)**: Create `appointment.model.ts`; scaffold `AppointmentService` with signal-based state and stub HTTP methods.
- **Dev 3 (Frontend 2)**: Scaffold `ScheduleAppointmentComponent` template-driven form; agree on `@Input`/`@Output` contract with Dev 2.
- **Dev 4 (QA)**: Write documented E2E test scenarios and acceptance criteria; set up test environment/tooling; prepare test data fixtures.

**Day 3 — Core implementation**
- **Dev 1**: Implement POST/GET endpoints (create + list) with referral-exists and Accepted-status validation; manual test via curl/Postman.
- **Dev 2**: Implement `listByReferral()` and `create()` in `AppointmentService`; build `AppointmentListComponent` table rendering and empty state.
- **Dev 3**: Complete form validation, error display, submit/cancel flow against a mocked service.
- **Dev 4**: Finalize test plan document; begin drafting automated E2E scripts against mocked/stub responses.

**Days 4-5 — Complete individual components**
- **Dev 1**: Implement PATCH reschedule/complete/cancel endpoints with state validation; finalize seed data; run a full manual API test pass; hand off the API contract to the frontend team.
- **Dev 2**: Implement reschedule/complete/cancel methods in the service; add status badges and inline actions to `AppointmentListComponent`; verify against Dev 1's live API.
- **Dev 3**: Wire `onSuccess`/`onCancel` outputs; begin integrating both components into `ReferralTrackingComponent` (`showScheduleForm` signal, conditional "Schedule Appointment" button).
- **Dev 4**: Validate the test environment can run the full stack (`./start_all.sh`); dry-run scenarios against Dev 1's live API.

**End of Week 1 checkpoint**: Backend API complete and manually verified; frontend list and form components built and independently testable; integration into Referral Tracking in progress; QA environment and draft automated scripts ready to run against the integrated build.

## Week 2 Activity: Integrate, Test, Ship

**Days 6-7 — Integration & first E2E pass**
- **Dev 1**: On standby for API bug fixes and edge cases surfaced during integration/QA; support Dev 3 on integration questions.
- **Dev 2**: Polish `AppointmentListComponent` styling and date formatting; support Dev 3 on integration.
- **Dev 3**: Complete integration into `ReferralTrackingComponent`; manually verify the full flow (schedule, reschedule, complete, cancel) end-to-end in the browser; fix integration bugs.
- **Dev 4**: Begin E2E test execution against the fully integrated build; log initial bugs.

**Day 8 — Bug fixing & deeper coverage**
- **Dev 1-3**: Fix bugs found during Dev 4's E2E pass; re-verify fixes with Dev 4.
- **Dev 4**: Continue E2E execution — validation/error cases (400/404), state-transition coverage, concurrent appointments/referrals, persistence-on-refresh checks.

**Day 9 — Regression & documentation**
- **Dev 4**: Complete a full regression pass; document bugs with repro steps and expected-vs-actual behavior; verify all fixes landed.
- **Dev 1-3**: Final bug fixes only; no new feature work.

**Day 10 — Sign-off**
- **Dev 4**: Produce the test summary report; sign off on feature readiness for UAT.
- **All**: Final team sign-off against the Definition of Done below.

---

## No Waiting for QA!

Unlike a 3-person team where QA waits for Dev 1 & 2, Dev 4 (QA) has **a full week** of parallel work before integration testing begins:
- ✅ Can write all test cases while waiting
- ✅ Can set up test infrastructure
- ✅ Can create test data/fixtures
- ✅ Can review and provide early feedback to Dev 1-3

This keeps QA productive from day 1 and ensures tests are ready to run immediately after integration is complete.

---

## Definition of Done (Team-Level)

Feature is complete when:
- ✅ All backend endpoints tested and working
- ✅ All frontend components built and integrated
- ✅ All E2E tests passing
- ✅ No critical bugs
- ✅ Documentation complete
- ✅ Ready for user acceptance testing

**Total effort: ~43 story points across 4 developers**
**Timeline: 2 weeks (10 working days) with parallel work**
