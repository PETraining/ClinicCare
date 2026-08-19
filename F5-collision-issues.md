# F5 Patient Portal — Collision Issues in gateway/main.py

**Branch:** `F5.2-imp`  
**Date:** 2026-08-19  
**Status:** ✅ RESOLVED — Commit 03220f2 applied and pushed to origin/F5.2-imp

---

## Overview

There is **one direct collision** between F5.2-imp (Patient Portal Sub-Feature 2) and F1-Appointments that will prevent your branch from merging cleanly to main.

---

## Collision: F1-Appointments vs F5.2-imp

### Issue
**Both branches add the same SERVICE_MAP entry to gateway/main.py, line 11:**

**F1-Appointments adds:**
```python
"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
```

**F5.2-imp adds:**
```python
"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
```

### Identical Code
- **Exact same line**, character-for-character
- **Same location** in SERVICE_MAP (after `"referrals"`)
- **Same target service** (Referral Service, port 8003)
- **Same environment variable** (`REFERRAL_SERVICE_URL`)

### Why This Happened
Both features need to expose appointments via the API Gateway:
- **F1 (Appointments Scheduling):** Clinician-facing appointment management
- **F5 (Patient Portal Sub-Feature 1):** Patient-facing appointment viewing

Both teams independently added the same gateway routing without coordination.

---

## Impact on F5 Merge

### Current State (master)
```python
SERVICE_MAP = {
    "patients": ...,
    "doctors": ...,
    "referrals": ...,
    # "appointments" does NOT exist yet
    "documents": ...,
    "notifications": ...,
}
```

### If F1 Merges First
```python
SERVICE_MAP = {
    "patients": ...,
    "doctors": ...,
    "referrals": ...,
    "appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),  # ← F1 added this
    "documents": ...,
    "notifications": ...,
}
```

### If F5.2-imp Then Tries to Merge
Git will **reject the merge** with a conflict:
```
CONFLICT (content): Merge conflict in gateway/main.py
Auto-merging gateway/main.py
CONFLICT (content): Merge conflict in gateway/main.py
error: Your local changes to the following files would be overwritten by merge:
    gateway/main.py
```

The conflicted section will look like:
```python
"referrals": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
<<<<<<< HEAD (F1's version, already on main)
"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
=======  (F5.2-imp's version, your branch)
"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
>>>>>>> F5.2-imp
"documents": os.environ.get("DOCUMENT_SERVICE_URL", "http://localhost:8004"),
```

### Manual Resolution
Even though the lines are **identical**, git does not auto-resolve this conflict. You must:
1. Choose one version (they're the same, so it doesn't matter)
2. Delete the conflict markers
3. Commit the resolution

**Result:** Merge succeeds, but only after manual conflict resolution.

---

## Resolution Options

### Option A: Remove from F5.2-imp (RECOMMENDED)
**Action:** Delete the `"appointments"` line from your F5.2-imp branch now, before F1 merges.

**Why:** 
- F1-Appointments is the primary owner of appointment scheduling
- Both branches add identical code, so there's no functional loss
- Eliminates the merge conflict entirely
- Cleaner commit history

**Steps:**
1. Check out F5.2-imp locally
2. Edit `gateway/main.py`
3. Remove the line: `"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),`
4. Commit and push the change
5. When F1 merges first, F5.2-imp will merge cleanly without conflict

---

### Option B: Wait for F1 to Merge, Then Resolve
**Action:** Let F1 merge first, then resolve the conflict in F5.2-imp during your merge.

**Why:**
- Passive approach; requires no proactive work now
- Git will flag the conflict, forcing explicit resolution

**Steps:**
1. Wait for F1 to merge to main
2. When merging F5.2-imp to main:
   ```bash
   git merge origin/F5.2-imp
   # Git reports conflict in gateway/main.py
   ```
3. Manually resolve by keeping only one copy of the line
4. Commit the conflict resolution

**Downside:** Creates unnecessary merge commit and conflict record

---

### Option C: Coordinate with F1 Team (NOT RECOMMENDED)
**Action:** Ask F1 team to remove their `"appointments"` entry and let F5 add it.

**Why:** This is unwise because:
- F1's branch is already ready/ahead in the merge queue
- F1 owns appointment scheduling (clinician-facing) — the primary use case
- F5 uses appointments as read-only (patient-viewing) — secondary use
- Delays F1's merge for no functional benefit

**Verdict:** Not recommended.

---

## Recommended Action Plan

### NOW (Before F1 Merges)
1. **Delete the `"appointments"` line from F5.2-imp's gateway/main.py**
   ```bash
   git checkout F5.2-imp
   # Edit gateway/main.py and remove:
   # "appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
   git add gateway/main.py
   git commit -m "Remove duplicate appointments gateway entry (F1-Appointments owns this)"
   git push origin F5.2-imp
   ```

2. **Verify the change:**
   ```bash
   git diff master..F5.2-imp -- gateway/main.py
   # Should show NO "appointments" line in the diff
   ```

### LATER (When Merging to Main)
1. F1-Appointments merges → adds "appointments" entry ✓
2. F5.2-imp merges → no conflict, clean merge ✓

---

## Impact Summary

| Aspect | Impact | Severity |
|--------|--------|----------|
| **Merge Conflict** | Will occur if both try to add same line | 🔴 HIGH |
| **Code Functionality** | No loss — both lines are identical | ✅ NONE |
| **Timeline** | Can be resolved in minutes now, or during merge | ⚠️ MEDIUM |
| **Recommended Fix** | Remove from F5.2-imp before F1 merges | ✅ SIMPLE |

---

## Why F5 Doesn't Own This Entry

Your feature context map (Referral & Appointment View) states:

> The gateway already proxies the `documents` segment to the Document Service (8004) with no changes needed for JSON routes.

And for appointments:

> **Service Architecture Table** ... `Appointment model + GET /appointments` — New, added to Referral Service (8003)

This indicates your feature team expected the gateway entry to already exist or be added elsewhere. F1-Appointments got there first with the same requirement.

**Lesson:** The "appointments" SERVICE_MAP entry is now F1's responsibility. F5 can use it without owning the gateway change.

---

## Files Affected

**Primary:**
- `gateway/main.py` — Remove `"appointments"` line

**No other files need changes** — the rest of F5.2-imp's implementation is unaffected.

---

## Questions & Escalation

**Q: Will F5 still work after removing the appointments entry?**  
A: Yes. The entry will be added by F1-Appointments when that branch merges. F5 depends on it existing, but doesn't need to be the one who adds it.

**Q: What if F1-Appointments doesn't merge on time?**  
A: F5 could still merge. The "appointments" routes won't work until F1 merges, but F5's other endpoints (documents, questionnaires, notifications, referrals) will function. This is a dependency risk, not a merge conflict.

**Q: Can both F1 and F5.2-imp add the same line without conflict?**  
A: If they're identical and merge in the same commit, git might auto-resolve. But manual resolution is safer. Removing from F5 is cleaner.

---

## Approval

**Action Recommended:** ✅ Remove `"appointments"` entry from F5.2-imp  
**Effort:** 1 line deletion  
**Timeline:** Do before F1 merges (no deadline pressure if done now)  
**Risk if not done:** Manual merge conflict resolution required, adds 5 min to merge day

---

**Last Updated:** 2026-08-19  
**Prepared By:** Code Analysis  
**Status:** ✅ RESOLVED

---

## Resolution Complete

**Commit:** `03220f2`  
**Message:** "Resolve gateway collision with F1-Appointments: remove duplicate appointments entry"

**What was done:**
- ✅ Removed `"appointments"` SERVICE_MAP entry from gateway/main.py (line 11)
- ✅ Kept F5's own `"questionnaires"` entry (line 13)
- ✅ Committed to F5.2-imp with detailed message
- ✅ Pulled latest remote changes
- ✅ Pushed to origin/F5.2-imp

**Outcome:**
F5.2-imp now has a clean path to merge. When F1-Appointments merges first and adds "appointments" to main, F5.2-imp will merge without conflicts.
