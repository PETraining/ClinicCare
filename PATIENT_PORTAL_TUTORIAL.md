# Patient Portal Implementation Tutorial

**Date**: 2026-08-12  
**Feature**: Patient Portal for ClinicCare  
**Scope**: 3 independent sub-features, 1 week each, 3 team members

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Agents](#architecture--agents)
3. [The 3 Sub-Features](#the-3-sub-features)
4. [How to Use the Agents](#how-to-use-the-agents)
5. [Context Format](#context-format)
6. [Running Commands](#running-commands)
7. [Workflow for Each Team](#workflow-for-each-team)
8. [Integration & Testing](#integration--testing)
9. [FAQ](#faq)

---

## Overview

### What is the Patient Portal?

The Patient Portal is a new feature for ClinicCare that gives patients visibility into their own care. Unlike the clinician-facing referral system, the Patient Portal allows patients to:

- **View referrals & appointments** — See active referrals and upcoming appointments in a dashboard
- **Upload & download documents** — Submit pre-visit forms and questionnaires; download clinic documents
- **Track referral progress** — See the status history of their referrals and receive notifications when things change

### Why 3 Sub-Features?

The Patient Portal is large enough that we've split it into 3 **independent, parallel sub-features**, each assigned to one team member. This allows:

- **Faster development**: Teams can work in parallel instead of sequentially
- **Clear ownership**: Each team member owns one feature end-to-end (backend + frontend)
- **Reduced coordination overhead**: Minimal blocking dependencies through clear data contracts

The 3 sub-features are:

1. **Referral & Appointment View** (Team Member 1) — Foundational; provides the dashboard and patient context for the other two
2. **Document & Form Management** (Team Member 2) — Lets patients upload forms; depends on referral data from Sub-Feature 1
3. **Referral Progress Tracking** (Team Member 3) — Shows referral status timeline; depends on referral data from Sub-Feature 1

---

## Architecture & Agents

### The Agent System

We use **3 specialized agents** to decompose, implement, and validate the Patient Portal:

#### 1. **Planner Agent** (`patient-portal-planner`)
**Purpose**: Create a detailed, structured implementation plan  
**When to use**: Before any coding starts (once per feature)  
**Output**: 
- Context-maps for each sub-feature (specs that implementors follow)
- Integration plan (how sub-features connect)
- Team assignments and timeline

**Invoked via**: `/plan-patient-portal [team-count]`

---

#### 2. **Implementor Agent** (`patient-portal-implementor`)
**Purpose**: Build one sub-feature end-to-end (backend services, API gateway, Angular frontend)  
**When to use**: After the planner creates context-maps (once per sub-feature per team)  
**Output**: 
- Working code across all services and frontend
- Attribution tag in context-map
- Implementation report with assumptions and deviations

**Invoked via**: `/implement-patient-portal <sub-feature-name> [phase]`

---

#### 3. **Validator Agent** (`patient-portal-validator`)
**Purpose**: Read-only validation that implementation matches spec  
**When to use**: After implementor finishes, before marking done (once per sub-feature per team)  
**Output**: 
- Validation report with PASS/FAIL/PARTIAL/UNKNOWN findings
- Recommendations for fixes
- No code changes (read-only)

**Invoked via**: `/validate-patient-portal <sub-feature-name> [phase]`

---

### How the Agents Work Together

```
Step 1: Planning
┌─────────────────────────────────────────────────────────┐
│ Run: /plan-patient-portal 3                             │
│ Output: Context-maps for 3 sub-features                 │
│ Files: teamupdates/features/patient-portal/*/           │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
Step 2: Parallel Implementation (Team 1, 2, 3)
┌───────▼──────────────────────┐   ┌──────────────────────┐
│ Team 1:                       │   │ Team 2:              │
│ /implement-patient-portal     │   │ /implement-patient-  │
│ referral-appointment-view     │   │ portal               │
│                               │   │ document-form-       │
│ Output: Complete code         │   │ management           │
│ (backend + frontend)          │   │                      │
└───────┬──────────────────────┘   └──────────┬───────────┘
        │                                     │
        │                          ┌──────────┘
        │                          │
        │        ┌─────────────────┴─────────┐
        │        │                           │
        │   ┌────▼──────────────────┐   Step 3: Validation
        │   │ Team 3:               │   (Parallel, each team)
        │   │ /implement-patient-   │   ┌─────────────────────┐
        │   │ portal                │   │ Team 1:             │
        │   │ referral-tracking     │   │ /validate-patient-  │
        │   │                       │   │ portal              │
        │   │ Output: Complete code │   │ referral-           │
        └───┤ (backend + frontend)  │   │ appointment-view    │
            └──────────┬───────────┘   │                     │
                       │               │ Output: Report with │
                       │               │ PASS/FAIL findings  │
                       │               └─────────────────────┘
                       │                     [Repeat for SF2 & SF3]
                       │
        ┌──────────────┴─────────────────┐
        │                                │
Step 4: Integration (All teams together)
┌───────▼────────────────────────────────▼──────────────┐
│ Wire up cross-feature navigation                       │
│ Align seed data                                        │
│ End-to-end testing                                     │
│ Final validation: /validate-patient-portal integration │
└────────────────────────────────────────────────────────┘
```

---

## The 3 Sub-Features

### Sub-Feature 1: Referral & Appointment View

**Team**: Team Member 1  
**Timeline**: Days 1–5  
**Context**: `teamupdates/features/patient-portal/referral-appointment-view/context-map.md`

**What it does**:
- Patients see their referrals and appointments in a dashboard
- Displays referral status, specialty, provider, appointment date
- Displays appointment details (date, time, provider, location)

**Key components**:
- **Backend**: GET endpoints for referrals and appointments (Referral Service 8003, Patient Service 8001)
- **Frontend**: Dashboard, referral card, appointment card, patient-portal shell component
- **Integration**: Provides the foundation for Sub-Features 2 & 3

**Shared contract**:
- Referral ID, status enum (pending|approved|scheduled|completed|canceled)
- Appointment date/time (ISO 8601)
- Patient ID (from logged-in user)

---

### Sub-Feature 2: Document & Form Management

**Team**: Team Member 2  
**Timeline**: Days 2–7  
**Context**: `teamupdates/features/patient-portal/document-form-management/context-map.md`

**What it does**:
- Patients upload pre-visit forms and documents
- Patients can optionally link uploads to a specific referral
- Patients download clinic-provided documents
- Shows upload status (pending, received, reviewed, rejected)

**Key components**:
- **Backend**: POST/GET endpoints for document upload/download (Document Service 8004)
- **Frontend**: Upload form, document list, document card
- **Storage**: Persistent file storage (local filesystem or S3)

**Shared contract**:
- Document metadata (name, upload date, status)
- Referral ID (optional, for linking documents to referrals)
- Patient ID

**Blocking dependency**: 
- Needs referral list from Sub-Feature 1 (for dropdown in upload form)
- **Unblock strategy**: Use seed referral data until Sub-Feature 1 APIs are ready

---

### Sub-Feature 3: Referral Progress Tracking

**Team**: Team Member 3  
**Timeline**: Days 3–7  
**Context**: `teamupdates/features/patient-portal/referral-tracking/context-map.md`

**What it does**:
- Patients see a timeline of status changes for their referrals
- Timeline shows when referral moved from pending → approved → scheduled, etc.
- Shows "next steps" messaging (e.g., "Upload insurance card")
- Triggers notifications when status changes (via Notification Service 8005)

**Key components**:
- **Backend**: GET endpoint for status history; POST hook when status changes (Referral Service 8003)
- **Frontend**: Timeline, status history, next-steps component
- **Notifications**: Call Notification Service when referral status changes

**Shared contract**:
- Referral ID, status enum, timestamp
- Status history (old status → new status, date, reason)
- Notification schema (patient_id, referral_id, message, timestamp)

**Blocking dependencies**:
- Needs referral data from Sub-Feature 1
- Needs NotificationService 8005 (should already exist)
- **Unblock strategy**: Use seed referral data; verify NotificationService is ready

---

## How to Use the Agents

### Running the Planner Agent

The planner creates a detailed breakdown of the feature into 3 sub-features with context-maps.

**Command**:
```
/plan-patient-portal 3
```

**What it does**:
1. Creates `teamupdates/features/patient-portal/referral-appointment-view/context-map.md`
2. Creates `teamupdates/features/patient-portal/document-form-management/context-map.md`
3. Creates `teamupdates/features/patient-portal/referral-tracking/context-map.md`
4. Creates `teamupdates/features/patient-portal/INTEGRATION_PLAN.md` (how they fit together)
5. Creates `teamupdates/features/patient-portal/TEAM_ASSIGNMENT.md` (team roles and timeline)

**Output**:
- Context-maps with phases, deliverables, files to change, success criteria, open questions
- Integration plan with shared data contracts and parallel work strategy
- Team assignment with blockers and coordination instructions

**Time**: ~5–10 minutes

---

### Running the Implementor Agent

Each team member runs the implementor for their assigned sub-feature.

**Command**:
```
/implement-patient-portal <sub-feature-name> [phase]
```

**Examples**:
```bash
# Implement the full Referral & Appointment View sub-feature
/implement-patient-portal referral-appointment-view

# Implement only the backend phase of Document Management
/implement-patient-portal document-form-management backend

# Implement the frontend phase of Referral Tracking
/implement-patient-portal referral-tracking frontend
```

**What it does**:
1. Reads the context-map for the sub-feature
2. Implements all phases (or the specified phase) end-to-end
3. Writes backend code (models, schemas, routes, seed data)
4. Writes frontend code (components, services, routes)
5. Wires up API Gateway routing
6. Adds attribution tag to context-map
7. Outputs an implementation report with assumptions and deviations

**Expected deliverables**:
- Working backend endpoints
- Working frontend components
- API Gateway proxy routes
- Seed data for testing
- No errors or warnings on syntax check

**Time**: ~1–2 hours per sub-feature (depending on complexity and team familiarity)

---

### Running the Validator Agent

After implementation, validate against the context-map.

**Command**:
```
/validate-patient-portal <sub-feature-name> [phase]
```

**Examples**:
```bash
# Validate the full Referral & Appointment View implementation
/validate-patient-portal referral-appointment-view

# Validate only the backend of Document Management
/validate-patient-portal document-form-management backend

# Validate with explicit doc paths (if context-maps are in non-standard location)
/validate-patient-portal referral-appointment-view full \
  teamupdates/features/patient-portal/referral-appointment-view/context-map.md
```

**What it does**:
1. Reads the context-map (requirement spec)
2. Examines the actual code (models, endpoints, components, routes)
3. Checks that each requirement is met (PASS/FAIL/PARTIAL/UNKNOWN)
4. Produces a validation report with findings and recommendations
5. Does NOT modify code (read-only validation)

**Expected output**:
- Validation report with PASS/FAIL/PARTIAL findings
- Recommendations for fixes (e.g., "Add auth guard to this route")
- Any scope gaps or unknowns that need manual testing

**Time**: ~30–45 minutes per sub-feature

**Success**: 0 FAIL findings, <3 PARTIAL findings (minor issues that can be fixed)

---

## Context Format

### What is a Context-Map?

A **context-map** is the specification document that describes what to build. The implementor agent reads it and builds code to satisfy it. The validator agent checks code against it.

### Structure of a Context-Map

Each context-map has these sections:

```markdown
# Patient Portal: [Sub-Feature Name]

**Feature Name**: [Human-readable name]
**Sub-Feature of**: Patient Portal
**Assigned Team**: Team Member X
**Timeline**: [1 week, etc.]
**Status**: [Pending Implementation, In Progress, Complete]

## Overview
[1-2 paragraphs: what the feature does, why it matters, key flows]

## Scope
[Detailed breakdown of phases (Phase 1, Phase 2, etc.) with deliverables]

### Phase 1: [Name]
**Deliverables**: [List of concrete outputs]
**Files to Change**: [Specific file paths that will be modified]

[Repeat for Phase 2, Phase 3, etc.]

## Service Architecture
[Table showing which service owns which piece]

## Success Criteria
[Checklist of observable outcomes that prove the feature works]

## Files to Change Summary
[Consolidated list of all files touched across all phases]

## Open Questions
[Ambiguities that the implementor should resolve conservatively]

## Integration Notes
[How this sub-feature depends on or connects to others]

## Manual Verification Steps
[How to test the feature after implementation]
```

### Example: Phases & Deliverables

A context-map breaks down the work into **phases** (usually 1-2 per sub-feature):

```markdown
### Phase 1: Backend Services & Data Model
**Deliverables**:
- Add ReferralStatusHistory model to Referral Service
- Add endpoints to retrieve status history
- Wire up notification trigger
- Seed test data

**Files to Change**:
- services/referral/models.py
- services/referral/schemas.py
- services/referral/main.py
- services/notification/main.py
- services/api-gateway/main.py
```

The implementor will read this and write code to all listed files, implementing each deliverable.

---

## Running Commands

### How to Invoke Agents

Agents are invoked via **slash commands** in Claude Code:

```
/plan-patient-portal 3
/implement-patient-portal referral-appointment-view
/validate-patient-portal referral-appointment-view
```

These are defined in `.claude/commands/` and route to the corresponding agent definitions in `.claude/agents/`.

### Command Files Location

```
.claude/
  agents/
    patient-portal-planner.md        ← Agent definition
    patient-portal-implementor.md    ← Agent definition
    patient-portal-validator.md      ← Agent definition
  commands/
    patient-portal-plan.md           ← Command routing to planner
    patient-portal-implement.md      ← Command routing to implementor
    patient-portal-validate.md       ← Command routing to validator
```

### Using Commands in Claude Code

In Claude Code CLI or IDE, run:

```bash
/plan-patient-portal 3
```

This will:
1. Load the command definition from `.claude/commands/patient-portal-plan.md`
2. Route to the planner agent definition from `.claude/agents/patient-portal-planner.md`
3. Invoke the agent with arguments `team-member-count=3`
4. Agent executes and produces output

---

## Workflow for Each Team

### Team Member 1: Referral & Appointment View

**Day 1**:
1. Read this tutorial
2. Read `teamupdates/features/patient-portal/TEAM_ASSIGNMENT.md` (your role)
3. Read `teamupdates/features/patient-portal/referral-appointment-view/context-map.md` (your spec)
4. Understand the success criteria and files to change

**Days 2–4**:
5. Implement Phase 1 (Backend): Models, schemas, endpoints
   - Update `services/referral/schemas.py`
   - Update `services/referral/main.py`
   - Update `services/patient/schemas.py` and `services/patient/main.py`
   - Update `services/patient/seed.py`
   - Update `services/api-gateway/main.py`
   - Verify with syntax checks: `python -m py_compile <file>`

6. Test locally: Start services with `./start_all.sh`, verify APIs with curl:
   ```bash
   curl -H "Authorization: Bearer <patient-token>" \
     http://localhost:8000/api/patient-portal/referrals/1
   ```

**Days 4–5**:
7. Implement Phase 2 (Frontend): Components, services, routes
   - Create patient-portal shell component
   - Create referral and appointment card components
   - Create patient-portal.service.ts
   - Register routes in app.routes.ts
   - Verify with TypeScript check: `cd frontend && npx tsc --noEmit`

8. Test UI: Navigate to `http://localhost:4200/patient-portal`, verify dashboard displays

**Day 5 (Evening)**:
9. Run validator: `/validate-patient-portal referral-appointment-view`
10. Fix any FAIL or PARTIAL findings
11. Run validator again until PASS with no FAIL findings
12. Commit code and mark your context-map as "Complete"

---

### Team Member 2: Document & Form Management

**Day 1**:
1. Read this tutorial and your team assignment
2. Read `teamupdates/features/patient-portal/document-form-management/context-map.md`
3. Note: You depend on referral list from Team Member 1 (unblock with seed data)

**Days 2–7** (overlapping with Team 1):
4. While waiting for Team 1's referral APIs:
   - Implement Document model and backend API endpoints
   - Use seed referral data in your mock code
   - Write upload handler, download handler, list handler

5. Once Team 1's referral APIs are ready:
   - Swap seed data for real API calls
   - Test referral dropdown in upload form

6. Implement frontend: Upload form, document list, document card
7. Test UI and API interactions
8. Run validator: `/validate-patient-portal document-form-management`
9. Fix findings and re-validate
10. Commit code

---

### Team Member 3: Referral Progress Tracking

**Day 1**:
1. Read this tutorial and your team assignment
2. Read `teamupdates/features/patient-portal/referral-tracking/context-map.md`
3. Understand the notification integration and timeline model

**Days 3–7** (overlapping with Teams 1 & 2):
4. While waiting for Team 1's referral APIs:
   - Design ReferralStatusHistory model
   - Implement timeline endpoints
   - Seed test status history data

5. Once referral APIs are available:
   - Implement status change notification hook
   - Verify NotificationService 8005 is available and working
   - Call it when referral status changes

6. Implement frontend: Timeline, next-steps component
7. Test status change flow (manually update a referral status, verify notification is sent)
8. Run validator: `/validate-patient-portal referral-tracking`
9. Fix findings and re-validate
10. Commit code

---

## Integration & Testing

### Integration Phase (Days 6–7)

Once all 3 sub-features are complete:

1. **Merge code**: All 3 teams merge to main branch (or integration branch)

2. **Run validators again**:
   ```bash
   /validate-patient-portal referral-appointment-view
   /validate-patient-portal document-form-management
   /validate-patient-portal referral-tracking
   ```
   Ensure all pass with no FAIL findings.

3. **Align seed data**: Ensure patient IDs, referral IDs, and appointment IDs are consistent across all services
   - All services should seed the same demo patient (e.g., ID 1)
   - All services should seed referrals with the same IDs
   - Manually verify in database:
     ```bash
     sqlite3 services/patient/patient.db "SELECT * FROM patients WHERE id = 1;"
     sqlite3 services/referral/referral.db "SELECT * FROM referrals WHERE patient_id = 1;"
     ```

4. **Wire up navigation**:
   - Add navigation menu in Patient Portal shell
   - Add links: Dashboard → View Progress → Tracking page
   - Add links: Dashboard → Upload Form → Document upload
   - Test all navigation flows

5. **End-to-end testing**:
   - Log in as a patient
   - View referrals & appointments
   - Click "View Progress" → see status timeline
   - Click "Upload Form" → upload a document
   - See document in next steps (if implemented)
   - Manually change a referral status (in DB or admin API)
   - Verify patient receives notification

6. **Responsive design check**:
   - Resize browser to mobile width
   - Verify all components adapt correctly
   - Test on actual mobile device if possible

7. **Performance check**:
   - Open browser DevTools Network tab
   - Verify API calls are reasonably fast (<500ms)
   - Check for any N+1 queries or inefficiencies

---

## FAQ

### Q: What if Sub-Feature 1 isn't ready when Team 2/3 needs to start?

**A**: Use **seed data** or **mock endpoints**. The `context-map` defines the shared data contract (what referral schema looks like). Team 2/3 can seed this data locally and test independently. When Team 1's APIs are ready, swap the mock for the real API call.

**Example (Team 2 mock)**:
```python
# services/document/seed.py
MOCK_REFERRALS = [
    {"id": "ref-1", "patientId": 1, "specialty": "Cardiology", "status": "pending"},
    {"id": "ref-2", "patientId": 1, "specialty": "Dermatology", "status": "scheduled"},
]

@app.get("/api/patient-portal/referrals")
def get_referrals_mock():
    return MOCK_REFERRALS

# Later, swap for real API call:
@app.get("/api/patient-portal/referrals")
async def get_referrals(patient_id: int):
    async with httpx.AsyncClient() as client:
        return await client.get(f"http://referral-service:8003/referrals/{patient_id}")
```

---

### Q: What if the context-map has an "Open Question" I don't know how to answer?

**A**: Resolve it **conservatively** (pick the simplest interpretation that meets the success criteria), implement it, and **document your assumption** in the implementation report.

**Example** (from Referral & Appointment View context-map):
```
Open Question: "What are the exact status enum values?"
Your resolution: Assume pending | approved | scheduled | completed | canceled
Document in report: "Assumed status enum values based on typical referral workflow. 
If different values are needed, update Referral model and Validator agent will flag."
```

The validator will note this as an "assumption" and flag it for review.

---

### Q: Do I need to run tests?

**A**: No automated test suite is required. The validator agent does a **static check** (reads code, verifies structure). You do **manual verification** by:

1. Starting services with `./start_all.sh`
2. Testing the feature in browser (`http://localhost:4200/patient-portal`)
3. Using curl to test APIs
4. Following the "Manual Verification Steps" in the context-map

**Example**:
```bash
# Test referral API
curl -H "Authorization: Bearer <patient-token>" \
  http://localhost:8000/api/patient-portal/referrals/1 | jq

# Test document upload
curl -F "file=@test.pdf" \
  -F "referral_id=ref-1" \
  -H "Authorization: Bearer <patient-token>" \
  http://localhost:8000/api/patient-portal/documents/upload
```

---

### Q: What if I find a bug in another team's code during integration?

**A**: Open an issue or Slack message with details. Don't push fixes directly (each team owns their code). Work with the other team to fix it together. If blocking, escalate to tech lead.

---

### Q: Can I start before the planner agent creates context-maps?

**A**: No. The context-map is your specification. Without it, you don't know exactly what to build. Run the planner first:
```
/plan-patient-portal 3
```
This creates the context-maps that implementors follow.

---

### Q: What's the difference between a context-map and a validator report?

**A**: 
- **Context-map**: The specification (what to build)
- **Validator report**: The audit (did you build it correctly?)

Context-map is written by the planner and read by the implementor. Validator report is written by the validator agent and read by the team to ensure quality.

---

### Q: Do I need to write code for the validator agent, or does it just check my code?

**A**: The validator agent **only reads and checks** your code. It does NOT write code or fix bugs. It's a read-only validation step. If it finds issues, you fix them and re-run the validator.

---

### Q: What if the validator finds a FAIL that I disagree with?

**A**: The validator is reading the context-map spec. If you disagree with the finding:

1. Double-check the context-map to understand the requirement
2. Verify your implementation against the requirement
3. If there's a genuine ambiguity in the context-map, update it and add a note
4. Re-run the validator to confirm the fix

If it's a tool issue (validator misunderstood the code), report it and the agent definitions can be refined.

---

### Q: How do I know if my implementation is "done"?

**A**: Your sub-feature is done when:

1. ✅ All files from "Files to Change" are updated
2. ✅ All "Success Criteria" are met (manual testing)
3. ✅ Validator returns 0 FAIL findings
4. ✅ Code is clean, follows CLAUDE.md, has no syntax errors
5. ✅ You've documented assumptions in the implementation report
6. ✅ Context-map is tagged with attribution (added by implementor agent)
7. ✅ Code is committed and pushed to branch

---

### Q: What branch should I use?

**A**: Ask your tech lead. Typical workflows:
- Main branch (if auto-deploying) — create a feature branch, PR when done
- Staging branch — all teams merge to `staging`, test together, then PR to main
- Release branch — teams work on own branches, merge to release at cutoff

For this tutorial, assume:
```
Main: master
Feature branches: F5-PatientPortal-<subfeature> or F5-<teamMember>-<subfeature>
Integration: Create a PR to master when all 3 are done
```

---

### Q: Where do I find the API endpoint for [Service X]?

**A**: 
1. Check the context-map "Files to Change" section — it lists which service owns each endpoint
2. Read `services/<service>/main.py` to see existing endpoints
3. Check `CLAUDE.md` for inter-service call patterns
4. Ask on Slack or in standup

---

## Next Steps

1. **Designate team members**: Assign each person to one sub-feature
2. **Run the planner**: 
   ```
   /plan-patient-portal 3
   ```
3. **Hold kick-off**: All team members read this tutorial + their context-map + team assignment
4. **Start building**: Team 1 begins Phase 1; Teams 2 & 3 unblock with seed data
5. **Daily standups**: 15 min daily to sync blockers
6. **Mid-week check-in**: Day 4, verify Team 1 is ready for Teams 2 & 3 to integrate
7. **Validation**: Each team validates before merging
8. **Integration week**: All teams merge and test together
9. **Ship**: Deploy to production once all validators pass

---

**Good luck, team! 🚀**

Questions? Ask on Slack, in standup, or escalate to tech lead.

For more details on the three sub-features, see:
- `teamupdates/features/patient-portal/referral-appointment-view/context-map.md`
- `teamupdates/features/patient-portal/document-form-management/context-map.md`
- `teamupdates/features/patient-portal/referral-tracking/context-map.md`
- `teamupdates/features/patient-portal/INTEGRATION_PLAN.md`
- `teamupdates/features/patient-portal/TEAM_ASSIGNMENT.md`
