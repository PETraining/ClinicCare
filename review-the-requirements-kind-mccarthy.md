# Patient Portal Implementation Plan

## Context

ClinicCare currently serves clinicians managing referrals and patient data. Patients have **zero visibility** into their care status, referrals, appointments, or ability to submit documents/questionnaires before visits. This portal gives patients control and visibility while allowing clinicians to receive pre-visit information earlier.

**Why separate app:** Patients and clinicians have fundamentally different UX needs, auth contexts, and security requirements. Separate apps enable independent scaling, deployment, and team velocity.

---

## Requirements (Scoped)

### Patient Portal - Clear Scope Only

1. **View Referrals** — Track referral status from referring clinician to specialist
2. **View Appointments** — See scheduled appointment details (date, time, location, doctor)
3. **Upload Documents** — Freeform file upload for pre-visit preparation (insurance cards, test results, etc.)
4. **Download Documents** — Access clinician-provided documents (letters, reports, instructions)
5. **Complete Questionnaires** — Fill digital forms (text, multiple choice, ratings) created by clinicians
6. **Track Referral Progress** — Visual timeline showing referral state transitions

### Out of Scope (Future)
- Appointment scheduling by patients
- Video consultations
- Prescription refill requests
- Medical record corrections
- Messaging with clinicians

---

## Architecture Decision: Separate Angular Application

**Structure:**
```
cliniccare-patient-portal/          (new app, port 4201)
  ├── features/ (login, dashboard, referrals, appointments, documents, questionnaires, profile)
  ├── core/ (auth, services, models, interceptors)
  └── shared/ (UI components, pipes)
```

**Why separate:**
- **UX**: Patient-focused simplicity vs clinician workflows
- **Auth**: Separate patient login flow, different credential types
- **Security**: Distinct CSP, stricter role-based guards
- **Deployment**: Scale independently based on traffic
- **Team velocity**: Two teams work in parallel without merge conflicts

---

## Backend Changes

### Authentication & Authorization

**New PatientAccount table** (in Patient Service):
```sql
PatientAccount(PatientAccountId, PatientId, Email, PasswordHash, IsActive, LastLoginAt, CreatedAt, UpdatedAt)
```

**New endpoints** (Patient Service 8001):
```
POST /patients/auth/login          → JWT token + patient data
POST /patients/auth/register       → Create account, return JWT
POST /patients/auth/refresh        → New access token from refresh token
GET  /patients/me                  → Authenticated patient profile only
PATCH /patients/me                 → Update own profile (not DOB/Gender)
```

**Gateway middleware** (port 8000):
```python
# Extract patient_id from JWT claims → inject into request scope
# Enforce: POST /api/patients/auth/* → allow (no auth check)
# Enforce: GET /api/*/me → must have user_type="patient" in JWT
```

**Authorization pattern across all services:**
```
GET /referrals/me              → Query: WHERE PatientId = authenticated_patient_id
GET /documents/me              → Query: WHERE PatientId = authenticated_patient_id
GET /appointments/me           → Query: WHERE PatientId = authenticated_patient_id
GET /questionnaires/me         → Filter by referrals WHERE PatientId = authenticated_patient_id
```

### Existing Services - Add Patient-Facing Endpoints

| Service | New Endpoints | Changes |
|---------|---------------|---------|
| **Referral** (8003) | GET /referrals/me, /me/{id} | Add patient-specific queries |
| **Document** (8004) | GET /documents/me, /me/{id}, POST /me (upload) | Add file storage (S3/NAS), upload support |
| **Notification** (8005) | GET /notifications/me, PATCH /{id}/read | Add PatientId field, track read status |

### New Microservices

**Appointment Service (8007):**
```
Models: Appointment(AppointmentId, PatientId, DoctorId, ScheduledDate, Location, Status, Reason)
Endpoints:
  GET /appointments/me          → Patient's upcoming/past appointments
  GET /appointments/me/{id}     → Appointment detail
  (Clinician endpoints for scheduling - separate from patient flows)
```

**Questionnaire Service (8008):**
```
Models: 
  Questionnaire(QuestionnaireId, ReferralId, Title, CreatedBy, Status)
  Question(QuestionId, QuestionnaireId, QuestionText, Type, Options, Order)
  PatientAnswer(AnswerId, QuestionnaireId, QuestionId, PatientId, Answer, CompletedAt)

Endpoints:
  GET /questionnaires/me                          → Questionnaires linked to patient's referrals
  GET /questionnaires/me/{id}                     → Questions + patient's answers (if any)
  POST /questionnaires/{id}/submit                → Batch insert/update patient answers
  GET /questionnaires/{id}/progress               → % complete, last updated
```

### Critical Files to Create/Modify

1. **services/patient/models.py** — Add PatientAccount model + migration
2. **services/patient/main.py** — Auth endpoints (login, register, refresh, /me endpoints)
3. **gateway/main.py** — Add JWT extraction middleware, patient-only route enforcement
4. **services/referral/main.py** — Add GET /referrals/me
5. **services/document/main.py** — Add GET /documents/me, POST /documents/me (upload)
6. **services/notification/main.py** — Add GET /notifications/me
7. **services/appointments/** (NEW) — Full Appointment service skeleton + DB
8. **services/questionnaires/** (NEW) — Full Questionnaire service skeleton + DB
9. **cliniccare-patient-portal/** (NEW) — New Angular app (see Frontend section below)

---

## Frontend Changes

### New Patient Portal App Structure

```
cliniccare-patient-portal/
├── src/app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts                (patient login/logout, JWT management)
│   │   │   ├── auth.guard.ts                  (CanActivate: verify JWT + redirect)
│   │   │   ├── auth.interceptor.ts            (inject Authorization header)
│   │   │   └── jwt.utils.ts
│   │   ├── services/
│   │   │   ├── patient.service.ts             (GET /patients/me, PATCH /patients/me)
│   │   │   ├── referral.service.ts            (GET /referrals/me)
│   │   │   ├── appointment.service.ts         (GET /appointments/me)
│   │   │   ├── document.service.ts            (GET /documents/me, POST /documents/me)
│   │   │   ├── questionnaire.service.ts       (GET /questionnaires/me, POST submit)
│   │   │   └── notification.service.ts        (GET /notifications/me)
│   │   └── models/ (TypeScript interfaces: Patient, Referral, Appointment, etc.)
│   ├── features/
│   │   ├── login/ (LoginComponent, RegisterComponent)
│   │   ├── dashboard/ (DashboardComponent, referral cards, appointment cards, quick links)
│   │   ├── referrals/ (ReferralListComponent, ReferralDetailComponent, ReferralTimelineComponent)
│   │   ├── appointments/ (AppointmentListComponent, AppointmentDetailComponent)
│   │   ├── documents/ (DocumentListComponent, DocumentUploadComponent, DocumentViewerComponent)
│   │   ├── questionnaires/ (QuestionnaireListComponent, QuestionnaireFormComponent)
│   │   ├── profile/ (ProfileComponent, EditProfileComponent)
│   │   └── notifications/ (NotificationBellComponent)
│   ├── shared/ (Header, Sidebar, Footer, LoadingSpinner, Pipes, Directives)
│   ├── shell/ (Main layout container)
│   └── app.routes.ts (Route definitions)
```

### Key Implementation Patterns

**State Management**: Angular Signals + Services
```typescript
referralService.referrals = signal<Referral[]>([])  // Client-side cache
referralService.isLoading = signal<boolean>(false)
referralService.loadMyReferrals()                   // Populates signal
```

**Routes (Protected by authGuard):**
```
/login, /register, /reset-password           (public)
/dashboard, /referrals, /appointments, ... (guarded by authGuard)
```

**Auth Interceptor**: Auto-inject JWT token in all requests
```
Authorization: Bearer <token>
```

---

## Work Breakdown - 6 Person Team

### Workstream 1: Authentication (2 devs) — Backend Lead
- [ ] PatientAccount model + migration (2d)
- [ ] JWT generation, login/register/refresh endpoints (4d)
- [ ] Gateway auth middleware + enforcement (2d)
- [ ] AuthService + interceptor (Angular) (2d)
- [ ] Auth guard + protected routes (1d)
- [ ] Testing: login flow, token refresh, unauthorized access (2d)

**Deliverable**: Working patient login/logout, secure JWT auth, protected routes

---

### Workstream 2: Patient Data Access & Security (2 devs) — Backend Lead
- [ ] Add /patients/me, /referrals/me, /documents/me endpoints (5d)
- [ ] Authorization validation (patient_id matching on all queries) (3d)
- [ ] ReferralService, DocumentService (Angular) (2d)
- [ ] Dashboard card components (1d)
- [ ] Data access testing (2d)

**Deliverable**: Patients see ONLY their own data, no data leaks

---

### Workstream 3: Document Management (1 dev) — Backend Lead
- [ ] File storage abstraction (S3/local filesystem) (3d)
- [ ] POST /documents/me (upload, virus scan, file validation) (2d)
- [ ] GET /documents/me (download with streaming) (2d)
- [ ] DocumentUploadComponent (drag-drop, file preview) (2d)
- [ ] DocumentListComponent + download UI (1d)

**Deliverable**: Patients upload/download documents, storage working

---

### Workstream 4: Appointments & Notifications (1 dev) — Backend Lead
- [ ] Appointment model + service (8007) (3d)
- [ ] GET /appointments/me endpoint + filtering (2d)
- [ ] Notification enhancement (PatientId field, read status) (2d)
- [ ] AppointmentListComponent (1d)
- [ ] NotificationBellComponent (1d)

**Deliverable**: Appointment viewing, notification badge + dropdown

---

### Workstream 5: Questionnaires (1 dev) — Backend Lead
- [ ] Questionnaire/Question/PatientAnswer models (8008) (2d)
- [ ] GET /questionnaires/me, POST submit endpoints (2d)
- [ ] Progress tracking (1d)
- [ ] Dynamic QuestionnaireFormComponent (handles text/radio/checkbox/rating) (3d)
- [ ] Form validation + success toast (1d)

**Deliverable**: Patients complete questionnaires, responses saved + visible to clinicians

---

### Workstream 6: Frontend Dashboard & UX (1 dev) — Frontend Lead
- [ ] Dashboard layout (header, sidebar, main) (2d)
- [ ] Referral card + appointment card UI (2d)
- [ ] Patient profile view + edit form (2d)
- [ ] Responsive design (mobile-first) (2d)
- [ ] Loading states, error boundaries, accessibility (2d)
- [ ] E2E testing: full workflows (3d)

**Deliverable**: Polished, responsive, accessible patient portal

---

## Dependencies & Timeline

**Critical Path**: WS1 → WS2 → (WS3, WS4, WS5 in parallel) → WS6

```
Week 1-2:   WS1 (Auth)
Week 2-3:   WS2 (Data Access) + WS1 complete
Week 3-4:   WS3, WS4, WS5 (parallel)
Week 4-5:   WS6 (Dashboard)
Week 5-6:   Testing, bug fixes, performance optimization
Week 6-7:   UAT, deployment
```

---

## Verification & Testing

### Functional Testing
1. **Auth flow**: Register → Login → JWT stored → Access protected routes → Logout
2. **Data isolation**: Patient A cannot view Patient B's referrals (test 403 on different patient IDs)
3. **Referral viewing**: See status, dates, specialist info, timeline
4. **Appointment viewing**: See upcoming/past appointments with correct doctor + location
5. **Document upload**: Drag-drop, file validation, success confirmation
6. **Document download**: Click download, file saved locally
7. **Questionnaire completion**: Fill all question types, submit, see confirmation
8. **Notifications**: Bell shows unread count, click to see details, mark as read

### Security Testing
- [ ] JWT validation (expired token → redirect to login)
- [ ] Patient data isolation (modify patientId in API call → 403)
- [ ] File upload validation (reject .exe, oversized files, malware)
- [ ] CORS headers correctly set (patient app origin only)
- [ ] Password hashing verified (bcrypt, rounds ≥ 12)

### Performance Testing
- [ ] Dashboard loads < 2s (referrals, appointments, quick stats)
- [ ] Document upload < 5MB, streaming download for large files
- [ ] Questionnaire form interactive on mobile (< 100ms input latency)

### Accessibility Testing
- [ ] WCAG 2.1 AA compliance (keyboard navigation, screen readers, color contrast)
- [ ] All forms labeled, error messages associated
- [ ] Focus visible on all interactive elements

---

## Security Checklist

**Backend:**
- [ ] Passwords: bcrypt with ≥12 rounds
- [ ] JWT: HS256 or RS256, short expiry (24h), refresh tokens (7d)
- [ ] Rate limiting: 5 auth attempts/min per IP
- [ ] Data validation: Pydantic BaseModel on all inputs
- [ ] File uploads: MIME type whitelist, max size, virus scan
- [ ] CORS: Whitelist patient portal origin only
- [ ] HTTPS only in production
- [ ] Secure session cookies: HttpOnly, SameSite=Strict, Secure flag

**Frontend:**
- [ ] JWT stored in HttpOnly cookies only (NOT localStorage)
- [ ] CSP headers: restrict to API gateway origin
- [ ] Input sanitization: DomSanitizer for user content
- [ ] No sensitive data in URL parameters
- [ ] Form validation before submission

---

## Deployment

**New Ports:**
- Patient Portal app: 4201
- Appointment Service: 8007
- Questionnaire Service: 8008

**Updated docker-compose.yml:**
```yaml
  patient-portal:
    build: ./cliniccare-patient-portal
    ports: ["4201:4200"]
    depends_on: [gateway]

  appointment-service:
    build: ./services/appointments
    ports: ["8007:8000"]
    environment:
      DATABASE_URL: sqlite:///./appointment.db

  questionnaire-service:
    build: ./services/questionnaires
    ports: ["8008:8000"]
    environment:
      DATABASE_URL: sqlite:///./questionnaire.db
```

**File storage:**
- Local dev: `/data/documents/` mounted volume
- Production: AWS S3 or NAS (configurable via env var)

---

## Success Criteria

✅ Patient can register and log in  
✅ Patient sees only their referrals, appointments, documents, questionnaires  
✅ Patient can upload files (validated, virus-scanned)  
✅ Patient can download documents  
✅ Patient can complete and submit questionnaires  
✅ Questionnaire responses visible to clinician in clinician portal  
✅ No data leaks (patient A cannot access patient B data)  
✅ Portal loads in < 2s  
✅ Fully responsive on mobile  
✅ WCAG 2.1 AA accessible  
✅ All E2E tests pass  

---

## Notes

- **Existing clinician app unchanged** — Patient portal is additive, no breaking changes
- **Shared backend** — Both apps use same API gateway and services
- **Demo data** — Seed patient accounts in PatientAccount table on first run
- **Email notifications** — Questionnaire ready, appointment reminder (async background job)
- **Future enhancements** — Appointment scheduling, messaging, prescription refills (out of scope)
