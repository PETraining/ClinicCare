# gateway/main.py Status on master

**Date**: 2026-08-19  
**Branch Checked**: `master` (canonical production branch)

---

## Current State on master

```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    "documents": 8004,
    "notifications": 8005,
}
```

### Proxy Logic
- Standard routing: `/api/{segment}/{rest}` → `{SERVICE_URL}/{full_path}`
- No special path-stripping logic
- No `UNPREFIXED_SERVICES` or equivalent

---

## Comparison: master vs Feature Branches

### ✅ OUR PLANNED ENTRY (`"appointments"`)

**Status on master**: ❌ **NOT PRESENT**

Our plan:
```python
"appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
```

**Conclusion**: Safe to add — no collision risk ✅

---

### Lab Team's Entry (`"labs"`)

**Status on master**: ❌ **NOT PRESENT**

Lab planned:
```python
"labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8006"),
```

**Conclusion**: Safe to add (but port conflict with Pharmacy exists) ⚠️

---

### Pharmacy Team's Entry (`"pharmacy"`)

**Status on master**: ❌ **NOT PRESENT**

Pharmacy planned:
```python
"pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
```

**Conclusion**: Safe to add (but port conflict with Lab exists) ⚠️

---

### Insurance Team's Entries

**Status on master**: No special entries (uses existing `patients` and `referrals`)

**Conclusion**: ✅ No changes to SERVICE_MAP needed

---

## Risk Assessment

| Team | Planned Entry | On master? | Conflict? | Safe to Add? |
|------|---|---|---|---|
| **F1 (Appointments)** | `appointments→8003` | ❌ No | No | ✅ Yes |
| **F2 (Insurance)** | (none, uses existing) | N/A | No | ✅ Yes |
| **F3 (Lab)** | `labs→8006` | ❌ No | Port 8006 | ⚠️ Yes (if Pharmacy uses 8007) |
| **F4 (Pharmacy)** | `pharmacy→8006` | ❌ No | Port 8006 | ⚠️ Yes (if Lab uses 8007) |
| **F5.2 (Patient Portal)** | `appointments→8003` | ❌ No | Duplicate with F1 | ✅ Yes (same entry) |

---

## Findings

### ✅ **No entries from any team have been merged to master yet**

All planned SERVICE_MAP entries are absent:
- ❌ `appointments` (planned by F1 and F5.2)
- ❌ `labs` (planned by F3)
- ❌ `pharmacy` (planned by F4)
- ✅ Insurance uses only existing entries

### ✅ **No conflicting entries on master**

The production gateway only has the 5 original services:
- `patients`, `doctors`, `referrals`, `documents`, `notifications`

### ⚠️ **Proxy logic collision will happen on merge**

Master's proxy function is the **simple baseline**. Both F3 (Lab) and F4 (Pharmacy) extended it with special path-stripping logic. When merged, they will conflict.

---

## Safe Merge Timeline

Since nothing has merged yet, you can safely merge in any order:

```
master (CURRENT)
  ├─ +F1 (Appointments) ✅ Clean
  ├─ +F2 (Insurance) ✅ Clean
  ├─ +F3 (Lab) ✅ Clean (adds proxy logic, adds "labs")
  ├─ +F4 (Pharmacy) ⚠️ CONFLICT in proxy logic (need manual merge)
  └─ +F5.2 (Patient Portal) ✅ Clean (adds "appointments" like F1)
```

---

## Decision Point

**Before merging F3 and F4, decide on ports:**

- **Option A** (Recommended): Lab stays 8006, Pharmacy moves to 8007
- **Option B**: Pharmacy stays 8006, Lab moves to 8007
- **Option C** (Not recommended): Merge into single service

Once decided, the merge conflict in proxy logic is resolvable by unifying both teams' approaches into a single extended proxy that handles both cases.

---

**Conclusion**: You're safe to add our `"appointments"` entry to gateway/main.py on master right now — **no collision exists yet**.

