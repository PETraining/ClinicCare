# Patient Portal: Referral & Appointment View

**Feature Name**: Referral & Appointment View
**Sub-Feature of**: Patient Portal
**Assigned Team**: Engineer A (foundational — build first)
**Timeline**: 1 week (Days 1–5)
**Status**: Pending Implementation
**Last grounded against repo**: 2026-08-13, branch `F5.2-imp`

## Ground truth this spec is based on (read this before coding)

The existing app ("ReferralIQ") is a **clinician-facing** staff tool, not a patient-facing one:
- `frontend/src/app/core/services/auth.service.ts` — single hardcoded demo user (`Dr. Rohan Sharma`), no patient identity concept at all.
- `frontend/src/app/app.routes.ts` — flat routes (`/login`, `/dashboard`, `/patients`, `/referrals`, `/documents`) behind one `ShellComponent` + `authGuard`.
- There is **no Appointment entity anywhere** in the codebase. The only scheduling-like data is `Referral.Status` (`Draft → Submitted → Accepted/Rejected → Completed`) in `services/referral/models.py`. There is no date/time/location field for a visit.
- `services/referral/main.py` already exposes `GET /referrals?patientId=&status=` and `GET /referrals/{id}` — **this endpoint already works for patient-scoped referral reads**, reachable today via the gateway as `GET /api/referrals?patientId=1`.
- Gateway (`gateway/main.py`) is a **generic path-segment proxy**: it maps the first path segment of `/api/{segment}/...` to a fixed upstream base URL via `SERVICE_MAP` (`patients→8001, doctors→8002, referrals→8003, documents→8004, notifications→8005`). There is no `/api/patient-portal/*` prefix convention — do not invent one. New segments must be added to `SERVICE_MAP` explicitly.
- The doctor referenced by `Referral.SpecialistId` (name/specialty) comes from the Doctors Service (8002), via `GET /doctors/{id}` — there is no `/doctors/{id}` single-get shown in the excerpt read, verify and add if missing; `GET /doctors` (list) exists and is used by the frontend `DoctorService`.

**This means Sub-Feature 1 is doing more net-new work than a typical "just read existing data" dashboard**: it must (a) invent the Appointment concept as an additive, non-breaking extension of the Referral Service, and (b) build patient authentication from scratch, since none exists. See Open Questions.

## Overview

Patients can view their active referrals and (derived) upcoming appointments in a single dashboard, scoped strictly to their own `PatientId`. This sub-feature also builds the shared foundation the other two sub-features sit on: the patient-facing shell, patient auth/session, and routing skeleton under a new `/patient-portal` area — kept entirely separate from the existing clinician UI at `/`, `/login`, `/dashboard`, etc.

## Scope

### Phase 1 (Days 1–3): Backend + Patient Auth Foundation

**Deliverables**:
- New `Appointment` model in the Referral Service (additive table, does not touch the existing `referrals` table used by the clinician UI).
- New read endpoints for appointments, scoped by `patientId`.
- Gateway: register a new `appointments` segment pointing at the Referral Service.
- Patient-side auth: a lightweight, password-less "select your patient record" login, modeled after the existing clinician demo-login pattern but supporting multiple identities (since isolation must be demonstrable across patients).
- Seed data: appointments for the already-seeded `Accepted`/`Completed` referrals.

**Files to Change**:
- `services/referral/models.py` — add:
  ```python
  class Appointment(Base):
      __tablename__ = "appointments"
      AppointmentId = Column(Integer, primary_key=True, index=True)
      ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, index=True)
      PatientId = Column(Integer, nullable=False, index=True)  # denormalized for simple filtering, mirrors Referral.PatientId
      ScheduledAt = Column(DateTime, nullable=False)
      Location = Column(String, nullable=False)
      CheckInInstructions = Column(String, nullable=True)
  ```
- `services/referral/schemas.py` — add `AppointmentRead` / `AppointmentCreate` (PascalCase fields, `ConfigDict(from_attributes=True)`, matching existing style exactly).
- `services/referral/main.py` — add:
  - `GET /appointments?patientId=` (mirrors `list_referrals` filtering pattern)
  - `GET /appointments/{appointment_id}`
- `services/referral/seed.py` — add 2–3 `Appointment` rows tied to existing seeded `Accepted`/`Completed` referral IDs (5, 6, 7, 8 per the current seed comments).
- `gateway/main.py` — add one line to `SERVICE_MAP`:
  ```python
  "appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
  ```
- `services/doctors/main.py` — verify a `GET /doctors/{id}` (single) endpoint exists; if only `GET /doctors` (list) and `GET /doctors/{id}/exists` exist, add a plain single-get so the dashboard can resolve `SpecialistId → Name/Specialty` without pulling the whole list. (Read the file before assuming — the referral service only calls `/doctors/{id}/exists`.)

### Phase 2 (Days 3–5): Patient Shell, Auth Guard, Dashboard UI

**Deliverables**:
- New patient-facing route subtree `/patient-portal/*`, fully separate from the clinician shell/routes.
- Patient auth service + guard (new files, do **not** reuse or modify the clinician `AuthService`/`authGuard` — different identity model, different storage key).
- Dashboard listing the logged-in patient's referrals (via existing `/api/referrals?patientId=`) and appointments (via new `/api/appointments?patientId=`).

**Files to Change** (frontend, Angular 18 standalone + signals, following existing conventions in `core/services/*.service.ts` and `features/*`):
- `frontend/src/app/core/models/appointment.model.ts` — new, mirrors `referral.model.ts` style (`AppointmentId`, `ReferralId`, `PatientId`, `ScheduledAt`, `Location`, `CheckInInstructions`).
- `frontend/src/app/core/models/patient-session.model.ts` — new (`{ patientId: number; patientName: string }`).
- `frontend/src/app/core/services/patient-auth.service.ts` — new; signal-based (`isAuthenticated`, `currentPatient`), localStorage key `referraliq_patient_portal_session` (distinct from clinician's `referraliq_demo_user`). `login(patientId)` looks up the patient via existing `GET /api/patients/{id}` to populate the display name.
- `frontend/src/app/core/guards/patient-auth.guard.ts` — new, same `CanActivateFn` shape as `auth.guard.ts` but checks `PatientAuthService` and redirects to `/patient-portal/login`.
- `frontend/src/app/core/services/appointment.service.ts` — new, mirrors `referral.service.ts` (`loadByPatient(patientId)`).
- `frontend/src/app/features/patient-portal/shell/patient-portal-shell.component.ts` (+ `.html`/`.css`) — new layout with nav to Dashboard / Documents / Referral Tracking; `<router-outlet>`; logout button.
- `frontend/src/app/features/patient-portal/login/patient-login.component.ts` (+ `.html`) — new; a simple patient picker (dropdown sourced from `GET /api/patients`) — **do not build real password auth**, this is a demo login by design, same spirit as the existing clinician login.
- `frontend/src/app/features/patient-portal/dashboard/patient-dashboard.component.ts` (+ `.html`/`.css`) — new; renders referral cards + appointment cards for `patientAuth.currentPatient().patientId`.
- `frontend/src/app/app.routes.ts` — add a new top-level route block:
  ```ts
  { path: 'patient-portal/login', component: PatientLoginComponent },
  {
    path: 'patient-portal',
    component: PatientPortalShellComponent,
    canActivate: [patientAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PatientDashboardComponent },
      // 'documents' and 'tracking' children added by Sub-Features 2 and 3
    ],
  },
  ```
  Do not touch the existing clinician route block above it.

## Service Architecture Table

| Piece | Owning Service (port) | New/Existing |
| --- | --- | --- |
| Referral read (`GET /referrals?patientId=`) | Referral Service (8003) | **Existing** — already works, no backend change needed |
| Appointment model + `GET /appointments` | Referral Service (8003) | **New** — additive table in same service/DB |
| Doctor/specialist lookup | Doctors Service (8002) | Existing (`GET /doctors`); verify/add single-get |
| Gateway routing for `appointments` segment | API Gateway (8000) | **New** one-line `SERVICE_MAP` entry |
| Patient identity/session | Frontend only (no backend auth service exists) | **New** — `PatientAuthService`, localStorage-based, no password |
| Dashboard UI, shell, routing | Angular Frontend | **New** — `features/patient-portal/*` |

## Success Criteria

- [ ] A patient can go to `/patient-portal/login`, pick their identity, and land on `/patient-portal/dashboard`.
- [ ] Dashboard shows only referrals/appointments where `PatientId` matches the logged-in patient (verify by switching patients and confirming the lists change).
- [ ] Referral card shows: specialty (via `SpecialistId` → Doctors Service), reason, priority, status, created/updated dates.
- [ ] Appointment card shows: scheduled date/time, location, check-in instructions, and links back to its referral.
- [ ] `GET /api/appointments?patientId=X` returns only that patient's rows (gateway proxy verified end-to-end, not just service-level).
- [ ] Existing clinician routes/components (`/dashboard`, `/referrals`, `ReferralTrackingComponent`, etc.) are untouched and still work.
- [ ] Seed data provides at least 2 appointments across at least 2 different patients.

## Open Questions (resolve conservatively, document the assumption taken)

1. **Appointment scheduling data doesn't exist today.** This spec's default is a new additive `Appointment` table in the Referral Service (see Phase 1 model). An alternative would be adding `ScheduledAt`/`Location` columns directly onto the existing `Referral` table — **do not do this**, it risks changing behavior/shape of data the clinician UI and existing tests already depend on. If product later wants every `Accepted` referral to automatically imply a visit, that's a follow-up, not part of this MVP — for now, appointments are seeded/created explicitly and only loosely correlated to referral status.
2. **Patient login has no real credential model.** `Patient` (in `services/patient/models.py`) has no username/password/email field, and none should be added speculatively. Default: an unauthenticated "pick who you are" demo picker, consistent with the existing single-demo-user clinician login. Do not add a password field, and do not use DOB as a shared secret/PIN.
3. **Doctors Service single-get.** Confirm whether `GET /doctors/{id}` exists before assuming it; the referral service only relies on `/doctors/{id}/exists`. If missing, add it — it's a small, safe addition other sub-features can also use.
4. **Timezone handling for `ScheduledAt`.** Store and seed as naive UTC datetimes, consistent with `Referral.CreatedAt`/`UpdatedAt`; display as-is on the frontend for MVP (no timezone conversion).

## Integration Notes (what Sub-Features 2 & 3 can rely on immediately)

- **Referral list is already a real, live endpoint** (`GET /api/referrals?patientId=`) — Sub-Features 2 and 3 do **not** need to wait for Engineer A or mock this; it exists today in `services/referral/main.py`.
- What Sub-Features 2 & 3 **do** need from this sub-feature, and therefore should coordinate on timing for:
  - The `patient-auth.guard.ts` / `PatientAuthService` (so their routes can sit under the same guarded `/patient-portal` subtree).
  - The `PatientPortalShellComponent` (so their pages render inside the same nav/layout instead of building their own shell).
- **File-level collision risk**: Sub-Feature 3 also needs to modify `services/referral/main.py` and `services/referral/models.py` (to add status-history tracking). Both sub-features touch the same two files. Recommendation: Engineer A lands the `Appointment` model/endpoints first (Days 1–2) and pushes to the shared branch quickly so Engineer C can rebase, rather than both working from a stale copy for a full week.

## Manual Verification Steps

1. Start backend services (patient 8001, doctors 8002, referral 8003, gateway 8000) and the Angular dev server.
2. `curl http://localhost:8000/api/appointments?patientId=3` — confirm only patient 3's appointments return.
3. In the browser, go to `/patient-portal/login`, select "Divya Menon" (PatientId 3), confirm dashboard shows her referrals/appointments only.
4. Switch to a different patient via logout/login; confirm the lists change accordingly.
5. Visit `/dashboard` (clinician route) and confirm it still works unchanged.

---
_Context-map rewritten 2026-08-13 against actual repo structure (previous draft referenced a non-existent `services/api-gateway/` path and an `/api/patient-portal/*` gateway prefix that the real gateway does not support)._

---
_Implemented by patient-portal-implementor agent, invoked by Rejayi Chandra Surendran, on 2026-08-13._
