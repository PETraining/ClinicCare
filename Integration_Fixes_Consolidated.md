# Integration Fixes — Consolidated & De-Duplicated

Built from all four teams' collision reports. Each issue below is assigned to **exactly one team** — where two reports flagged the same thing independently, only one team acts, using the logic explained under each item. One genuinely new finding (F1/F5's Appointment table-name clash) was caught only as a side-note in F2's report, missed by both F1's and F5's own investigations — flagged prominently below.

**F4-Pharmacy-Ann is already merged to master — no outstanding action for them. They're the stable base everyone else is reconciling against.**

---

## F4-Pharmacy-Ann — 0 items, plus one verification for another team

Already merged (commit `49564f4`). Owns port 8006 on `gateway/main.py`'s SERVICE_MAP, with the established `services_with_prefix` routing logic that F3's fix (item B below) needs to extend rather than replace.

No fixes needed on your side. One thing worth confirming, since your own report's collision analysis assumed F1 and F2 had the identical problem (both "removing pharmacy" on merge) — F2's own report states the opposite: they made **zero edits** to `gateway/main.py` at all. Worth a direct check before assuming F2 needs a rebase here too:

**Prompt (F2 or F4, whoever's available, run this to settle it):**
```
Fetch origin/F2-InsuranceEligibility and check whether gateway/main.py 
was modified at all compared to the merge-base with master. Confirm 
whether F2 genuinely made zero changes to this file, as their own 
report claims.
```
If confirmed, F2 needs no gateway-related fix — their task list (below) stays exactly as written. If it turns out F2 *did* touch this file, that's a new item to add to F2's list before Integration Day closes.

---

## F1-Appointments — 2 items

### A. Rebase onto current master before merging (critical)

Your branch forked before Pharmacy merged. As-is, merging would silently delete Pharmacy's live routes — no `"pharmacy"` key, and your rewritten `proxy()` replaces the prefix-stripping logic Pharmacy's routes depend on.

**Prompt:**
```
Our branch (F1-Appointments) forked before Pharmacy's feature merged to 
master. Rebase our branch onto current origin/master. Confirm after 
rebasing that gateway/main.py still contains the "pharmacy" SERVICE_MAP 
key and the services_with_prefix stripping logic — we should not have 
removed either. Show me the diff before and after the rebase.
```

### B. Remove the now-unnecessary "appointments" SERVICE_MAP key

Both you and F5.2-imp independently added this key, but it's dead weight — every appointment endpoint is already reachable via the existing `"referrals"` key. F5 already removed their copy; remove yours too.

**Prompt:**
```
Remove the "appointments" entry from gateway/main.py's SERVICE_MAP. 
Confirm first that all our appointment endpoints (POST/GET/PATCH under 
/referrals/{id}/appointments and /referrals/appointments/{id}/*) are 
already reachable through the existing "referrals" key without it.
```

---

## F2-InsuranceEligibility — 5 items

### A. Reconcile services/referral/{main,models,schemas,seed}.py with F1's already-merged appointment code

Both branches insert new code at the same point (after `complete_referral()`). Purely additive — no logic actually conflicts, just needs manual combination.

**Prompt:**
```
Fetch and merge origin/master (which now includes F1-Appointments) into 
our branch. Resolve the conflicts in services/referral/main.py, 
models.py, schemas.py, and seed.py by keeping both our authorization 
endpoints/model AND F1's appointment endpoints/model — nothing from 
either side should be removed, only combined.
```

### B. Reconcile referral-tracking.component.ts with F1's appointment UI

Same file, genuine overlapping edits — your `canAccept()` authorization guard and F1's appointment list/schedule UI both need to coexist.

**Prompt:**
```
In frontend/src/app/features/referrals/referral-tracking.component.ts, 
merge our canAccept() authorization guard logic with F1-Appointments' 
appointment list and schedule-form integration (showScheduleForm signal, 
AppointmentListComponent). Both need to work together in the same 
component — show me the merged version before committing.
```

### C. Fold your authorization_updated enum value into Lab's version of notification/schemas.py

Lab's version is the more complete one (three enum values, `Optional[ReferralId]`, new `Source` field) and is confirmed compatible with your simpler addition. Fold into theirs rather than the reverse.

**Prompt:**
```
Fetch origin/F3-DiagnosticLab and look at their version of 
services/notification/schemas.py. Add our single enum value, 
authorization_updated = "AuthorizationUpdated", into their EventType 
enum — keep their three lab-related values and their NotificationBase 
changes (Optional ReferralId, new Source field) intact. Our 
authorization notifications always carry a ReferralId, so their change 
doesn't break us.
```

### D. Add your notification helper alongside Pharmacy's already-merged one

Both append a new function to the end of `services/referral/clients.py`. Pharmacy is already on master — you're the one integrating on top of it.

**Prompt:**
```
Confirm services/referral/clients.py on master already has Pharmacy's 
create_prescription_from_referral() function, the PHARMACY_SERVICE_URL 
constant, and the logging import. Add our record_authorization_notification() 
function alongside it, without removing anything Pharmacy added.
```

### E. Rebase your docker-compose.yml frontend service addition

Your branch predates Lab's and Pharmacy's service entries landing in this file — this is rebase hygiene, not a real conflict.

**Prompt:**
```
Rebase our docker-compose.yml changes (the frontend service block) onto 
current origin/master, which now includes lab-service and 
pharmacy-service entries. Confirm our frontend block still exists and 
nothing from the other two services was lost.
```

---

## F3-DiagnosticLab — 4 items

### A. Move off port 8006 — Pharmacy already owns it on master

**Prompt:**
```
Pharmacy's service is already merged to master using port 8006. Change 
our lab-service to a different port — 8007 — in both gateway/main.py's 
SERVICE_MAP and docker-compose.yml. Show me both files after the change.
```

### B. Extend Pharmacy's existing prefix-stripping mechanism — don't replace it with your own

Pharmacy's `services_with_prefix` approach is already live on master. Add `"labs"` handling into that existing mechanism rather than introducing your separate `UNPREFIXED_SERVICES` whitelist.

**Prompt:**
```
gateway/main.py on master already has a services_with_prefix set and 
prefix-stripping logic that Pharmacy's routes depend on. Don't replace 
this with our own UNPREFIXED_SERVICES approach — instead, modify the 
existing services_with_prefix logic so it also correctly handles our 
"labs" routes (which, like pharmacy's, should NOT be prefix-stripped). 
Confirm both /api/pharmacy/* and /api/labs/* routes work correctly 
after the change.
```

### C. Resolve the shell nav-link order with Pharmacy's already-merged link

Cosmetic — just decide final order.

**Prompt:**
```
Confirm shell.component.html on master already has Pharmacy's nav link. 
Add our two nav links (Labs, Lab Tech) after it, in a sensible order. 
Show me the final nav section.
```

### D. Resolve the patient-details.component.ts imports array with Insurance's addition

Neither of you has merged yet — you're taking ownership of resolving this one since you've already done the deepest investigation of it.

**Prompt:**
```
Fetch origin/F2-InsuranceEligibility and check their change to 
patient-details.component.ts's imports array (they add FormsModule). 
Combine both additions: imports should end up as [RouterLink, 
DocumentsPanelComponent, LabResultsPanelComponent, FormsModule]. Confirm 
the corresponding .html file's two new sections (Insurance's and ours) 
don't actually overlap — they shouldn't, based on prior analysis, but 
verify directly.
```

---

## F5.2-imp (Patient Portal) — 1 new item

Your gateway "appointments" key duplicate is already resolved (commit `03220f2`) — nothing further there.

### NEW — Remove your competing Appointment model entirely

This wasn't caught in your own collision report or F1's — it surfaced only as a side-note in Insurance's investigation. Your `Appointment` model and F1's both use `__tablename__ = "appointments"`, with **incompatible schemas** (yours: `ScheduledAt`/`CheckInInstructions`; theirs: `SpecialistId`/`ScheduledDate`/`Status` with a full lifecycle). Same precedent as your gateway key: F1 owns appointment scheduling, you consume it read-only — don't maintain a competing table.

**Prompt:**
```
Our Appointment model in services/referral/models.py (or wherever we 
defined it) uses __tablename__ = "appointments" — the same table name 
F1-Appointments uses, with a different, incompatible schema. Remove our 
own Appointment model entirely. Instead, have our patient-facing 
appointment view call F1's existing endpoint (GET /referrals/{id}/appointments) 
to read appointment data, rather than maintaining our own competing 
table. Show me what changes and confirm our "view appointments" feature 
still works correctly against the real endpoint.
```

---

## Summary table

| Team | Items | Depends on |
|---|---|---|
| F1-Appointments | 2 | Must rebase before merging (blocks everyone else) |
| F2-InsuranceEligibility | 5 | Assumes F1 already merged; item A's gateway/main.py assumption needs the F4 verification above confirmed first |
| F3-DiagnosticLab | 4 | Assumes F4 (Pharmacy) already merged; coordinates directly with F2 on item D |
| F5.2-imp | 1 | Assumes F1 already merged |
| F4-Pharmacy-Ann | 0 | Already merged — no action; one verification flagged above |

**Suggested resolution order, given dependencies above:** F1 first (unblocks everyone touching referral/* and the appointments table question), then F2 and F5 in either order, then F3 last (needs to coordinate with F2 on the shared frontend import conflict).
