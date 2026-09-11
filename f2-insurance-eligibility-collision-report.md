# Insurance Eligibility & Prior Authorization — Branch Collision Report

**Feature branch**: `F2-InsuranceEligibility` (dev_kevin / kevincharley, arunksoman)
**Method**: verified empirically with `git merge-tree` (real 3-way merge simulation) between
`origin/F2-InsuranceEligibility` and each other real feature branch — not inferred from
context-maps or plans. Noise (`.claude/*` tooling, `.github/workflows/*`, `CLAUDE.md`
doc edits, duplicate test-file scaffolding) is excluded; only conflicts that involve our
feature's actual functional code are listed.

Branches checked: `F1-Appointments`, `F3-DiagnosticLab`, `F4-Pharmacy-Ann`, `F5.2-imp`
(Patient Portal). All other remote branches are out of scope for this report.

---

## Summary

| Branch | Real functional collision with our feature? | Files |
|---|---|---|
| F1-Appointments | **Yes** | `services/referral/{main,models,schemas,seed}.py`, `frontend/.../referral-tracking.component.ts` |
| F3-DiagnosticLab | **Yes (one file)** | `services/notification/schemas.py` |
| F4-Pharmacy-Ann | **Yes (one file)** | `services/referral/clients.py` |
| F5.2-imp (Patient Portal) | **Yes** | `services/referral/{main,models,schemas,seed}.py` |

---

## 1. F1-Appointments — `services/referral/main.py`, `models.py`, `schemas.py`, `seed.py`

**Confirmed conflict** (`git merge-tree` reports `CONFLICT (content)` on all four files).

Both branches add their new endpoints/models to the exact same insertion point in
`main.py` — immediately after the last existing function, `complete_referral()`:

- **Ours** appends `_get_authorization_or_404()` + `GET/POST/PUT /referrals/{id}/authorization`.
- **F1** appends `_get_appointment_or_404()` + `POST/GET /referrals/{id}/appointments` +
  `PATCH /referrals/appointments/{id}/{reschedule,complete,cancel}`.

Same pattern in `models.py`: we add an `authorization` relationship to `Referral` plus a
new `Authorization` model; F1 adds an `appointments` relationship to `Referral` plus a new
`Appointment` model — both edit the same trailing lines of the `Referral` class.

**Also confirmed conflict**: `frontend/src/app/features/referrals/referral-tracking.component.ts`.
We add the `canAccept()` authorization guard (disables Accept when authorization is
`Pending`/`Denied`); F1 adds the appointment list/schedule-form integration
(`showScheduleForm` signal, embedded `AppointmentListComponent`). Same component, same
region of the file, genuine overlapping edits — not just a shared file.

**Resolution needed**: manual reconciliation of both endpoint sets in `main.py`/`schemas.py`
(mechanically additive, low risk), plus a manual merge of the two independent UI additions
to `referral-tracking.component.ts` (low-medium risk — two unrelated features editing the
same template/component logic).

---

## 2. F5.2-imp (Patient Portal, Sub-Feature 1) — same files as F1, plus a deeper issue

**Confirmed conflict** on `services/referral/{main,models,schemas,seed}.py` — same
mechanism as above (F5.2-imp also appends new code immediately after `complete_referral()`
and adds its own `Appointment` model to `Referral`).

**This one is not purely additive.** F5.2-imp's `Appointment` model uses `__tablename__ =
"appointments"` — the same table name F1-Appointments also claims, with a different,
incompatible schema (`ScheduledAt`/`CheckInInstructions`, no `Status`, vs. F1's
`SpecialistId`/`ScheduledDate`/`Status` with a full lifecycle). Since our branch doesn't
touch the `Appointment` model itself, this table-name clash is between F1 and F5.2-imp, not
us — but because all three branches touch the same trailing region of `services/referral/models.py`,
whichever of F1 or F5.2-imp resolves that clash will still have to merge around our
`Authorization` addition in the same file. Flagging so our merge isn't done in isolation
from that resolution.

---

## 3. F3-DiagnosticLab — `services/notification/schemas.py`

**Confirmed conflict** (`git merge-tree` reports `CONFLICT (content)`).

Both branches extend the shared `EventType` enum and `NotificationBase` schema in the
Notification Service, in the same location:

- **Ours** adds one enum value: `authorization_updated = "AuthorizationUpdated"`.
- **F3** adds three enum values (`LabOrderCreated`, `LabResultCritical`,
  `LabResultCompleted`), makes `ReferralId` optional (lab events aren't always tied to a
  referral), and adds a new `Source` field.

Mechanically simple to resolve (union of enum values; F3's `Optional[ReferralId]`/`Source`
change is a strict superset that we're compatible with — our authorization notifications
always carry a `ReferralId`), but it is a real conflict in a shared file, not just adjacent
unrelated additions.

*(`main.py` in the Referral service is untouched by F3 — no conflict there; F3 doesn't
touch `services/referral/{main,models,schemas}.py` at all.)*

---

## 4. F4-Pharmacy-Ann — `services/referral/clients.py`

**Confirmed conflict** (`git merge-tree` reports `CONFLICT (content)`).

Both branches append a new async helper function to the end of the same file:

- **Ours**: `record_authorization_notification()` — thin wrapper around the existing
  `record_notification()`.
- **F4**: `create_prescription_from_referral()` — fire-and-forget POST to the pharmacy
  service, plus new `PHARMACY_SERVICE_URL` constant and a `logging` import at the top of
  the file.

Mechanically trivial (two independent new functions, no shared logic), but still a literal
same-file, adjacent-line conflict that needs a human to resolve, not an auto-merge.

**Note**: `services/referral/main.py` between us and F4 auto-merges *cleanly* (verified —
no conflict reported). F4 only modifies the existing `accept_referral()` endpoint body; we
never touch that function, only `list_referrals()`, `get_referral()`, and the file's tail.
So despite both branches editing `main.py`, only `clients.py` is a real conflict for this pair.

---

## Out of scope / not a collision for us

- **`gateway/main.py`**: we make zero edits (byte-identical to the shared fork point across
  all branches) — confirmed no collision, see prior review.
- **`docker-compose.yml`**: we add a `frontend` service block (containerizing the Angular
  dev server) at the tail of the file. This does produce merge-tree conflicts against
  `F3-DiagnosticLab` and `F4-Pharmacy-Ann`, but it's a rebase-hygiene issue (our branch
  predates `pharmacy-service`/`lab-service` landing in that file), not a functional
  collision with either team's actual feature — noted for awareness, not listed above.
- **CLAUDE.md, `.claude/*`, `.github/workflows/*`, duplicate `*.spec.ts` scaffolding**:
  add/add conflicts from independent doc/tooling/test-file edits, not feature logic.
