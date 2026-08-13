# Patient Portal — Integration Plan

**Date**: 2026-08-13
**Status**: Planning Phase (rewritten against actual repo structure — see note below)
**Target Completion**: After all 3 sub-features complete

> **Revision note**: this replaces an earlier version of this file that assumed a `services/api-gateway/` path, an `/api/patient-portal/*` gateway prefix, and an `Appointment` model already living in the Patient Service — none of which exist in this repo. The gateway (`gateway/main.py`) is a generic path-segment proxy keyed by `SERVICE_MAP`; it maps the *first* segment of `/api/{segment}/...` to a fixed upstream URL (`patients→8001, doctors→8002, referrals→8003, documents→8004, notifications→8005`). There is no support for arbitrary nested prefixes — every new resource needs its own top-level segment added to `SERVICE_MAP` (or reuses an existing segment if it belongs to an existing service). All routes below reflect that constraint.

## Overview

The Patient Portal is decomposed into 3 sub-features, built in parallel by 3 engineers, layered on top of the existing "ReferralIQ" clinician staff tool (FastAPI microservices: Patient 8001, Doctors 8002, Referral 8003, Document 8004, Notification 8005, fronted by a single API Gateway on 8000; Angular 18 standalone-component frontend on 4200). The Patient Portal is an **entirely new, separate frontend area** (`/patient-portal/*`) with its own auth, sitting alongside — not replacing — the existing clinician UI (`/`, `/login`, `/dashboard`, `/patients`, `/referrals`, `/documents`).

## Sub-Feature Dependency Graph

```
Sub-Feature 1: Referral & Appointment View  (Engineer A, foundational)
  - Patient auth service + guard (new, frontend-only)
  - PatientPortalShellComponent (new)
  - Appointment model + endpoints (new, in Referral Service 8003)
  - Referral read (ALREADY EXISTS: GET /api/referrals?patientId=)
        │
        ├── used for shell/auth by ──▶ Sub-Feature 2: Document & Form Management (Engineer B)
        │                               - File upload/download + Questionnaire subsystem (new, Document Service 8004)
        │                               - Referral dropdown data: already live, no wait needed
        │
        └── used for shell/auth by ──▶ Sub-Feature 3: Referral Progress Tracking (Engineer C)
                                        - ReferralStatusHistory (new, Referral Service 8003 — SAME FILES as Sub-Feature 1)
                                        - Notification PatientId/Read (new, Notification Service 8005)
```

The two real dependencies are **much lighter** than a typical 3-way split because the referral read path already exists in the codebase today:

- Sub-Feature 2 needs referral data for its upload-form dropdown → **already available**, zero backend work required, zero waiting.
- Sub-Feature 3 needs referral data to render its timeline → **already available** for the "current status" part; only the *history* table is new (owned entirely by Sub-Feature 3).

The dependency that **does** create real coordination overhead is a **shared-file** one, not a data one: Sub-Feature 1 and Sub-Feature 3 both add models/endpoints to `services/referral/models.py` and `services/referral/main.py`. See "Critical Path" below.

## Sub-Feature Summaries

### Sub-Feature 1: Referral & Appointment View
**Engineer**: A
**Delivers**: Patient auth (new, password-less demo picker), `PatientPortalShellComponent`, dashboard listing referrals (existing endpoint) + appointments (new `Appointment` model/endpoints added to Referral Service).
**Exports** (used by others): `PatientAuthService`, `patientAuthGuard`, `PatientPortalShellComponent`, the `/patient-portal` route subtree skeleton.
**Full spec**: `referral-appointment-view/context-map.md`

### Sub-Feature 2: Document & Form Management
**Engineer**: B
**Delivers**: Real file storage added to the Document Service (currently metadata-only), upload/download endpoints, a new Questionnaire template + response subsystem (also in the Document Service — no new microservice).
**Imports**: referral list (already live) for the upload form's referral-selector dropdown; the shared shell/auth guard from Sub-Feature 1.
**Full spec**: `document-form-management/context-map.md`

### Sub-Feature 3: Referral Progress Tracking
**Engineer**: C
**Delivers**: `ReferralStatusHistory` table hooked into the existing `_transition()` function in the Referral Service; `PatientId`/`Read` columns added to the Notification Service; patient-facing timeline + notification inbox UI.
**Imports**: current referral status (already live); the shared shell/auth guard from Sub-Feature 1.
**Full spec**: `referral-progress-tracking/context-map.md` (supersedes the earlier draft at `referral-tracking/context-map.md`, kept but stale)

## Shared Data Contracts

These are the **real** shapes, taken from the actual Pydantic schemas in the repo (PascalCase fields, `ConfigDict(from_attributes=True)`), not invented camelCase JSON:

### Referral (existing — `services/referral/schemas.py`)
```json
{
  "ReferralId": 5,
  "PatientId": 3,
  "ReferringDoctorId": 6,
  "SpecialistId": 3,
  "Reason": "Suspicious skin lesion for evaluation",
  "Priority": "Routine",
  "Status": "Accepted",
  "CreatedAt": "2026-07-09T09:00:00",
  "UpdatedAt": "2026-07-12T14:00:00"
}
```
`Status` enum: `Draft | Submitted | Accepted | Rejected | Completed`. `Priority` enum: `Routine | Urgent | Emergent`.

### Appointment (new — owned by Sub-Feature 1, added to Referral Service)
```json
{
  "AppointmentId": 1,
  "ReferralId": 5,
  "PatientId": 3,
  "ScheduledAt": "2026-08-20T10:00:00",
  "Location": "Downtown Clinic",
  "CheckInInstructions": "Please arrive 15 minutes early"
}
```

### Document (existing, extended by Sub-Feature 2 — `services/document/schemas.py`)
```json
{
  "DocumentId": 12,
  "PatientId": 3,
  "ReferralId": 5,
  "Type": "Pre-Visit Form",
  "UploadedDate": "2026-08-10",
  "FileName": "symptom_checklist.pdf",
  "StoragePath": "storage/uploads/12_symptom_checklist.pdf",
  "UploadedBy": "Patient"
}
```
`Type` enum (extended): `Lab Report | Imaging | Referral Letter | Discharge Summary | Pre-Visit Form`.

### Questionnaire / QuestionnaireResponse (new — owned by Sub-Feature 2, added to Document Service)
```json
{ "QuestionnaireId": 1, "Title": "Pre-Visit Symptom Checklist", "Description": "...", "QuestionsJson": "[{\"id\":1,\"prompt\":\"Reason for visit\",\"type\":\"text\"}]" }
```
```json
{ "ResponseId": 7, "QuestionnaireId": 1, "PatientId": 3, "ReferralId": 5, "SubmittedAt": "2026-08-10T09:00:00", "AnswersJson": "{\"1\":\"Follow-up on chest pain\"}" }
```

### ReferralStatusHistory (new — owned by Sub-Feature 3, added to Referral Service)
```json
{ "HistoryId": 1, "ReferralId": 5, "OldStatus": "Submitted", "NewStatus": "Accepted", "ChangedAt": "2026-07-12T14:00:00", "Reason": "Accepted by specialist" }
```

### Notification (existing, extended by Sub-Feature 3 — `services/notification/schemas.py`)
```json
{
  "NotificationId": 5,
  "ReferralId": 5,
  "PatientId": 3,
  "EventType": "Accepted",
  "Timestamp": "2026-07-12T14:00:00",
  "Message": "Referral #5 accepted by specialist.",
  "Read": false
}
```
`EventType` enum: `Submitted | Accepted | Rejected | Completed`. `PatientId` is nullable for backward compatibility with pre-existing seeded rows.

## API Route Structure (real gateway conventions — no invented `/patient-portal/*` prefix)

Gateway routes stay flat, keyed by the first path segment, exactly as today:

```
GET    /api/referrals?patientId=                  → Referral Service (8003) — EXISTING
GET    /api/referrals/{id}                        → Referral Service (8003) — EXISTING
GET    /api/referrals/{id}/history                 → Referral Service (8003) — NEW (Sub-Feature 3)
GET    /api/appointments?patientId=                → Referral Service (8003) — NEW (Sub-Feature 1; new SERVICE_MAP entry)
GET    /api/appointments/{id}                      → Referral Service (8003) — NEW (Sub-Feature 1)
GET    /api/documents?patientId=|referralId=        → Document Service (8004) — EXISTING
POST   /api/documents/upload                       → Document Service (8004) — NEW (Sub-Feature 2)
GET    /api/documents/{id}/download                 → Document Service (8004) — NEW (Sub-Feature 2)
GET    /api/questionnaires                          → Document Service (8004) — NEW (Sub-Feature 2)
POST   /api/questionnaire-responses                 → Document Service (8004) — NEW (Sub-Feature 2)
GET    /api/questionnaire-responses?patientId=       → Document Service (8004) — NEW (Sub-Feature 2)
GET    /api/notifications?patientId=&unreadOnly=      → Notification Service (8005) — extended (Sub-Feature 3)
PATCH  /api/notifications/{id}/read                  → Notification Service (8005) — NEW (Sub-Feature 3)
```

`gateway/main.py`'s `SERVICE_MAP` needs exactly **one** new entry for this whole feature: `"appointments": ... http://localhost:8003`. Every other new route rides on an existing segment.

## Frontend Route Structure

All Patient Portal routes live under a new `/patient-portal` subtree in `frontend/src/app/app.routes.ts`, guarded by the new `patientAuthGuard` — added alongside, not inside, the existing clinician route block:

```
/patient-portal/login                    → PatientLoginComponent (Sub-Feature 1)
/patient-portal                          → PatientPortalShellComponent (Sub-Feature 1)
/patient-portal/dashboard                → PatientDashboardComponent (Sub-Feature 1)
/patient-portal/documents                → PatientDocumentsComponent (Sub-Feature 2)
/patient-portal/documents/upload         → UploadFormComponent (Sub-Feature 2)
/patient-portal/questionnaires           → QuestionnaireListComponent (Sub-Feature 2)
/patient-portal/questionnaires/:id       → QuestionnaireDetailComponent (Sub-Feature 2)
/patient-portal/tracking/:referralId     → PatientReferralProgressComponent (Sub-Feature 3)
/patient-portal/notifications            → NotificationInboxComponent (Sub-Feature 3)
```

Existing clinician routes (`/login`, `/dashboard`, `/patients`, `/patients/:id`, `/referrals`, `/referrals/new`, `/documents`) are untouched.

## Critical Path / Key Cross-Feature Dependency

The single biggest coordination risk is **not** a data dependency — it's that **Sub-Feature 1 and Sub-Feature 3 both edit the same two backend files**: `services/referral/models.py` (Appointment vs. ReferralStatusHistory) and `services/referral/main.py` (new appointment endpoints vs. the `_transition()` history hook). If both engineers work off week-old branches, this is where merge pain happens.

**Recommendation**: Engineer A lands their Referral Service changes (Appointment model + endpoints) by end of Day 2. Engineer C rebases onto that before starting their own Referral Service changes on Day 3, rather than both branches diverging for the full week. Sub-Feature 2 has no file-level overlap with either (it lives entirely in the Document Service) and can proceed fully independently start to finish.

## Integration Phase (after all 3 sub-features pass validation)

1. **Unified navigation**: wire Documents / Questionnaires / Tracking / Notifications links into `PatientPortalShellComponent`'s nav (built by Sub-Feature 1, populated once Sub-Features 2 & 3 exist).
2. **Cross-feature navigation polish**: referral card (Sub-Feature 1) → "View Progress" link to `/patient-portal/tracking/:id`; "Upload Document" link to `/patient-portal/documents/upload?referralId=:id`.
3. **"Next steps" cross-link (optional polish, not core scope)**: Sub-Feature 3's next-steps messaging can query Document Service data to say e.g. "insurance form received" — this is additive UI polish, not a hard requirement of any single sub-feature's success criteria.
4. **Seed data consistency check**: confirm `PatientId` values line up across `services/referral/seed.py`, `services/document/seed.py`, and the backfilled `services/notification/seed.py` (all reference the same 5 seeded patients: 1=Anjali Verma, 2=Rajesh Kumar, 3=Divya Menon, 4=Suresh Iyengar, 5=Neha Bhatt).
5. **End-to-end walkthrough**: log in as a patient → see referrals/appointments → view a referral's progress timeline → upload a document from that referral → confirm it shows up in the clinician-facing `DocumentsPanelComponent` too (proves the "clinicians see patient-submitted data pre-appointment" requirement from the brief) → trigger a status transition via the clinician UI → confirm the patient sees a new timeline entry and an unread notification.
6. **Regression check on the existing clinician app**: `/dashboard`, `/patients`, `/referrals` (including submit/accept/reject/complete actions), `/documents` all still work exactly as before — none of the additive schema/model changes should have altered existing behavior.

## Validation Gates

After each sub-feature: run `/validate-patient-portal <sub-feature-name>` (validator agent), do the "Manual Verification Steps" in that sub-feature's context-map, and confirm the clinician-facing regression check above before merging.

## Rollback Notes

All backend changes in this plan are additive (new tables, new nullable columns, new endpoints) — nothing renames or removes existing fields the clinician UI depends on. A sub-feature can be reverted independently by dropping its new table(s)/columns and removing its routes/gateway entry without affecting the other two.

---
_Integration plan rewritten 2026-08-13 against actual repo structure._
