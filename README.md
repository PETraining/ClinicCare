# ClinicCare Patient Portal

## Feature Overview

The ClinicCare Patient Portal is a patient-centric web application that enables patients to manage their healthcare journey. Patients can view referrals, appointments, documents, and track the progress of their referrals in real-time. All patient-submitted data (forms, questionnaires) is made available to clinicians prior to appointments, streamlining the pre-visit workflow.

**Objective**: Build a secure, responsive patient portal that reduces administrative burden on clinical staff and improves patient engagement.

---

## Initial Requirements

### Functional Requirements

#### 1. Patient Authentication & Authorization
- Patients log in with secure credentials (email/password or SSO)
- Only logged-in patients can access their own data (patient-centric isolation)
- Session management with timeout policies
- Support for role-based access control (patient-only view)

#### 2. Referral & Appointment View
- **Requirement**: Patients can view all active referrals and upcoming appointments
- Display referral details: specialty, referring provider, status, appointment date
- Show appointment details: date/time, location, clinician, preparation instructions
- Filter/search referrals and appointments by date range or specialty
- Real-time status updates when appointments are scheduled or canceled

#### 3. Document Management
- **Requirement**: Patients can view, download, and upload documents
- **Download**: Access clinic-provided documents (instructions, lab results, consent forms)
- **Upload**: Pre-visit forms and questionnaires; file upload validation (PDF, images)
- **Link to referral**: Each document is associated with a referral for context
- Track document status: pending, received, processed

#### 4. Form & Questionnaire Management
- **Requirement**: Patients can complete and submit pre-visit questionnaires
- Dynamic form rendering (multi-page forms with progress tracking)
- Form validation (required fields, format checks, conditional logic)
- Save draft functionality (auto-save or manual save)
- Submission confirmation with timestamp

#### 5. Referral Progress Tracking
- **Requirement**: Patients can track the status of their referrals over time
- Timeline view of status changes (pending → approved → scheduled → completed)
- Next steps or action items for the patient
- Notification alerts when referral status changes
- Historical view of all past referrals

#### 6. Notifications
- **Requirement**: Patients receive real-time notifications on referral status changes
- In-app notifications (badge, toast, notification panel)
- Email notifications (opt-in) for critical updates
- Notification preferences/settings for patients to control frequency

---

## Acceptance Criteria

### AC1: Patient Data Isolation
- ✅ A logged-in patient can **only** view their own referrals, appointments, and documents
- ✅ No cross-patient data leakage
- ✅ API enforces patient context at every endpoint

### AC2: Referral & Appointment Dashboard
- ✅ Patient sees a card-based dashboard with upcoming appointments (next 30 days)
- ✅ Active referrals are listed with status, specialty, and next action
- ✅ Clicking a referral/appointment shows detailed view
- ✅ Empty state when no referrals or appointments exist

### AC3: Document Download
- ✅ Patient can list all available documents for each referral
- ✅ Download button for each document (PDF, image, etc.)
- ✅ File metadata shown: upload date, file name, type

### AC4: Form Upload & Submission
- ✅ Patient can upload pre-visit forms (PDF or image)
- ✅ File size limits enforced (e.g., max 10MB per file)
- ✅ Form validation: required fields, format checks
- ✅ Submit button and confirmation on successful upload
- ✅ Uploaded forms visible to clinicians in the clinic portal (backend integration)

### AC5: Questionnaire Completion
- ✅ Patient completes questionnaire with multi-page support
- ✅ Progress indicator shows completion percentage
- ✅ Auto-save or manual save option
- ✅ Submit button with confirmation
- ✅ Submission stored and visible to clinicians

### AC6: Progress Tracking
- ✅ Timeline view shows all status changes for a referral
- ✅ Each status entry includes: old status, new status, change date, reason (if provided)
- ✅ Next steps or action items displayed for pending referrals

### AC7: Notifications
- ✅ In-app notification badge updates when status changes
- ✅ Email notification sent (if opted in) with summary of status change
- ✅ Patient can view notification history
- ✅ Patient can configure notification preferences

### AC8: Responsive Design
- ✅ Portal works on desktop, tablet, and mobile devices
- ✅ Touch-friendly buttons and forms
- ✅ Fast load times (< 3 seconds on 4G)

### AC9: Performance
- ✅ Page load time: < 2 seconds
- ✅ API response time: < 500ms for all endpoints
- ✅ Support 1000+ concurrent patients

### AC10: Security
- ✅ All API endpoints require authentication
- ✅ HTTPS/TLS encryption for data in transit
- ✅ Patient data encrypted at rest
- ✅ Audit logging for all patient data access

---

## Sub-Features & Decomposition

The Patient Portal is decomposed into **3 independent sub-features**, each workable in parallel:

### Sub-Feature 1: Referral & Appointment View
- **Owner**: Team Member 1
- **Timeline**: 1 week
- **Scope**: 
  - Patient dashboard with referrals and appointments
  - Display logic, filtering, status badges
  - Backend: Fetch referral/appointment data from Referral Service
  - Frontend: Dashboard, card components, detail views
- **Key Files**:
  - Backend: Referral Service (8003), Patient Service (8001), API Gateway
  - Frontend: `portal/dashboard`, `portal/components/referral-card`, `portal/components/appointment-card`

### Sub-Feature 2: Document & Form Management
- **Owner**: Team Member 2
- **Timeline**: 1 week (parallel to Sub-Feature 1)
- **Scope**:
  - Patient uploads pre-visit forms
  - Patient downloads clinic documents
  - File validation, storage, metadata tracking
  - Backend: Document Service (8004), API Gateway
  - Frontend: Upload form, document list, file browser
- **Key Files**:
  - Backend: Document Service (8004), API Gateway
  - Frontend: `portal/components/upload-form`, `portal/components/document-list`
- **Dependency**: Referral list from Sub-Feature 1 (can use seed data until ready)

### Sub-Feature 3: Referral Progress Tracking & Notifications
- **Owner**: Team Member 3
- **Timeline**: 1 week (parallel to Sub-Features 1 & 2)
- **Scope**:
  - Referral status timeline view
  - Notification panel and email notifications
  - Notification preferences
  - Backend: Referral Service, Notification Service (8005), API Gateway
  - Frontend: Timeline component, notification badge, preferences panel
- **Key Files**:
  - Backend: Referral Service (8003), Notification Service (8005), API Gateway
  - Frontend: `portal/components/timeline`, `portal/components/notifications`
- **Dependency**: Referral data from Sub-Feature 1 (can use seed data until ready)

---

## Service Architecture

The Patient Portal integrates with the following microservices:

| Service | Port | Purpose | Owner |
|---------|------|---------|-------|
| **Patient Service** | 8001 | Patient profile, authentication, data isolation | Infrastructure |
| **Referral Service** | 8003 | Referrals, appointments, status tracking | Sub-Feature 1 + 3 |
| **Document Service** | 8004 | Document storage, upload/download, file metadata | Sub-Feature 2 |
| **Notification Service** | 8005 | Notifications, email, preferences | Sub-Feature 3 |
| **API Gateway** | 8000 | Request routing, authentication enforcement, rate limiting | All |

---

## Data Contracts (Shared Between Sub-Features)

All teams **must** use these contracts to ensure compatibility:

### Referral Schema
```json
{
  "id": "ref-123",
  "patientId": 1,
  "specialty": "Cardiology",
  "referringProvider": "Dr. Smith",
  "status": "scheduled",
  "appointmentDate": "2026-09-15T10:00:00Z",
  "createdAt": "2026-08-01T00:00:00Z",
  "notes": "Routine checkup"
}
```

### Document Schema
```json
{
  "id": "doc-123",
  "patientId": 1,
  "referralId": "ref-123",
  "fileName": "form.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "uploadDate": "2026-08-10T00:00:00Z",
  "uploadedBy": "patient",
  "status": "received",
  "metadata": {
    "description": "Pre-visit questionnaire"
  }
}
```

### Status History Schema
```json
{
  "id": "hist-123",
  "referralId": "ref-123",
  "oldStatus": "pending",
  "newStatus": "approved",
  "changedAt": "2026-08-05T00:00:00Z",
  "reason": "Insurance approved",
  "createdBy": "system"
}
```

### Notification Schema
```json
{
  "id": "notif-123",
  "patientId": 1,
  "referralId": "ref-123",
  "type": "status_change",
  "title": "Referral Approved",
  "message": "Your cardiology referral has been approved. Appointment will be scheduled soon.",
  "createdAt": "2026-08-05T10:00:00Z",
  "read": false,
  "metadata": {
    "oldStatus": "pending",
    "newStatus": "approved"
  }
}
```

---

## Team Structure & Assignment

| Role | Team Member | Sub-Feature | Timeline | Status |
|------|-------------|-------------|----------|--------|
| Lead Planner | Architecture Team | All | Planning Phase | 📋 |
| Implementor 1 | Backend/Frontend Dev | Referral & Appointment View | Week 1 | 🔧 |
| Implementor 2 | Backend/Frontend Dev | Document & Form Management | Week 1 | 🔧 |
| Implementor 3 | Backend/Frontend Dev | Referral Progress Tracking | Week 1 | 🔧 |
| Validator | QA/Tech Lead | All | Week 2 | ✅ |

---

## Implementation Timeline

### Phase 1: Planning (Day 1)
- [ ] Run `/plan-patient-portal 3` to generate context-maps
- [ ] Assign team members to sub-features
- [ ] Share INTEGRATION_PLAN.md and TEAM_ASSIGNMENT.md

### Phase 2: Backend Implementation (Days 2–4)
- [ ] Sub-Feature 1: Implement Referral/Appointment API endpoints
- [ ] Sub-Feature 2: Implement Document upload/download endpoints
- [ ] Sub-Feature 3: Implement Notification endpoints and status tracking
- **Unblock Strategy**: Use seed data if inter-service APIs aren't ready

### Phase 3: Frontend Implementation (Days 3–5)
- [ ] Sub-Feature 1: Build dashboard and card components
- [ ] Sub-Feature 2: Build upload and document list components
- [ ] Sub-Feature 3: Build timeline and notification components

### Phase 4: Integration & Testing (Days 6–7)
- [ ] Wire up cross-feature navigation
- [ ] Align seed data across services
- [ ] End-to-end testing
- [ ] Performance testing (load testing, latency checks)

### Phase 5: Validation & Deployment (Day 8+)
- [ ] Run validators for each sub-feature
- [ ] Fix any FAIL findings
- [ ] Merge to main branch
- [ ] Deploy to production

---

## Open Questions & Decisions

| Question | Current Answer | Owner |
|----------|---|--------|
| How many documents can a patient upload per referral? | No limit (validate file size) | Implementor 2 |
| Should patients see historical referrals (> 30 days)? | Yes, with an "Archive" filter | Implementor 1 |
| What's the notification retention period? | 90 days | Implementor 3 |
| Should questionnaires have time limits (e.g., due date)? | No hard deadline; optional "suggested date" | Implementor 2 |
| Can patients modify submitted forms? | No; they must request a new form from clinician | Implementor 2 |
| What happens if an upload fails mid-transfer? | Retry with client-side resume or re-upload | Implementor 2 |

---

## Success Criteria

### Technical Success
- ✅ All 3 sub-features implemented and passing validators
- ✅ All AC (acceptance criteria) met
- ✅ Performance benchmarks met (< 2s page load, < 500ms API response)
- ✅ Security audit passed
- ✅ No FAIL findings from validators

### User Success
- ✅ Patients can log in and view all their data
- ✅ Patients can upload forms and receive confirmation
- ✅ Patients receive notifications on status changes
- ✅ Portal is usable on mobile and desktop
- ✅ No data leakage between patients

### Business Success
- ✅ Reduction in pre-visit administrative tasks (tracked post-launch)
- ✅ Improved patient engagement (measured by portal adoption)
- ✅ Positive user feedback (NPS > 8/10)

---

## Dependencies & Risk Mitigation

| Dependency | Risk | Mitigation |
|------------|------|-----------|
| Referral Service API (Sub-Feature 1) | Sub-Features 2 & 3 blocked if delayed | Use seed data in `seed.py`; mock API responses |
| Document Service file storage | Upload/download failures | Ensure S3/local storage is configured; add retry logic |
| Notification Service email | Email delivery failures | Add fallback in-app notification; log email delivery status |
| Authentication/Identity Service | Patient data leakage | Enforce `patientId` validation on every API call |
| Database schema alignment | Data inconsistencies | Pre-define schemas; validate in `seed.py` |

---

## Tech Stack

### Backend
- **Language**: Python 3.9+
- **Framework**: FastAPI (microservices)
- **Database**: PostgreSQL (relational data)
- **File Storage**: S3 or local filesystem
- **Message Queue**: Redis (for notifications)

### Frontend
- **Framework**: Angular 16+
- **Styling**: Tailwind CSS
- **State Management**: NgRx (if needed)
- **HTTP Client**: HttpClient (built-in)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

---

## Glossary

| Term | Definition |
|------|-----------|
| **Referral** | A clinical referral from a referring provider to a specialist |
| **Appointment** | A scheduled meeting between patient and clinician |
| **Referral Status** | The current state of a referral (pending, approved, scheduled, completed, canceled) |
| **Document** | A file uploaded or provided by clinic (forms, lab results, consent forms) |
| **Form** | An interactive questionnaire for patient to complete pre-visit |
| **Notification** | An alert sent to patient on referral status change or important event |
| **Patient Portal** | The web application used by patients to manage their healthcare |
| **Clinician Portal** | A separate admin portal used by clinical staff (not part of this feature) |

---

## Getting Started

### For Team Leads
1. Review this README
2. Run `/plan-patient-portal 3` to generate context-maps
3. Assign team members to sub-features
4. Share context-maps and TEAM_ASSIGNMENT.md with teams
5. Hold kick-off meeting

### For Implementors
1. Read this README and your assigned context-map
2. Review INTEGRATION_PLAN.md and TEAM_ASSIGNMENT.md
3. Run `/implement-patient-portal <sub-feature>` to start building
4. Use seed data if dependency APIs aren't ready
5. Run `/validate-patient-portal <sub-feature>` before submission

### For Validators
1. After implementation is done, run `/validate-patient-portal <sub-feature>`
2. Review findings (PASS, PARTIAL, FAIL, UNKNOWN)
3. Share findings with implementor
4. Re-validate after fixes

---

## References

- **Detailed Planning**: `teamupdates/features/patient-portal/INTEGRATION_PLAN.md`
- **Team Assignments**: `teamupdates/features/patient-portal/TEAM_ASSIGNMENT.md`
- **Sub-Feature Specs**:
  - `teamupdates/features/patient-portal/referral-appointment-view/context-map.md`
  - `teamupdates/features/patient-portal/document-form-management/context-map.md`
  - `teamupdates/features/patient-portal/referral-progress-tracking/context-map.md`
- **Quick Start Guide**: `teamupdates/features/patient-portal/QUICK_START.md`

---

**Generated**: 2026-08-13  
**Version**: 1.0  
**Status**: Active Planning
