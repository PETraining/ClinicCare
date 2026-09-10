# Frontend Routing Guide — All Modules Integrated

**Status:** ✅ Consolidated with backend routes  
**Date:** 2026-09-10  
**File:** `frontend/src/app/app.routes.ts`

---

## 🎯 Routing Architecture

```
Entry Point (4200)
│
├─ PUBLIC ROUTES
│  ├─ /login                          → LoginComponent (Clinician login)
│  └─ /patient-portal/login           → PatientLoginComponent (Patient login)
│
├─ CLINICIAN DASHBOARD (ShellComponent, guarded by authGuard)
│  ├─ / or /dashboard                 → DashboardComponent
│  ├─ /patients                       → PatientsListComponent
│  ├─ /patients/:id                   → PatientDetailsComponent
│  ├─ /referrals                      → ReferralTrackingComponent [F1]
│  ├─ /referrals/new                  → CreateReferralComponent [F1]
│  ├─ /documents                      → DocumentsComponent
│  ├─ /pharmacy/*                     → PharmacyComponents [F4]
│  └─ /lab/*                          → LabComponents [F3] (pending)
│
└─ PATIENT PORTAL (PatientPortalShellComponent, guarded by patientAuthGuard)
   ├─ /patient-portal                 → redirect to /patient-portal/dashboard
   ├─ /patient-portal/dashboard       → PatientDashboardComponent
   ├─ /patient-portal/appointments    → AppointmentListComponent [F1/F5]
   ├─ /patient-portal/appointments/:id/checkin → CheckinComponent [F5]
   └─ /patient-portal/documents       → PatientDocumentsComponent [F3]
```

---

## 📋 Route Details by Feature Team

### **Core Routes (All Teams Use)**

#### Public Routes
```typescript
{ path: 'login', component: LoginComponent }
{ path: 'patient-portal/login', component: PatientLoginComponent }
```

#### Dashboard Hub
```typescript
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }    // Redirect /
{ path: 'dashboard', component: DashboardComponent }         // Main dashboard
```

---

### **F1 - Appointments** ✅ ROUTES

**Clinician Routes** (Manage referrals & appointments)
```typescript
// Referral Management
{ path: 'referrals', component: ReferralTrackingComponent }
  └─ Shows: List of all referrals
  └─ UI includes: Appointment scheduling form
  └─ API calls: GET /api/referrals, POST /api/referrals/{id}/appointments

{ path: 'referrals/new', component: CreateReferralComponent }
  └─ Shows: Form to create new referral
  └─ API calls: POST /api/referrals
```

**Patient Portal Routes** (Patients view appointments)
```typescript
{ path: 'patient-portal/appointments', component: AppointmentListComponent }
  └─ Shows: Patient's scheduled appointments (read-only)
  └─ API calls: GET /api/referrals/{id}/appointments

{ path: 'patient-portal/appointments/:id/checkin', component: CheckinComponent }
  └─ Shows: Check-in flow for appointment
  └─ API calls: PATCH /api/referrals/appointments/{id}/checkin
```

**Backend API Routes Used by F1**
```
GET    /api/referrals                     ← List all referrals
POST   /api/referrals                     ← Create referral
GET    /api/referrals/{id}                ← Get referral details
PATCH  /api/referrals/{id}                ← Update referral
GET    /api/referrals/{id}/appointments   ← List appointments (F1 creates via POST)
POST   /api/referrals/{id}/appointments   ← Schedule appointment
GET    /api/referrals/appointments/{id}   ← Get appointment details
PATCH  /api/referrals/appointments/{id}   ← Update appointment (status, etc.)
```

---

### **F2 - Insurance Eligibility** 

**Clinician Routes** (Manage authorization)
```typescript
// Part of referral-tracking.component.ts
// Shows insurance authorization panel alongside appointment scheduling
// Authorization guard: canAccept() checks authorization status
```

**UI Components** (referral-tracking.component.ts)
```
- Authorization Guard (canAccept())
- Eligibility Verification Form
- Authorization Status Display
- Request Authorization Button
```

**Backend API Routes Used by F2**
```
GET    /api/referrals/{id}/authorization           ← Check authorization status
POST   /api/referrals/{id}/authorization           ← Request authorization
POST   /api/referrals/{id}/authorization/verify    ← Verify eligibility
```

**Notification Events**
```
authorization_updated → Updates authorization panel in real-time
```

---

### **F3 - Diagnostic Lab** 🔄

**Clinician Routes** (Lab technician dashboard)
```typescript
// PENDING IMPLEMENTATION
{ path: 'lab/dashboard', component: LabDashboardComponent }
{ path: 'lab/orders', component: LabOrdersComponent }
{ path: 'lab/results', component: LabResultsComponent }
```

**Patient Portal Routes** (Patient views lab results)
```typescript
{ path: 'patient-portal/documents', component: PatientDocumentsComponent }
  └─ Shows: Lab reports and results (from document service)
  └─ API calls: GET /api/documents
```

**Backend API Routes Used by F3**
```
GET    /api/labs/tests                   ← Available lab tests
GET    /api/labs/orders                  ← List lab orders
POST   /api/labs/orders                  ← Create new lab order
GET    /api/labs/orders/{id}             ← Get order status
GET    /api/labs/orders/{id}/results     ← Get test results
```

**Notification Events**
```
lab_results_ready → Notifies patient via portal
```

---

### **F4 - Pharmacy** ✅

**Clinician Routes** (Pharmacy dashboard)
```typescript
{ path: 'pharmacy/dashboard', component: PharmacyDashboardComponent }
{ path: 'pharmacy/prescriptions', component: PrescriptionListComponent }
{ path: 'pharmacy/prescriptions/:id', component: PrescriptionDetailComponent }
{ path: 'pharmacy/inventory', component: InventoryManagementComponent }
```

**Backend API Routes Used by F4**
```
GET    /api/pharmacy/prescriptions                 ← List prescriptions
POST   /api/pharmacy/prescriptions                 ← Create prescription
GET    /api/pharmacy/prescriptions/{id}            ← Get prescription details
PATCH  /api/pharmacy/prescriptions/{id}/fill       ← Mark as filled
```

**Notification Events**
```
prescription_created → Notifies pharmacy staff
```

---

### **F5.2 - Patient Portal** 

**Patient Routes** (Patient-only features)
```typescript
{
  path: 'patient-portal',
  component: PatientPortalShellComponent,
  canActivate: [patientAuthGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    
    // Dashboard
    { path: 'dashboard', component: PatientDashboardComponent }
      └─ Shows: Upcoming appointments, recent documents, notifications
    
    // Appointments (F1 integration)
    { path: 'appointments', component: AppointmentListComponent }
      └─ Shows: Scheduled appointments (read-only)
      └─ API: GET /api/referrals/{id}/appointments
    
    // Check-in
    { path: 'appointments/:id/checkin', component: CheckinComponent }
      └─ Shows: Check-in form for appointment
      └─ API: PATCH /api/referrals/appointments/{id}/checkin
    
    // Documents
    { path: 'documents', component: PatientDocumentsComponent }
      └─ Shows: Lab reports, prescriptions, referrals
      └─ API: GET /api/documents
  ],
}
```

**Backend API Routes Used by F5**
```
GET    /api/referrals/{id}/appointments           ← Patient's appointments (read-only)
PATCH  /api/referrals/appointments/{id}/checkin   ← Check-in for appointment
GET    /api/documents                             ← Patient's documents (lab reports)
GET    /api/notifications                         ← Patient's notifications
```

**Key Constraint**
```
❌ DO NOT create separate Appointment table/model in patient portal
✅ DO consume F1's endpoints read-only
```

---

## 🔗 Component to API Mapping

### Clinician Dashboard

| Route | Component | API Calls | Owner |
|---|---|---|---|
| `/dashboard` | DashboardComponent | GET /api/referrals, GET /api/appointments | F1 |
| `/patients` | PatientsListComponent | GET /api/patients | Core |
| `/patients/:id` | PatientDetailsComponent | GET /api/patients/{id}, GET /api/referrals | F1/F2/F3 |
| `/referrals` | ReferralTrackingComponent | GET /api/referrals, POST /api/referrals/{id}/appointments | F1/F2 |
| `/referrals/new` | CreateReferralComponent | POST /api/referrals | F1 |
| `/documents` | DocumentsComponent | GET /api/documents, POST /api/documents | F3 |
| `/pharmacy/*` | PharmacyComponents | GET /api/pharmacy/*, POST /api/pharmacy/* | F4 |
| `/lab/*` | LabComponents (pending) | GET /api/labs/*, POST /api/labs/* | F3 |

### Patient Portal

| Route | Component | API Calls | Owner |
|---|---|---|---|
| `/patient-portal/dashboard` | PatientDashboardComponent | GET /api/notifications, GET /api/referrals/{id}/appointments | F5 |
| `/patient-portal/appointments` | AppointmentListComponent | GET /api/referrals/{id}/appointments | F1/F5 |
| `/patient-portal/appointments/:id/checkin` | CheckinComponent | PATCH /api/referrals/appointments/{id}/checkin | F5 |
| `/patient-portal/documents` | PatientDocumentsComponent | GET /api/documents | F3/F5 |

---

## 🎨 Shell Navigation

### Clinician Shell (ShellComponent)
Located in `frontend/src/app/shell/shell.component.html`

**Nav Links (in order)**
```html
<nav>
  <a routerLink="/dashboard">Dashboard</a>
  <a routerLink="/patients">Patients</a>
  <a routerLink="/referrals">Referrals</a>
  <a routerLink="/pharmacy/dashboard">Pharmacy</a>
  <a routerLink="/lab/dashboard">Lab</a>
  <a routerLink="/documents">Documents</a>
  <!-- Logout link -->
</nav>
```

### Patient Portal Shell (PatientPortalShellComponent)
Located in `frontend/src/app/features/patient-portal/shell/patient-portal-shell.component.html`

**Nav Links**
```html
<nav>
  <a routerLink="/patient-portal/dashboard">Dashboard</a>
  <a routerLink="/patient-portal/appointments">Appointments</a>
  <a routerLink="/patient-portal/documents">Documents</a>
  <!-- Logout link -->
</nav>
```

---

## 🔐 Route Guards

### authGuard
- Protects: All clinician dashboard routes
- Checks: User is authenticated clinician (doctor, admin, pharmacist, lab tech)
- Failure: Redirects to `/login`

### patientAuthGuard
- Protects: All patient portal routes
- Checks: User is authenticated patient
- Failure: Redirects to `/patient-portal/login`

---

## 📊 Data Flow: Frontend → Backend

### Example 1: Appointment Scheduling
```
User clicks "Schedule Appointment" in /referrals
  ↓
ReferralTrackingComponent
  ↓
Calls: POST /api/referrals/{id}/appointments
  body: { scheduledDate, doctorId, notes }
  ↓
API Gateway (8000)
  ↓
Referral Service (8003)
  ↓
Creates appointment in DB
  ↓
Publishes: appointment_scheduled event to Notification Service
  ↓
Frontend listens to notifications
  ↓
Refreshes appointment list automatically
```

### Example 2: Patient Check-in
```
Patient navigates to /patient-portal/appointments/:id/checkin
  ↓
CheckinComponent
  ↓
Calls: PATCH /api/referrals/appointments/{id}/checkin
  body: { checkInTime }
  ↓
API Gateway (8000)
  ↓
Referral Service (8003) → strips "appointments" prefix
  ↓
Updates appointment status in DB
  ↓
Publishes: appointment_completed event
  ↓
Frontend updates UI (shows confirmation)
```

### Example 3: View Lab Results (Patient Portal)
```
Patient navigates to /patient-portal/documents
  ↓
PatientDocumentsComponent
  ↓
Calls: GET /api/documents?patientId={id}
  ↓
API Gateway (8000)
  ↓
Document Service (8004)
  ↓
Returns patient's documents (lab reports)
  ↓
Frontend displays lab results in panel
```

---

## 🧪 Testing Routes

### Test Clinician Routes
```bash
# Navigate to dashboard
http://localhost:4200/dashboard

# Navigate to patients
http://localhost:4200/patients

# Navigate to referrals
http://localhost:4200/referrals

# Navigate to pharmacy
http://localhost:4200/pharmacy/dashboard

# Navigate to lab (when ready)
http://localhost:4200/lab/dashboard
```

### Test Patient Portal Routes
```bash
# Navigate to patient login
http://localhost:4200/patient-portal/login

# Navigate to patient dashboard
http://localhost:4200/patient-portal/dashboard

# Navigate to appointments
http://localhost:4200/patient-portal/appointments

# Navigate to documents
http://localhost:4200/patient-portal/documents
```

---

## 📝 Implementation Checklist

### Phase 1: F1-Appointments ✅
- [x] Referral routes configured
- [x] Appointment scheduling UI in referral-tracking.component
- [x] Appointment list in patient portal
- [x] Check-in component ready
- [ ] Test all appointment endpoints

### Phase 2a: F2-InsuranceEligibility
- [x] Authorization guard in referral-tracking.component
- [x] Authorization panel displays correctly
- [x] Eligibility verification form works
- [ ] Test all authorization endpoints

### Phase 2b: F5.2-Patient Portal
- [x] Patient portal shell routes configured
- [x] Appointment list component (read-only)
- [x] Check-in component
- [x] Documents panel
- [ ] Remove duplicate Appointment model
- [ ] Test patient portal features

### Phase 3: F3-DiagnosticLab
- [ ] Lab dashboard route configured
- [ ] Lab orders list component
- [ ] Lab results display component
- [ ] Patient lab documents in portal
- [ ] Test all lab endpoints

---

## 🔗 Related Documentation

- **Backend Routing:** See `CONSOLIDATED_ROUTING_GUIDE.md`
- **Architecture Diagrams:** See `ARCHITECTURE_DIAGRAMS.md`
- **API Endpoints:** See `MODULE_INTEGRATION_SUMMARY.md`
- **Integration Order:** See `INTEGRATION_UPDATES_SUMMARY.md`

---

## 💡 Key Rules

1. **Clinician vs Patient Routes**
   - Clinician: Full access, guarded by authGuard
   - Patient: Limited access (read-only), guarded by patientAuthGuard

2. **API Routing**
   - `/api/{service}/{endpoint}` format for all backend calls
   - Gateway handles routing internally (8000 → 8001-8007)

3. **Appointments Ownership**
   - F1 owns the appointments table
   - F5 consumes it read-only via GET /api/referrals/{id}/appointments
   - No duplicate data models

4. **Pharmacy & Lab Services**
   - Use prefix-stripping in gateway
   - Frontend calls `/api/pharmacy/*` and `/api/labs/*`
   - Backend strips the service name automatically

5. **Real-time Updates**
   - All services publish to Notification Service (8005)
   - Frontend listens to events
   - UI updates automatically on events

---

**Frontend routing consolidated with all 5 feature teams. Ready for integration! 🚀**
