# Patient Portal — Team Assignment & Timeline

**Date Created**: 2026-08-12  
**Feature**: Patient Portal  
**Total Team**: 3 members  
**Total Duration**: 1–2 weeks

## Team Breakdown

### Team Member 1: Referral & Appointment View (Foundational)
**Name**: [To be assigned]  
**Role**: Backend + Frontend for patient portal shell and referral/appointment dashboard  
**Timeline**: Week 1 (Days 1–5)  
**Focus**: Build the foundation that all other sub-features depend on

**Responsibilities**:
- Design and implement the Patient Portal shell component (reusable layout)
- Build Referral and Appointment backend APIs (endpoints, models, schemas)
- Create referral and appointment card components
- Implement auth guard for patient-only access
- Create patient-portal.service.ts for HTTP calls
- Seed test data for referrals and appointments
- Register patient-portal route in app.routes.ts

**Deliverables**:
- ✓ Backend: Referral GET endpoints, Appointment GET endpoints
- ✓ Frontend: Patient Portal shell, dashboard, card components, service
- ✓ API Gateway: Proxy routes for `/api/patient-portal/referrals` and `/api/patient-portal/appointments`
- ✓ Seed data: 2+ referrals and appointments for demo patient
- ✓ Auth guard: Patient-only access to /patient-portal routes

**Context**: See `teamupdates/features/patient-portal/referral-appointment-view/context-map.md`

**Success Criteria**:
- Patient can view their referrals and appointments on a dashboard
- Each referral shows specialty, provider, status, appointment date
- Each appointment shows date, time, provider, location
- API enforces patient data isolation

**Blockers**: None (foundational)

**Supported by**: Tech lead or architect for code review and integration guidance

---

### Team Member 2: Document & Form Management
**Name**: [To be assigned]  
**Role**: Backend + Frontend for document upload/download and form handling  
**Timeline**: Week 1–2 (Days 2–7, overlapping with Team 1)  
**Focus**: Enable patients to share pre-visit documents and forms

**Responsibilities**:
- Design PatientDocument model in Document Service
- Build document upload, download, and list APIs
- Create upload form component with referral selector
- Create document list and card components
- Implement document.service.ts for HTTP calls
- Handle file persistence and retrieval
- Seed sample forms/documents
- Integrate with patient portal navigation

**Deliverables**:
- ✓ Backend: Document upload, download, list endpoints
- ✓ Model: PatientDocument with patient_id, referral_id, status
- ✓ Frontend: Upload form, document list, document card components
- ✓ API Gateway: Proxy routes for `/api/patient-portal/documents/*`
- ✓ Seed data: Sample forms/documents for demo patient
- ✓ File handling: Store and serve files persistently

**Context**: See `teamupdates/features/patient-portal/document-form-management/context-map.md`

**Success Criteria**:
- Patient can navigate to Documents section
- Patient can upload a file with optional referral association
- Patient can download their uploaded documents
- API enforces patient data isolation

**Blockers**: 
- Depends on Sub-Feature 1 for referral list (for dropdown in upload form)
  - **Unblock**: Use seed referral data until Sub-Feature 1 APIs are ready

**Supported by**: Team Member 1 for integration, Tech lead for file handling guidance

---

### Team Member 3: Referral Progress Tracking
**Name**: [To be assigned]  
**Role**: Backend + Frontend for referral status history, timeline, and notifications  
**Timeline**: Week 1–2 (Days 3–7, overlapping with Teams 1 & 2)  
**Focus**: Give patients visibility into referral progress and status changes

**Responsibilities**:
- Design ReferralStatusHistory model in Referral Service
- Build referral tracking and status history endpoints
- Create timeline event component
- Create referral tracking detail component
- Create next-steps messaging component
- Implement referral-tracking.service.ts
- Wire up notifications when referral status changes
- Call NotificationService 8005 for email/push notifications
- Seed status history for demo referrals

**Deliverables**:
- ✓ Backend: Referral tracking endpoint, status history retrieval
- ✓ Model: ReferralStatusHistory with status changes, timestamps, reasons
- ✓ Frontend: Timeline, tracking detail, next-steps components
- ✓ API Gateway: Proxy route for `/api/patient-portal/referral-tracking/{refId}`
- ✓ Notifications: Emit when referral status changes (integration with Notification Service)
- ✓ Seed data: Status history for 2+ demo referrals

**Context**: See `teamupdates/features/patient-portal/referral-tracking/context-map.md`

**Success Criteria**:
- Patient can view referral status timeline
- Timeline shows status changes with dates and reasons
- Patient receives notifications when status changes
- API enforces patient data isolation
- Next-steps messaging guides patient on actions (e.g., "Upload insurance")

**Blockers**:
- Depends on Sub-Feature 1 for referral data
  - **Unblock**: Use seed referral data until Sub-Feature 1 APIs are ready
- Depends on NotificationService 8005 (should already exist)
  - **Unblock**: If NotificationService endpoints are unclear, coordinate with platform team

**Supported by**: Team Member 1 for referral data, Tech lead for notification integration

---

## Parallel Work Timeline

```
Week 1 (Days 1–5)
  Team 1 (Sub-Feature 1) ██████████████████░░░░░░░░░░░░░░░░░░░░ Days 1–5
  Team 2 (Sub-Feature 2) ░░░░░░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░ Days 2–7
  Team 3 (Sub-Feature 3) ░░░░░░░░░░░░░░░░░░░░░░░░░░██████████░░░░░░░░ Days 3–7

Week 2 (Days 6–7)
  Integration Phase      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████ Days 6–7
  - Wire up navigation
  - Align seed data
  - End-to-end testing
  - Validator checks
```

## Coordination & Dependencies

### Kick-off (Day 1, Before Implementation)
1. All team members read this TEAM_ASSIGNMENT.md
2. Each team member reads their assigned sub-feature context-map
3. Team lead reviews INTEGRATION_PLAN.md with the group
4. Clarify any ambiguities in the shared data contracts
5. Define communication protocol (daily standup, Slack channel, etc.)

### Daily Standup (Days 2–7, 15 min)
- **Team Member 1**: What's done, what's next, blockers?
- **Team Member 2**: What's done, what's next, blockers? (likely: waiting for Sub-Feature 1 APIs)
- **Team Member 3**: What's done, what's next, blockers? (likely: waiting for Sub-Feature 1 APIs)
- **Tech Lead**: Address blockers, provide guidance

### Mid-Week Sync (Day 4, 30 min)
- Review Team 1's completed backend APIs
- Ensure Teams 2 & 3 have everything they need to continue
- Discuss any design issues or scope changes

### Integration Week (Days 6–7)
- All teams merge code to main branch (or integration branch)
- Run validator agents: `/validate-patient-portal <sub-feature>`
- Manual end-to-end testing as a group
- Fix any integration issues
- Deploy to staging or production

## Unblocking Strategy

### For Team 2 & 3: Waiting for Team 1's APIs

**Option A: Use Seed Data (Recommended for fast parallel progress)**
```python
# In Team 2's seed.py and Team 3's seed.py, hardcode test referrals
# Use these for testing while Team 1's APIs are being built

TEST_REFERRALS = [
    {"id": "ref-1", "patientId": 1, "specialty": "Cardiology", "status": "pending"},
    {"id": "ref-2", "patientId": 1, "specialty": "Dermatology", "status": "scheduled"},
]
```

**Option B: Mock Endpoints**
```python
# In Team 2's/Team 3's main.py, add temporary mock endpoints
# that return seed data until Team 1's real APIs are ready

@app.get("/api/patient-portal/referrals")
def get_referrals_mock(patient_id: int):
    return TEST_REFERRALS  # Return mock data
```

Once Team 1's APIs are ready, swap these mocks for actual HTTP calls to the Referral Service.

### For Team 1: Coordinating Frontend with Backend

Team 1 should:
1. Build backend first (models, APIs, seed data) — Days 1–3
2. Write simple backend validation (e.g., `curl` tests) — Day 3
3. Build frontend against real APIs — Days 3–5
4. This ensures Teams 2 & 3 have a solid API to build against

## Code Review & Validation Gates

After each team completes their sub-feature:

1. **Run Validator Agent**:
   ```bash
   /validate-patient-portal <sub-feature-name>
   ```
   This checks implementation against context-map requirements.

2. **Manual Testing**:
   Follow the "Manual Verification Steps" in the sub-feature's context-map.

3. **Peer Code Review**:
   - Other team member or tech lead reviews code
   - Check style, security, adherence to CLAUDE.md conventions
   - Check database migrations and seed data

4. **Sign-Off**:
   Team member confirms PASS from validator before moving to integration.

## Success Metrics

- [ ] All 3 sub-features are 100% complete per context-maps
- [ ] All 3 sub-features pass validator agent (0 FAIL findings, <3 PARTIAL)
- [ ] All 3 sub-features pass manual testing (all success criteria met)
- [ ] No critical bugs found during integration testing
- [ ] Delivered on time (Week 1–2 estimate)
- [ ] Code is clean, follows CLAUDE.md, and is production-ready

## Escalation & Support

**Tech Lead / Architect**:
- Available for design questions, architectural decisions
- Helps unblock Team 2 & 3 if APIs aren't ready
- Reviews code for quality and standards compliance
- Oversees integration phase

**Product Manager (if applicable)**:
- Clarifies requirements if ambiguities come up
- Prioritizes scope changes
- Signs off on feature completeness

**Platform Team**:
- Ensures NotificationService 8005 is ready for Team 3
- Provides any infrastructure or DevOps support

---
_Team assignment created during planning phase; to be finalized with actual team member names_
