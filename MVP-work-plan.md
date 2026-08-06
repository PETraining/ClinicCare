# Patient Portal MVP - Work Plan (2 Weeks, 3 People)

## Overview

Build a **working patient portal** in 2 weeks with 3 developers. Scope: patients can login, view referrals/appointments, upload documents, complete questionnaires. All features work end-to-end on happy path.

---

## Architecture Summary

**Frontend**: New Angular app (port 4201)  
**Backend**: 2 new services (Appointment 8007, Questionnaire 8008) + enhanced existing services  
**Authentication**: Email-only login, UUID session tokens stored in DB  
**Database**: SQLite local files, 1MB file uploads to local filesystem  

---

## Backend Changes Required

### Patient Service (8001)
```
New Models:
  PatientAccount(PatientAccountId, PatientId, Email, SessionToken, TokenExpiry)

New Endpoints:
  POST /patients/auth/login
    Input: {email}
    Output: {session_token, patient_id, patient_name}
  
  GET /patients/me
    Output: {patient_id, name, email}

Behavior:
  - No password validation (email-only login)
  - Generate UUID token, store in DB, set 24h expiry
  - Session tokens valid until TokenExpiry > now
```

### Referral Service (8003)
```
New Endpoint:
  GET /referrals/me
    Query: WHERE PatientId = authenticated_patient_id
    Return: List of referrals for authenticated patient

Behavior:
  - Gateway injects patient_id from token lookup
  - Return early if token invalid/expired
```

### Document Service (8004)
```
New Endpoints:
  GET /documents/me
    Query: WHERE PatientId = authenticated_patient_id
    Return: List of documents
  
  POST /documents/me
    Input: multipart file (max 1MB)
    Store: /uploads/{patient_id}/{filename}
    Return: {document_id, filename}

Behavior:
  - Accept any file type
  - Check size < 1MB, reject if larger
  - Store in local filesystem
```

### Notification Service (8005)
```
New Endpoint:
  GET /notifications/me
    Query: WHERE PatientId = authenticated_patient_id
    Return: List of notifications (read-only)
```

### Appointment Service (8007) - NEW
```
Models:
  Appointment(AppointmentId, PatientId, DoctorId, ScheduledDate, Location, Status)
  - Status: Scheduled, Completed, Cancelled

Endpoints:
  GET /appointments/me
    Return: All appointments for authenticated patient
  
  GET /appointments/me/{id}
    Return: Single appointment detail

Behavior:
  - Seed with demo data (5-10 appointments)
  - Filter by PatientId from token
```

### Questionnaire Service (8008) - NEW
```
Models:
  Questionnaire(QuestionnaireId, ReferralId, Title, Status)
  
  Question(QuestionId, QuestionnaireId, QuestionText, Type)
  - Type: "text" or "choice"
  
  PatientAnswer(AnswerId, QuestionId, PatientId, Answer)

Endpoints:
  GET /questionnaires/me
    Return: Questionnaires linked to patient's referrals
  
  GET /questionnaires/me/{id}
    Return: Questions + patient's answers (if any)
  
  POST /questionnaires/{id}/submit
    Input: [{question_id, answer}, ...]
    Action: Batch insert/update patient_answers

Behavior:
  - Seed with demo data (2-3 questionnaires)
  - Filter by referrals where PatientId = authenticated_patient_id
```

### Gateway (8000)
```
Add Middleware:
  1. Extract session_token from Authorization header
  2. Query: SELECT * FROM patient_accounts WHERE SessionToken = token
  3. If found AND TokenExpiry > now:
       - Inject patient_id into request scope
       - Call next middleware
     Else:
       - If path in [/api/*/me, ...patient-only paths]:
           Return 401 Unauthorized
       - Else allow (public endpoints)

CORS:
  - Allow origin: http://localhost:4201 (patient portal)
  - Methods: GET, POST, OPTIONS
```

---

## Frontend - New Angular App (port 4201)

### Project Structure
```
cliniccare-patient-portal/
├── src/app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.interceptor.ts
│   │   ├── services/
│   │   │   ├── patient.service.ts
│   │   │   ├── referral.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── questionnaire.service.ts
│   │   │   └── notification.service.ts
│   │   └── models/
│   │       └── (TypeScript interfaces)
│   ├── features/
│   │   ├── login/
│   │   │   └── login.component.ts
│   │   ├── dashboard/
│   │   │   └── dashboard.component.ts
│   │   ├── referrals/
│   │   │   ├── referral-list.component.ts
│   │   │   └── referral-detail.component.ts
│   │   ├── appointments/
│   │   │   ├── appointment-list.component.ts
│   │   │   └── appointment-detail.component.ts
│   │   ├── documents/
│   │   │   ├── document-list.component.ts
│   │   │   └── document-upload.component.ts
│   │   └── questionnaires/
│   │       ├── questionnaire-list.component.ts
│   │       └── questionnaire-form.component.ts
│   ├── shell/
│   │   └── shell.component.ts (header, sidebar, router-outlet)
│   ├── app.routes.ts
│   └── app.component.ts
└── angular.json, tsconfig.json, package.json
```

### Key Services

**AuthService**
```typescript
login(email: string): Observable<{session_token, patient_id, patient_name}>
logout(): void
hasToken(): boolean
getPatientId(): number
```

**ReferralService**
```typescript
loadMyReferrals(): Observable<Referral[]>
getReferral(id: number): Observable<Referral>
```

**AppointmentService**
```typescript
loadMyAppointments(): Observable<Appointment[]>
getAppointment(id: number): Observable<Appointment>
```

**DocumentService**
```typescript
loadMyDocuments(): Observable<Document[]>
uploadDocument(file: File): Observable<Document>
downloadDocument(id: number): void
```

**QuestionnaireService**
```typescript
loadMyQuestionnaires(): Observable<Questionnaire[]>
getQuestionnaire(id: number): Observable<Questionnaire>
submitAnswers(id: number, answers: Answer[]): Observable<void>
```

### Routing
```
/login                      (public)
/dashboard                  (protected)
/referrals                  (protected)
/referrals/:id              (protected)
/appointments               (protected)
/appointments/:id           (protected)
/documents                  (protected)
/documents/upload           (protected)
/questionnaires             (protected)
/questionnaires/:id         (protected)
```

### Auth Flow
```
1. User types email → POST /api/patients/auth/login
2. Backend: lookup email, generate UUID, store token, return token + patient_id
3. Frontend: store token in localStorage
4. All requests: interceptor injects Authorization header
5. Gateway: validates token exists in DB + not expired
6. Access granted or 401 Unauthorized
```

---

## Work Breakdown - 3 People, 2 Weeks

### Person 1: Backend Authentication & Authorization
**Responsibility**: Login, token validation, patient data isolation

#### Week 1 (2.5 days)
- [ ] PatientAccount model (0.25d)
  - Email, SessionToken, TokenExpiry fields
  - Add to services/patient/models.py

- [ ] Token generation (0.5d)
  - auth_utils.py: generate_token(), is_token_valid()
  - Use UUID v4, 24h expiry

- [ ] Login endpoint (0.75d)
  - POST /patients/auth/login
  - Email lookup, generate token, store in DB

- [ ] Gateway middleware (1d)
  - Extract session token from Authorization header
  - DB lookup: SELECT * WHERE SessionToken = token
  - Validate expiry
  - Inject patient_id into request scope
  - CORS headers

#### Week 2 (3 days)
- [ ] Authorization enforcement (1.5d)
  - Referral Service: add WHERE PatientId clause to queries
  - Document Service: add WHERE PatientId clause to queries
  - Notification Service: add WHERE PatientId clause to queries
  - Return 403 if patient_id mismatch

- [ ] GET /patients/me endpoint (0.5d)
  - Return authenticated patient profile

- [ ] Testing (1d)
  - E2E: Login with email
  - Verify Patient A cannot access Patient B data
  - Manual test with 2 patient accounts

**Deliverable**: Login working, gateway validates tokens, all patient endpoints enforce patient_id isolation

---

### Person 2: Backend Services (Appointments & Questionnaires)
**Responsibility**: Two new microservices, data models, endpoints

#### Week 1 (3 days)
- [ ] Appointment Service skeleton (1.5d)
  - Create services/appointments/ directory
  - Models: Appointment(AppointmentId, PatientId, DoctorId, ScheduledDate, Location, Status)
  - Database schema + SQLite
  - Seed 10 demo appointments

- [ ] Questionnaire Service skeleton (1d)
  - Create services/questionnaires/ directory
  - Models: Questionnaire, Question, PatientAnswer
  - Question types: "text" | "choice"
  - Database schema + SQLite
  - Seed 3 demo questionnaires with questions

- [ ] Document Service enhancement (0.5d)
  - Create /uploads/ directory
  - Add file size check (max 1MB)

#### Week 2 (2.5 days)
- [ ] Appointment endpoints (1d)
  - GET /appointments/me → List all appointments
  - GET /appointments/me/{id} → Single appointment detail

- [ ] Questionnaire endpoints (1d)
  - GET /questionnaires/me → Questionnaires linked to patient's referrals
  - GET /questionnaires/me/{id} → Questions + patient's answers
  - POST /questionnaires/{id}/submit → Batch insert answers

- [ ] Document endpoints (0.5d)
  - GET /documents/me → List documents
  - POST /documents/me → Upload file (multipart)

**Deliverable**: Appointment + Questionnaire services live, all endpoints working, file uploads to local storage

---

### Person 3: Frontend - Angular App
**Responsibility**: UI components, integration, happy path

#### Week 1 (3 days)
- [ ] Angular app scaffolding (0.75d)
  - Create cliniccare-patient-portal/ app
  - Set up angular.json, tsconfig.json, environment config

- [ ] Auth service + interceptor (1d)
  - AuthService: login(), logout(), hasToken()
  - Auth interceptor: inject Authorization header
  - Store token in localStorage

- [ ] Auth guard + routing (0.5d)
  - authGuard: check token exists
  - Route definitions: public (/login) + protected

- [ ] Login page (0.75d)
  - LoginComponent: email input, login button
  - Basic validation (required email)
  - Success redirect to dashboard

- [ ] App shell (0.5d)
  - Header with patient name + logout button
  - Sidebar with navigation links
  - router-outlet for pages

#### Week 2 (3 days)
- [ ] Dashboard (0.75d)
  - Show latest 3 referrals (simple list)
  - Show next appointment (simple list)
  - Notification count badge

- [ ] Referrals feature (0.75d)
  - ReferralListComponent: simple list
  - ReferralDetailComponent: show details

- [ ] Appointments feature (0.5d)
  - AppointmentListComponent: list all
  - AppointmentDetailComponent: show details

- [ ] Documents feature (0.75d)
  - DocumentListComponent: list documents
  - DocumentUploadComponent: file input + upload button
  - Download: click link to download

- [ ] Questionnaires feature (0.75d)
  - QuestionnaireListComponent: list questionnaires
  - QuestionnaireFormComponent: render text + choice questions dynamically
  - Submit answers button

- [ ] Testing (0.5d)
  - Happy path E2E: Login → Dashboard → Logout
  - Manual test: Upload file, submit questionnaire

**Deliverable**: Complete patient portal with all 6 features working

---

## Coordination Points

**End of Week 1**:
- Person 1 + 2: Verify token generation works with DB lookup
- Person 3: Request dummy patient data from Person 1 for UI testing
- All: Merge Week 1 changes to shared dev environment

**During Week 2**:
- Person 3 needs Person 1's `/patients/me` endpoint ready (Day 1)
- Person 3 needs Person 2's appointment/questionnaire endpoints ready (Day 2)
- Daily 15min standup: blockers, integration issues

---

## Daily Checklist

### Person 1
- [ ] Day 1-2: PatientAccount model + token generation
- [ ] Day 3-4: Login endpoint + gateway middleware
- [ ] Day 5: CORS setup + basic testing
- [ ] Day 6-8: Add patient_id WHERE clauses to all services
- [ ] Day 9-10: /patients/me endpoint + data isolation testing

### Person 2
- [ ] Day 1-2: Appointment service setup + models
- [ ] Day 3: Questionnaire service setup + models
- [ ] Day 4: Document service file storage prep
- [ ] Day 5-6: Appointment endpoints
- [ ] Day 7-8: Questionnaire endpoints
- [ ] Day 9-10: Document endpoints + testing

### Person 3
- [ ] Day 1: App scaffolding
- [ ] Day 2-3: Auth service + login page
- [ ] Day 4: Auth guard + shell layout
- [ ] Day 5: Test login with Person 1
- [ ] Day 6-7: Dashboard + referrals components
- [ ] Day 8: Appointments + documents
- [ ] Day 9: Questionnaires component
- [ ] Day 10: E2E testing + fixes

---

## Success Criteria (EOD Week 2)

✅ Patient login works (email → token stored in DB → session valid)  
✅ Dashboard loads with referral list + next appointment  
✅ Patient can view referral details  
✅ Patient can view appointment details  
✅ Patient can upload file (<1MB) to documents  
✅ Patient can download document  
✅ Patient can view questionnaire list  
✅ Patient can complete questionnaire (text + choice questions)  
✅ Patient can submit answers  
✅ Patient data isolation enforced (Patient A cannot see Patient B data)  
✅ Happy path E2E test passes: Login → View data → Upload → Submit → Logout  

---

## Testing Strategy

**What we test:**
- Login with valid email → works
- Login with invalid email → error
- Access dashboard after login → works
- Logout → redirects to login
- Upload file <1MB → works
- Download file → works
- Submit questionnaire → works
- Access referrals → shows only my referrals
- Access appointments → shows only my appointments

**What we don't test:**
- Upload file >1MB (just ensure size check is there)
- Expired token handling (just set 24h expiry, test via manual clock adjustment if time)
- Browser compatibility (Chrome only for MVP)
- Mobile devices (desktop only)
- Accessibility
- Performance metrics
- Error recovery flows
- Edge cases

---

## Tech Stack

**Backend:**
- FastAPI 0.115.0
- SQLAlchemy 2.0.35
- SQLite
- Python 3.11

**Frontend:**
- Angular 18.2.0
- TypeScript 5.5.2
- RxJS
- Angular Signals
- FormsModule (template-driven forms)

**Deployment:**
- Docker + Docker Compose
- Port 4201 (patient portal)
- Ports 8007, 8008 (new services)

---

## Notes

- All services communicate via API Gateway (no direct service-to-service calls)
- Database: Each service has its own SQLite file
- Demo data seeded on startup
- Token expiry: 24 hours (no refresh logic)
- File uploads: Max 1MB, stored in `/uploads/` directory on disk
- Patient ID isolation enforced at API layer (WHERE PatientId = authenticated_patient_id)
- No password hashing, no HTTPS, no rate limiting (all Phase 2+)
- Desktop browser only (no mobile optimization)

---

## Files to Create/Modify

**Backend:**
```
services/patient/models.py          Add: PatientAccount model
services/patient/main.py            Add: /auth/login, /me endpoints
services/patient/auth_utils.py      New: token generation + validation
gateway/main.py                     Modify: add token middleware + CORS
services/referral/main.py           Modify: add /referrals/me, WHERE clause
services/document/main.py           Modify: add /documents/me endpoints
services/notification/main.py       Modify: add /notifications/me endpoint
services/appointments/             New: Full service (main.py, models.py, db.py)
services/questionnaires/           New: Full service (main.py, models.py, db.py)
docker-compose.yml                 Modify: add 2 new services
```

**Frontend:**
```
cliniccare-patient-portal/                      New: Root directory
cliniccare-patient-portal/src/app/core/auth/    New: auth service, guard, interceptor
cliniccare-patient-portal/src/app/core/services/New: 6 data services
cliniccare-patient-portal/src/app/features/     New: 7 feature modules
cliniccare-patient-portal/src/app/shell/        New: shell component
cliniccare-patient-portal/angular.json          New: Angular config
```

---

## Go/No-Go Decision Points

**EOD Day 5 (Friday Week 1):**
- ✅ Login endpoint working?
- ✅ Token validation in gateway working?
- ✅ Person 3 can login with real token?
- ❌ If not → Fix immediately, don't proceed to Week 2

**EOD Day 10 (Friday Week 2):**
- ✅ All 6 features working end-to-end?
- ✅ Happy path E2E test passes?
- ✅ No data leaks (patient isolation enforced)?
- ❌ If not → Debug before calling it done
