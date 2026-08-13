# Patient Portal — Feature Decomposition Plan

**Date**: 2026-08-13
**Team Size**: 3 members
**Status**: Rewritten against actual repo structure (see revision note)

> **Revision note**: an earlier version of this document (and the linked context-maps) assumed backend paths and gateway conventions that don't exist in this repo (`services/api-gateway/`, an `/api/patient-portal/*` gateway prefix, an `Appointment` model already present on the Patient Service). This version — and the context-maps it links to — were re-derived by reading the actual services (`services/patient`, `services/referral`, `services/document`, `services/notification`, `gateway/main.py`) and the actual Angular frontend (`frontend/src/app`). Use this version; treat the old `referral-tracking/context-map.md` file as stale (it has not been deleted, only superseded by `referral-progress-tracking/context-map.md`).

## Overview

The existing app ("ReferralIQ") is a clinician-facing staff tool (FastAPI microservices + Angular 18 frontend). The Patient Portal adds a brand-new, patient-facing area (`/patient-portal/*`) with its own auth, split into 3 independently buildable sub-features: (1) a referral/appointment dashboard, (2) document upload/download plus questionnaires, and (3) referral status timelines with notifications. Two of the three data dependencies a typical decomposition would create are already satisfied by existing code — `GET /api/referrals?patientId=` already works today — which keeps Sub-Features 2 and 3 largely unblocked from Sub-Feature 1's pace.

## Sub-Feature Breakdown

### Sub-Feature 1: Referral & Appointment View
**Team Member**: Engineer A
**Timeline**: Week 1, Days 1–5 (foundational — build first)
**Key Deliverables**:
- Patient auth (`PatientAuthService`, `patientAuthGuard` — new, password-less demo picker; no PII/credentials stored)
- `PatientPortalShellComponent` + `/patient-portal` route skeleton
- New `Appointment` model/endpoints added to the Referral Service (8003) — additive, since no appointment concept exists in the repo today
- Dashboard rendering referrals (existing endpoint) + appointments (new endpoint), scoped to the logged-in patient

**Spec**: `teamupdates/features/patient-portal/referral-appointment-view/context-map.md`

### Sub-Feature 2: Document & Form Management
**Team Member**: Engineer B
**Timeline**: Week 1–2, Days 1–7/10 (heaviest sub-feature — real file storage + a new Questionnaire subsystem, both from scratch)
**Key Deliverables**:
- Real file upload/download added to the Document Service (8004) — today it only stores metadata, no bytes
- New `Questionnaire`/`QuestionnaireResponse` models + endpoints, in the same service (no new microservice/port)
- Patient-facing document list, upload form (referral dropdown backed by the already-live `GET /api/referrals?patientId=`), questionnaire fill-and-submit flow

**Spec**: `teamupdates/features/patient-portal/document-form-management/context-map.md`

### Sub-Feature 3: Referral Progress Tracking
**Team Member**: Engineer C
**Timeline**: Week 1, Days 1–5 (start after Sub-Feature 1's referral-service changes land — see Critical Path)
**Key Deliverables**:
- New `ReferralStatusHistory` table, hooked into the existing `_transition()` function in the Referral Service (8003)
- `PatientId`/`Read` columns added to the Notification Service (8005); `PatientId` threaded through from the referral service's existing notification call
- Patient-facing status timeline (`/patient-portal/tracking/:referralId`) and notification inbox (`/patient-portal/notifications`) — named/routed to avoid collision with the existing clinician `ReferralTrackingComponent` at `/referrals`

**Spec**: `teamupdates/features/patient-portal/referral-progress-tracking/context-map.md`

## Team Assignment at a Glance

| Engineer | Sub-Feature | Primary Services Touched | Timeline | Starts |
| --- | --- | --- | --- | --- |
| A | Referral & Appointment View | Referral Service (8003, new `Appointment`), Gateway (1-line `SERVICE_MAP` add), Frontend (new shell/auth) | Week 1, Days 1–5 | Day 1 (foundational) |
| B | Document & Form Management | Document Service (8004, file storage + Questionnaire subsystem) | Week 1–2, Days 1–7/10 | Day 1 (no blocking dependency) |
| C | Referral Progress Tracking | Referral Service (8003, `ReferralStatusHistory`), Notification Service (8005, `PatientId`/`Read`) | Week 1, Days 1–5 | Day 3, after rebasing onto A's referral-service changes |

## Critical Path / Key Cross-Feature Dependency

**This is a file-collision dependency, not a data dependency.** Engineer A and Engineer C both add models/endpoints to the same two files: `services/referral/models.py` and `services/referral/main.py` (A adds `Appointment`, C adds `ReferralStatusHistory` + a hook inside the existing `_transition()` function). Engineer B has zero file overlap with either (all of Sub-Feature 2 lives in the Document Service) and is **not** blocked on anything — the referral data it needs (`GET /api/referrals?patientId=`) already exists in the codebase today.

Sequencing to avoid merge pain:
1. **Days 1–2**: Engineer A lands the `Appointment` model + endpoints + gateway `SERVICE_MAP` entry in the Referral Service, and pushes to the shared integration branch.
2. **Day 3**: Engineer C rebases onto that before starting the `ReferralStatusHistory` work in the same files.
3. **Days 1–5 (parallel, unblocked)**: Engineer B builds the entire Document & Form Management sub-feature independently.
4. **Days 3–5**: All three build their frontend components against the shared `PatientPortalShellComponent`/`patientAuthGuard` from Engineer A (available by end of Day 2).

## Parallel Work Timeline

```
Days 1–2   Engineer A: patient auth + shell + Appointment model/endpoints  ████████░░░░░░░░░░░░░░░░
           Engineer B: Document Service file storage + Questionnaire models ████████░░░░░░░░░░░░░░░░
           Engineer C: reading spec, prepping Notification schema changes   ████░░░░░░░░░░░░░░░░░░░░

Days 3–5   Engineer A: dashboard UI, routing, integration polish            ░░░░░░░░████████░░░░░░░░
           Engineer B: upload/download + questionnaire UI                   ░░░░░░░░████████░░░░░░░░
           Engineer C: rebase onto A's referral changes, build history +    ░░░░░░░░████████░░░░░░░░
                        notification patch + timeline/inbox UI

Days 6–10  Engineer B: remaining Document & Form Management polish (heaviest scope, may run 1 extra week)
           Integration phase: nav wiring, seed data consistency, end-to-end walkthrough, clinician regression check
```

## Coordination & Dependencies

### Kick-off
1. All three engineers read this file and `INTEGRATION_PLAN.md`.
2. Each engineer reads their own context-map — and reads the actual source files it references (`services/referral/main.py`, `services/document/models.py`, `services/notification/models.py`, `gateway/main.py`, `frontend/src/app/app.routes.ts`) before writing code, since the specs are grounded in exact current file contents that will keep changing as the feature is built.
3. Engineer A and Engineer C explicitly agree on the Day 2→Day 3 handoff for `services/referral/*`.

### Validation Gates
After each sub-feature: run `/validate-patient-portal <sub-feature-name>`, complete the "Manual Verification Steps" in that context-map, and confirm the existing clinician-facing routes/components (`/dashboard`, `/patients`, `/referrals`, `/documents`) still work unchanged — every backend change in this plan is additive (new tables/columns/endpoints), so a regression there indicates a mistake, not an expected tradeoff.

## Success Metrics

- [ ] All 3 sub-features complete per their context-maps
- [ ] All 3 pass validator agent checks
- [ ] End-to-end walkthrough in `INTEGRATION_PLAN.md` passes (patient views referral → views progress timeline → uploads document → clinician sees it in the existing `DocumentsPanelComponent` → clinician transitions referral status → patient sees new timeline entry + unread notification)
- [ ] No regression in the existing clinician-facing app
- [ ] No sensitive identifiers (SSN, government ID, insurance policy numbers, etc.) introduced anywhere in schemas, seed data, or sample questionnaire content

---
_Generated by patient-portal-planner agent, 2026-08-13, grounded against the actual `d:\training\ClinicCare` repository contents rather than assumed conventions._
