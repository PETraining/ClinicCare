# DiagnosticLab (Lab Service) — Confirmed Cross-Team Collisions

**Scope:** Only collisions where **our feature (`F3-DiagnosticLab` / `dev_ebin`, the Lab Service)** is one of the two parties. Collisions between *other* teams that don't involve Lab (e.g. the `Appointment` model clash between `F1-Appointments` and `F5.2-imp`) are intentionally excluded — see `.claude/plans/look-in-the-directory-compiled-thimble.md` for those.

**Method:** Every finding below is a diff against real code on the actual branches (`git diff master origin/<branch> -- <file>`), not against planning docs. Branches compared: `F1-Appointments`, `F2-InsuranceEligibility`, `F4-Pharmacy-Ann`, `F5.2-imp` (the 5 branches confirmed as "real" for this session) vs. our `F3-DiagnosticLab`. `F1-Appointments` and `F5.2-imp` touch none of the files Lab touches — no collision found with either.

**Snapshot date:** 2026-08-19

---

## 1. `gateway/main.py` — vs. `F4-Pharmacy-Ann` — ⚠️ ALREADY LIVE ON MASTER

**Severity: highest.** This is not a future risk sitting in two parallel branches — `F4-Pharmacy-Ann`'s version of this file is **already merged into `master`** (PR #18, commit `49564f4 Merge pull request #18 from PETraining/F4-Pharmacy-Ann`, confirmed via `git merge-base --is-ancestor`). `master`'s `gateway/main.py` is byte-for-byte identical to `F4-Pharmacy-Ann`'s (`git diff` between them is empty). Our `"labs"` entry is not on `master` at all yet.

Three concrete problems if/when `F3-DiagnosticLab` merges as-is:

1. **`SERVICE_MAP` dict — same insertion point.** Both branches add their new key immediately after the `"notifications"` line, right before the closing `}`:
   ```python
   # ours
   "notifications": ...,
   "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8006"),
   }
   # theirs (already on master)
   "notifications": ...,
   "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
   }
   ```
   Different keys, so no key gets silently overwritten — but adjacent insertions anchored at the exact same context line are exactly the pattern that trips up a 3-way merge.

2. **`proxy()` function body — two incompatible rewrites of the same lines.** We independently solved "strip the service-name segment before forwarding" two different ways:
   - Ours: `UNPREFIXED_SERVICES = {"labs"}` — a whitelist of segments *to strip*, computed into a `downstream_path` variable, used in `f"{base_url}/{downstream_path}"`.
   - Theirs (live on master): `services_with_prefix = {"patients", "doctors", "referrals", "documents", "notifications"}` — the *inverse* whitelist (segments to *keep* prefixed), computed into `upstream_path`, used in `f"{base_url}{upstream_path}"` (no literal `/`, already baked in).

   These edit the same lines inside `async def proxy(...)` — a real git merge conflict, not a hypothetical one.

3. **Functional risk if "resolved" naively.** Confirmed Pharmacy's actual routes (`services/pharmacy/main.py`): `/medications`, `/prescriptions`, `/inventory/low-stock` — none prefixed with `/pharmacy`, exactly like Lab's `/tests`, `/orders` aren't prefixed with `/labs`. **Both services need their segment stripped.** If a merge keeps master's `services_with_prefix` set and just adds `"labs"` to `SERVICE_MAP` without also reconciling the stripping logic, `/api/labs/tests` would forward to `{LAB_SERVICE_URL}/tests` correctly by coincidence (labs isn't in `services_with_prefix` either) — but if it instead keeps our `UNPREFIXED_SERVICES` set without adding `"pharmacy"` to it, `/api/pharmacy/medications` forwards to `{PHARMACY_SERVICE_URL}/pharmacy/medications`, which 404s. Whoever reconciles this needs a single mechanism that covers **both** `"labs"` and `"pharmacy"`, not just a copy-paste of one side.

4. **Port collision, confirmed in `docker-compose.yml` too**, not just the gateway:
   ```yaml
   # F3-DiagnosticLab
   lab-service:
     build: ./services/lab
     ports:
       - "8006:8006"

   # F4-Pharmacy-Ann (already on master)
   pharmacy-service:
     build: ./services/pharmacy
     ports:
       - "8006:8006"
   ```
   Both declare the identical host port. `docker-compose up` will fail with a port-binding conflict if both service blocks exist together as currently written. One of the two needs to move off 8006 (or Lab needs to be assigned a different port before it merges, since Pharmacy already holds 8006 on `master`).

**Action needed:** before `F3-DiagnosticLab` merges, someone needs to (a) pick one port for Lab that isn't 8006, or negotiate reclaiming 8006 from Pharmacy, and (b) unify the two prefix-stripping mechanisms in `proxy()` into one that correctly handles both `"labs"` and `"pharmacy"`.

---

## 2. `services/notification/schemas.py` — vs. `F2-InsuranceEligibility` — neither merged yet

Both branches independently add a new member to the same `EventType` enum, at the same anchor line (immediately after `completed = "Completed"`):

```python
# master (current, unmodified) — confirmed via direct read
class EventType(str, Enum):
    submitted = "Submitted"
    accepted = "Accepted"
    rejected = "Rejected"
    completed = "Completed"

# F3-DiagnosticLab adds:
    lab_order_created = "LabOrderCreated"
    lab_result_critical = "LabResultCritical"
    lab_result_completed = "LabResultCompleted"

# F2-InsuranceEligibility adds (independently):
    authorization_updated = "AuthorizationUpdated"
```

Lab's change also makes `NotificationBase.ReferralId` `Optional[int]` (was required `int`) and adds a `Source: Optional[str]` field — Insurance's one-line diff doesn't touch `NotificationBase` at all, so that part is additive and non-conflicting. The enum insertion itself is the collision: not semantically incompatible (both are pure additions, nothing overwritten), but anchored at the identical line, which is the same category of merge-conflict risk as the `SERVICE_MAP` dict above. Confirmed `master` currently has neither change — this is a "when both eventually merge" risk, not a live one yet.

---

## 3. `frontend/src/app/shell/shell.component.html` — vs. `F4-Pharmacy-Ann` — same anchor line

Both branches insert a new nav link immediately after the "Documents" link, right before `</nav>`:

```html
<!-- shared unmodified anchor -->
<a routerLink="/documents" routerLinkActive="active">Documents</a>

<!-- F3-DiagnosticLab adds: -->
<a routerLink="/lab/orders" routerLinkActive="active">Labs</a>
<a routerLink="/lab-tech" routerLinkActive="active">Lab Tech</a>

<!-- F4-Pharmacy-Ann adds (independently): -->
<a routerLink="/pharmacy/dashboard" routerLinkActive="active">Pharmacy</a>
```

Low severity — trivially resolved (just decide the final link order), but it's a real same-anchor-point collision, not a false alarm.

---

## 4. `frontend/src/app/features/patients/patient-details.component.ts` — vs. `F2-InsuranceEligibility` — ⚠️ confirmed exact same line

This is the clearest, most unambiguous collision found in the whole investigation: **both branches modify the identical line** in the `@Component` decorator's `imports` array — not adjacent insertions, the *same line*, changed two different ways:

```typescript
// original (master, unmodified)
imports: [RouterLink, DocumentsPanelComponent],

// F3-DiagnosticLab changes it to:
imports: [RouterLink, DocumentsPanelComponent, LabResultsPanelComponent],

// F2-InsuranceEligibility changes it to (independently):
imports: [RouterLink, DocumentsPanelComponent, FormsModule],
```

This is a guaranteed git merge conflict — there's no ambiguity in whether this will conflict, unlike the "same anchor line" cases above where a 3-way merge might auto-resolve. Whoever merges second must manually combine both additions into `[RouterLink, DocumentsPanelComponent, LabResultsPanelComponent, FormsModule]`.

**Note — the corresponding template file is *not* a collision.** `patient-details.component.html` is also touched by both branches, but at genuinely different, non-adjacent locations: Insurance's new "Insurance" section is inserted *before* the outer `<div>` closes (right after the medications section); Lab's new "Lab Results" section is inserted *after* that `<div>` closes and after the documents panel section, near the bottom of the file. These should merge cleanly without a conflict — flagging this explicitly so it isn't mistaken for a fifth collision.

---

## Summary

| # | File | Other branch | Status | Severity |
|---|---|---|---|---|
| 1 | `gateway/main.py` + `docker-compose.yml` | `F4-Pharmacy-Ann` | **Already on `master`** | High — port collision + incompatible proxy logic |
| 2 | `services/notification/schemas.py` | `F2-InsuranceEligibility` | Neither merged | Low — same anchor line, purely additive |
| 3 | `frontend/.../shell.component.html` | `F4-Pharmacy-Ann` | Neither merged | Low — cosmetic, trivial to resolve |
| 4 | `frontend/.../patient-details.component.ts` | `F2-InsuranceEligibility` | Neither merged | Medium — guaranteed same-line conflict, easy fix once noticed |

No collisions found between `F3-DiagnosticLab` and `F1-Appointments` or `F5.2-imp` — those two branches don't touch any file Lab modifies.
