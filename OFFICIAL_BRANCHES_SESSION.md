# 🎯 OFFICIAL BRANCHES - SESSION CANONICAL LIST

**Last Updated**: August 19, 2026  
**Status**: ✅ CONFIRMED BY USER

---

## 📌 THE 5 OFFICIAL FEATURE BRANCHES

These are the ONLY branches to analyze and consider for this entire session.  
All other branches are IGNORED.

### Team F1
```
origin/F1-Appointments
```

### Team F2
```
origin/F2-InsuranceEligibility
```

### Team F3
```
origin/F3-DiagnosticLab
```

### Team F4 (OUR PHARMACY TEAM)
```
origin/F4-Pharmacy-Ann
```

### Team F5
```
origin/F5.2-imp
```

---

## ✅ BRANCHES TO IGNORE THIS SESSION

The following branches exist on origin but are NOT part of official analysis:
- ❌ `origin/F4-Pharmacy-Description-Ann`
- ❌ `origin/F4-PharmacyPrescription`
- ❌ `origin/F4-PharmacyPrescription-Arun`
- ❌ `origin/F5-PatientPortal`
- ❌ `origin/F5-PatientPortal-new`
- ❌ `origin/dev_*` branches
- ❌ `origin/test/*` branches
- ❌ All other development/test branches

---

## 📊 ANALYSIS FOCUS

**Only these 5 branches receive collision analysis:**

| # | Team | Official Branch | Status |
|---|------|-----------------|--------|
| 1 | F1 | `F1-Appointments` | ✅ To analyze |
| 2 | F2 | `F2-InsuranceEligibility` | ✅ To analyze |
| 3 | F3 | `F3-DiagnosticLab` | ✅ To analyze |
| 4 | F4 | `F4-Pharmacy-Ann` | ✅ Our branch (merged) |
| 5 | F5 | `F5.2-imp` | ✅ To analyze |

---

## 🚨 KNOWN ISSUE

From previous analysis:
- **F3-DiagnosticLab** has port 8006 collision with **F4-Pharmacy-Ann**
- Requires F3 to update to port 8007 before merge

---

## 📋 NEXT STEPS

1. Analyze context/plan documents for each of the 5 official branches
2. Document all collision risks
3. Provide merge recommendations
4. Ignore all other branches completely
