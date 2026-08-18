# ClinicCare: Insurance CRUD UI — Context Map

**Feature summary**: Wire the already-built Patient Service insurance CRUD endpoints up to the
patient details screen so front-desk/intake staff can add, edit, and delete a patient's insurance
records from within ClinicCare, instead of only viewing them read-only (or editing via seed data /
direct API calls).

## Entrypoint

- **Angular route/component**: `/patients/:id` → `PatientDetailsComponent`
  (`frontend/src/app/features/patients/patient-details.component.ts`, routed at
  `frontend/src/app/app.routes.ts:23`). This is the existing screen that already renders the
  patient's insurance list read-only
  (`frontend/src/app/features/patients/patient-details.component.html:46-62`); the new CRUD
  affordances (add/edit/delete controls + inline form) are added to this same component/template,
  not a new route.
- **API Gateway**: `/api/patients/*` is proxied by the generic path-prefix proxy in
  `gateway/main.py:7-13,29-54` — the `"patients"` segment maps to
  `PATIENT_SERVICE_URL` (default `http://localhost:8001`). The gateway has no per-route
  allowlist; any verb/path under `/api/patients/...` (including the insurance sub-resource) is
  already proxied transparently. No gateway change is required.
- **Backend endpoints** (already implemented, `services/patient/main.py:71-109`):
  - `GET /patients/{patient_id}/insurance` — list (line 71)
  - `POST /patients/{patient_id}/insurance` — create, 201 (line 82)
  - `PUT /patients/{patient_id}/insurance/{insurance_id}` — update (line 92)
  - `DELETE /patients/{patient_id}/insurance/{insurance_id}` — delete, 204 (line 104)
  - Insurance records are also returned embedded in `GET /patients/{patient_id}` via
    `PatientDetail.insurance` (`services/patient/schemas.py:99-103`,
    `services/patient/main.py:33-48`).

## Data Flow

1. Staff opens a patient's detail page → `PatientDetailsComponent` effect
   (`patient-details.component.ts:25-32`) calls `patientService.loadById(id)`, which `GET`s
   `/api/patients/{id}` and populates the `selected` signal (`patient.service.ts:21-23`),
   including the current `insurance[]` array.
2. **Add**: staff clicks an "Add Insurance" control (new) → an inline form section becomes visible
   in `patient-details.component.html` → on submit, the component calls a new
   `patientService.createInsurance(patientId, payload)` → `POST
   /api/patients/{patientId}/insurance` → gateway proxies to Patient Service (8001) → `main.py`
   `create_insurance` (line 82) validates via `InsuranceCreate`, inserts an `Insurance` row scoped
   to `PatientId`, commits, returns `InsuranceRead` (201).
3. **Edit**: staff clicks "Edit" on an existing insurance row → form pre-populates from that
   record → on submit, component calls `patientService.updateInsurance(patientId, insuranceId,
   payload)` → `PUT /api/patients/{patientId}/insurance/{insuranceId}` → `update_insurance`
   (line 92) looks the record up scoped to both IDs via `_get_insurance_or_404` (line 58-68, 404
   if patient/insurance pair doesn't match), overwrites all `InsuranceUpdate` fields, commits,
   returns the updated `InsuranceRead`.
4. **Delete**: staff clicks "Delete" → confirmation → `patientService.deleteInsurance(patientId,
   insuranceId)` → `DELETE /api/patients/{patientId}/insurance/{insuranceId}` → `delete_insurance`
   (line 104) same lookup guard, deletes row, 204 no content.
5. **UI refresh**: after any create/edit/delete resolves, the component re-syncs `selected()` —
   either by re-invoking `patientService.loadById(patientId)` (matches the existing read pattern
   used by the component today) or by having the service mutate the `selected` signal's
   `insurance` array in place (the `ReferralService.applyUpdate`/`applyAuthorization` pattern at
   `referral.service.ts:35-37,67-71` is the closest existing precedent for optimistic in-signal
   updates without a full reload). Either approach is codebase-grounded; which one
   `requirement-implementor` picks is a plan-level implementation detail, not a contract change.
6. No inter-service `httpx` calls are involved (insurance is entirely Patient Service data) and no
   notification event exists or is expected for insurance changes — `services/notification` is
   not part of this flow, unlike the authorization-status-change events in the
   `insurance-authorization` feature (`teamupdates/insurance-authorization/plan.md:62-65`).

## Dependencies & Contracts

- **Depends on** (must not break): the existing Patient Service `Insurance` model
  (`services/patient/models.py:55-67`), `InsuranceCreate`/`InsuranceUpdate`/`InsuranceRead`
  schemas (`services/patient/schemas.py:56-77`), and the four endpoints listed under Entrypoint —
  all pre-existing and already exercised by seed data (`services/patient/seed.py:5,15,31,47,66,
  82,100-101`). This feature is UI-only; **no backend model, schema, or endpoint changes are
  required or in scope** unless codebase exploration during implementation reveals a defect in
  those endpoints (out of scope to fix proactively per this plan — see Risk Areas).
- **Contract consumed** — request/response bodies the frontend must match exactly:
  - `InsuranceCreate`/`InsuranceUpdate` request body: `InsurerName: string` (required),
    `PolicyNumber: string` (required), `GroupNumber: string | null` (optional), `MemberId: string`
    (required), `EffectiveDate: date` (required, ISO `YYYY-MM-DD`), `TerminationDate: date | null`
    (optional). Note `InsuranceUpdate` is a full-replace shape identical to `InsuranceBase` (no
    partial/PATCH semantics) — the edit form must submit all fields, not just changed ones.
  - `InsuranceRead` response adds `InsuranceId: int`, `PatientId: int` to the above.
  - This matches the existing frontend `Insurance` model 1:1
    (`frontend/src/app/core/models/patient.model.ts:23-32`) — no model interface change needed,
    though a new `InsuranceCreate`/`InsuranceUpdate` request-shape type (omitting `InsuranceId`/
    `PatientId`) should be added alongside it for the new service methods, following the
    `ReferralCreate`/`AuthorizationUpdate` naming convention already used in
    `frontend/src/app/core/models/referral.model.ts`.
  - HTTP status codes to handle: 201 (create), 200 (update), 204 (delete), 404 (patient or
    insurance-record-for-patient not found — surfaced today as a generic HTTPException detail
    string, not a structured error body).
- **Depends on / blocks other features**: This feature is the direct, previously-identified
  follow-up to `insurance-authorization`
  (`teamupdates/insurance-authorization/`) — that feature's Week 1 backend build included this
  exact Insurance model/CRUD API, and its Week 2 frontend build only ever consumed insurance
  read-only. The gap was formally logged during validation of that feature
  (`validationresult.md:77-80`, `teamupdates/insurance-crud-ui/intent.txt`). This feature does not
  block `insurance-authorization`'s own remaining gaps (e.g., the referral-creation
  authorization-badge and notification-consumption gaps also noted in `validationresult.md:82-90`
  and `108-110`) — those are out of scope here.

## Where This Epic Lives

- **Backend**: none — no new files, no changes to `services/patient/models.py`,
  `schemas.py`, or `main.py` are planned. (If implementation-time testing surfaces a genuine
  backend defect in the existing insurance endpoints, that's a risk/finding to report, not silent
  in-scope work — see Risk Areas.)
- **API Gateway**: none — `gateway/main.py`'s generic `/api/{full_path:path}` proxy already
  covers `/api/patients/{id}/insurance...` via the existing `"patients"` → `PATIENT_SERVICE_URL`
  mapping (`gateway/main.py:7-13`). No new route entries needed.
- **Frontend — service layer**: extend
  `frontend/src/app/core/services/patient.service.ts` (currently only `search()` and
  `loadById()`, lines 15-23) with `createInsurance`, `updateInsurance`, `deleteInsurance` methods
  following the `HttpClient` + `Observable`-return pattern used by
  `frontend/src/app/core/services/referral.service.ts:25-27` (`create()`).
- **Frontend — model layer**: extend `frontend/src/app/core/models/patient.model.ts` with an
  insurance request-payload type (e.g. `InsuranceCreate`), mirroring the existing
  `Insurance` interface (lines 23-32) minus `InsuranceId`/`PatientId`.
- **Frontend — UI**: extend the existing insurance section of
  `frontend/src/app/features/patients/patient-details.component.html` (lines 46-62) and
  `patient-details.component.ts` — add per-row Edit/Delete controls and an inline add/edit form,
  following the reactive form pattern already used by
  `frontend/src/app/features/referrals/create-referral.component.ts`/`.html` (`FormsModule` +
  `[(ngModel)]` + template-driven `#f="ngForm"`, not Angular Reactive Forms — no
  `ReactiveFormsModule` usage exists anywhere in this codebase, confirmed by inspecting
  `create-referral.component.ts:1-3` and `patients-list.component.ts:1-3`). This is a **new UI
  section within the existing component**, not a new Angular feature folder or new route — the
  intent doc's phrasing ("form/modal... without leaving the patient details page") and the
  absence of any modal/dialog infrastructure anywhere in `frontend/src/app` (confirmed via
  repo-wide search for "modal"/"dialog" — no matches) both point to an inline, in-page form
  section rather than an overlay dialog. Styling extends
  `frontend/src/app/features/patients/patient-details.component.css` (existing `.grid`/`section`
  conventions, lines 11-22).
- **Seed/test data**: no change — `services/patient/seed.py` already seeds insurance records
  (lines 15, 31, 47, 66, 82, 100-101), sufficient for manually exercising the new UI against
  existing patients.

## Risk Areas / Unknowns

1. **No DB migration needed, confirmed** — the `Insurance` table
   (`services/patient/models.py:55-67`) and all four CRUD endpoints already exist and are already
   exercised by seed data. This is *not* a risk, but it is worth stating explicitly since the raw
   ask ("CRUD UI (and any needed backend support)") left open whether backend work was needed —
   verified it is not, per Step 3 grounding.
2. **`InsuranceUpdate` is full-replace, not partial** — the PUT endpoint
   (`services/patient/main.py:92-101`) overwrites every field from the request body with no
   partial-update support. If the edit form only pre-populates a subset of fields, or omits
   optional fields the user didn't touch, submitting will null them out server-side. The
   implementor must ensure the edit form pre-fills and resubmits all six fields on every update.
3. **PII/sensitive-data constraint** — the existing `Insurance` schema
   (`services/patient/schemas.py:56-62`) already avoids modeling SSN or other high-sensitivity
   identifiers (fields are limited to `InsurerName`, `PolicyNumber`, `GroupNumber`, `MemberId`,
   `EffectiveDate`, `TerminationDate`). Per org policy, this must remain the case — if
   implementation or later review considers adding fields like a subscriber SSN, that must be
   flagged and avoided, not added to satisfy some perceived completeness of the insurance record.
   No such addition is in scope here since no schema change is planned.
4. **Auth on write operations** — `authGuard` (`frontend/src/app/core/guards/auth.guard.ts`,
   referenced in `app.routes.ts:3,18`) protects the whole `/patients/:id` route at the Angular
   router level, but the backend insurance POST/PUT/DELETE endpoints themselves have no
   authentication/authorization check in `services/patient/main.py` — same as every other write
   endpoint in this codebase (e.g. patient creation, line 112). This is a pre-existing,
   codebase-wide gap, not something introduced by this feature, but it means the new UI is not
   adding any *new* backend exposure beyond what already exists for `POST /patients`. Flagging as
   inherited risk rather than new risk.
5. **Error-message surfacing is ambiguous** — the backend returns `HTTPException(detail=...)`
   plain-text-ish JSON on 404s (e.g. "Insurance {id} not found for patient {id}"); the closest
   existing frontend precedent for surfacing such errors is `create-referral.component.ts:82-85`
   (`err?.error?.detail`). Whether the new insurance form should show inline field errors,
   a toast, or reuse that same `errorMessage` signal pattern is left as an implementation-time
   choice — not resolved here.
6. **Add-vs-edit UI shape is not fully prescribed by the source ask** — `intent.txt` says
   "form/modal" without specifying whether add and edit use the same form instance toggled by
   state, two separate forms, or a shared row-inline edit. Given the absence of any modal
   precedent (see "Where This Epic Lives"), the natural codebase-grounded choice is a single
   inline form (add mode when no row selected, edit mode when a row's Edit is clicked), but this
   is a UI-composition decision for the implementor, not settled here.
7. **Delete confirmation UX has no precedent in this codebase** — no existing delete/destructive
   action anywhere in the current frontend prompts for confirmation (no delete buttons exist yet
   elsewhere in `frontend/src/app/features`). Whether to use a native `confirm()` dialog or an
   inline "are you sure" state is left open.

<!-- Implemented by: claude-haiku on 2026-08-18 -->
