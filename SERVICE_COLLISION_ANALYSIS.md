# ⚠️ SERVICE_MAP COLLISION ANALYSIS

**Date**: August 19, 2026  
**Status**: 🚨 **CRITICAL COLLISION DETECTED**

---

## Executive Summary

**COLLISION FOUND:** The Diagnostic Lab feature (F3) is planning to use port **8006** for the `labs` service, but this port is **already occupied by the Pharmacy service** in the master branch.

---

## Current State (Master Branch)

### Active SERVICE_MAP Entries

```python
SERVICE_MAP = {
    "patients": "http://localhost:8001",      # Patient Service
    "doctors": "http://localhost:8002",        # Doctors Service
    "referrals": "http://localhost:8003",      # Referral Service
    "documents": "http://localhost:8004",      # Document Service
    "notifications": "http://localhost:8005",  # Notification Service
    "pharmacy": "http://localhost:8006",       # Pharmacy Service ✅ MERGED
}
```

### Docker Compose Services

Running services:
- `patient-service` (8001)
- `doctors-service` (8002)
- `referral-service` (8003)
- `document-service` (8004)
- `notification-service` (8005)
- `pharmacy-service` (8006)
- `gateway` (8000)

---

## Feature Branch SERVICE_MAP Entries

### F1-Appointments

**Status**: ❌ No new service
- Uses existing services: patients, doctors, referrals, notifications
- No new SERVICE_MAP entry needed
- Adds models/endpoints to **Referral Service** (8003)
- **No collision risk**

### F2-InsuranceEligibility

**Status**: ❌ No new service
- Uses existing services: patients, referrals, notifications
- No new SERVICE_MAP entry needed
- Adds models/endpoints to **Patient Service** (8001) and **Referral Service** (8003)
- **No collision risk**

### F3-DiagnosticLab

**Status**: 🚨 **COLLISION DETECTED**

```python
SERVICE_MAP = {
    # ... existing services ...
    "labs": "http://localhost:8006",  # ⚠️ TRYING TO USE 8006
}
```

**Problem**: Lab Service is attempting to claim port **8006**, which is **already assigned to Pharmacy Service** in master.

**Evidence**:
- DiagnosticLab-context-map.md states: "The Lab Service, its port (8006)..."
- Master branch shows: `"pharmacy": "http://localhost:8006"`
- Two services cannot share the same port

---

## F4-Pharmacy (Our Implementation)

**Status**: ✅ **Already merged to master**

```python
"pharmacy": "http://localhost:8006"
```

- Service name: `pharmacy`
- Port: `8006`
- Route prefix: `/api/pharmacy/*`
- Service strips prefix (e.g., `/api/pharmacy/medications` → `/medications`)
- **No collision with other merged services**
- **BLOCKING collision with F3-DiagnosticLab**

---

## Port Allocation Summary

| Port | Service | Branch | Status | Service Name |
|------|---------|--------|--------|--------------|
| 8001 | Patient | master | ✅ Merged | `patients` |
| 8002 | Doctors | master | ✅ Merged | `doctors` |
| 8003 | Referral | master | ✅ Merged | `referrals` |
| 8004 | Document | master | ✅ Merged | `documents` |
| 8005 | Notification | master | ✅ Merged | `notifications` |
| 8006 | **Pharmacy** | master | ✅ Merged | `pharmacy` |
| 8007 | ❌ **UNUSED** | — | — | — |
| 8008 | ❌ **UNUSED** | — | — | — |
| 8009 | ❌ **UNUSED** | — | — | — |

---

## Collision Details

### Root Cause

When the Pharmacy feature was implemented (F4), it claimed port 8006. The DiagnosticLab feature (F3) was designed and planned to also use port 8006, but:
1. This was not coordinated between the teams
2. Pharmacy was merged to master first
3. DiagnosticLab context map was never updated to reflect the collision

### Impact

**If DiagnosticLab is merged as-is:**
- ✅ Docker Compose startup will fail (port 8006 already bound)
- ✅ Both services will try to register in SERVICE_MAP with different keys (`pharmacy` vs `labs`)
- ✅ Gateway routing will attempt to forward requests to port 8006
- ✅ Only one service will actually bind to the port → requests to the other fail

---

## Solution Options

### Option 1: Move DiagnosticLab to Port 8007 ✅ RECOMMENDED

**Changes needed in F3-DiagnosticLab branch:**
1. Update `gateway/main.py`:
   ```python
   "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8007"),  # Changed from 8006
   ```

2. Update `docker-compose.yml`:
   ```yaml
   lab-service:
     build: ./services/lab
     ports:
       - "8007:8007"  # Changed from 8006
     environment:
       - SERVER_PORT=8007  # Changed from 8006
   ```

3. Update `services/lab/Dockerfile`:
   ```dockerfile
   EXPOSE 8007  # Changed from 8006
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8007"]  # Updated port
   ```

4. Update `FeatureContextMaps/DiagnosticLab-context-map.md`:
   - Change all references from port 8006 to 8007
   - Document the reason (Pharmacy service already claimed 8006)

5. Update `FeatureContextMaps/DiagnosticLab-plan.md`:
   - Change all references from port 8006 to 8007

**Advantages:**
- ✅ Minimal code changes
- ✅ Both services can coexist
- ✅ No impact on Pharmacy implementation
- ✅ Port 8007 is available and unused

**Disadvantages:**
- Requires updating DiagnosticLab branch before merge

### Option 2: Move Pharmacy to Different Port ❌ NOT RECOMMENDED

**Why not:**
- Pharmacy is already merged to master
- Would require changes to `test/workflow-v2` branch
- Would impact all existing deployments
- Gateway already has routing for pharmacy at 8006
- Higher risk of breaking existing functionality

---

## Recommendations

### For Teams/PRs

1. **F3-DiagnosticLab**: Update your branch to use port **8007** before merging
2. **F1-Appointments & F2-InsuranceEligibility**: No changes needed; no collisions detected
3. **F4-Pharmacy**: No action needed; already merged

### For Gateway Configuration

Once DiagnosticLab is updated:

```python
SERVICE_MAP = {
    "patients": "http://localhost:8001",
    "doctors": "http://localhost:8002",
    "referrals": "http://localhost:8003",
    "documents": "http://localhost:8004",
    "notifications": "http://localhost:8005",
    "pharmacy": "http://localhost:8006",
    "labs": "http://localhost:8007",      # ← Add this
}
```

### For Docker Compose

Add lab-service entry (once F3 is updated):

```yaml
lab-service:
  build: ./services/lab
  ports:
    - "8007:8007"
  environment:
    - DATABASE_URL=sqlite:///./lab.db
  depends_on:
    - notification-service
```

---

## Verification Checklist

- [ ] DiagnosticLab branch updated to port 8007
- [ ] gateway/main.py SERVICE_MAP updated with `"labs": "http://localhost:8007"`
- [ ] docker-compose.yml lab-service entry added with port 8007
- [ ] All references in documentation (context-map, plan) updated
- [ ] DiagnosticLab Dockerfile updated to expose 8007
- [ ] All branches tested for port conflicts

---

## Other Feature Observations

### F1-Appointments & F2-InsuranceEligibility

✅ **No collisions detected**

These features only add models and endpoints to **existing services**:
- **Appointments**: Adds to Referral Service (8003) ✅
- **Insurance Eligibility**: Adds to Patient Service (8001) and Referral Service (8003) ✅

No new microservices = no SERVICE_MAP entries needed = no collision risk

---

## Summary Table

| Feature | New Service? | Service Name | Port | Status | Collision Risk |
|---------|-------------|--------------|------|--------|-----------------|
| F1-Appointments | ❌ No | — | — | Ready | ✅ None |
| F2-Insurance | ❌ No | — | — | Ready | ✅ None |
| F3-DiagnosticLab | ✅ Yes | `labs` | 8006 | 🚨 Blocked | ⚠️ **YES - Port 8006 taken** |
| F4-Pharmacy | ✅ Yes | `pharmacy` | 8006 | ✅ Merged | ✅ None (already merged) |

---

## Conclusion

🚨 **CRITICAL**: F3-DiagnosticLab must update to port **8007** before merging to avoid port conflict with Pharmacy.

✅ **Safe to merge**: F1-Appointments and F2-InsuranceEligibility (no new services, no collisions)

✅ **Already merged**: F4-Pharmacy (no conflicts with other merged services)

---

## References

- **Current master branch gateway**: Pharmacy mapped to port 8006
- **F3-DiagnosticLab context map**: Claims port 8006 (outdated, needs update)
- **F4-Pharmacy**: Successfully uses port 8006 (already merged)
- **Available ports**: 8007, 8008, 8009, 8010, etc.
