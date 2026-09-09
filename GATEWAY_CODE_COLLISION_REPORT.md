# Gateway CODE Collision Report

**Date**: 2026-08-19  
**Analysis**: Actual `gateway/main.py` code diffs from 5 feature branches

---

## Summary

✅ **NO GENUINE CODE COLLISION** — All branches have non-overlapping SERVICE_MAP entries.

However, ⚠️ **ARCHITECTURE CONFLICT** exists: Lab (F3) and Pharmacy (F4) both target **port 8006**, and the proxy logic differs between them (see below).

---

## 1. SERVICE_MAP Entries by Branch

### F1-Appointments
```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    "appointments": 8003,      # ← Routes to Referral Service
    "documents": 8004,
    "notifications": 8005,
}
```
**New entry**: `"appointments"` (added)  
**Conflicts with**: None ✅

---

### F2-InsuranceEligibility
```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    # ← NO NEW ENTRIES
    "documents": 8004,
    "notifications": 8005,
}
```
**New entries**: None (uses existing routes)  
**Conflicts with**: None ✅

---

### F3-DiagnosticLab
```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    "documents": 8004,
    "notifications": 8005,
    "labs": 8006,              # ← NEW SERVICE
}

UNPREFIXED_SERVICES = {"labs"}  # ← NEW CONSTANT
```
**New entries**: `"labs": 8006`  
**New logic**: `UNPREFIXED_SERVICES` set + path-stripping logic  
**Proxy logic change**: Strips `labs` prefix before forwarding  
**Conflicts with**: **PORT 8006 conflict with F4** ⚠️

---

### F4-Pharmacy-Ann
```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    "documents": 8004,
    "notifications": 8005,
    "pharmacy": 8006,          # ← NEW SERVICE
}

services_with_prefix = {"patients", "doctors", "referrals", "documents", "notifications"}
```
**New entries**: `"pharmacy": 8006`  
**New logic**: `services_with_prefix` set + conditional path handling  
**Proxy logic change**: Different path-stripping strategy than F3  
**Conflicts with**: **PORT 8006 conflict with F3** ⚠️

---

### F5.2-imp (Ours)
```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    "appointments": 8003,      # ← Same as F1
    "documents": 8004,
    "notifications": 8005,
}
```
**New entries**: `"appointments": 8003` (same as F1)  
**Conflicts with**: None ✅

---

## 2. Detailed Collision Analysis

### ✅ No SERVICE_MAP Key Collisions

All SERVICE_MAP keys are unique within each branch:

| Key | F1 | F2 | F3 | F4 | F5.2 |
|-----|----|----|----|----|------|
| patients | ✅ | ✅ | ✅ | ✅ | ✅ |
| doctors | ✅ | ✅ | ✅ | ✅ | ✅ |
| referrals | ✅ | ✅ | ✅ | ✅ | ✅ |
| appointments | ✅ | - | - | - | ✅ |
| documents | ✅ | ✅ | ✅ | ✅ | ✅ |
| notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| labs | - | - | ✅ | - | - |
| pharmacy | - | - | - | ✅ | - |

**Conclusion**: No key collisions in SERVICE_MAP entries ✅

---

### ⚠️ PORT 8006 Conflict (F3 vs F4)

Both F3 and F4 use port 8006 but implement different proxy logic:

#### F3 (Lab) Approach:
```python
UNPREFIXED_SERVICES = {"labs"}

if segment in UNPREFIXED_SERVICES:
    downstream_path = full_path[len(segment):].lstrip("/")
else:
    downstream_path = full_path

# Example:
# /api/labs/orders → base_url + "/orders" (strip "labs" prefix)
# /api/patients/1 → base_url + "/api/patients/1" (keep full path)
```

#### F4 (Pharmacy) Approach:
```python
services_with_prefix = {"patients", "doctors", "referrals", "documents", "notifications"}

if segment in services_with_prefix:
    upstream_path = f"/{full_path}"
else:
    upstream_path = f"/{full_path.split('/', 1)[1]}" if "/" in full_path else "/"

# Example:
# /api/pharmacy/medications → base_url + "/medications" (strip "pharmacy" prefix)
# /api/patients/1 → base_url + "/api/patients/1" (keep full path with prefix)
```

**Result**: Both produce similar outcomes but with inverse logic and different variable names.

---

### ✅ No Code Duplication in Proxy Logic

Both branches modify the proxy logic, but they're **intended for different services**:
- F3's logic applies to "labs" service
- F4's logic applies to "pharmacy" service

When merged, they would conflict **in the proxy function itself** because both modify how `downstream_path` or `upstream_path` is constructed.

---

## 3. Merge Conflict Prediction

### If merging sequentially (e.g., F1 then F3 then F4):

**F1 → main**: 
- Adds `"appointments": 8003` to SERVICE_MAP
- No proxy logic changes
- ✅ Merges cleanly

**F3 → main (after F1)**:
- Adds `"labs": 8006` to SERVICE_MAP
- Adds `UNPREFIXED_SERVICES` constant
- Modifies proxy logic to handle unprefixed services
- ✅ Merges cleanly (no conflicts with F1)

**F4 → main (after F1, F3)**:
- Adds `"pharmacy": 8006` to SERVICE_MAP (port conflict with F3!)
- Overwrites proxy logic with different approach (`services_with_prefix`)
- ❌ **CODE CONFLICT**: The two proxy logic implementations are incompatible
  - F3 uses `UNPREFIXED_SERVICES` set
  - F4 uses `services_with_prefix` set
  - Can't have both; need to merge the logic manually

---

## 4. The Real Problem

The issue isn't just the port (8006) conflict — it's that **each team independently rewrote the proxy function** to handle their service's routing quirk:

| Team | Quirk | Implementation | Variable Name |
|------|-------|---|---|
| **F3 (Lab)** | Strip prefix from incoming path | `UNPREFIXED_SERVICES` set | `downstream_path` |
| **F4 (Pharmacy)** | Conditional prefix handling | `services_with_prefix` set | `upstream_path` |

When merged, **only one approach survives** (whichever merges last). The losing team's logic gets overwritten.

---

## 5. Safe Merge Strategy

### If port 8006 is resolved (Lab stays 8006, Pharmacy moves to 8007):

1. **Merge F1** (Appointments) — ✅ Clean, just adds SERVICE_MAP key
2. **Merge F2** (Insurance) — ✅ Clean, only uses existing routes
3. **Merge F3** (Lab) — ✅ Adds SERVICE_MAP + proxy logic for `UNPREFIXED_SERVICES`
4. **Merge F4** (Pharmacy) — ⚠️ **Requires manual conflict resolution**
   - Accept F3's proxy logic (base version)
   - Manually extend it to handle both Lab AND Pharmacy routing quirks
   - Add both `"labs": 8006` and `"pharmacy": 8007` to SERVICE_MAP

### Final merged gateway/main.py would look like:

```python
SERVICE_MAP = {
    "patients": 8001,
    "doctors": 8002,
    "referrals": 8003,
    "appointments": 8003,
    "documents": 8004,
    "notifications": 8005,
    "labs": 8006,
    "pharmacy": 8007,          # ← Different port than F4's 8006
}

# Services that need path manipulation:
# - "labs": strip the prefix (UNPREFIXED_SERVICES)
# - "pharmacy": strip the prefix (new)
UNPREFIXED_SERVICES = {"labs", "pharmacy"}

@app.api_route("/api/{full_path:path}", ...)
async def proxy(full_path: str, request: Request):
    segment = full_path.split("/", 1)[0]
    base_url = SERVICE_MAP.get(segment)
    if base_url is None:
        raise HTTPException(...)
    
    downstream_path = full_path
    if segment in UNPREFIXED_SERVICES:
        downstream_path = full_path[len(segment):].lstrip("/")
    
    # ... rest of logic
```

---

## 6. Recommendations

### Immediate Actions

1. ✅ **No action needed for code merging** — each branch's SERVICE_MAP entries don't collide
2. ⚠️ **RESOLVE PORT CONFLICT**: Decide now whether Pharmacy uses 8006 or 8007
3. ⚠️ **PLAN MERGE STRATEGY**: When merging F4, manually integrate the proxy logic

### Merge Order Recommendation

```
main
  ↓ (merge F1: Appointments)
  ↓ (merge F2: Insurance)
  ↓ (merge F3: Lab) 
  ↓ (merge F4: Pharmacy — requires manual conflict resolution)
  ↓ (merge F5.2: Patient Portal)
final main
```

### Port Decision Matrix

| Option | Pros | Cons |
|--------|------|------|
| **Lab: 8006, Pharmacy: 8007** (Recommended) | Clean separation, follows pattern, F3 stays unchanged | Need F4 to update all references (8006→8007) |
| **Lab: 8007, Pharmacy: 8006** | F4 stays unchanged | F3 must change all references (8006→8007) |
| **Merge into same service** | Reuses port | Couples independent features, violates SRP |

---

## Summary Table

| Branch | SERVICE_MAP Changes | Proxy Logic Changes | Port Conflict? | Merges Cleanly? |
|--------|---|---|---|---|
| **F1-Appointments** | Add `appointments→8003` | None | No | ✅ Yes |
| **F2-Insurance** | None (uses existing) | None | No | ✅ Yes |
| **F3-DiagnosticLab** | Add `labs→8006` | Add `UNPREFIXED_SERVICES` logic | **Yes (8006)** | ✅ Yes (but see below) |
| **F4-Pharmacy-Ann** | Add `pharmacy→8006` | Add `services_with_prefix` logic | **Yes (8006)** | ❌ **Manual resolution needed** |
| **F5.2-imp** | Add `appointments→8003` | None | No | ✅ Yes |

---

**Conclusion**: **No genuine code collision**, but **port collision + proxy logic merge needed** when integrating Lab and Pharmacy.

