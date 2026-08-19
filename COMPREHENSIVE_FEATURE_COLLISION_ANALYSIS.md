# 📋 COMPREHENSIVE FEATURE COLLISION ANALYSIS
## All Teams' Context & Plan Documentation Review

**Analysis Date**: August 19, 2026  
**Includes**: Context maps, plans, and intent documents from all feature branches

---

## 🎯 EXECUTIVE SUMMARY

| Team | Feature | New Microservice? | Port | Service Name | Collision Risk | Status |
|------|---------|-------------------|------|--------------|-----------------|--------|
| **F1** | Appointments | ❌ No | — | — | ✅ **NONE** | ✅ Ready |
| **F2** | Insurance | ❌ No | — | — | ✅ **NONE** | ✅ Ready |
| **F3** | Diagnostic Lab | ✅ Yes | 8006 | `labs` | ⚠️ **CRITICAL** | ❌ Blocked |
| **F4** | Pharmacy (OURS) | ✅ Yes | 8006 | `pharmacy` | ✅ **NONE** | ✅ Merged |
| **F5** | Patient Portal | ❌ No | — | — | ✅ **NONE** | ✅ Ready |

---

## TEAM F1: APPOINTMENTS

### Documentation Found
- `appoinmentsService-intent.md` - Feature requirements and architecture

### Service Architecture Decision
✅ **NO NEW MICROSERVICE NEEDED**

**Key Quote from Plan:**
> "Appointments need to be added as a new capability within the **existing Referral Service** (not as a new microservice) to maintain data locality and simplify the referral-appointment relationship."

### Implementation Approach
- **Location**: Referral Service (8003) - existing service
- **What's Added**: New models, schemas, and endpoints
- **No New Port**: Uses existing Referral Service infrastructure
- **Service Dependencies**: Only referral, notification (existing)

### Collision Risk Assessment
✅ **ZERO COLLISION RISK**
- No new SERVICE_MAP entry needed
- No new port assignment required
- Adds to existing service infrastructure
- **Safe to merge anytime**

---

## TEAM F2: INSURANCE ELIGIBILITY

### Documentation Found
- CLAUDE.md (inherited from repo)
- No specific feature context in branch

### Service Architecture Decision
✅ **NO NEW MICROSERVICE NEEDED**

**Service Modifications**:
- Adds Insurance model to **Patient Service** (8001)
- Adds Authorization model to **Referral Service** (8003)
- No new microservice created

### Implementation Approach
- **Patient Service**: Insurance data, CRUD endpoints
- **Referral Service**: Authorization tracking, status management
- **No New Port**: Uses existing services
- **Service Dependencies**: Patient (8001), Referral (8003), Notification (8005)

### Collision Risk Assessment
✅ **ZERO COLLISION RISK**
- Modifies existing services only
- No new SERVICE_MAP entry needed
- No port assignment conflicts
- **Safe to merge anytime**

---

## TEAM F3: DIAGNOSTIC LAB

### Documentation Found
- `diagnostic_lab-context-map.md` - Full architecture review
- `diagnostic_lab-intent.md` - Requirements
- `LAB_MODULE_TASKS.md` - Implementation tracking

### Service Architecture Decision
✅ **NEW MICROSERVICE CREATED**

**Key Evidence from Context Map:**
- Service name: `labs`
- Port specified: **8006** (explicitly stated as "port (8006)")
- Endpoint: `/api/labs/*`
- Status: **MVP complete and merged into docker-compose.yml**

### Implementation Details
```python
SERVICE_MAP = {
    # ... existing services ...
    "labs": "http://localhost:8006",  # ⚠️ PROBLEM: Already taken!
}
```

**Services Created**:
- `services/lab/main.py` - Lab endpoints
- `services/lab/models.py` - Lab data models
- `services/lab/Dockerfile` - Container config
- `services/lab/docker-compose` entry

**Service Dependencies**:
- Notification Service (for lab events)
- Patient Service (for patient data)
- Referral Service (for referral context)

### Collision Risk Assessment
🚨 **CRITICAL COLLISION DETECTED**

**The Problem:**
- F3-DiagnosticLab claims port **8006** for `labs` service
- F4-Pharmacy (our implementation) **already owns port 8006** (merged to master)
- Two services **cannot bind to same port**

**Impact if Merged As-Is:**
- ❌ Docker Compose will fail to start both services
- ❌ Gateway routing conflict: both trying to register SERVICE_MAP["labs"] and SERVICE_MAP["pharmacy"]
- ❌ Only one service actually binds → the other's requests fail
- ❌ System cannot run with both features

**Solution Required:**
- F3 must move to port **8007** before merge
- Update all references in:
  - `gateway/main.py`
  - `docker-compose.yml`
  - `services/lab/Dockerfile`
  - `diagnostic_lab-context-map.md`
  - `diagnostic_lab-intent.md`

---

## TEAM F5: PATIENT PORTAL

### Documentation Found
- `patient-portal-intent-context.md` - Feature rationale and scope
- `MVP-work-plan.md` - Implementation plan
- `DELIVERY_SUMMARY.md` - Delivery status
- Multiple validation & testing documents

### Service Architecture Decision
✅ **NO NEW MICROSERVICE NEEDED**

**Key Points from Documentation:**
- Builds on existing referral workflow
- Provides patient view of referrals/appointments
- No new backend service mentioned
- Works with existing Patient, Referral services

### Implementation Approach
- **Location**: Frontend enhancement
- **Services Used**: Existing Patient, Referral, Notification services
- **No New Port**: Frontend at 4200 (existing), uses gateway 8000
- **Service Dependencies**: Patient (8001), Referral (8003), Notification (8005)

### Collision Risk Assessment
✅ **ZERO COLLISION RISK**
- No new SERVICE_MAP entry needed
- No port assignment required
- Frontend-only feature (Angular components)
- **Safe to merge anytime**

---

## 🚨 DETAILED COLLISION ANALYSIS: F3 vs F4

### Current Master Branch STATE

```python
# gateway/main.py on master
SERVICE_MAP = {
    "patients": "http://localhost:8001",      # ✅ Patient Service
    "doctors": "http://localhost:8002",        # ✅ Doctors Service
    "referrals": "http://localhost:8003",      # ✅ Referral Service
    "documents": "http://localhost:8004",      # ✅ Document Service
    "notifications": "http://localhost:8005",  # ✅ Notification Service
    "pharmacy": "http://localhost:8006",       # ✅ Pharmacy (F4 - MERGED)
}
```

### F3-DiagnosticLab PLANNED

```python
# What F3 branch wants to add to gateway/main.py:
"labs": "http://localhost:8006"  # ⚠️ CONFLICT!
```

### The Docker Compose Conflict

**Master has:**
```yaml
pharmacy-service:
  build: ./services/pharmacy
  ports:
    - "8006:8006"  # Port 8006 is taken!
```

**F3 wants to add:**
```yaml
lab-service:
  build: ./services/lab
  ports:
    - "8006:8006"  # Port 8006 already bound!
```

**Result if merged:** Only one service starts successfully; the other fails to bind to port 8006.

---

## ✅ TEAMS READY TO MERGE (NO COLLISIONS)

### F1-Appointments ✅
- **Decision**: Adds to Referral Service (8003)
- **No new service**: No SERVICE_MAP changes
- **Status**: READY TO MERGE
- **Risk**: None

### F2-Insurance Eligibility ✅
- **Decision**: Modifies Patient (8001) and Referral (8003) services
- **No new service**: No SERVICE_MAP changes
- **Status**: READY TO MERGE
- **Risk**: None

### F5-Patient Portal ✅
- **Decision**: Frontend enhancement, no new service
- **No new service**: No SERVICE_MAP changes
- **Status**: READY TO MERGE
- **Risk**: None

---

## ❌ TEAMS BLOCKED (COLLISIONS)

### F3-DiagnosticLab ⚠️ BLOCKED
- **Decision**: Creates new Lab Service on port 8006
- **Problem**: F4 Pharmacy already owns port 8006
- **Status**: CANNOT MERGE WITHOUT FIX
- **Required Action**: Update to port 8007 (or another unused port)

---

## 📊 PORT ALLOCATION FINAL STATUS

```
Port 8000 - API Gateway           ✅ (master)
Port 8001 - Patient Service       ✅ (master)
Port 8002 - Doctors Service       ✅ (master)
Port 8003 - Referral Service      ✅ (master)
Port 8004 - Document Service      ✅ (master)
Port 8005 - Notification Service  ✅ (master)
Port 8006 - Pharmacy Service      ✅ (F4 - MERGED)
Port 8007 - AVAILABLE (for F3 Lab)
Port 8008 - AVAILABLE
Port 8009 - AVAILABLE
```

---

## 🎯 MERGE SEQUENCE RECOMMENDATION

### Phase 1: Immediate (No Issues)
1. ✅ **F1-Appointments** - Ready, no changes needed
2. ✅ **F2-Insurance** - Ready, no changes needed
3. ✅ **F5-Patient Portal** - Ready, no changes needed

### Phase 2: Requires Fix First
4. ⚠️ **F3-DiagnosticLab** - **MUST update port to 8007 before merge**

### Already Complete
- ✅ **F4-Pharmacy** (our team) - Already merged to master

---

## 📋 VERIFICATION CHECKLIST FOR F3 FIX

Before F3-DiagnosticLab can be merged:

- [ ] `gateway/main.py`: Change port from 8006 → 8007
  ```python
  "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8007")
  ```

- [ ] `docker-compose.yml`: Update lab-service
  ```yaml
  lab-service:
    ports:
      - "8007:8007"  # Changed from 8006
  ```

- [ ] `services/lab/Dockerfile`: Update EXPOSE and CMD
  ```dockerfile
  EXPOSE 8007
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8007"]
  ```

- [ ] `diagnostic_lab-context-map.md`: Update all port references
- [ ] `diagnostic_lab-intent.md`: Update all port references
- [ ] All documentation updated
- [ ] Tested locally with `docker-compose up`

---

## 📌 FINAL CONCLUSIONS

### F1-Appointments
✅ **Clear to Merge** - No new microservice, no collisions

### F2-Insurance Eligibility
✅ **Clear to Merge** - Modifies existing services only, no collisions

### F3-Diagnostic Lab
🚨 **BLOCKED - Must Fix Port Collision**
- Currently designed for port 8006 (occupied by Pharmacy)
- Required fix: Move to port 8007
- Time to fix: ~15 minutes (update 5 files)
- Once fixed: Can merge safely

### F4-Pharmacy (Ours)
✅ **Already Merged** - Port 8006 claim is secure on master

### F5-Patient Portal
✅ **Clear to Merge** - Frontend feature, no new service, no collisions

---

## 🏁 SUMMARY

**Safe to Merge (3/5)**:
- F1-Appointments ✅
- F2-Insurance ✅
- F5-Patient Portal ✅

**Already Merged (1/5)**:
- F4-Pharmacy ✅

**Blocked Until Fix (1/5)**:
- F3-Diagnostic Lab ⚠️ (port 8006 collision with Pharmacy)

**Recommended Action**: Fix F3's port, then merge all teams' features without conflicts.

---

## 📚 Related Documents
- `SERVICE_COLLISION_ANALYSIS.md` - Detailed collision breakdown
- `REMOTE_BRANCHES_SUMMARY.md` - Branch listing and status
- `FEATURE_CONTEXT_SUMMARY.md` - All features' files/endpoints/tables
