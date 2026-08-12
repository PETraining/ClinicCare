# Patient Portal — Quick Start Guide

**For: Team leads, developers, implementors**

## TL;DR

The Patient Portal is a 3-team feature split into independent sub-features. Use these agents to plan, build, and validate:

```bash
# Step 1: Create the plan (one-time, before coding)
/plan-patient-portal 3

# Step 2: Each team implements their sub-feature (parallel)
/implement-patient-portal referral-appointment-view
/implement-patient-portal document-form-management
/implement-patient-portal referral-tracking

# Step 3: Each team validates their work (after implementation)
/validate-patient-portal referral-appointment-view
/validate-patient-portal document-form-management
/validate-patient-portal referral-tracking

# Step 4: Teams integrate (after all sub-features pass validation)
# - Wire up navigation
# - Align seed data
# - Test end-to-end
# - Deploy
```

## Key Files

### 📋 Specifications (Context-Maps)
- `referral-appointment-view/context-map.md` — Sub-Feature 1 spec (Team 1)
- `document-form-management/context-map.md` — Sub-Feature 2 spec (Team 2)
- `referral-tracking/context-map.md` — Sub-Feature 3 spec (Team 3)

### 🔗 Planning & Coordination
- `INTEGRATION_PLAN.md` — How sub-features connect, shared data contracts
- `TEAM_ASSIGNMENT.md` — Team roles, timeline, dependencies, blockers

### 🛠️ Agent Definitions
- `.claude/agents/patient-portal-planner.md` — Creates the plan
- `.claude/agents/patient-portal-implementor.md` — Builds each sub-feature
- `.claude/agents/patient-portal-validator.md` — Validates each sub-feature

### 📚 Commands
- `.claude/commands/patient-portal-plan.md` — Invoke planner
- `.claude/commands/patient-portal-implement.md` — Invoke implementor
- `.claude/commands/patient-portal-validate.md` — Invoke validator

### 📖 Tutorial
- `PATIENT_PORTAL_TUTORIAL.md` — Comprehensive how-to guide

---

## For Team Leads

### Day 1: Planning
```bash
/plan-patient-portal 3
```

This generates:
- Context-maps for each sub-feature (architectural specification)
- Integration plan (data contracts, parallel work strategy)
- Team assignment (roles, timeline, blockers)

**Outputs**: Files in `teamupdates/features/patient-portal/`

### Day 2: Kick-Off
1. Assign each team member to a sub-feature
2. Have everyone read:
   - `PATIENT_PORTAL_TUTORIAL.md` (this guide)
   - Their assigned `context-map.md`
   - `TEAM_ASSIGNMENT.md` (everyone reads)
3. Set up daily standups (15 min)

### Days 3–7: Monitor Progress
- **Daily standup**: What's done, blockers, what's next
- **Day 4 sync**: Mid-week check (is Team 1 ready for Teams 2 & 3 to integrate?)
- **Unblock teams**: Help resolve dependencies (e.g., if Team 1 APIs aren't ready, use seed data)

### Days 6–7: Integration & Validation
1. Run validators for each sub-feature:
   ```bash
   /validate-patient-portal referral-appointment-view
   /validate-patient-portal document-form-management
   /validate-patient-portal referral-tracking
   ```
2. Fix any FAIL findings
3. Merge all code to main
4. Run end-to-end testing
5. Deploy

---

## For Implementors

### Day 1: Understand Your Sub-Feature
1. Read `PATIENT_PORTAL_TUTORIAL.md` (this guide)
2. Read your assigned `context-map.md` (in `referral-appointment-view/`, `document-form-management/`, or `referral-tracking/`)
3. Read `TEAM_ASSIGNMENT.md` to understand dependencies

### Days 2–7: Implement
```bash
# For Phase 1 (backend)
/implement-patient-portal <your-sub-feature> backend

# For Phase 2 (frontend)
/implement-patient-portal <your-sub-feature> frontend

# Or all at once
/implement-patient-portal <your-sub-feature>
```

**Unblock strategy**: If you depend on another team's API, use **seed data** until they're ready.

### Day 7: Validate
```bash
/validate-patient-portal <your-sub-feature>
```

Fix any FAIL findings and re-validate until all PASS.

---

## For Validators (Tech Lead / QA)

### After Each Sub-Feature
```bash
/validate-patient-portal <sub-feature-name>
```

**Read the report**:
- ✅ **PASS**: Requirement is met
- ⚠️ **PARTIAL**: Partially met; recommendation for completion
- ❌ **FAIL**: Not met; needs fixing
- ❓ **UNKNOWN**: Can't verify statically; needs manual testing

**Escalate**:
- FAIL findings → team member fixes and re-validates
- PARTIAL findings → review with team, decide if acceptable
- UNKNOWN findings → schedule manual testing

---

## Sub-Feature Overview

### Sub-Feature 1: Referral & Appointment View
- **Team**: Member 1
- **Timeline**: 1 week
- **Scope**: Patient dashboard showing referrals and appointments
- **Context**: `referral-appointment-view/context-map.md`
- **Key files**: 
  - Backend: Referral Service (8003), Patient Service (8001), API Gateway
  - Frontend: Patient Portal shell, dashboard, card components

### Sub-Feature 2: Document & Form Management
- **Team**: Member 2
- **Timeline**: 1 week (overlapping with Team 1)
- **Scope**: Patient uploads pre-visit forms, downloads clinic documents
- **Context**: `document-form-management/context-map.md`
- **Dependency**: Needs referral list from Sub-Feature 1
- **Key files**: 
  - Backend: Document Service (8004), API Gateway
  - Frontend: Upload form, document list components

### Sub-Feature 3: Referral Progress Tracking
- **Team**: Member 3
- **Timeline**: 1 week (overlapping with Teams 1 & 2)
- **Scope**: Patient sees referral status timeline, receives notifications
- **Context**: `referral-tracking/context-map.md`
- **Dependencies**: Referral data from Sub-Feature 1, Notification Service 8005
- **Key files**: 
  - Backend: Referral Service (8003), Notification Service (8005), API Gateway
  - Frontend: Timeline, next-steps components

---

## Data Contracts (Shared Between Sub-Features)

All team members must use these schemas to ensure compatibility:

### Referral (Sub-Feature 1 exports, others import)
```json
{
  "id": "ref-123",
  "patientId": 1,
  "specialty": "Cardiology",
  "referringProvider": "Dr. Smith",
  "status": "scheduled",
  "appointmentDate": "2026-09-15T10:00:00Z"
}
```

### Document (Sub-Feature 2 exports)
```json
{
  "id": "doc-123",
  "patientId": 1,
  "referralId": "ref-123",
  "fileName": "form.pdf",
  "uploadDate": "2026-08-10T00:00:00Z",
  "status": "received"
}
```

### Status History (Sub-Feature 3 exports)
```json
{
  "id": "hist-123",
  "referralId": "ref-123",
  "oldStatus": "pending",
  "newStatus": "approved",
  "changedAt": "2026-08-05T00:00:00Z",
  "reason": "Insurance approved"
}
```

See `INTEGRATION_PLAN.md` for full data contracts.

---

## Troubleshooting

### Team 2/3 blocked on Team 1's API?
→ Use **seed data** in your `seed.py`. Mock the API with test data. When Team 1's API is ready, replace mock with real HTTP call.

### Can't find something in the context-map?
→ It's an "Open Question" meant to be resolved conservatively by the implementor. Implement it, document your assumption, include in the implementation report.

### Validator says FAIL but I think I implemented it?
→ The context-map might be more specific than you thought. Re-read the relevant section and verify your code matches exactly. If still confused, escalate to tech lead.

### Agent timed out or errored?
→ Try running the command again. If persistent, check agent definition and command definition files for syntax errors.

---

## Next Steps

1. **Assign teams** (if not already done)
2. **Run planner**: `/plan-patient-portal 3`
3. **Hold kick-off**: Share this guide and context-maps
4. **Start building**: Team 1 → Team 2 → Team 3 (parallel)
5. **Validate**: Each team validates before merging
6. **Integrate**: Wire up cross-feature navigation and test end-to-end
7. **Ship**: Deploy to production

---

**For detailed guidance**, see `PATIENT_PORTAL_TUTORIAL.md`

**Questions?** Ask in standup, Slack, or escalate to tech lead.
