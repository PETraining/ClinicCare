# Implementation Plan: Insurance CRUD UI

## Overview

The Patient Service already fully implements insurance CRUD (model, schemas, four endpoints,
seed data — see `context-map.md` "Dependencies & Contracts"). This plan is frontend-only: wire
the existing `/api/patients/{patient_id}/insurance` endpoints into the patient details screen so
staff can add, edit, and delete insurance records without leaving that page. **Each patient is
allowed only ONE active insurance record** — the "Add Insurance" button is hidden when a record
exists, and delete operations warn that the patient will have no insurance on file if they
proceed. No backend, seed data, or API Gateway changes are in scope.

## Phase 1: Frontend Data Layer

### 1.1 Insurance request-payload model
- **File**: `frontend/src/app/core/models/patient.model.ts`
- Add an `InsuranceCreate` interface (also reused for update, since the backend's
  `InsuranceUpdate` schema is identical in shape to `InsuranceCreate` —
  `services/patient/schemas.py:56-70`):
  ```ts
  export interface InsuranceCreate {
    InsurerName: string;
    PolicyNumber: string;
    GroupNumber: string | null;
    MemberId: string;
    EffectiveDate: string;
    TerminationDate: string | null;
  }
  ```
- Leave the existing `Insurance` and `PatientDetail` interfaces (lines 23-32, 41-46) unchanged —
  they already match `InsuranceRead`.

### 1.2 PatientService CRUD methods
- **File**: `frontend/src/app/core/services/patient.service.ts`
- Add three methods alongside the existing `search()`/`loadById()` (lines 15-23), following the
  `HttpClient` + `Observable`-return pattern from `referral.service.ts:25-27`:
  - `createInsurance(patientId: number, payload: InsuranceCreate)` → `POST
    ${this.base}/${patientId}/insurance`, returns `Observable<Insurance>`.
  - `updateInsurance(patientId: number, insuranceId: number, payload: InsuranceCreate)` → `PUT
    ${this.base}/${patientId}/insurance/${insuranceId}`, returns `Observable<Insurance>`.
  - `deleteInsurance(patientId: number, insuranceId: number)` → `DELETE
    ${this.base}/${patientId}/insurance/${insuranceId}`, returns `Observable<void>`.
- After each call resolves, refresh `selected` so the display stays in sync — simplest
  codebase-consistent approach is for each method to `tap()`-refresh via a call to `loadById`
  (matching how the component already reloads on `patientId` change,
  `patient-details.component.ts:25-32`), or to update the `selected` signal's `insurance` array
  in place using the `ReferralService.applyUpdate`-style pattern (`referral.service.ts:35-37`).
  Pick one and apply it consistently across all three methods.
- Import `InsuranceCreate` from `../models/patient.model`.

## Phase 2: Frontend UI

### 2.1 Component state and handlers
- **File**: `frontend/src/app/features/patients/patient-details.component.ts`
- Add `FormsModule` to the `imports` array (currently `[RouterLink, DocumentsPanelComponent]`,
  line 12) so template-driven forms (`[(ngModel)]`, `#f="ngForm"`) are available, matching
  `create-referral.component.ts:3,15`.
- Add component state:
  - `editingInsurance = signal<Insurance | null>(null)` — non-null when editing an existing
    record; drives whether the form is in add or edit mode.
  - `showInsuranceForm = signal(false)` — controls whether the inline form is visible at all
    (hidden by default; "Add Insurance" button reveals it in add mode).
  - `insuranceForm: InsuranceCreate` — the ngModel-bound draft object, reset to blank defaults on
    "Add" and populated from the selected record on "Edit".
  - `insuranceError = signal<string | null>(null)` and `insuranceSubmitting = signal(false)`,
    mirroring `errorMessage`/`submitting` in `create-referral.component.ts:43-44`.
- Add handler methods:
  - `startAddInsurance()` — resets `insuranceForm` to blanks, sets `editingInsurance(null)`,
    `showInsuranceForm(true)`.
  - `startEditInsurance(record: Insurance)` — copies `record` fields into `insuranceForm`, sets
    `editingInsurance(record)`, `showInsuranceForm(true)`.
  - `cancelInsuranceForm()` — hides the form, clears `insuranceError`.
  - `submitInsurance()` — reads `patientId()`, calls `patientService.createInsurance(...)` or
    `patientService.updateInsurance(...)` depending on whether `editingInsurance()` is set;
    handles success (hide form, clear state) and error (`err?.error?.detail`, same pattern as
    `create-referral.component.ts:82-85`) via the `insuranceError`/`insuranceSubmitting` signals.
  - `deleteInsuranceRecord(record: Insurance)` — confirms with a message warning that the patient
    will have no insurance on file (native `confirm()`, no existing dialog-component precedent in
    this codebase per `context-map.md` risk #7; message: "Are you sure? This patient will have no
    insurance on file"), then calls `patientService.deleteInsurance(patientId,
    record.InsuranceId)`, surfacing any error via `insuranceError`.
- Import `Insurance`, `InsuranceCreate` from `../../core/models/patient.model`.

### 2.2 Template — insurance section controls and inline form
- **File**: `frontend/src/app/features/patients/patient-details.component.html`
- In the existing `<section><h2>Insurance</h2>...</section>` block (lines 46-62):
  - Add an "Add Insurance" button next to the `<h2>` that calls `startAddInsurance()` — **this
    button is hidden (`@if (patient.insurance.length === 0)`) when a record already exists**, since
    only one insurance record per patient is allowed.
  - Add "Edit" / "Delete" buttons to the insurance record (since only one exists, use `@if
    (patient.insurance.length > 0)` to conditionally render a single row with Edit/Delete), calling
    `startEditInsurance(patient.insurance[0])` and `deleteInsuranceRecord(patient.insurance[0])`
    respectively.
  - Below the list (or replacing it while active), add the inline form guarded by
    `@if (showInsuranceForm())`, using `(ngSubmit)="submitInsurance()"` and `#insF="ngForm"`,
    with labeled inputs for `InsurerName`, `PolicyNumber`, `GroupNumber` (optional), `MemberId`,
    `EffectiveDate` (`type="date"`), `TerminationDate` (`type="date"`, optional) —
    structurally mirroring the label/input layout of
    `create-referral.component.html` (lines 4-39), template-driven with `[(ngModel)]` on each
    field of `insuranceForm`.
    - Submit button label reflects mode: "Add Insurance" vs. "Save Changes"
      (`editingInsurance() ? 'Save Changes' : 'Add Insurance'`), disabled when
      `!insF.valid || insuranceSubmitting()`, matching
      `create-referral.component.html:59-61`.
    - A "Cancel" button calls `cancelInsuranceForm()`.
    - `@if (insuranceError())` renders the error message, matching
      `create-referral.component.html:55-57`'s `errorMessage()` pattern.

### 2.3 Styling
- **File**: `frontend/src/app/features/patients/patient-details.component.css`
- Add minimal styling for the new buttons/inline form (e.g. `.insurance-actions`,
  `.insurance-form`) consistent with the existing spacing/color conventions already in this file
  (`.empty` at `#94a3b8`, links at `#2563eb`, section headings at `#334155` — lines 1-33). No new
  design system or component library is introduced.

## Success Criteria

- Each patient has at most **ONE active insurance record** — the "Add Insurance" button is hidden
  when a record exists and visible only when the insurance list is empty.
- Staff can click "Add Insurance" on `/patients/:id` (when no insurance exists), fill the form,
  submit, and see the new record appear without a page navigation.
- Staff can click "Edit" on the existing insurance record, see the form pre-filled with that
  record's current values, change a field, submit, and see the updated values reflected in the
  list.
- Staff can click "Delete" on the existing insurance record, see a confirmation dialog warning
  "Are you sure? This patient will have no insurance on file", and after confirming, see it
  removed from the list and the "Add Insurance" button re-appear.
- All three operations call the existing Patient Service endpoints
  (`POST`/`PUT`/`DELETE /patients/{patient_id}/insurance[/{insurance_id}]`) with no backend,
  schema, or gateway changes.
- Errors returned by the backend (e.g. 404 on a stale insurance ID) are surfaced to the user
  in the form rather than failing silently.
- No SSN or other high-sensitivity identifier field is introduced anywhere in the insurance
  form, model, or payload — the field set stays limited to `InsurerName`, `PolicyNumber`,
  `GroupNumber`, `MemberId`, `EffectiveDate`, `TerminationDate`, matching the existing backend
  schema.

## Dependencies & Blockers

- None — the backend CRUD API this feature wires up is already built and seeded
  (`services/patient/models.py`, `schemas.py`, `main.py`, `seed.py`); this plan can start
  immediately.
- This plan closes the gap identified in `validationresult.md:77-80` during validation of the
  `insurance-authorization` feature. It does not address that feature's other open gaps
  (referral-creation authorization badges, notification consumption) — those remain out of scope
  here.
