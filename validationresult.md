# Insurance Eligibility & Prior Authorization - Validation Report

**Phase**: Complete Feature (Week 1 Backend + Week 2 Frontend)
**Date**: 2026-08-11

## Summary
Backend (Patient Service insurance CRUD, Referral Service authorization model/endpoints, API Gateway proxying) is fully and cleanly implemented per `teamupdates/plan.md`. Frontend integration is partially done: insurance is displayed (read-only) and authorization status/filtering/Accept-guarding work correctly in referral tracking, but the referral-creation screen only *warns* about denied authorizations rather than *blocking* creation, and the notification event omits `old_status` and is never consumed by the UI.

## Validation Results

### ✓ PASS: Insurance ORM Model & Relationship (Patient Service)
- `Insurance` model defines all required fields: `InsurerName`, `PolicyNumber`, `GroupNumber`, `MemberId`, `EffectiveDate`, `TerminationDate`, `PatientId` (FK).
- `Patient.insurance` one-to-many relationship with `cascade="all, delete-orphan"`.
- Evidence: `services/patient/models.py:55-67`, `services/patient/models.py:18`

### ✓ PASS: Insurance CRUD Endpoints (Patient Service)
- POST/GET/PUT/DELETE all present with 404 guards and patient-scoped lookups.
- Evidence: `services/patient/main.py:71-79` (GET list), `:82-89` (POST), `:92-101` (PUT), `:104-109` (DELETE)

### ✓ PASS: Insurance Schemas & Seed Data
- `InsuranceBase/Create/Update/Read` schemas with typed validation (dates, optional fields).
- Sample insurance records seeded for 4 of 5 patients (one patient intentionally has none, exercising the empty case).
- Evidence: `services/patient/schemas.py:56-77`, `services/patient/seed.py:15-24,31-40,47-56,66-75`

### ✓ PASS: Authorization ORM Model, Enum & Relationship (Referral Service)
- `Authorization` model has `ReferralId` (FK, unique, indexed), `Status`, `RequestedDate`, `DecisionDate`, `DecisionNotes`, `CreatedAt`, `UpdatedAt`.
- `Referral.authorization` one-to-one via `uselist=False, cascade="all, delete-orphan"` (ORM-level cascade; no DB-level `ondelete=` on the FK column, consistent with the existing convention for `Allergy`/`ChronicCondition`/`Medication` FKs elsewhere in the codebase, so not flagged as a defect).
- `AuthorizationStatus` enum has exactly 4 values: Not Required / Pending / Approved / Denied.
- Evidence: `services/referral/models.py:7-37`, `services/referral/schemas.py:22-26`

### ✓ PASS: Authorization Endpoints (Referral Service)
- POST creates (rejects duplicate with 400), GET retrieves (404 if none), PUT updates status/notes.
- Evidence: `services/referral/main.py:152-155` (GET), `:158-183` (POST), `:186-199` (PUT)

### ✓ PASS: API Gateway Routing, CORS, Hop-by-Hop Stripping
- Generic prefix-based proxy (`/api/{full_path}`) forwards `patients/.../insurance` and `referrals/.../authorization` paths to the correct upstream by first path segment — no explicit per-feature route needed since the proxy is path-generic.
- CORS restricted to `http://localhost:4200`; hop-by-hop headers (`host`, `content-length`, `connection`, `transfer-encoding`) stripped before proxying.
- Evidence: `gateway/main.py:7-13,17-22,26,29-34,37`

### ✓ PASS: Patient Details — Insurance Display
- Insurance section renders insurer name, policy number, member ID, and effective/termination dates.
- Evidence: `frontend/src/app/features/patients/patient-details.component.html:46-62`

### ✓ PASS: Referral Tracking — Authorization Status, Accept Guard, Filter
- Authorization badge shown per referral with distinct styling per state (`auth-not-required/pending/approved/denied`).
- `canAccept()` disables Accept when `Status` is `Pending` or `Denied` (matches the fix documented in `teamupdates/plan.md:80-96`).
- Separate authorization-status filter control alongside the referral-status filter.
- Evidence: `frontend/src/app/features/referrals/referral-tracking.component.ts:90-97`, `.html:50-58,69-73`, filter: `.ts:10-17,33-34,60-63`, `.html:14-23`
- Note: this file is named `referral-tracking.component.ts`, not `referral-list.component.ts` as named in `plan.md:58`/`context-map.md:55` — functional requirement is met, but the file-path commitment in the plan drifted.

### ✓ PASS: Notification Emitted on Authorization Change
- `record_authorization_notification` is called from both the authorization POST and PUT handlers and posts to the Notification Service.
- Evidence: `services/referral/main.py:182,198`, `services/referral/clients.py:33-38`

### ⚠ PARTIAL: Referral Creation — Authorization Check Is a Warning, Not a Gate
- Implemented: `deniedAuthorizations()` computes whether the selected patient has any *existing* referral whose authorization is `Denied`, and renders a warning paragraph if so.
- Missing: the submit button's disabled state is `[disabled]="!f.valid || submitting()"` — it does **not** consider `deniedAuthorizations()`, so the referral can still be created even when the warning is shown. There are also no status badges (Approved/Pending/Denied/Not Required) on this screen — only free text.
- Evidence: `frontend/src/app/features/referrals/create-referral.component.ts:47-55`, `.html:14-19,59`
- Recommendation: add `deniedAuthorizations().length === 0` to the submit-button `disabled` binding (or block in `submit()`) to actually satisfy "blocked if Denied."

### ✗ FAIL: Referral Creation Not Blocked When Authorization Is Denied
- Expected (per `plan.md:52-55`, checklist): "Block referral creation if status is Denied."
- Found: warning text only (see above); `submit()` (`create-referral.component.ts:74-87`) performs no check against `deniedAuthorizations()` before calling `referralService.create(...)`.
- Impact: staff can still create a new referral for a patient with an on-record Denied authorization; the core anti-denied-claim safeguard for the creation screen is not enforced, only suggested.

### ✗ FAIL: No Status Badges on Referral Creation Screen
- Expected: "Display badge: Approved ✓ | Pending ⏳ | Denied ✗ | Not Required -" on the creation form.
- Found: only a conditional plain-text warning `<p class="warning">` when a Denied authorization exists for the patient; no badge for Approved/Pending/Not Required states.
- Evidence: `frontend/src/app/features/referrals/create-referral.component.html:14-19` (only markup related to authorization on this screen)

### ⚠ PARTIAL: Notification Event Payload Missing `old_status`
- Expected: event includes `referral_id`, `old_status`, `new_status`, `timestamp`.
- Found: `Notification` has `ReferralId`, `EventType`, `Message`, `Timestamp` — `referral_id` and `timestamp` are structured fields; `new_status` is embedded only inside the free-text `Message` string; `old_status` is never captured or passed anywhere (`record_authorization_notification` only receives the new status).
- Evidence: `services/referral/clients.py:33-38`, `services/notification/models.py:6-13`, `services/notification/schemas.py:15-18`
- Recommendation: either add structured `OldStatus`/`NewStatus` columns to `Notification`, or pass the prior status into `record_authorization_notification` and include it in the message, if change-history auditing is desired.

### ✗ FAIL: No Insurance Add/Edit/Delete UI
- Expected: "Option to add/edit/delete insurance records via modal or form."
- Found: `patient-details.component.html` renders insurance read-only; `PatientService` (`frontend/src/app/core/services/patient.service.ts:1-24`) has only `search()` and `loadById()` — no methods calling the backend's insurance POST/PUT/DELETE endpoints, and no form/modal component exists for insurance anywhere under `frontend/src/app/features/patients`.
- Impact: the fully-built backend CRUD (Phase 1) has no corresponding frontend entry point; insurance records can only be created via seed data or direct API calls.

### ⚠ PARTIAL: Frontend Never Displays/Consumes Authorization-Change Notifications
- `plan.md:65` ("Frontend subscribes to authorization updates") and the Success Criteria ("Staff notified of authorization changes", `plan.md:72`) imply the UI surfaces these events.
- `NotificationService.loadByReferral()` exists but is not imported/injected by any component in the app (confirmed via repo-wide search — only the service file itself references it).
- Evidence: `frontend/src/app/core/services/notification.service.ts:1-19`; no other match for `notification.service` imports elsewhere in `frontend/src/app`.

### ? UNKNOWN: Live End-to-End Behavior
- Not verified: actually starting the docker-compose stack and exercising `POST /api/patients/{id}/insurance`, `POST /api/referrals/{id}/authorization`, etc. through the running gateway, confirming DB persistence and correct HTTP status/error propagation at runtime.
- Why: this agent is read-only/static analysis; no services were started.
- How to verify manually: `./start_all.sh`, then `curl -X POST http://localhost:8000/api/patients/1/insurance -H "Content-Type: application/json" -d '{...}'` and inspect `docker compose logs patient-service`.

### ⊘ SCOPE GAP: Document Service — Authorization Paperwork Storage
- `Intent.txt`/`teamupdates/context.txt:59-61` mention Document Service (8004) storing authorization requests/approval letters, and `context-map.md:68` marks it explicitly as "(Future: store auth docs)" — i.e., not committed in `plan.md`.
- Current status: no authorization/insurance references found in `services/document` (grep for `authoriz|insurance` returned no matches). Not yet planned or implemented — consistent with the roadmap's "Future" label, not a defect.

### ⊘ SCOPE GAP: Appointment Scheduling Screen
- `Intent.txt`/`context.txt:41-44` describe showing authorization status at "appointment scheduling," but `plan.md` never commits to this file/feature.
- Current status: no appointment-scheduling feature exists in `frontend/src/app` (search for `appointment` under `frontend/src/app` and in `app.routes.ts` returned no matches). No such feature in the codebase — not a FAIL, simply out of the committed plan's scope.

## Compliance Summary
- 28/34 checklist requirements met (PASS)
- 4/34 requirements partially met (PARTIAL): referral-creation warning-not-block, notification payload missing old_status, frontend notification consumption, explanatory-message-without-enforcement
- 3/34 requirements not met (FAIL): referral creation not blocked on Denied, no badges on creation screen, no insurance add/edit/delete UI
- 1 requirement not yet verifiable (UNKNOWN): live end-to-end runtime behavior
- 2 scope gaps identified (Document Service auth-doc storage, appointment-scheduling screen) — both correctly out of `plan.md`'s committed scope

## Recommendations
1. **Priority 1** — Make the create-referral guard actually block, not just warn: extend the submit-button `disabled` binding in `create-referral.component.html:59` (and/or `submit()` in `.ts`) to include `deniedAuthorizations().length > 0`, and render an authorization badge on that screen, matching the referral-tracking component's pattern.
2. **Priority 2** — Build the missing insurance CRUD UI: add create/edit/delete methods to `PatientService` and a form/modal in the patient-details view so the Week 1 backend endpoints are actually reachable from the UI.
3. **Priority 3** — Close the notification loop: either surface `NotificationService` data in a component (e.g., a notifications panel on referral tracking) to satisfy "staff notified," and/or add a structured `old_status`/`new_status` pair to the authorization-change notification payload instead of relying solely on free-text `Message`.
