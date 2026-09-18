# Patient Portal: Referral Progress Tracking

**Feature Name**: Referral Progress Tracking
**Sub-Feature of**: Patient Portal
**Assigned Team**: Engineer C
**Timeline**: 1 week (Days 1–5) — the "wait for Sub-Feature 1's referral-service changes" condition below is now satisfied (see Status)
**Status**: Pending Implementation. **Update (2026-09-10)**: Sub-Feature 1's `services/referral/models.py`/`main.py` changes (the `Appointment` table + endpoints) have already landed on branch `F5.3-IMP`. Engineer C no longer needs to wait or coordinate a rebase — start directly against the current `main.py`/`models.py`, adding `ReferralStatusHistory` alongside the existing `Appointment` model. `ReferralStatusHistory` and `Notification.PatientId`/`Read` themselves are still **not** present in the codebase; this sub-feature's Phase 1/2 scope below is entirely unbuilt.
**Last grounded against repo**: 2026-09-10, branch `F5.3-IMP` (re-confirmed against current `services/referral/*` and `services/notification/*`; original grounding was 2026-08-13 against branch `F5.2-imp`)

> Note: an earlier draft of this spec lived at `teamupdates/features/patient-portal/referral-tracking/context-map.md`. This file supersedes it — the directory name changed to `referral-progress-tracking` to avoid confusion with the existing clinician-facing `ReferralTrackingComponent` at `frontend/src/app/features/referrals/referral-tracking.component.ts` (see Open Question 3). The old file was left in place; treat this one as canonical.

## Ground truth this spec is based on (read this before coding)

- `services/referral/models.py`'s `Referral` has only a **current** `Status` — there is no history table. Status changes happen in `services/referral/main.py`'s `_transition()` helper (`submit`/`accept`/`reject`/`complete`), which already calls `clients.record_notification(referral.ReferralId, next_status, message)` on every transition (see `services/referral/clients.py`).
- `services/notification/models.py`'s `Notification` has **no `PatientId` and no `Read`/unread flag** — only `NotificationId, ReferralId, EventType, Timestamp, Message`. A patient-facing inbox needs both.
- `clients.record_notification()` posts `{"ReferralId", "EventType", "Message"}` to `POST /notifications` on the Notification Service — it does **not** currently send `PatientId`. Adding `PatientId` to notifications requires a small change on both sides: the Notification Service's model/schema, and the Referral Service's `clients.py`/`_transition()` call site (the referral object already has `PatientId` in scope — it just isn't passed through today).
- There is an **existing, unrelated, clinician-facing component already named "referral tracking"** (`ReferralTrackingComponent`, route `/referrals`) that lists *all* referrals with accept/reject/submit/complete actions for staff. This sub-feature is a different, read-only, patient-facing view. Do not reuse the name, the route, or the component — pick distinct names (this spec uses `PatientReferralProgressComponent` at `/patient-portal/tracking`).

## Overview

Patients can see the status history of each of their referrals as a timeline (e.g., Submitted → Accepted → Completed, with dates and reasons) and get notified when a status changes. This requires two additive backend changes: a new `ReferralStatusHistory` table in the Referral Service, and `PatientId`/`Read` columns on the Notification Service's `Notification` table.

## Scope

### Phase 1 (Days 1–3): Backend — status history + patient-aware notifications

**Deliverables**:
- New `ReferralStatusHistory` table, populated automatically inside the existing `_transition()` function (one new row per transition — no change to the transition logic itself, just an added `db.add(...)` before/after commit).
- `Notification` gains `PatientId` (nullable — existing seeded rows won't have it) and `Read` (default `False`).
- `clients.record_notification()` in the Referral Service passes `PatientId` through.
- New read endpoints: referral history, and a patient-scoped/unread-filterable notification list + mark-as-read.

**Files to Change**:
- `services/referral/models.py` — add:
  ```python
  class ReferralStatusHistory(Base):
      __tablename__ = "referral_status_history"
      HistoryId = Column(Integer, primary_key=True, index=True)
      ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, index=True)
      OldStatus = Column(String, nullable=False)
      NewStatus = Column(String, nullable=False)
      ChangedAt = Column(DateTime, nullable=False)
      Reason = Column(String, nullable=True)
  ```
- `services/referral/schemas.py` — add `ReferralStatusHistoryRead`.
- `services/referral/main.py` — inside `_transition()` (after `referral.Status = next_status` / before or alongside the existing `db.commit()`), insert a `ReferralStatusHistory` row capturing `required_status → next_status`. Add `GET /referrals/{referral_id}/history`. **This function already exists and is shared** — make a minimal, additive change; do not restructure the transition logic.
- `services/referral/clients.py` — extend `record_notification(referral_id, event_type, message, patient_id)` to include `PatientId` in the POST body; update the one call site in `main.py`'s `_transition()` to pass `referral.PatientId`.
- `services/notification/models.py` — add:
  ```python
  PatientId = Column(Integer, nullable=True, index=True)  # nullable: legacy seeded rows predate this field
  Read = Column(Boolean, nullable=False, default=False)
  ```
- `services/notification/schemas.py` — add `PatientId: Optional[int]` and `Read: bool` to `NotificationBase`/`NotificationRead`; add `NotificationCreate` support for the new field (default `None` for backward compatibility if any other caller doesn't send it yet).
- `services/notification/main.py` — extend `list_notifications` to accept `patientId` and `unreadOnly` query params; add `PATCH /notifications/{id}/read`.
- `services/referral/seed.py` — add `ReferralStatusHistory` rows mirroring the existing seeded status progressions (the seed file's own comments already document the intended history per referral, e.g. referral 5: Submitted 2026-07-10 → Accepted 2026-07-12).
- `services/notification/seed.py` — backfill `PatientId` on the existing `SEED_NOTIFICATIONS` entries (cross-reference `ReferralId` against `services/referral/seed.py`'s `PatientId` comments, e.g. `ReferralId=5` belongs to `PatientId=3`).

### Phase 2 (Days 3–5): Frontend — timeline + notification inbox

**Deliverables**:
- Read-only timeline view per referral.
- Notification inbox with unread badge and mark-as-read.

**Files to Change**:
- `frontend/src/app/core/models/referral-history.model.ts` — new (`ReferralStatusHistory` interface).
- `frontend/src/app/core/models/notification.model.ts` — extend `NotificationEvent` with `PatientId: number | null` and `Read: boolean` (additive; existing clinician notification usage, if any, keeps working since these are optional/new fields).
- `frontend/src/app/core/services/referral-history.service.ts` — new; `loadForReferral(referralId)`.
- `frontend/src/app/core/services/notification.service.ts` — extend or add a patient-scoped method (`loadByPatient(patientId, unreadOnly?)`, `markRead(id)`); check the existing service first — if it's only used by clinician screens today, prefer adding new methods rather than changing existing call signatures.
- `frontend/src/app/features/patient-portal/tracking/patient-referral-progress.component.ts` (+ `.html`/`.css`) — new; per-referral timeline (status → date → reason), plus a simple "next steps" message derived from current `Status` (e.g., `Submitted` → "Awaiting specialist review"; `Accepted` → "Appointment will be scheduled"). Route: `/patient-portal/tracking/:referralId`.
- `frontend/src/app/features/patient-portal/notifications/notification-inbox.component.ts` (+ `.html`) — new; list + unread count + mark-as-read. Route: `/patient-portal/notifications`.
- `frontend/src/app/app.routes.ts` — add children under the `patient-portal` route added by Sub-Feature 1:
  ```ts
  { path: 'tracking/:referralId', component: PatientReferralProgressComponent },
  { path: 'notifications', component: NotificationInboxComponent },
  ```

## Service Architecture Table

| Piece | Owning Service (port) | New/Existing |
| --- | --- | --- |
| Referral status history | Referral Service (8003) | **New** table + endpoint; hooks into existing `_transition()` |
| Notification patient-awareness (`PatientId`, `Read`) | Notification Service (8005) | **New** columns + endpoints |
| Notification emission on status change | Referral Service (8003) → Notification Service (8005) | Existing call path (`clients.record_notification`), extended to include `PatientId` |
| Referral current status/detail | Referral Service (8003), via existing `GET /referrals/{id}` | Existing, no change |
| Gateway routing | API Gateway (8000) | No change — `referrals` and `notifications` segments already proxy correctly |

## Success Criteria

- [ ] `GET /api/referrals/{id}/history` returns a chronological list of status changes with dates.
- [ ] Triggering a real transition (`PATCH /api/referrals/{id}/accept`, etc.) creates a new history row **and** a notification with the correct `PatientId` in the same call — verify both side effects, not just one.
- [ ] `GET /api/notifications?patientId=X&unreadOnly=true` returns only that patient's unread notifications.
- [ ] `PATCH /api/notifications/{id}/read` flips `Read` to `true` and the inbox reflects it without a full reload.
- [ ] Patient-facing timeline component is reachable at a route distinct from the existing clinician `ReferralTrackingComponent`/`/referrals`, and neither interferes with the other.
- [ ] Legacy seeded notifications (pre-`PatientId`) don't crash the new patient-scoped endpoints — they're simply excluded when `patientId` is specified and the row's `PatientId` is `null`, unless seed data has been backfilled per Phase 1.

## Open Questions (resolve conservatively, document the assumption taken)

1. **Reason on status transitions.** `_transition()` today has no free-text "reason" input (e.g., why a referral was rejected) — transitions are just `PATCH /referrals/{id}/accept` with no body. Default: `Reason` on `ReferralStatusHistory` is populated with a generic message derived from the transition itself (e.g., "Accepted by specialist"), matching the tone of existing notification messages in `clients.record_notification` calls. If product wants clinicians to type a real rejection reason, that's a new input on the *clinician* reject flow — out of scope for this patient-facing sub-feature.
2. **Notification delivery channel.** The brief says "receive notifications on status changes" — the existing `Notification` model has no channel/delivery field (email/SMS/push), it's just a persisted row the frontend polls via GET. Default: in-app inbox only (poll-on-navigate, no push/email/websocket). If real email/push is required, that's a materially larger scope addition — flag before building.
3. **Naming collision with the existing clinician `ReferralTrackingComponent`.** Resolved in this spec by using `PatientReferralProgressComponent` / `/patient-portal/tracking` — confirm this doesn't conflict with whatever route names Sub-Feature 1 sets up for the shell nav links.
4. **Backfilling `PatientId` on legacy `Notification` rows.** Since `services/notification/seed.py`'s rows predate this field, either backfill them in `seed.py` (recommended, keeps demo data fully functional) or accept that pre-existing seeded notifications simply won't show up in the patient inbox until backfilled. This spec recommends backfilling since the mapping is fully knowable from the referral seed comments.

## Integration Notes (cross-feature dependencies — this is the critical path)

- **Same-file collision with Sub-Feature 1 — now resolved.** Both this sub-feature (`ReferralStatusHistory` + `_transition()` hook) and Sub-Feature 1 (`Appointment` model + endpoints) modify `services/referral/models.py` and `services/referral/main.py`. As of 2026-09-10, Sub-Feature 1's changes to those two files are already merged on branch `F5.3-IMP`, so there is no live rebase risk anymore — Engineer C should branch from the current `F5.3-IMP` tip and add `ReferralStatusHistory` additively alongside the existing `Appointment` class, leaving it untouched.
- **Depends on Sub-Feature 1** for the shared `PatientPortalShellComponent`/`patientAuthGuard` only — the referral *data* dependency (`GET /referrals/{id}`) already exists and is stable today, no mocking needed.
- **Does not depend on Sub-Feature 2.** "Next steps" messaging in this sub-feature is derived purely from `Referral.Status`; it does not need to query Document Service state for the MVP (a richer "next steps: upload your insurance form" cross-link is integration-phase polish, not core scope — see `INTEGRATION_PLAN.md`).

## Manual Verification Steps

1. `curl -X PATCH http://localhost:8000/api/referrals/1/submit` then `curl http://localhost:8000/api/referrals/1/history` — confirm a new history row appears.
2. `curl http://localhost:8000/api/notifications?patientId=1` — confirm the notification from step 1 has the correct `PatientId`.
3. In the browser, log in as the patient who owns referral 1, navigate to `/patient-portal/tracking/1`, confirm the timeline shows the new status.
4. Check `/patient-portal/notifications`, confirm the new notification appears unread; mark it read; confirm it updates.
5. Visit the existing clinician `/referrals` route and confirm it still lists/accepts/rejects referrals exactly as before.

---
_Context-map written 2026-08-13 against actual repo structure. Supersedes the draft previously at `referral-tracking/context-map.md` (not deleted, but stale)._
