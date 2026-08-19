# ReferralIQ Appointment Scheduling — Combined Master Plan

**Project**: Appointment Scheduling Feature (Phase 2)  
**Status**: Ready for Implementation  
**Team Size**: 4 Developers  
**Timeline**: 4 Days  
**Total Effort**: 43 Story Points

---

## Executive Summary

Once a referral is accepted in ReferralIQ, there's currently no way to schedule the actual visit in the system—it's tracked outside via phone and email, causing referrals to "go dark." This plan adds appointment scheduling as a first-class feature within the existing Referral Service, allowing clinical teams to schedule, track, and manage patient visits directly in the platform.

**Key deliverables**: 
- Backend: 4 REST API endpoints + Appointment data model
- Frontend: Service + 2 components (list & scheduling form)
- Integration: Appointments wired into Referral Tracking page
- Testing: Comprehensive E2E test coverage

---

# Part 1: Business Requirements & Vision

## Why This Change

**Problem**: Version 1 of ReferralIQ ends when a referral reaches `Accepted` status — there is no next step defined for accepted referrals. Accepted referrals drop out of the system for visibility and scheduling, requiring Clinical Operations to track visits outside the platform via phone and email.

**Opportunity**: Add appointment scheduling to the Referral Service so visits are captured and tracked in-system instead of scattered across multiple tools.

**Impact**: Clinical teams can immediately schedule appointments after accepting referrals, maintaining visibility and continuity from referral acceptance through visit completion.

---

## What Changes

- **New data model**: Appointments linked to referrals and patients, capturing assigned specialist, scheduled date/time, location, and status
- **New API endpoints**: Create, list, reschedule, and cancel appointments
- **New UI**: Appointment scheduling form and appointment list with status tracking on the Referral Tracking screen
- **Status tracking**: Appointments track Scheduled, Completed, Cancelled, and No Show states
- **Rescheduling support**: Appointments can be rescheduled (date/time/location/specialist updated) before completion or cancellation
- **Constraint**: Appointments can only be created for referrals with Accepted status

---

## Affected Capabilities

### New Capabilities
- **appointment-scheduling**: Full lifecycle appointment management—create appointments linked to accepted referrals, track status (Scheduled, Completed, Cancelled, No Show), capture specialist, date, time, and location, support rescheduling before completion/cancellation.

### Modified Capabilities
- **referral-management**: Accepted referrals now support appointment creation as the logical next action. Referral-appointment relationship is parent-child.

---

## Impact Assessment

- **Affected services**: Referral Service (new Appointment model, schemas, endpoints)
- **Affected frontend**: Referral Tracking page (new appointment scheduling form, appointment list view)
- **APIs**: 4 new endpoints (POST create, GET list, PATCH reschedule, PATCH complete, PATCH cancel)
- **Database**: New appointments table with foreign key to referrals
- **Workflows**: Clinical teams can now schedule visits in the system immediately after accepting referrals instead of using external tools

---

# Part 2: Functional Specifications

## Specification 1: Appointment Scheduling

**Purpose**: Enables clinical teams to schedule and track patient visits within the platform, linking appointments to accepted referrals so visits are captured in-system instead of tracked via phone and email.

### ADDED Requirements

#### Requirement: Create appointment for accepted referral
The system SHALL allow users to create an appointment linked to an accepted referral. An appointment can only be created if the referenced referral exists and has Accepted status.

**Scenario: Successful appointment creation**
- **WHEN** user submits appointment creation request with ReferralId, ScheduledDate, Location, and SpecialistId for a referral in Accepted status
- **THEN** system creates the appointment, assigns initial status Scheduled, records CreatedAt timestamp, and returns appointment details with AppointmentId

**Scenario: Reject creation for non-existent referral**
- **WHEN** user attempts to create appointment with non-existent ReferralId
- **THEN** system returns 404 error

**Scenario: Reject creation for non-Accepted referral**
- **WHEN** user attempts to create appointment for referral with status Draft, Submitted, Rejected, or Completed
- **THEN** system returns 400 error with message "Appointment can only be created for Accepted referrals"

---

#### Requirement: List appointments for a referral
The system SHALL return all appointments linked to a referral, in reverse chronological order by CreatedAt (newest first).

**Scenario: Retrieve appointments**
- **WHEN** user requests appointments for a given ReferralId
- **THEN** system returns list of appointment records, each with AppointmentId, ReferralId, ScheduledDate, Location, SpecialistId, Status, and CreatedAt

**Scenario: Empty list for referral with no appointments**
- **WHEN** user requests appointments for referral with no scheduled appointments
- **THEN** system returns empty list (not an error)

---

#### Requirement: Reschedule appointment
The system SHALL allow users to update the ScheduledDate, Location, and SpecialistId of a Scheduled appointment before completion or cancellation.

**Scenario: Successful reschedule**
- **WHEN** user submits reschedule request with AppointmentId, new ScheduledDate, Location, SpecialistId for appointment in Scheduled status
- **THEN** system updates the appointment, records UpdatedAt timestamp, and returns updated appointment details

**Scenario: Reject reschedule for completed appointment**
- **WHEN** user attempts to reschedule appointment with status Completed
- **THEN** system returns 400 error with message "Cannot reschedule completed appointment"

**Scenario: Reject reschedule for cancelled appointment**
- **WHEN** user attempts to reschedule appointment with status Cancelled
- **THEN** system returns 400 error with message "Cannot reschedule cancelled appointment"

**Scenario: Reject reschedule for non-existent appointment**
- **WHEN** user attempts to reschedule non-existent AppointmentId
- **THEN** system returns 404 error

---

#### Requirement: Cancel appointment
The system SHALL allow users to cancel a Scheduled appointment, transitioning it to Cancelled status.

**Scenario: Successful cancellation**
- **WHEN** user submits cancel request for appointment in Scheduled status
- **THEN** system sets status to Cancelled, records UpdatedAt timestamp, and returns updated appointment details

**Scenario: Reject cancellation of completed appointment**
- **WHEN** user attempts to cancel appointment with status Completed
- **THEN** system returns 400 error with message "Cannot cancel completed appointment"

**Scenario: Reject cancellation of already-cancelled appointment**
- **WHEN** user attempts to cancel appointment already in Cancelled status
- **THEN** system returns 400 error with message "Appointment is already cancelled"

---

#### Requirement: Mark appointment as completed
The system SHALL allow users to mark a Scheduled appointment as Completed, recording completion without modifying the original scheduled details.

**Scenario: Successful completion**
- **WHEN** user submits completion request for appointment in Scheduled status
- **THEN** system sets status to Completed, records UpdatedAt timestamp, and returns updated appointment details

**Scenario: Reject completion of cancelled appointment**
- **WHEN** user attempts to complete appointment with status Cancelled
- **THEN** system returns 400 error with message "Cannot complete cancelled appointment"

---

#### Requirement: Track appointment status
The system SHALL maintain appointment status as one of: Scheduled, Completed, Cancelled, or No Show.

**Scenario: Status field is queryable**
- **WHEN** user retrieves an appointment
- **THEN** system returns Status field with one of the four allowed values

**Scenario: No Show status can be set by admin**
- **WHEN** administrative user sets appointment status to No Show
- **THEN** system accepts the status change and records UpdatedAt timestamp

---

#### Requirement: Appointment data model
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

**Scenario: Appointment persists with all fields**
- **WHEN** appointment is created and retrieved
- **THEN** all fields are returned unchanged from what was submitted

---

#### Requirement: Appointments visible on referral and patient screens
The system SHALL display created appointments on the Referral Tracking screen, showing status and allowing inline actions to reschedule, mark complete, or cancel.

**Scenario: Appointments display on Referral Tracking**
- **WHEN** user views a referral in Referral Tracking screen
- **THEN** system displays list of linked appointments below referral details with columns for ScheduledDate, Location, SpecialistName, Status, and Actions

**Scenario: Schedule Appointment button available for Accepted referrals**
- **WHEN** user views a referral in Accepted status
- **THEN** system displays "Schedule Appointment" button that opens appointment creation form

**Scenario: Actions available for Scheduled appointments**
- **WHEN** user views a Scheduled appointment
- **THEN** system displays "Reschedule", "Mark Complete", and "Cancel" actions

---

## Specification 2: Referral Management (Modified)

### MODIFIED Requirements

#### Requirement: Accepted referrals support appointment creation
Accepted referrals are no longer an endpoint—they now require a next action. The system SHALL support creating appointments linked to any referral in Accepted status, allowing clinical teams to schedule visits within the platform.

**Scenario: Appointments accessible after referral acceptance**
- **WHEN** referral transitions to Accepted status
- **THEN** user can immediately create appointments for that referral via POST /referrals/{referralId}/appointments

**Scenario: Appointments list visible on accepted referral detail**
- **WHEN** user views a referral in Accepted status
- **THEN** system displays any appointments previously created for that referral below the referral details

---

#### Requirement: Referral must exist for appointment creation
The system SHALL validate that the ReferralId exists before allowing appointment creation.

**Scenario: Appointment creation validates referral exists**
- **WHEN** user attempts to create appointment with a ReferralId
- **THEN** system verifies the referral exists; if not, returns 404 error

---

# Part 3: Technical Architecture & Design

## Context

ReferralIQ uses a microservices architecture with a Referral Service managing referral lifecycle. The system includes an API Gateway routing frontend requests to backend services, each with its own SQLAlchemy ORM database and Pydantic schemas.

Referrals currently end at Accepted status with no defined next step, causing accepted referrals to drop out of the system for visibility and scheduling. Appointments need to be added as a new capability within the existing Referral Service (not as a new microservice) to maintain data locality and simplify the referral-appointment relationship.

---

## Architecture Goals

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

---

## Key Design Decisions

### Decision 1: Appointments live in Referral Service, not as a new service

**Rationale**: 
- Appointments are tightly coupled to referrals—every appointment needs a referral context
- Queries and updates often involve both referrals and appointments together
- Keeping them in one service avoids inter-service calls and distributed transaction complexity

**Alternatives rejected**:
- Dedicated Appointment Service: Would require upstream calls to validate referral state and add network latency
- Separate database with same service: Unnecessary complexity

---

### Decision 2: Appointment model with denormalized PatientId

**Rationale**:
- PatientId denormalized from referral for query efficiency (avoid join to fetch patient-level appointment lists)
- ScheduledDate and Location are plain datetime/string fields with no validation (minimalist design)
- Status stored as string (not database enum) to allow admin flexibility for No Show transitions
- UpdatedAt tracks rescheduling and status changes

---

### Decision 3: API endpoints follow Referral Service patterns

**Rationale**:
- Nesting create/list under /referrals/{referralId} makes referral context explicit and enforces validation
- State transitions use separate PATCH endpoints (complete, cancel, reschedule) rather than generic PATCH
- Matches existing Referral Service patterns (e.g., `/referrals/{id}/accept`, `/referrals/{id}/reject`)

---

### Decision 4: Frontend components: separate list and schedule form

**Rationale**:
- Separation of concerns (display vs. creation) makes components reusable
- List component can be embedded on any page without forcing a single view
- Schedule form can be modal-like (show/hide) without full route navigation
- Follows existing Angular patterns

---

### Decision 5: AppointmentService uses signals for state management

**Rationale**:
- Follows Angular 18 signal-based state pattern used elsewhere in codebase
- Updates are automatic when state changes (no manual change detection)
- Computed derived state is easy (e.g., filtering by status)

---

## Risks & Trade-offs

| Risk | Mitigation |
|------|-----------|
| **PatientId denormalization** — If patient info changes, appointments don't auto-reflect | PatientId is read-only once appointment created; acceptable for Phase 2 |
| **No availability checking** — Specialist might be double-booked | Explicitly out of scope; can be added in Phase 3 |
| **Status field is manual** — No automatic transition to No Show | Acceptable by design; manual capture allows time for rescheduling |
| **Rescheduling discards old data** — No audit trail of previous times | Acceptable for Phase 2; can add history fields later |
| **Cross-service consistency** — If one service down, other operations affected | Referral Service is required; Patient Service updates don't affect existing records |

---

## Open Questions (Deferred)

1. **No Show handling**: Manual vs. automatic transition? (Phase 3)
2. **Cascade delete**: Delete appointments if referral deleted? (Phase 3)
3. **Appointment notes**: Free-text notes field? (Phase 3 if requested)

---

# Part 4: Implementation Plan

## Team Structure (4 Developers)

| Developer | Story | Points | Role |
|-----------|-------|--------|------|
| **Dev 1** | Backend API & Data Model | 13 | Backend Engineer |
| **Dev 2** | Service & List Component | 9 | Frontend Engineer 1 |
| **Dev 3** | Schedule Form & Integration | 11 | Frontend Engineer 2 |
| **Dev 4** | E2E Testing & UAT | 10 | QA/Test Engineer |

**Total: 43 Story Points | Timeline: 4 Days**

---

## Story 1: Backend API & Data Model (Developer 1)

**Objective**: Implement complete backend layer

**Tasks**:

### Models & Schemas (Days 1-2)
- [ ] 1.1 Create Appointment SQLAlchemy model
  - AppointmentId (PK, auto-increment)
  - ReferralId (FK to referrals, indexed)
  - PatientId (denormalized, indexed)
  - SpecialistId (foreign key to doctor)
  - ScheduledDate (DateTime)
  - Location (String)
  - Status (String, indexed, default='Scheduled')
  - CreatedAt (DateTime, default=utcnow)
  - UpdatedAt (DateTime, default=utcnow, onupdate=utcnow)
  - Relationship: `appointments = relationship("Referral", back_populates="referral")`

- [ ] 1.2 Update Referral model
  - Add `appointments = relationship("Appointment", back_populates="referral", cascade="all, delete-orphan")`

- [ ] 1.3 Create schemas
  - AppointmentStatus enum (Scheduled, Completed, Cancelled, No Show)
  - AppointmentCreate (input: ScheduledDate, Location, SpecialistId)
  - AppointmentRead (output: all fields)
  - Use PascalCase, ConfigDict(from_attributes=True)

### Endpoints (Days 2-3)
- [ ] 2.1 Helper function: `_get_appointment_or_404(appointment_id, db)`

- [ ] 2.2 POST `/referrals/{referral_id}/appointments`
  - Validate referral exists (404 if not)
  - Validate referral.Status == "Accepted" (400 if not)
  - Create appointment with PatientId from referral
  - Return 201 with AppointmentRead

- [ ] 2.3 GET `/referrals/{referral_id}/appointments`
  - Validate referral exists
  - Return list ordered by CreatedAt DESC
  - Return 200 with [AppointmentRead]

- [ ] 2.4 PATCH `/appointments/{appointment_id}/reschedule`
  - Validate appointment exists (404)
  - Validate Status == "Scheduled" (400 if not)
  - Update ScheduledDate, Location, SpecialistId
  - Return 200 with AppointmentRead

- [ ] 2.5 PATCH `/appointments/{appointment_id}/complete`
  - Validate appointment exists
  - Validate Status == "Scheduled" (400 if not)
  - Set Status = "Completed"
  - Return 200 with AppointmentRead

- [ ] 2.6 PATCH `/appointments/{appointment_id}/cancel`
  - Validate appointment exists
  - Validate Status == "Scheduled" (400 if not)
  - Set Status = "Cancelled"
  - Return 200 with AppointmentRead

### Seed Data (Day 3)
- [ ] 3.1 Add SEED_APPOINTMENTS with sample data
- [ ] 3.2 Update seed_if_empty() to populate appointments

### Testing (Day 3)
- [ ] 4.1 Rebuild service: `docker compose up -d --build referral-service`
- [ ] 4.2 Test POST create (success)
- [ ] 4.3 Test POST create (invalid referral/status)
- [ ] 4.4 Test GET list (success/empty)
- [ ] 4.5 Test PATCH operations (success/invalid state)
- [ ] 4.6 Verify all error codes and messages

**Definition of Done**: APIs tested, code clean, ready for frontend

---

## Story 2: Frontend Service & List Component (Developer 2)

**Objective**: Build service and list display component

**Tasks**:

### Data Models (Day 1)
- [ ] 1.1 Create `appointment.model.ts`
  - Appointment interface (matches AppointmentRead)
  - AppointmentCreate interface (matches schema)

### Service (Days 1-2)
- [ ] 2.1 Create `appointment.service.ts` with `@Injectable({ providedIn: 'root' })`
- [ ] 2.2 Add `appointments = signal<Appointment[]>([])`
- [ ] 2.3 Implement `listByReferral(referralId)` — GET /api/referrals/{id}/appointments
- [ ] 2.4 Implement `create(referralId, payload): Observable<Appointment>`
- [ ] 2.5 Implement `reschedule(appointmentId, payload): Observable<Appointment>`
- [ ] 2.6 Implement `complete(appointmentId): Observable<Appointment>`
- [ ] 2.7 Implement `cancel(appointmentId): Observable<Appointment>`

### List Component (Days 2-3)
- [ ] 3.1 Create `appointment-list.component.ts` (standalone)
- [ ] 3.2 Add Input: `@Input() referralId: number`
- [ ] 3.3 Build template:
  - Table with: ScheduledDate | Location | Status | Actions
  - Status badges (colored)
  - Action buttons for Scheduled: Reschedule, Complete, Cancel
  - Empty state message
- [ ] 3.4 Add styling (professional table, colored badges)

### Testing (Day 3)
- [ ] 4.1 Service injectable and callable
- [ ] 4.2 Component renders with appointments
- [ ] 4.3 Empty state displays
- [ ] 4.4 Status badges show correct colors
- [ ] 4.5 No TypeScript errors

**Definition of Done**: Components tested, service ready, can be integrated

---

## Story 3: Frontend Schedule Form & Integration (Developer 3)

**Objective**: Build form component and integrate into referral page

**Tasks**:

### Schedule Form Component (Days 1-3)
- [ ] 1.1 Create `schedule-appointment.component.ts` (standalone)
- [ ] 1.2 Add Inputs: `@Input() referralId: number`
- [ ] 1.3 Add Outputs:
  - `@Output() onSuccess = new EventEmitter<Appointment>()`
  - `@Output() onCancel = new EventEmitter<void>()`
- [ ] 1.4 Build template-driven form:
  - ScheduledDate: `<input type="datetime-local">` (required)
  - Location: `<input type="text">` (required)
  - SpecialistId: field (required)
- [ ] 1.5 Add form validation
  - Submit button disabled if invalid or submitting
  - Show "Scheduling..." text while submitting
- [ ] 1.6 Add error display (API error messages)
- [ ] 1.7 Add styling (professional form layout)

### Integration with Referral Tracking (Days 3-4)
- [ ] 2.1 Import both components in referral-tracking.component.ts
- [ ] 2.2 Add `showScheduleForm = signal(false)`
- [ ] 2.3 Update template:
  - Show "Schedule Appointment" button when Status === 'Accepted' && !showScheduleForm
  - Show ScheduleAppointmentComponent when showScheduleForm
  - Show AppointmentListComponent (always)
- [ ] 2.4 Wire outputs:
  - onSuccess: hide form, reload appointments
  - onCancel: hide form
- [ ] 2.5 Pass referralId to both components

### Testing (Day 4)
- [ ] 3.1 Navigate to Accepted referral
- [ ] 3.2 Click "Schedule Appointment" — form opens
- [ ] 3.3 Fill and submit — appointment appears in list
- [ ] 3.4 Test Reschedule — list updates
- [ ] 3.5 Test Complete/Cancel — status changes
- [ ] 3.6 Test persistence — refresh, data persists
- [ ] 3.7 No console errors

**Definition of Done**: Integration complete, ready for E2E testing

---

## Story 4: E2E Testing & UAT (Developer 4)

**Objective**: Test feature end-to-end and prepare for UAT

**Tasks**:

### Test Planning (Days 1-2) — Can start immediately
- [ ] 1.1 Write test scenarios:
  - Create appointment for Accepted referral
  - Reschedule appointment
  - Mark appointment complete
  - Cancel appointment
  - Verify persistence on refresh
  - Test error cases
- [ ] 1.2 Create test data fixtures
- [ ] 1.3 Set up test environment and tools
- [ ] 1.4 Document test requirements

### E2E Test Execution (Days 3-4) — After Dev 1-3 finish
- [ ] 2.1 Start full stack: `./start_all.sh`

- [ ] 2.2 Happy path workflow:
  - Create patient
  - Create referral
  - Accept referral
  - Schedule appointment
  - Verify in system
  - Reschedule it
  - Mark complete
  - Refresh and verify persistence

- [ ] 2.3 Validation testing:
  - Cannot schedule for non-Accepted referral (400)
  - Cannot reschedule Completed/Cancelled (400)
  - Invalid referral returns 404

- [ ] 2.4 State transition testing:
  - Scheduled → Completed
  - Scheduled → Cancelled
  - Multiple appointments per referral

- [ ] 2.5 UI/UX testing:
  - Form validation works
  - Error messages clear
  - Status badges correct
  - Actions appear/disappear correctly

- [ ] 2.6 Data persistence:
  - Refresh browser
  - Navigate away and back
  - All data persists

### Bug Tracking & Sign-Off (Day 4)
- [ ] 3.1 Document any bugs (steps, expected vs actual)
- [ ] 3.2 Verify all bugs fixed
- [ ] 3.3 Sign off on feature readiness
- [ ] 3.4 Create test summary report

**Definition of Done**: All E2E tests pass, feature ready for UAT

---

# Part 5: Team Execution Plan

## Timeline

### Days 1-2: Parallel Development
```
Dev 1: Backend models, schemas, basic endpoints
Dev 2: Service, list component structure
Dev 3: Schedule form component
Dev 4: Test scenarios, test data, environment setup
```

### Day 3: Integration & Testing
```
Dev 1: Complete endpoints, backend testing, hand off
Dev 2: Finish list component, coordinate with Dev 3
Dev 3: Integrate components into referral page
Dev 4: Prepare to run E2E tests
```

### Day 4: E2E Testing & Sign-Off
```
Dev 1-3: On standby for bug fixes
Dev 4: Execute all E2E tests, log bugs, verify fixes
All: Final sign-off
```

---

## Handoff Protocol

| Dev | Deliverable | Hands Off To | When |
|-----|---|---|---|
| Dev 1 | Tested backend APIs | Dev 2, Dev 3, Dev 4 | End of Day 3 |
| Dev 2 | Service + List Component | Dev 3 | End of Day 2 |
| Dev 3 | Integrated feature | Dev 4 | End of Day 3 |
| Dev 4 | Test results & sign-off | Product/Stakeholders | End of Day 4 |

---

## Definition of Done (Feature)

✅ All backend endpoints tested and working  
✅ All frontend components built and integrated  
✅ All E2E tests passing  
✅ No critical bugs  
✅ Documentation complete  
✅ Ready for user acceptance testing  

---

## Files to Modify/Create

### Backend (Referral Service)
```
services/referral/
├── models.py          [MODIFY] Add Appointment model
├── schemas.py         [MODIFY] Add appointment schemas
├── main.py            [MODIFY] Add 4 endpoints
├── seed.py            [MODIFY] Add seed data
└── db.py              [NO CHANGE]
```

### Frontend
```
frontend/src/app/
├── core/
│   ├── models/
│   │   └── appointment.model.ts     [CREATE]
│   └── services/
│       └── appointment.service.ts   [CREATE]
└── features/
    ├── appointments/
    │   ├── appointment-list.component.ts          [CREATE]
    │   └── schedule-appointment.component.ts      [CREATE]
    └── referrals/
        └── referral-tracking.component.ts         [MODIFY] Integrate
```

---

## Success Criteria

✅ Feature shipped and working end-to-end  
✅ Referrals no longer "go dark" after acceptance  
✅ Appointments tracked in-system, not via external tools  
✅ Clinical teams can schedule visits immediately after referral acceptance  
✅ All team members clear on their tasks and dependencies  
✅ Timeline: 4 days with 4 developers  

---

## Next Steps

1. **Review** this plan with team
2. **Assign** each developer to their story
3. **Day 1 9:00 AM**: Kickoff meeting
4. **Day 1 10:00 AM**: All developers start work in parallel
5. **Daily standups**: 15 min sync on blockers
6. **End of Day 4**: Feature ready for UAT

---

**Prepared**: 2026-08-05  
**Status**: Ready for Implementation  
**Questions?** Review the individual story files or contact project lead
