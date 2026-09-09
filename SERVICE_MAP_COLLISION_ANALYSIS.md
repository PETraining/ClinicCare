# SERVICE_MAP Collision Analysis

**Date**: 2026-08-19  
**Status**: ⚠️ COLLISION DETECTED

---

## Current gateway/main.py (as of HEAD)

```python
SERVICE_MAP = {
    "patients": "http://localhost:8001",      # Patient Service
    "doctors": "http://localhost:8002",       # Doctors Service
    "referrals": "http://localhost:8003",     # Referral Service
    "appointments": "http://localhost:8003",  # ← Routes to Referral Service
    "documents": "http://localhost:8004",     # Document Service
    "notifications": "http://localhost:8005", # Notification Service
}
```

---

## What Each Feature Needs

### 1. Appointments (Complete)
**Proposed routes**: `/api/referrals/{id}/appointments` and `/api/appointments/{id}/*`  
**SERVICE_MAP**: Routes to existing `"referrals": 8003` ✅  
**Collision**: NONE — uses existing Referral Service

### 2. Diagnostic Lab (Complete)
**Proposed routes**: `/api/labs/*`  
**SERVICE_MAP entry needed**: `"labs": "http://localhost:8006"`  
**Service port**: 8006  
**Special note**: Context map mentions `UNPREFIXED_SERVICES` quirk  
**Collision**: **CONFLICT with Pharmacy** (both want 8006)

### 3. Insurance Eligibility (Planned)
**Proposed routes**:
- `/api/patients/{id}/insurance/*` → Patient Service
- `/api/referrals/{id}/authorization/*` → Referral Service

**SERVICE_MAP**: Routes to existing services (`"patients"`, `"referrals"`) ✅  
**Collision**: NONE — uses existing services

### 4. Pharmacy (Planned)
**Proposed routes**: `/api/pharmacy/*`  
**SERVICE_MAP entry needed**: `"pharmacy": "http://localhost:8006"`  
**Service port**: 8006  
**Collision**: **CONFLICT with Lab** (both want 8006)

---

## Collision Matrix

| Feature | Route Prefix | Service Port | SERVICE_MAP Key | Existing? | Conflict? |
|---------|--------------|--------------|-----------------|-----------|-----------|
| Patients | `/api/patients/*` | 8001 | `patients` | ✅ | No |
| Doctors | `/api/doctors/*` | 8002 | `doctors` | ✅ | No |
| Referrals | `/api/referrals/*` | 8003 | `referrals` | ✅ | No |
| **Appointments** | `/api/appointments/*` | 8003 | `appointments` | ✅ | No |
| Documents | `/api/documents/*` | 8004 | `documents` | ✅ | No |
| Notifications | `/api/notifications/*` | 8005 | `notifications` | ✅ | No |
| **Lab** | `/api/labs/*` | **8006** | `labs` | ❌ | **COLLISION** |
| **Insurance** | `/api/patients/insurance/*` | 8001 | (none, existing) | ✅ | No |
| **Insurance** | `/api/referrals/authorization/*` | 8003 | (none, existing) | ✅ | No |
| **Pharmacy** | `/api/pharmacy/*` | **8006** | `pharmacy` | ❌ | **COLLISION** |

---

## 🔴 The Conflict: Lab vs Pharmacy (Port 8006)

Both features plan to use **port 8006** as their microservice port:

```
Lab Service         Pharmacy Service
├─ Port 8006       ├─ Port 8006          ← CONFLICT!
├─ Route: /labs    ├─ Route: /pharmacy
└─ Endpoints: 20+  └─ Endpoints: 12
```

### Current Context Map Claims

**Lab Context Map (line 34)**:
> `gateway/main.py` `SERVICE_MAP["labs"]` + `UNPREFIXED_SERVICES`

Suggests Lab already has special handling in gateway, but **Lab is not yet in SERVICE_MAP**.

**Pharmacy Context Map (line 149)**:
> Add pharmacy routing to API gateway (`/api/pharmacy/*`)

Explicitly requests `/api/pharmacy/*` → 8006 in SERVICE_MAP.

---

## ✅ What's Already in SERVICE_MAP (No Collisions)

| Key | URL | Service | Feature |
|-----|-----|---------|---------|
| `patients` | 8001 | Patient Service | Base |
| `doctors` | 8002 | Doctors Service | Base |
| `referrals` | 8003 | Referral Service | Base |
| `appointments` | 8003 | (routed to Referral) | Appointments |
| `documents` | 8004 | Document Service | Base |
| `notifications` | 8005 | Notification Service | Base |

✅ All of these are unique and non-overlapping.

---

## 🔴 Missing from SERVICE_MAP (Will Collide)

| Key | Proposed URL | Feature | Conflict |
|-----|--------------|---------|----------|
| `labs` | 8006 | Lab | **Port 8006 conflict with Pharmacy** |
| `pharmacy` | 8006 | Pharmacy | **Port 8006 conflict with Lab** |

---

## Solutions

### Option A: Use Different Ports
Assign Lab and Pharmacy to different ports:

```python
SERVICE_MAP = {
    # ... existing entries ...
    "labs": "http://localhost:8006",      # Lab Service
    "pharmacy": "http://localhost:8007",  # Pharmacy Service (moved to 8007)
}
```

**Pros**: 
- Clean separation
- Each service fully independent

**Cons**: 
- Need to update Pharmacy docker-compose and all references

---

### Option B: Consolidate Lab & Pharmacy into One Service
Create a unified `med-management` or `clinical-services` microservice combining both:

```python
SERVICE_MAP = {
    # ... existing entries ...
    "labs": "http://localhost:8006",       # Lab + Pharmacy unified
    "pharmacy": "http://localhost:8006",   # Alias to same service
}
```

Then inside the service, route:
- `/labs/*` → Lab module
- `/pharmacy/*` → Pharmacy module

**Pros**:
- Reuses single port
- Both features in same service (logical grouping: both clinical/diagnostic)

**Cons**:
- Couples two independent features
- Harder to scale separately
- Violates single-responsibility principle

---

### Option C: Use Shared HTTP Prefix with Suffix Routes
Keep both on 8006 but use longer route prefixes:

```python
SERVICE_MAP = {
    # ... existing entries ...
    "clinical-labs": "http://localhost:8006",  # Lab Service
    "clinical-pharmacy": "http://localhost:8006",  # Same port, different routes
}
```

Frontend routes:
- `/api/clinical-labs/orders` → 8006/orders
- `/api/clinical-pharmacy/prescriptions` → 8006/prescriptions

**Pros**:
- Same port for both (cost saving)
- Routes are still distinct

**Cons**:
- Confusing naming
- Not idiomatic (breaks the pattern of "service-name": port)

---

## Recommendation

**✅ Option A: Use Different Ports**

- Lab Service: **8006** (as originally planned)
- Pharmacy Service: **8007** (move from 8006)

**Rationale**:
1. Matches ClinicCare's established pattern (one service per port)
2. Each service is independent and scalable
3. Minimal changes to context maps (just update Pharmacy from 8006 → 8007)
4. Clear, unambiguous SERVICE_MAP entries
5. No coupling between features

**Implementation**:
1. Update `FeatureContextMaps/Pharmacy-*.md` — change all references from 8006 → 8007
2. Update `docker-compose.yml` — Pharmacy service port: 8007
3. Once both features are ready, update `gateway/main.py`:
   ```python
   SERVICE_MAP = {
       # ... existing ...
       "labs": "http://localhost:8006",      # Lab Service
       "pharmacy": "http://localhost:8007",  # Pharmacy Service
   }
   ```

---

## Files That Will Need Updates

### If choosing Option A (Different Ports):

**Pharmacy context maps** (4 files):
- `FeatureContextMaps/Pharmacy-CONTEXT.md` — Change 8006 → 8007
- `FeatureContextMaps/Pharmacy-PLAN.md` — Change 8006 → 8007
- `FeatureContextMaps/Pharmacy-prescription-context.md` — Change 8006 → 8007
- `FeatureContextMaps/Pharmacy-prescription-plan.md` — Change 8006 → 8007

**Gateway**:
- `gateway/main.py` — Add both entries when ready:
  ```python
  "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8006"),
  "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8007"),
  ```

**Docker Compose**:
- `docker-compose.yml` — Update Pharmacy service port when implemented

**Lab Context Map** (already complete):
- No changes needed (already set to 8006)

---

## Summary Table

| What | Current | After (Option A) | Collision? |
|------|---------|------------------|-----------|
| Lab SERVICE_MAP | Not yet added | `"labs": 8006` | ✅ Resolved |
| Pharmacy SERVICE_MAP | Not yet added | `"pharmacy": 8007` | ✅ Resolved |
| Patient routes | `/api/patients/*` | (unchanged) | No |
| Referral routes | `/api/referrals/*` | (unchanged) | No |
| Appointment routes | `/api/appointments/*` | (unchanged) | No |
| Insurance routes | N/A | `/api/patients/insurance/*`, `/api/referrals/authorization/*` | No |

---

## Decision Required

**Question for team lead**: Which option do you prefer?

- **Option A** (Recommended): Lab on 8006, Pharmacy on 8007
- **Option B**: Consolidate into single service
- **Option C**: Share port with different route prefixes

Once decided, we can update the context maps and gateway accordingly before implementation begins.

---

**Last Updated**: 2026-08-19  
**Owner**: Architecture Team  
**Status**: Awaiting decision
