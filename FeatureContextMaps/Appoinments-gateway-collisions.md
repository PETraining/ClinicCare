# Appointments — Real `gateway/main.py` Collision Issues

**Scope:** Only collisions that involve the Appointments feature (`F1-Appointments`). Collisions between other teams (e.g. F3-DiagnosticLab vs. the merged Pharmacy feature) are excluded — see the earlier cross-team analysis for those.

**Method:** Confirmed against actual `git diff` output between `origin/F1-Appointments`, `origin/F5.2-imp`, `origin/master`, and `origin/F4-Pharmacy-Ann` (fetched and diffed directly), not against planning docs.

---

## Issue 1: Merging F1 unrebased will silently delete the live Pharmacy route

**Status:** Real regression risk, confirmed in code. Not a deliberate act by either team — a staleness artifact.

**What's happening:**
`F1-Appointments` forked from commit `0c45b0b`, which predates Pharmacy's merge into `master` (`76050a7` / `7969fa1`, "phase1 implementation"). F1's own commit `1e9ce23` ("clinic care appoinment be and front end") rewrote the gateway's proxy logic and, in doing so, carried forward a `gateway/main.py` that:

- Has no `"pharmacy"` key in `SERVICE_MAP` (it was never there when F1 forked).
- Replaces the `services_with_prefix` branching logic — which Pharmacy's routes depend on to strip the `/pharmacy` segment before forwarding — with a single unconditional `f"{base_url}/{full_path}"`.

Current `master` (already fetched and confirmed) has:
```python
SERVICE_MAP = {
    ...
    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
}
...
services_with_prefix = {"patients", "doctors", "referrals", "documents", "notifications"}
if segment in services_with_prefix:
    upstream_path = f"/{full_path}"
else:
    upstream_path = f"/{full_path.split('/', 1)[1]}" if "/" in full_path else "/"
```

F1's `gateway/main.py` has neither. If F1 merges into `master` as-is (fast-forward or naive merge without conflict), `/api/pharmacy/*` requests will 404 with `"Unknown API route"` — a real regression against a feature that's already shipped.

**Fix:** Rebase `F1-Appointments` onto current `master` before merging. Since F1 never intentionally touched the `pharmacy` key or the prefix logic, a rebase should resolve cleanly and restore both.

---

## Issue 2: Independent duplicate `"appointments"` SERVICE_MAP key vs. F5.2-imp (Patient Portal)

**Status:** Real, independently-authored duplicate. Harmless in effect (byte-identical), but unnecessary on both sides.

**What's happening:**
Two different commits, by two different authors, on two different branches, both add the exact same line to `SERVICE_MAP`:

```python
"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
```

- `F1-Appointments`, commit `1e9ce23` ("clinic care appoinment be and front end")
- `F5.2-imp` (Patient Portal), commit `d60e270` ("reference view", authored by Rejayi Chandra Surendran)

Confirmed `1e9ce23` is **not** an ancestor of `F5.2-imp` — this was written twice, independently, not inherited from shared history.

**Why it's unnecessary:** Checked `services/referral/main.py` on F1 — every appointment endpoint is mounted under `/referrals/...`:

```
POST  /referrals/{referral_id}/appointments
GET   /referrals/{referral_id}/appointments
PATCH /referrals/appointments/{appointment_id}/reschedule
PATCH /referrals/appointments/{appointment_id}/complete
PATCH /referrals/appointments/{appointment_id}/cancel
```

The pre-existing `"referrals"` SERVICE_MAP key (already on `master`, unmodified) already routes every one of these paths correctly. Neither team needed to add `"appointments"` at all.

**Fix:** Drop the `"appointments"` key from F1's `gateway/main.py` — it's dead weight pointing at a URL the existing `"referrals"` entry already reaches. Flag to the Patient Portal team that their identical addition in `F5.2-imp` is equally unnecessary, so neither branch needs to carry it going forward.

---

## Net effect if F1 merges today, unaddressed

1. Pharmacy (`/api/pharmacy/*`) breaks — 404 on every request.
2. A dead, redundant `"appointments"` key sits in `SERVICE_MAP` doing nothing useful (all traffic to it would already resolve via `"referrals"`).

Both are fixable by rebasing onto current `master` and deleting the redundant key before opening the PR.
