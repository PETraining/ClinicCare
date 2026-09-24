# 📌 OFFICIAL FEATURE BRANCHES - CANONICAL LIST

**Confirmed by User - These are the ONLY branches to consider**

---

## ✅ OFFICIAL FEATURE BRANCHES (5 Teams)

### Team F1: Appointments
```
Branch: origin/F1-Appointments
```

### Team F2: Insurance Eligibility
```
Branch: origin/F2-InsuranceEligibility
```

### Team F3: Diagnostic Lab
```
Branch: origin/F3-DiagnosticLab
```

### Team F4: Pharmacy (OUR TEAM)
```
Branch: origin/F4-Pharmacy-Ann  ← THIS IS OUR BRANCH
```

### Team F5: (Implementation/Phase 2)
```
Branch: origin/F5.2-imp
```

---

## 📋 SUMMARY TABLE

| Team | Official Branch | Feature | Collision Status |
|------|-----------------|---------|------------------|
| **F1** | `F1-Appointments` | Appointments | ✅ None |
| **F2** | `F2-InsuranceEligibility` | Insurance Eligibility | ✅ None |
| **F3** | `F3-DiagnosticLab` | Diagnostic Lab | ⚠️ Port 8006 collision |
| **F4** | `F4-Pharmacy-Ann` | Pharmacy (OURS) | ✅ Merged |
| **F5** | `F5.2-imp` | Phase 2 Implementation | ⏳ TBD |

---

## 🎯 ANALYSIS SCOPE

**All future analysis will consider ONLY these branches:**
- ✅ origin/F1-Appointments
- ✅ origin/F2-InsuranceEligibility
- ✅ origin/F3-DiagnosticLab
- ✅ origin/F4-Pharmacy-Ann
- ✅ origin/F5.2-imp

**All other branches on origin are IGNORED for this session.**

---

## 📊 KNOWN COLLISION

From SERVICE_COLLISION_ANALYSIS.md:

| Collision | Branch 1 | Port | Branch 2 | Port | Impact |
|-----------|----------|------|----------|------|--------|
| **Port 8006** | F3-DiagnosticLab | 8006 | F4-Pharmacy-Ann | 8006 | ⚠️ Cannot both merge |

**Solution**: F3 must move to port 8007 before merging.

---

## 🔍 NEXT STEPS

1. Analyze `F5.2-imp` context/plan for collisions
2. Verify F1, F2 have no collisions (already confirmed)
3. Document F3 port collision and required fix
4. Confirm merge sequence with all 5 teams
