# Validation Agent Quick Start Guide

## What is the Validation Agent?

The **Insurance Eligibility & Prior Authorization Validator** is a specialized Claude Code agent that verifies implementation of the Insurance Eligibility feature against the project requirements.

**Location**: `.claude/agents/insurance-eligibility-validator.md`

---

## How to Use the Validator

### Option 1: Ask Claude Directly (Recommended)

In the Claude Code chat, ask for validation of specific aspects:

#### Validate Backend (Week 1)
```
Validate the Insurance Eligibility backend implementation against the plan
```

#### Validate Frontend (Week 2)
```
Validate the Insurance Eligibility frontend implementation against the plan
```

#### Validate Specific Component
```
Validate the Patient Service insurance endpoints implementation
```

#### Validate Data Model
```
Validate the Authorization ORM model and schema definitions
```

#### Validate Integration
```
Validate the API Gateway routing for insurance and authorization endpoints
```

---

### Option 2: Manual Validation Steps

If you prefer to run manual validation, follow the **VALIDATION_REFERENCE.md** file:

1. **For Backend (Week 1)**:
   - Follow sections 1-5 in VALIDATION_REFERENCE.md
   - Run the provided curl commands to test endpoints
   - Check database schemas with SQL commands

2. **For Frontend (Week 2)**:
   - Follow sections 6-9 in VALIDATION_REFERENCE.md
   - Perform manual UI testing in browser
   - Test each authorization status scenario

3. **For Integration**:
   - Run the integration test scenarios at the end
   - Verify service-to-service communication

---

## What Gets Validated

### Phase 1: Backend Foundation (Week 1)

| Component | Validation | Status |
|-----------|-----------|--------|
| Patient Service Insurance Model | ORM fields, relationships, indexes | [Run validator] |
| Insurance CRUD Endpoints | All 5 endpoints (POST, GET, PUT, DELETE) | [Run validator] |
| Referral Service Authorization Model | ORM fields, status enum, relationships | [Run validator] |
| Authorization Endpoints | All 3 endpoints (POST, GET, PUT) | [Run validator] |
| API Gateway Routes | Proxy routes for insurance & authorization | [Run validator] |
| Database Schema | Tables, constraints, cascade delete | [Run validator] |

### Phase 2: Frontend & Integration (Week 2)

| Component | Validation | Status |
|-----------|-----------|--------|
| Patient Details UI | Insurance display & management | [Run validator] |
| Referral Creation | Authorization blocking logic | [Run validator] |
| Referral Tracking | Status badges & Accept guard | [Run validator] |
| Notification Service | Event emission on auth status change | [Run validator] |

---

## Validation Output Format

When you ask the validator to validate, it will report:

```
# Insurance Eligibility & Prior Authorization - Validation Report

## Summary
[Overview of findings]

## Results

### ✓ PASS: Insurance ORM Model
Details of what was verified...

### ⚠ PARTIAL: Insurance CRUD Endpoints
What's implemented... What's missing...

### ✗ FAIL: Authorization Status Enum
What was expected... What was found...

### ? UNKNOWN: Frontend Authorization Blocking
What couldn't be verified... Why...

## Compliance Summary
- [X/Y] requirements met
- [A/B] requirements partially met
- [C/D] requirements not met

## Recommendations
1. [Priority 1 fix]
2. [Priority 2 fix]
3. [Priority 3 fix]
```

---

## Common Validation Requests

### "Is the backend ready for Week 2?"
Ask: `Validate that the backend insurance/authorization implementation is complete`

The validator will check:
- ✓ Insurance model exists with all fields
- ✓ Insurance endpoints work (POST, GET, PUT, DELETE)
- ✓ Authorization model exists with 4-state enum
- ✓ Authorization endpoints work (POST, GET, PUT)
- ✓ API Gateway routes configured
- ✓ Database schema created

### "Can staff create referrals with authorization checks?"
Ask: `Validate that referral creation properly blocks when authorization is denied`

The validator will check:
- ✓ Referral creation component fetches authorization status
- ✓ Denied status disables submit button
- ✓ Pending status shows warning
- ✓ Approved/Not Required allow submission
- ✓ Error messages are clear

### "Does the patient insurance display work?"
Ask: `Validate the patient details insurance section`

The validator will check:
- ✓ Insurance list displayed on patient details page
- ✓ Add/Edit/Delete insurance works
- ✓ Form validation on insurance fields
- ✓ Error handling for API calls

### "Are authorization events being emitted?"
Ask: `Validate the notification service authorization event handling`

The validator will check:
- ✓ Events emitted when authorization status changes
- ✓ Event contains required fields (referral_id, old_status, new_status)
- ✓ Events appear in notification logs
- ✓ Frontend can subscribe to events

---

## Testing Checklist

Before asking for full validation, ensure:

- [ ] `./start_all.sh` runs without errors
- [ ] Backend services are running (docker compose logs shows all services up)
- [ ] Frontend is running (http://localhost:4200 loads)
- [ ] Database tables exist (check via sqlite3)
- [ ] No compilation errors in backend or frontend
- [ ] API Gateway is proxying correctly

---

## Running the Validator

### In Claude Code Chat:
Simply type your validation request. The agent is automatically available.

Example:
```
I need you to validate that the Insurance Service backend is complete. 
Check the models, schemas, and endpoints against the plan in teamupdates/plan.md
```

### What the Agent Does:
1. Reads requirement files (context, plan, intent)
2. Searches for implementation files (models, endpoints, UI)
3. Compares implementation against requirements
4. Reports findings with PASS/PARTIAL/FAIL/UNKNOWN status
5. Provides recommendations for gaps

---

## Success Criteria

✓ **Week 1 (Backend) is ready when:**
- All insurance ORM fields present with proper constraints
- All 5 insurance endpoints implemented and tested
- Authorization ORM with 4-state enum implemented
- All 3 authorization endpoints implemented and tested
- API Gateway routes configured
- Database tables create on startup
- Seed data includes insurance and authorization examples

✓ **Week 2 (Frontend) is ready when:**
- Patient details page shows insurance info with add/edit/delete
- Referral creation blocks when authorization is Denied
- Referral tracking shows authorization status badges
- Accept button disabled when authorization is Pending or Denied
- Authorization status changes emit notifications
- All UI tests pass manually

---

## Files in This Validation Framework

1. **insurance-eligibility-validator.md** - The agent definition (you're using this)
2. **settings.json** - Configuration that maps requirements to implementation files
3. **VALIDATION_REFERENCE.md** - Detailed validation procedures with test commands
4. **VALIDATION_QUICKSTART.md** - This file (quick reference)
5. **../VALIDATION_CHECKLIST.md** - Comprehensive test checklist for QA team

---

## Need Help?

- **Validator not working?** Ensure `.claude/agents/insurance-eligibility-validator.md` exists
- **Don't know what to validate?** Check VALIDATION_REFERENCE.md for step-by-step procedures
- **Need full QA checklist?** See VALIDATION_CHECKLIST.md in the project root
- **Want to understand the feature?** Read Assignemtnrequirement.txt or teamupdates/context-map.md

---

**Created**: 2026-08-11  
**Purpose**: Quick reference for using the Insurance Eligibility Validator agent  
**Next Steps**: Run a validation, then implement any missing components identified
