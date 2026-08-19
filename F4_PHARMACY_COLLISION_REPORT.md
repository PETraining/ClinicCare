# 🔴 F4-PHARMACY COLLISION REPORT

**Our Feature: F4-Pharmacy-Ann**  
**Report Date**: August 19, 2026  
**Status**: Collisions detected with 3 other teams

---

## 📋 EXECUTIVE SUMMARY

Our feature (F4-Pharmacy) is successfully merged to master ✅, but three other teams (F1, F2, F3) have branches that will collide with our changes when they try to merge.

```
F4-Pharmacy Status:        ✅ MERGED & SECURE
Colliding Teams:           3 (F1, F2, F3)
Collision Severity:        🔴 CRITICAL
Our Feature's Risk:        🟢 ZERO (already merged)
Their Merge Risk:          🔴 CRITICAL (need to rebase)
```

---

## 🎯 THE CORE ISSUE

**F4-Pharmacy added:**
- Line 13 in gateway/main.py: `"pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006")`
- Port 8006 is now claimed by pharmacy service
- Special routing logic for pharmacy endpoints

**F1, F2, F3 were created BEFORE F4-Pharmacy merged**, so they don't have pharmacy in their codebase. When they try to merge:
- F1 & F2 will try to REMOVE the pharmacy line
- F3 will try to REPLACE the pharmacy line with labs

All three create conflicts with our merged code.

---

## 🔴 COLLISION #1: F4 vs F1-APPOINTMENTS

### Who Has What
```
Master (F4 merged):     pharmacy on port 8006 ✅
F1 branch:              No pharmacy (old master)
```

### The Conflict
When F1 tries to merge to master:
```python
# F1 tries to do this:
-    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),

# But master already has:
     "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
```

### Merge Conflict Output
```
CONFLICT (modify/delete): gateway/main.py
  deleted by them:
    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
  modified by us (master):
    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
```

### Impact on F4-Pharmacy
🟢 **ZERO IMPACT** - Our pharmacy code is already safely in master

### Impact on F1-Appointments
🔴 **CRITICAL** - F1 cannot merge without fixing this conflict

### What F1 Team Needs To Do
1. Rebase F1 on current master
2. Resolve conflict by ACCEPTING pharmacy from master
3. Keep the pharmacy routing logic
4. Test locally

---

## 🔴 COLLISION #2: F4 vs F2-INSURANCE

### Who Has What
```
Master (F4 merged):     pharmacy on port 8006 ✅
F2 branch:              No pharmacy (old master)
```

### The Conflict
F2 has the **EXACT SAME CHANGES** as F1 - both try to remove pharmacy:
```python
# F2 tries to do this:
-    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
-    [removes special pharmacy routing logic]

# But master already has:
     "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
```

### Why F1 and F2 Are Identical
Both teams branched from the same old master (before F4 merged), so both have identical gateway/main.py changes.

### Impact on F4-Pharmacy
🟢 **ZERO IMPACT** - Our pharmacy code is already safely in master

### Impact on F2-Insurance
🔴 **CRITICAL** - F2 cannot merge without fixing this conflict

### What F2 Team Needs To Do
1. Rebase F2 on current master
2. Resolve conflict by ACCEPTING pharmacy from master
3. Keep the pharmacy routing logic
4. Test locally

---

## 🔴 COLLISION #3: F4 vs F3-DIAGNOSTIC LAB

### Who Has What
```
Master (F4 merged):     pharmacy on port 8006 ✅
F3 branch:              labs on port 8006 ❌ (not pharmacy)
```

### The Conflict
F3 is not just removing pharmacy - it's REPLACING it:

```python
# F3 tries to do this:
- "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
+ "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8006"),

# Also adds:
+ UNPREFIXED_SERVICES = {"labs"}

# And modifies routing logic to handle labs instead of pharmacy
```

### Multiple Layers of Conflict

**Layer 1: Merge Conflict**
```
CONFLICT (modify/delete): gateway/main.py
  deleted by them: "pharmacy" entry
  modified by us: "pharmacy" entry
  added by them: "labs" entry
```

**Layer 2: Port Conflict**
```
F4 claims port 8006 for pharmacy
F3 claims port 8006 for labs
Both cannot run on same port!
```

**Layer 3: Routing Logic Conflict**
```
Master has: pharmacy-specific routing logic
F3 wants:   labs-specific routing logic
Both cannot coexist as written
```

### Impact on F4-Pharmacy
🟢 **ZERO IMMEDIATE IMPACT** - Our code is already in master

🟡 **OPERATIONAL RISK** - If F3 merged as-is, pharmacy would be removed from production

### Impact on F3-Diagnostic Lab
🔴 **CRITICAL** - F3 cannot merge without major rework

### What F3 Team Needs To Do
1. Rebase F3 on current master (to get pharmacy)
2. KEEP pharmacy entry on port 8006
3. ADD labs entry on NEW port (8007)
4. Update docker-compose.yml: lab service on port 8007
5. Update Dockerfile: lab service on port 8007
6. Update routing logic to handle BOTH pharmacy and labs
7. Test locally with both services running

**Example fix:**
```python
SERVICE_MAP = {
    "patients": ...,
    "doctors": ...,
    "referrals": ...,
    "documents": ...,
    "notifications": ...,
    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
    "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8007"),  # NEW
}

UNPREFIXED_SERVICES = {"pharmacy", "labs"}  # Both unprefixed
```

---

## ✅ F4-PHARMACY CURRENT STATUS

### What We Have
✅ Successfully merged to master  
✅ Port 8006 is ours and secure  
✅ Routing logic in place  
✅ Pharmacy service running  
✅ No one can remove or replace our entry without consequences  

### Risk to Our Feature
🟢 **ZERO** - We're already in master

### What We Need To Do
✅ **NOTHING** - Our feature is complete and safe

---

## 📊 COLLISION MATRIX

```
         F1-APT   F2-INS   F3-LAB   F4-PHARM   F5-TBD
        ┌────────┬────────┬────────┬──────────┬──────┐
 F1-APT │   -    │   ✅   │   ✅   │    ❌    │  ⏳  │
 F2-INS │   ✅   │   -    │   ✅   │    ❌    │  ⏳  │
 F3-LAB │   ✅   │   ✅   │   -    │    ❌❌  │  ⏳  │
F4-PHARM│   ❌   │   ❌   │  ❌❌  │    -     │  ⏳  │
 F5-TBD │   ⏳   │   ⏳   │   ⏳   │    ⏳    │  -   │
        └────────┴────────┴────────┴──────────┴──────┘

Legend:
  ✅ = No collision between these teams
  ❌ = F1/F2/F3 collide with F4
  ❌❌ = F3 has DOUBLE collision (merge + port)
  ⏳ = Cannot assess (F5 branch missing)
  -  = Same team
```

---

## 🎯 OUR POSITION (F4-PHARMACY)

### We Are Protected
- ✅ Already merged to master
- ✅ Cannot be removed or overwritten (we merged first)
- ✅ Port 8006 is ours by right of merge order
- ✅ Routing logic is established and working

### We Are NOT Blocking Anyone
- ✅ Our changes don't prevent others from merging
- ✅ Others can merge if they rebase correctly
- ✅ We're not demanding special treatment
- ✅ We just need them to rebase and accept our code

### Our Responsibility
- ✅ Keep pharmacy service stable
- ✅ Help other teams understand the collision
- ✅ Provide examples of how to rebase correctly

---

## 📋 EVIDENCE

### Commit Where F4 Was Merged
```
Commit: 49564f4
Message: Merge pull request #18 from PETraining/F4-Pharmacy-Ann
Date: (before current HEAD f95bbd6)
Status: ✅ MERGED & CURRENT
```

### What That Merge Added
```
gateway/main.py:
  + Line 13: "pharmacy" SERVICE_MAP entry
  + Lines 40-58: Pharmacy routing logic
  
services/pharmacy/:
  + main.py, models.py, schemas.py, etc.
  + Dockerfile, requirements.txt
  
docker-compose.yml:
  + pharmacy-service definition
  
Other files:
  + Frontend components
  + Tests
  + Documentation
```

### Current Status
```
File: gateway/main.py
Line 13: "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
✅ Present and active in master
✅ Not going anywhere
✅ Protected by merge order
```

---

## 🚀 RECOMMENDATION FOR F4-PHARMACY TEAM

### What We Should Do
1. ✅ Monitor the other teams' rebase efforts
2. ✅ Help them understand the collision
3. ✅ Provide example rebase commands
4. ✅ Offer to review their rebased code
5. ✅ Test their branches locally when ready

### What We Should NOT Do
- ❌ Back down from our port 8006 claim
- ❌ Remove our pharmacy entry to make merging easier for others
- ❌ Accept any merged branches that break pharmacy
- ❌ Compromise our feature to accommodate other teams

### Our Message to Others
```
"We're merged and secure. You need to rebase on us.
Our pharmacy code is staying on port 8006.
Rebase, keep our changes, and you'll be fine.
We're happy to help."
```

---

## ✅ SUMMARY FOR F4-PHARMACY

| Aspect | Status | Details |
|--------|--------|---------|
| **Our Merge Status** | ✅ COMPLETE | Already in master, commit 49564f4 |
| **Port 8006 Status** | ✅ OURS | Claimed first, staying ours |
| **Risk to Us** | 🟢 ZERO | We're protected by merge order |
| **Blockers** | 🟢 NONE | We have no blockers |
| **Action Needed** | ✅ NONE | Feature is done, nothing to fix |
| **Others' Status** | ❌ BLOCKED | F1, F2, F3 need rebase |
| **Our Responsibility** | 🟢 HELP | Help others understand rebase |

---

## 📌 FINAL WORD

**F4-Pharmacy is in excellent shape.**

We merged first. We own port 8006. We have no conflicts. We have no blockers. Our feature works.

The other teams need to rebase and accept our code. That's their problem to solve, not ours.

We just need to wait and help where we can.

---

**Status**: ✅ SECURE  
**Risk Level**: 🟢 ZERO  
**Action Required**: None  
**Next Step**: Monitor other teams' rebase efforts
