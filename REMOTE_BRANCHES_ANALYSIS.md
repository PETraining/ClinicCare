# Remote Branches Analysis

**Date**: 2026-08-19  
**Current Branch**: `F5.2-imp` (Patient Portal Implementation)

---

## Branch Inventory

Total branches: **19 remote branches**

---

## 1. Main Branches

| Branch | Purpose | Status |
|--------|---------|--------|
| `origin/master` | Main production branch | ✅ Canonical |
| `origin/HEAD -> origin/master` | Default remote HEAD | ✅ Canonical |

---

## 2. Feature Branches by Team

### 🔵 Team 1: Appointments (F1)
| Branch | Status | Notes |
|--------|--------|-------|
| `origin/F1-Appointments` | Active | Appointments feature implementation |

### 🟢 Team 2: Insurance Eligibility (F2)
| Branch | Status | Notes |
|--------|--------|-------|
| `origin/F2-InsuranceEligibility` | Active | Insurance & Prior Authorization feature |

### 🟡 Team 3: Diagnostic Lab (F3)
| Branch | Status | Notes |
|--------|--------|-------|
| `origin/F3-DiagnosticLab` | Active | Lab Management feature |

### 🟣 Team 4: Pharmacy (F4)
| Branch | Status | Notes |
|--------|--------|-------|
| `origin/F4-Pharmacy-Description-Ann` | Active | Pharmacy implementation variant (Ann's branch) |
| `origin/F4-PharmacyPrescription` | Active | Pharmacy prescription feature |
| `origin/F4-PharmacyPrescription-Arun` | Active | Pharmacy prescription variant (Arun's branch) |

---

## 3. Team 5: Patient Portal (OUR TEAM - F5)

### Main Feature Branch
| Branch | Status | Notes |
|--------|--------|-------|
| `origin/F5.2-imp` | **CURRENT** | 🔴 **We are on this branch** |

### Related/Deprecated F5 Branches
| Branch | Status | Notes |
|--------|--------|-------|
| `origin/F5-PatientPortal` | Older | Original patient portal work |
| `origin/F5-PatientPortal-new` | Variant | Alternative implementation attempt |
| `origin/F5-PatientPortal-old` | Deprecated | Legacy work |
| `origin/F5-PatientPortalApp` | Variant | Another variation |
| `origin/F5.1-Planner` | Planning Phase | Planner agent setup (our phase 1) |

---

## 4. Personal Development Branches

These are likely team members' personal sandbox branches:

| Branch | Owner | Status |
|--------|-------|--------|
| `origin/dev_arun` | Arun | Personal dev |
| `origin/dev_ebin` | Ebin | Personal dev |
| `origin/dev_gouri` | Gouri | Personal dev |
| `origin/dev_kevin` | Kevin | Personal dev |

---

## Quick Reference: Other Teams' Branches to Monitor

```
The 4 teams that are NOT F5.2-imp (our branch):

F1: origin/F1-Appointments
F2: origin/F2-InsuranceEligibility
F3: origin/F3-DiagnosticLab
F4: origin/F4-Pharmacy-Description-Ann
    origin/F4-PharmacyPrescription
    origin/F4-PharmacyPrescription-Arun
```

---

## Branch Cleanup Recommendations

### Could be deleted (duplicates/variants):
- `origin/F5-PatientPortal` — Original, use `F5.2-imp` instead
- `origin/F5-PatientPortal-new` — Variant, use `F5.2-imp` instead
- `origin/F5-PatientPortal-old` — Deprecated
- `origin/F5-PatientPortalApp` — Variant, use `F5.2-imp` instead
- `origin/F5.1-Planner` — Planning phase only (now in `F5.2-imp`)

### Keep (active feature work):
- `origin/F1-Appointments`
- `origin/F2-InsuranceEligibility`
- `origin/F3-DiagnosticLab`
- `origin/F4-Pharmacy-Description-Ann`
- `origin/F4-PharmacyPrescription`
- `origin/F4-PharmacyPrescription-Arun`
- `origin/F5.2-imp` (OUR BRANCH)
- `origin/dev_*` (personal branches — could clean up if inactive)

---

## Cross-Team Integration Points

When merging back to master, watch for:

1. **Lab (F3)** ↔ **Patient Portal (F5.2)**: Lab results visible in patient portal
2. **Pharmacy (F4)** ↔ **Referral Flow (Appointments F1)**: Pharmacy prescriptions created when referral accepted
3. **Insurance (F2)** ↔ **Patient Portal (F5.2)**: Insurance status visible during referral/appointment
4. **All features** ↔ **Notification Service**: All features emit events

Make sure to:
- Check for API contract mismatches between teams
- Verify SERVICE_MAP entries don't collide (see `SERVICE_MAP_COLLISION_ANALYSIS.md`)
- Ensure seed data is compatible across services

---

**Last Updated**: 2026-08-19
