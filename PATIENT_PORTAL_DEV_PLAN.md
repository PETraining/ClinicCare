# Patient Portal Development Plan

**Last Updated:** 2026-08-19  
**Status:** In Progress  
**Baseline Completion:** 2026-09-15

---

## Overview

This document outlines the development roadmap for completing and enhancing the Patient Portal feature. It's organized by phase with clear deliverables, dependencies, and estimated effort.

---

## Phase 1: MVP Completion (1-2 weeks)

### Goal
Complete core functionality for patient viewing of referrals and basic document/questionnaire UI.

#### Task 1.1: Document Upload Implementation
- **Component:** `DocumentUploadComponent`
- **Deliverable:** Full file upload with validation
- **Acceptance Criteria:**
  - Patient can select file from disk
  - File type validation (PDF, JPG, PNG only)
  - File size limit: 10MB max
  - Success/error toast notifications
  - Upload progress bar
  - Document appears in list after upload
- **Dependencies:** Document Service API ready
- **Estimated Effort:** 8 hours
- **Owner:** [Frontend Dev 1]
- **Files to Modify:**
  - `document-upload.component.ts` - Add upload logic
  - `document-upload.component.html` - Form UI
  - `patient-document.service.ts` - Upload method
  - `patient-documents.component.ts` - Refresh list after upload

#### Task 1.2: Questionnaire Form Submission
- **Component:** `QuestionnaireFormComponent`
- **Deliverable:** Working form with validation and submission
- **Acceptance Criteria:**
  - Load questionnaire by ID from route
  - Render form fields dynamically
  - Client-side validation (required fields, email format, etc.)
  - Submit button triggers save
  - Show success message on completion
  - Redirect to questionnaire list on success
- **Dependencies:** Questionnaire Service API ready
- **Estimated Effort:** 10 hours
- **Owner:** [Frontend Dev 1]
- **Files to Modify:**
  - `questionnaire-form.component.ts` - Add form logic
  - `questionnaire-form.component.html` - Form template
  - `questionnaire.service.ts` - Submit method
  - `questionnaire-list.component.ts` - Update state after submit

#### Task 1.3: Document Upload Status Tracking
- **Component:** `PatientReferralViewComponent`
- **Deliverable:** Link uploaded documents with required documents list
- **Acceptance Criteria:**
  - `isDocumentUploaded()` method works correctly
  - Fetch uploaded documents from service
  - Compare against required documents list
  - Display ✓ badge for uploaded items
  - Show missing documents in pending state
- **Dependencies:** Document Service provides uploaded docs
- **Estimated Effort:** 4 hours
- **Owner:** [Frontend Dev 2]
- **Files to Modify:**
  - `patient-referral-view.component.ts` - Update methods
  - `patient-document.service.ts` - Add query method

#### Task 1.4: Specialist & Required Documents Data Fetch
- **Component:** `PatientReferralListComponent` & `PatientReferralViewComponent`
- **Deliverable:** Replace hardcoded data with backend calls
- **Acceptance Criteria:**
  - `specialtyFromId()` fetches from Doctors Service
  - Required documents fetched from Document Service
  - Specialty displayed correctly in referral cards
  - Falls back to "Specialist #N" on error
  - No UI breaking changes
- **Dependencies:** Service endpoints available
- **Estimated Effort:** 5 hours
- **Owner:** [Frontend Dev 2]
- **Files to Modify:**
  - `patient-referral-list.component.ts` - Inject service, add method
  - `patient-referral-view.component.ts` - Fetch documents array
  - Create/update service methods

---

## Phase 2: Enhanced Validation & Error Handling (1 week)

### Goal
Improve data validation, error messages, and resilience to service failures.

#### Task 2.1: Expand Validation Service
- **Component:** `ReferralValidationService`
- **Deliverable:** Comprehensive referral readiness checks
- **Checks to Add:**
  - ✓ Appointment is scheduled
  - ✓ Appointment date is in future
  - ✓ All required documents uploaded
  - ✓ Questionnaire completed
  - ✓ Specialist assigned (not null)
  - ✓ Patient info is complete
- **Acceptance Criteria:**
  - Each check returns specific warning message
  - Warnings are actionable (link to document upload, etc.)
  - Validation result shows summary + individual warnings
  - UI updates in real-time as patient completes tasks
- **Estimated Effort:** 6 hours
- **Owner:** [Backend/Full-stack Dev]

#### Task 2.2: Error Boundary & Resilience
- **Components:** All components
- **Deliverable:** Graceful handling of service failures
- **Acceptance Criteria:**
  - Service timeout (5s) shows friendly error message
  - 404/403 errors handled with specific messages
  - 500 errors suggest retry
  - UI doesn't crash on bad data
  - Offline state detected and shown
  - Retry button available for failed operations
- **Estimated Effort:** 8 hours
- **Owner:** [Frontend Dev 1]
- **Implementation:**
  - Add error property to signals
  - Wrap service calls in try/catch
  - Update templates to show error UI
  - Create reusable error component

#### Task 2.3: Loading States & Skeleton Screens
- **Components:** All list/detail components
- **Deliverable:** Better UX during data loading
- **Acceptance Criteria:**
  - Skeleton cards show while loading referrals
  - Appointment info skeleton while fetching
  - "Loading..." text replaced with visual skeleton
  - No layout shift when data loads
- **Estimated Effort:** 5 hours
- **Owner:** [Frontend Dev 2]
- **Implementation:**
  - Create `SkeletonComponent` reusable
  - Update component templates
  - Test for layout stability

---

## Phase 3: Accessibility & Performance (1 week)

### Goal
Ensure patient portal is accessible and performant for all users.

#### Task 3.1: Accessibility (a11y)
- **Scope:** All patient portal components
- **Deliverable:** WCAG 2.1 AA compliance
- **Acceptance Criteria:**
  - All interactive elements have keyboard focus indicators
  - Buttons and links have descriptive labels
  - Form labels associated with inputs
  - Color contrast >= 4.5:1 for text
  - Heading hierarchy logical
  - ARIA roles added where needed
  - Screen reader tested
- **Estimated Effort:** 8 hours
- **Owner:** [Accessibility Specialist / Frontend Dev]
- **Testing Tools:**
  - axe DevTools
  - WAVE
  - Keyboard-only navigation test

#### Task 3.2: Performance Optimization
- **Scope:** Component rendering, data loading
- **Deliverable:** < 3s load, 60fps interactions
- **Acceptance Criteria:**
  - Referral list loads < 500ms
  - Detail view loads < 1s
  - Lazy load documents/questionnaires
  - Image optimization (if any)
  - Bundle size analyzed
- **Estimated Effort:** 6 hours
- **Owner:** [Frontend Dev 1]
- **Tools:**
  - Chrome DevTools Performance tab
  - Lighthouse audit
  - Angular performance profiler

#### Task 3.3: Mobile Optimization
- **Scope:** All components, CSS
- **Deliverable:** Fully functional on mobile devices
- **Acceptance Criteria:**
  - Test on real iOS/Android devices
  - Touch targets >= 48x48px
  - Viewport meta tags set
  - No horizontal scroll
  - Buttons accessible on thumb zone
  - Form inputs work with mobile keyboards
- **Estimated Effort:** 4 hours
- **Owner:** [Frontend Dev 2]
- **Testing:**
  - Chrome DevTools mobile emulation
  - Real device testing (iPhone, Android)

---

## Phase 4: Advanced Features (2-3 weeks)

### Goal
Add valuable features that differentiate the patient portal.

#### Task 4.1: Real-time Notifications
- **Feature:** Alert patient when referral status changes
- **Deliverable:** Toast notifications + badge count
- **Acceptance Criteria:**
  - When referral moves to "Accepted" → toast shows
  - When document upload succeeds → toast shows
  - When appointment scheduled → toast shows
  - Notification count badge on referral icon
  - User can dismiss notifications
- **Dependencies:** WebSocket or polling mechanism needed
- **Estimated Effort:** 12 hours
- **Owner:** [Backend Dev + Frontend Dev]
- **Implementation Options:**
  - Polling API every 30s (simple, less efficient)
  - WebSocket connection (complex, real-time)
  - SignalR (if .NET backend)

#### Task 4.2: Document Sharing with Specialists
- **Feature:** Patient can grant specialist access to documents
- **Deliverable:** Document permissions UI
- **Acceptance Criteria:**
  - Show checkboxes next to uploaded documents
  - Select which specialists can view
  - Toggle permission per specialist
  - Permission change reflected immediately
  - Audit log of permission changes
- **Dependencies:** Document Service permissions API
- **Estimated Effort:** 10 hours
- **Owner:** [Full-stack Dev]

#### Task 4.3: Appointment Rescheduling
- **Feature:** Allow patient to request appointment reschedule
- **Deliverable:** Reschedule modal + backend integration
- **Acceptance Criteria:**
  - Show available time slots
  - Patient selects new date/time
  - Sends request to specialist for approval
  - Shows "Pending Reschedule" status
  - Notification when approved/rejected
- **Dependencies:** Appointment Service supports rescheduling
- **Estimated Effort:** 14 hours
- **Owner:** [Full-stack Dev]

#### Task 4.4: Referral Messaging System
- **Feature:** Patient can message specialist about referral
- **Deliverable:** Simple inbox/compose UI
- **Acceptance Criteria:**
  - Compose button on referral detail
  - Modal to write message
  - Message appears in thread
  - Notifications on new specialist reply
  - Message history visible
- **Dependencies:** New Messaging Service needed
- **Estimated Effort:** 16 hours
- **Owner:** [Backend Dev + Frontend Dev]

---

## Phase 5: Authentication & Security (Ongoing)

### Goal
Replace demo authentication with real auth system.

#### Task 5.1: Integrate Real Auth Provider
- **Current:** Demo login with hardcoded patients
- **Target:** Real user authentication
- **Options:**
  - Option A: OAuth 2.0 (Google, FHIR provider)
  - Option B: Custom JWT-based auth
  - Option C: Enterprise SSO (SAML)
- **Estimated Effort:** 20-30 hours (depends on choice)
- **Owner:** [Security/Auth Team]
- **Files to Change:**
  - `patient-auth.service.ts` - Replace demo with real auth
  - `patient-login.component.ts` - Auth form
  - `patient-auth.guard.ts` - Token validation

#### Task 5.2: Secure API Communication
- **Current:** No HTTPS, no token validation
- **Target:** Secure API calls
- **Changes:**
  - Require HTTPS in production
  - Add JWT token to API requests
  - Implement token refresh
  - Add CORS security
  - Rate limiting on auth endpoints
- **Estimated Effort:** 10 hours
- **Owner:** [Security Team]

---

## Dependencies & Blockers

### Service API Readiness

| Service | Endpoint | Status | Impact |
|---------|----------|--------|--------|
| Referral Service | GET `/api/referrals?patientId=X` | ✅ Ready | P1: Blocking Phase 1 Task 1.3 |
| Document Service | POST `/api/documents/upload` | 🔄 In Dev | P1: Blocking Task 1.1 |
| Questionnaire Service | POST `/api/questionnaires/{id}/submit` | 🔄 In Dev | P1: Blocking Task 1.2 |
| Appointment Service | GET `/api/appointments?patientId=X` | ✅ Ready | P1: Ready |
| Doctors Service | GET `/api/doctors/{id}` | ✅ Ready | P1: Ready |

### Frontend Dependency Chain

```
Phase 1
├─ Task 1.1 (Document Upload) → needs Document Service API
├─ Task 1.2 (Questionnaire Submit) → needs Questionnaire Service API
├─ Task 1.3 (Doc Status Tracking) → depends on Task 1.1
└─ Task 1.4 (Data Fetch) → depends on Tasks 1.1, 1.2

Phase 2
├─ Task 2.1 (Validation) → depends on Phase 1 all tasks
├─ Task 2.2 (Error Handling) → independent
└─ Task 2.3 (Skeletons) → independent

Phase 3
├─ Task 3.1 (a11y) → depends on Phase 1 completion
├─ Task 3.2 (Performance) → depends on Phase 1 completion
└─ Task 3.3 (Mobile) → independent (can test earlier)

Phase 4
└─ All tasks → depend on Phase 1-3 completion

Phase 5
├─ Task 5.1 (Auth) → can start anytime, high impact
└─ Task 5.2 (Security) → depends on 5.1
```

---

## Testing Strategy

### Unit Tests
- **Scope:** Component methods, signal updates, computed properties
- **Tool:** Karma/Jasmine
- **Target Coverage:** 80%+
- **Command:** `npm test` in `/frontend`

### Integration Tests
- **Scope:** Component + Service interactions
- **Test Cases:**
  - Load referral → fetch specialist name → display
  - Upload document → refresh document list → update tracking
  - Submit questionnaire → validate form → call API → show success
  - Validation service → multiple checks → correct warnings

### E2E Tests (Cypress/Playwright)
- **Scope:** Full user flows
- **Scenarios:**
  - Login → view referrals → click details → see appointment
  - Login → click questionnaire → fill form → submit
  - Login → upload document → verify appears in list

### Accessibility Testing
- **Automated:** axe DevTools, Lighthouse
- **Manual:** Keyboard-only navigation, screen reader (NVDA/JAWS)
- **Real Device:** iOS VoiceOver, Android TalkBack

### Performance Testing
- **Metrics:**
  - First Contentful Paint (FCP): < 1s
  - Largest Contentful Paint (LCP): < 2.5s
  - Cumulative Layout Shift (CLS): < 0.1
  - Time to Interactive (TTI): < 3s
- **Tool:** Chrome DevTools, Lighthouse, Web Vitals

---

## Documentation Requirements

### For Each Phase Completion

1. **Code Comments** - Explain complex logic
2. **Component README** - List inputs/outputs, usage
3. **API Integration Guide** - How to use services
4. **Testing Guide** - How to test feature
5. **User Guide** - How patients use feature

### Living Documentation

- Update [PATIENT_PORTAL_CONTEXT.md](PATIENT_PORTAL_CONTEXT.md) weekly
- Maintain this dev plan with progress
- Document known issues in code comments
- Keep API contract docs in sync

---

## Success Metrics

### Phase 1 Success
- [ ] MVP feature-complete and tested
- [ ] No critical bugs in referral view
- [ ] Document upload working end-to-end
- [ ] Questionnaire submission working end-to-end
- [ ] All routes tested in browser

### Phase 2 Success
- [ ] Error rate < 1% (monitored via logs)
- [ ] 95%+ of validation checks working
- [ ] Zero crashes on service timeouts
- [ ] User feedback is positive

### Phase 3 Success
- [ ] Lighthouse accessibility score > 90
- [ ] Mobile usable on all major devices
- [ ] Page load time < 3s on 4G
- [ ] All WCAG 2.1 AA criteria met

### Phase 4 Success
- [ ] Features adopted by > 80% of patients
- [ ] Support tickets related to features < 5/week
- [ ] Patient satisfaction score > 4/5
- [ ] Features ranked as "valuable" by stakeholders

### Phase 5 Success
- [ ] No security vulnerabilities found
- [ ] Real auth integrated and tested
- [ ] Zero unauthorized access incidents
- [ ] Compliance audit passed

---

## Resource Allocation

### Team Composition (Recommended)

| Role | Hours/Week | Tasks |
|------|-----------|-------|
| Frontend Dev 1 | 40 | Phase 1, 2.2, 3.2 |
| Frontend Dev 2 | 40 | Phase 1, 3.1, 3.3 |
| Full-stack Dev | 20 | Phase 2, 4 tasks |
| QA/Tester | 20 | Testing across all phases |
| Product Owner | 5 | Backlog refinement, demos |
| **Total** | **125 hours/week** | - |

### Timeline Estimate

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|-----------|----------|--------|
| Phase 1 | 1-2 weeks | 2026-08-20 | 2026-09-02 | 🔄 In Progress |
| Phase 2 | 1 week | 2026-09-03 | 2026-09-09 | ⏳ Pending |
| Phase 3 | 1 week | 2026-09-10 | 2026-09-16 | ⏳ Pending |
| Phase 4 | 2-3 weeks | 2026-09-17 | 2026-10-05 | 📋 Planned |
| Phase 5 | Ongoing | 2026-08-20 | Continuous | 📋 Planned |
| **Total** | **6-8 weeks** | **2026-08-20** | **2026-10-05** | - |

---

## Risk Assessment

### High Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Backend APIs delayed | High | High | Start with mock data, integrate later |
| Browser compatibility issues | Medium | High | Test on 3+ browsers early |
| Mobile responsiveness problems | Medium | Medium | Use real devices for testing |
| Performance issues at scale | Medium | High | Load test with 1000+ referrals |

### Medium Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Scope creep from stakeholders | Medium | Medium | Clear phase boundaries, gate features |
| Auth integration delay | Low | High | Use demo auth as long as possible |
| Team member unavailability | Low | Medium | Cross-train team members |

### Mitigation Strategy

1. **Weekly standup** - surface blockers early
2. **API contract tests** - ensure backend matches expectations
3. **Feature gates** - toggle features on/off without code changes
4. **Rollback plan** - ability to revert deployments
5. **Staging environment** - test before production

---

## Decision Log

### ADR-001: Use Angular Signals for State Management
**Decision:** Use Angular signals instead of RxJS subjects  
**Rationale:** Simpler, more performant, direct integration with templates  
**Date:** 2026-08-19  
**Status:** ✅ Accepted

### ADR-002: Component-scoped CSS vs Global Stylesheet
**Decision:** Use component-scoped CSS for isolation  
**Rationale:** Prevents style conflicts, easier to maintain per-component  
**Date:** 2026-08-19  
**Status:** ✅ Accepted

### ADR-003: Polling vs WebSocket for Real-time Updates
**Decision:** Start with polling, upgrade to WebSocket if needed  
**Rationale:** Polling is simpler to implement, WebSocket can be added later  
**Date:** 2026-08-19  
**Status:** 🔄 Pending (Phase 4)

---

## Appendix: Command Reference

### Frontend Development

```bash
# Terminal 1: Start dev server
cd frontend
npm install
npm start

# Terminal 2: Run tests
npm test

# Terminal 3: Run linter
npm run lint

# Build for production
npm run build
```

### Backend Services

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f patient
docker-compose logs -f referral-service

# Restart service
docker-compose restart referral-service

# Stop all services
docker-compose down
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
ng test --include='**/patient-referral-list.spec.ts'

# Run with coverage
ng test --code-coverage

# E2E tests (when available)
npm run e2e
```

---

## Sign-off & Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | [PO Name] | [Date] | ☐ |
| Tech Lead | [TL Name] | [Date] | ☐ |
| Frontend Lead | [FL Name] | [Date] | ☐ |
| QA Lead | [QA Name] | [Date] | ☐ |

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-19  
**Next Review:** 2026-08-26  
**Owner:** Patient Portal Team

