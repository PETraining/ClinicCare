# Patient Portal — Integration Plan

**Date**: 2026-08-12  
**Status**: Planning Phase  
**Target Completion**: After all 3 sub-features complete

## Overview

The Patient Portal is decomposed into 3 independent sub-features that can be built in parallel. Once each team member completes their sub-feature, they are integrated into a unified patient dashboard. This document describes how the sub-features connect, shared data contracts, and the integration phase.

## Sub-Feature Dependencies

```
┌─────────────────────────────────────────────┐
│   Sub-Feature 1: Referral & Appointment     │
│   View (Team Member 1)                      │
│   - Referral list API                       │
│   - Appointment list API                    │
│   - Patient Portal shell & routing          │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
    ┌────▼──────────────────┐   │   ┌──────────────────────┐
    │ Sub-Feature 2:        │   │   │ Sub-Feature 3:       │
    │ Document & Form       │   └──▶ │ Referral Progress    │
    │ Management            │       │ Tracking             │
    │ (Team Member 2)       │       │ (Team Member 3)      │
    │ - Document upload API │       │ - Status history API │
    │ - Document list API   │       │ - Notification hook  │
    └──────────────────────┘       └──────────────────────┘
```

### Sub-Feature 1: Referral & Appointment View
**Team Member**: Team Member 1  
**Deliverables**:
- Backend: Referral and Appointment GET endpoints
- Frontend: Patient Portal shell, dashboard, referral/appointment card components
- Shared: Patient Portal layout used by all other sub-features
- **Exports**: Referral ID, Appointment data, auth guard, patient context

**Dependencies**: None (foundational)

### Sub-Feature 2: Document & Form Management
**Team Member**: Team Member 2  
**Deliverables**:
- Backend: Document upload/download/list endpoints
- Frontend: Upload form, document list, document card components
- **Imports**: Referral list (to let patient link docs to referrals)
- **Exports**: Document metadata, upload status

**Dependencies**: Sub-Feature 1 for referral ID list in dropdown

### Sub-Feature 3: Referral Progress Tracking
**Team Member**: Team Member 3  
**Deliverables**:
- Backend: Referral status history, notification trigger
- Frontend: Timeline, status history, next steps components
- Notification integration with NotificationService 8005
- **Imports**: Referral ID, current status (from Sub-Feature 1)
- **Exports**: Status history, notifications

**Dependencies**: Sub-Feature 1 for referral data; Sub-Feature 2 for linking documents in "next steps"

## Shared Data Contracts

To enable parallel development, the following data contracts are frozen and shared:

### Patient Context (Auth Guard)
```typescript
// Set in API Gateway / Auth layer
interface PatientContext {
  patientId: string | number;
  isPatient: boolean;
  isAuthenticated: boolean;
}
```

### Referral Data (Sub-Feature 1 → All Others)
```json
{
  "id": "ref-123",
  "patientId": "pat-1",
  "specialty": "Cardiology",
  "referringProvider": "Dr. Smith",
  "status": "scheduled",
  "appointmentDate": "2026-09-15T10:00:00Z",
  "createdAt": "2026-08-01T00:00:00Z"
}
```

**Status enum**: `pending | approved | scheduled | completed | canceled`

### Appointment Data (Sub-Feature 1)
```json
{
  "id": "apt-456",
  "patientId": "pat-1",
  "referralId": "ref-123",
  "providerName": "Dr. Johnson",
  "dateTime": "2026-09-15T10:00:00Z",
  "location": "Downtown Clinic",
  "checkInInstructions": "Please arrive 15 minutes early"
}
```

### Document Metadata (Sub-Feature 2)
```json
{
  "id": "doc-789",
  "patientId": "pat-1",
  "referralId": "ref-123",
  "fileName": "insurance_card.pdf",
  "uploadDate": "2026-08-10T14:30:00Z",
  "status": "received"
}
```

**Status enum**: `pending | received | reviewed | rejected`

### Referral Status History (Sub-Feature 3)
```json
{
  "id": "hist-111",
  "referralId": "ref-123",
  "oldStatus": "pending",
  "newStatus": "approved",
  "changedAt": "2026-08-05T09:00:00Z",
  "changedBy": "admin",
  "reason": "Insurance approved"
}
```

### Notification (Sub-Feature 3)
```json
{
  "id": "notif-222",
  "patientId": "pat-1",
  "referralId": "ref-123",
  "message": "Your referral to Cardiology has been approved",
  "timestamp": "2026-08-05T09:00:00Z",
  "read": false
}
```

## API Route Structure

All Patient Portal routes are prefixed with `/api/patient-portal/`:

```
GET    /api/patient-portal/referrals                     → Sub-Feature 1
GET    /api/patient-portal/referrals/{id}                → Sub-Feature 1
GET    /api/patient-portal/appointments                  → Sub-Feature 1
GET    /api/patient-portal/appointments/{id}             → Sub-Feature 1
GET    /api/patient-portal/documents                     → Sub-Feature 2
POST   /api/patient-portal/documents/upload              → Sub-Feature 2
GET    /api/patient-portal/documents/{id}                → Sub-Feature 2
GET    /api/patient-portal/referral-tracking/{refId}     → Sub-Feature 3
GET    /api/patient-portal/notifications                 → Sub-Feature 3
```

## Frontend Route Structure

All Patient Portal routes are under `/patient-portal`:

```
/patient-portal                      → Dashboard (Sub-Feature 1)
/patient-portal/referrals            → Referral list (Sub-Feature 1)
/patient-portal/referrals/:id        → Referral detail (Sub-Feature 1)
/patient-portal/appointments         → Appointment list (Sub-Feature 1)
/patient-portal/documents            → Document management (Sub-Feature 2)
/patient-portal/referral-tracking/:refId  → Referral tracking (Sub-Feature 3)
/patient-portal/notifications        → Notification inbox (Sub-Feature 3, optional)
```

## Integration Phase (After All Sub-Features Complete)

Once all 3 sub-features are implemented, the following integration work is performed:

### 1. Unified Navigation
- Add navigation menu in the Patient Portal shell (Sub-Feature 1) with links to:
  - Dashboard (referrals & appointments)
  - Documents
  - My Referrals (with progress tracking)
  - Notifications (optional)
- Ensure consistent styling and responsive layout across all sub-features

### 2. Cross-Feature Navigation
- From referral card (Sub-Feature 1) → "View Progress" links to tracking page (Sub-Feature 3)
- From referral card (Sub-Feature 1) → "Upload Document" links to upload form with referral pre-selected (Sub-Feature 2)
- From next steps (Sub-Feature 3) → "Upload Documents" links to Sub-Feature 2 upload form

### 3. Data Flow Validation
- Verify that documents uploaded in Sub-Feature 2 are visible in Sub-Feature 3's next steps messaging
- Verify that status changes in Sub-Feature 3 trigger notifications
- Verify that all three sub-features enforce patient data isolation correctly

### 4. Seed Data Alignment
- Ensure seed data across all 3 services is consistent (same referral IDs, patient IDs, etc.)
- Create a single seed script or coordination that populates all services together for demo

### 5. End-to-End Testing
- Test the full patient journey:
  1. Log in as patient
  2. View referrals & appointments (Sub-Feature 1)
  3. Click "View Progress" → see status timeline (Sub-Feature 3)
  4. Upload a form from "Next Steps" (Sub-Feature 2)
  5. See uploaded document in next steps (Sub-Feature 3)
  6. Receive notification when referral is approved (Sub-Feature 3)

## Parallel Work Strategy

Teams can work in parallel as follows:

1. **Days 1–2**: Team 1 builds Sub-Feature 1 (Referral & Appointment View)
   - Team 2 & 3 wait for APIs, or mock them with seed data
   - Focus: Backend models and APIs

2. **Days 2–3**: Team 1 finishes frontend shell; Team 2 & 3 start backend using API contracts
   - Team 1 can also help Team 2 & 3 if needed
   - Mock APIs allow all to build independently

3. **Days 3–5**: Team 2 & 3 complete backend and frontend
   - Team 1 validates and provides feedback

4. **Days 6–7**: Integration phase
   - Wire up cross-feature navigation
   - Align seed data
   - End-to-end testing

## Unblocking Strategy

If a sub-feature is blocked (e.g., waiting for another team's API):

1. **Use seed/mock data**: Each service's seed.py can populate test data independently
2. **Define clear contracts**: Use the shared data contracts above to implement mocks
3. **Implement HTTP stubs**: If an API doesn't exist yet, add a mock GET endpoint that returns seed data
4. **Re-integrate later**: Once the real API is ready, swap the mock for the real endpoint

Example: Team 3 needs referral data (Sub-Feature 1) but Team 1 isn't done yet:
- Team 3 seeds their test referral data locally
- Team 3 implements their endpoints using the local data
- When Sub-Feature 1 is ready, Team 3 updates their backend to call Sub-Feature 1's API instead of local seed

## Validation Gates

After each sub-feature is complete:

1. **Run the validator agent**: `/validate-patient-portal <sub-feature> [phase]`
   - Checks that implementation matches context-map
   - Reports PASS/FAIL/PARTIAL/UNKNOWN findings

2. **Manual testing**: Follow the "Manual Verification Steps" in the context-map
   - Test happy path (success case)
   - Test auth boundaries (patient can only see their data)
   - Test responsive design (mobile & desktop)

3. **Code review**: Peer review by another team member or tech lead
   - Check code quality, style, security
   - Ensure CLAUDE.md conventions are followed

## Success Criteria

- [ ] All 3 sub-features are implemented independently
- [ ] All 3 sub-features pass validator agent checks
- [ ] All 3 sub-features pass manual verification testing
- [ ] Cross-feature navigation is wired up (referral → tracking → documents)
- [ ] Seed data is consistent across all services
- [ ] End-to-end patient journey works without errors
- [ ] Patient Portal is deployed to production

## Rollback & Recovery Plan

If a sub-feature needs to be rolled back:

1. **Revert implementation commits**: `git revert <commit-hash>`
2. **Revert database schema** (if changes were made): Drop new tables/columns via SQLite CLI or migration script
3. **Redeploy services**: Rebuild Docker images and restart containers
4. **Notify stakeholders**: Document issue and re-estimated timeline

If a sub-feature is blocked indefinitely:

1. **Launch without it**: Other sub-features can ship independently
   - E.g., if Sub-Feature 3 is blocked, Sub-Feature 1 & 2 can still provide value
2. **Defer to next release**: Re-estimate and commit to a follow-up milestone

---
_Integration plan created during planning phase_
