# Remote Branches Summary

**Analysis Date**: August 19, 2026  
**Total Remote Branches**: 18

---

## Feature Team Branches

### **F1 - Appointments Team**
- `origin/F1-Appointments` ✅ Main feature branch

### **F2 - Insurance Eligibility Team**
- `origin/F2-InsuranceEligibility` ✅ Main feature branch

### **F3 - Diagnostic Lab Team**
- `origin/F3-DiagnosticLab` ✅ Main feature branch

### **F4 - Pharmacy Team (OUR TEAM)**
- `origin/F4-Pharmacy-Ann` ✅ **Main pharmacy branch (Ann)**
- `origin/F4-Pharmacy-Description-Ann` - Description/documentation version
- `origin/F4-PharmacyPrescription` - Alternative pharmacy version
- `origin/F4-PharmacyPrescription-Arun` - Pharmacy variant (Arun)

### **F5 - Patient Portal Team**
- `origin/F5-PatientPortal` ✅ Main patient portal branch
- `origin/F5-PatientPortal-new` - New patient portal variant

---

## Development/Test Branches

### **Personal Development Branches**
- `origin/dev_arun` - Arun's development branch
- `origin/dev_ebin` - Ebin's development branch
- `origin/dev_gouri` - Gouri's development branch
- `origin/dev_kevin` - Kevin's development branch

### **Testing/Workflow Branches**
- `origin/test/ci-workflow-validation` - CI workflow testing
- `origin/test/trigger-ci-workflow` - CI trigger testing
- `origin/test/workflow-v2` - Workflow version 2 (our test branch)

### **Main Branches**
- `origin/master` - Main production branch
- `origin/HEAD -> origin/master` - Points to master

---

## Summary by Team

| Team | Feature | Branch(es) | Status |
|------|---------|-----------|--------|
| **F1** | Appointments | `F1-Appointments` | 1 branch |
| **F2** | Insurance Eligibility | `F2-InsuranceEligibility` | 1 branch |
| **F3** | Diagnostic Lab | `F3-DiagnosticLab` | 1 branch |
| **F4** | Pharmacy (OURS) | `F4-Pharmacy-*` (4 branches) | 4 branches |
| **F5** | Patient Portal | `F5-PatientPortal*` (2 branches) | 2 branches |
| **Dev** | Individual dev work | `dev_*` (4 branches) | 4 branches |
| **Test** | Testing/workflows | `test/*` (3 branches) | 3 branches |

---

## Other Teams' Main Branches (NOT Ours)

### Feature Branches
1. **`origin/F1-Appointments`** - Team 1 (Appointments)
2. **`origin/F2-InsuranceEligibility`** - Team 2 (Insurance)
3. **`origin/F3-DiagnosticLab`** - Team 3 (Lab) ⚠️ **Has port collision with us**
4. **`origin/F5-PatientPortal`** - Team 5 (Patient Portal)
5. **`origin/F5-PatientPortal-new`** - Team 5 variant

### Development Branches
- `origin/dev_arun`
- `origin/dev_ebin`
- `origin/dev_gouri`
- `origin/dev_kevin`

---

## Key Observations

### Our Pharmacy Branches (F4)
- Multiple variants suggesting parallel work or iterations
- `F4-Pharmacy-Ann` appears to be the main one
- We're currently on `test/workflow-v2` (our CI/CD testing branch)

### Other Teams' Status
- **F1-Appointments**: Clean, single branch
- **F2-Insurance**: Clean, single branch
- **F3-Diagnostic Lab**: Clean, single branch BUT ⚠️ **COLLISION RISK** (port 8006)
- **F5-Patient Portal**: Two branches (main + new variant)

### Development Activity
- 4 individual developer branches suggest parallel work
- Personal branches may be temporary or for specific tasks
- Should consolidate/clean up when features are complete

---

## Recommendations

### For Merge Planning
1. ✅ **F1-Appointments**: Ready to merge (no port collision)
2. ✅ **F2-Insurance**: Ready to merge (no port collision)
3. ⚠️ **F3-Diagnostic Lab**: **HOLD until port updated from 8006 → 8007**
4. ✅ **F4-Pharmacy** (Ours): Already merged to master
5. ❓ **F5-Patient Portal**: Check for collisions before merge

### Branch Cleanup
- Consider archiving/deleting old dev branches once work is complete
- Consolidate pharmacy variants (`F4-Pharmacy-*`) into single main branch
- Monitor `test/*` branches - remove after testing complete

### Coordination
- Clear documentation of port assignments needed (see SERVICE_COLLISION_ANALYSIS.md)
- Define merge sequence to avoid conflicts
- Ensure gateway routing updated before each merge

---

## Active Merge Candidates

### **Ready to Merge** (No Issues Found)
- ✅ `F1-Appointments` 
- ✅ `F2-InsuranceEligibility`

### **Blocked** (Issues to Resolve)
- ⚠️ `F3-DiagnosticLab` - Port collision (8006 already taken by Pharmacy)

### **Already Merged**
- ✅ `F4-Pharmacy` (current branch contains pharmacy code)

### **Pending Analysis**
- ❓ `F5-PatientPortal` - Not yet analyzed, should check for collisions
