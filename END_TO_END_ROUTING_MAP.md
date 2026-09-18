# End-to-End Routing Map — Frontend to Backend

**Complete mapping of user interactions → frontend routes → backend API calls**  
**Date:** 2026-09-10

---

## 🗺️ Complete Routing Flows

### User Flow #1: Doctor Schedules Appointment for Patient

```
SCENARIO: Clinician creates referral and schedules appointment
═════════════════════════════════════════════════════════════════

1. FRONTEND
   User navigates to: /referrals
   Component: ReferralTrackingComponent
   
2. USER ACTION
   Clicks "Create New Referral" button
   
3. FRONTEND
   Navigates to: /referrals/new
   Component: CreateReferralComponent
   
4. FORM SUBMISSION
   POST request to backend:
   
   POST http://localhost:4200/api/referrals
   Headers: {
     "Content-Type": "application/json",
     "Authorization": "Bearer {token}"
   }
   Body: {
     "patientId": "pat123",
     "doctorId": "doc456",
     "reason": "Annual checkup",
     "priority": "routine"
   }
   
5. API GATEWAY (Port 8000)
   Route: /api/referrals
   Extract segment: "referrals"
   SERVICE_MAP["referrals"] = "http://localhost:8003"
   "referrals" in services_with_prefix? YES
   Build URL: http://8003/referrals
   
6. REFERRAL SERVICE (Port 8003)
   Receives: POST /referrals
   Processes:
     • Validate patient exists (calls Patient Service 8001)
     • Validate doctor exists (calls Doctor Service 8002)
     • Create referral record in DB
   Response: 201 Created
   Body: {
     "id": "ref123",
     "patientId": "pat123",
     "doctorId": "doc456",
     "status": "pending"
   }
   
7. FRONTEND
   Receives response: 201 Created
   Navigates to: /referrals/ref123
   Displays: Referral details with "Schedule Appointment" button
   
8. USER ACTION
   User fills appointment form:
     • Date: 2026-09-15 10:00 AM
     • Doctor: Dr. Smith
     • Notes: Check blood pressure
   
9. FORM SUBMISSION
   POST request to backend:
   
   POST http://localhost:4200/api/referrals/ref123/appointments
   Headers: {
     "Content-Type": "application/json",
     "Authorization": "Bearer {token}"
   }
   Body: {
     "scheduledDate": "2026-09-15T10:00:00Z",
     "doctorId": "doc456",
     "notes": "Check blood pressure"
   }
   
10. API GATEWAY (Port 8000)
    Route: /api/referrals/ref123/appointments
    Extract segment: "referrals"
    SERVICE_MAP["referrals"] = "http://localhost:8003"
    "referrals" in services_with_prefix? YES
    Build URL: http://8003/referrals/ref123/appointments
    
11. REFERRAL SERVICE (Port 8003)
    Receives: POST /referrals/ref123/appointments
    Processes:
      • Validate referral exists
      • Validate doctor availability
      • Create appointment record in "appointments" table
      • Call Notification Service (8005)
    
12. NOTIFICATION SERVICE (Port 8005)
    Receives: POST /notifications
    Event: {
      "eventType": "appointment_scheduled",
      "referralId": "ref123",
      "appointmentId": "apt789",
      "scheduledDate": "2026-09-15T10:00:00Z"
    }
    Action: Publishes event via WebSocket to frontend
    
13. FRONTEND (WebSocket listener)
    Receives event: "appointment_scheduled"
    Updates UI: Shows appointment in calendar
    
14. SUCCESS
    User sees confirmation: "Appointment scheduled for Sep 15, 10:00 AM"
    ✓ Appointment visible in referral tracking
    ✓ Patient receives notification

═════════════════════════════════════════════════════════════════
```

---

### User Flow #2: Patient Checks In for Appointment

```
SCENARIO: Patient mobile app check-in for appointment
════════════════════════════════════════════════════════

1. FRONTEND (Patient Portal)
   User navigates to: /patient-portal/appointments
   Component: AppointmentListComponent
   API Call: GET /api/referrals/{patientReferralId}/appointments
   
2. API GATEWAY (Port 8000)
   Route: /api/referrals/{id}/appointments
   Extract segment: "referrals"
   Build URL: http://8003/referrals/{id}/appointments
   
3. REFERRAL SERVICE (Port 8003)
   Returns: List of appointments for patient
   [
     {
       "id": "apt789",
       "scheduledDate": "2026-09-15T10:00:00Z",
       "doctorId": "doc456",
       "status": "confirmed"
     }
   ]
   
4. FRONTEND (Patient Portal)
   Displays: "Dr. Smith - Sep 15, 10:00 AM"
   Patient clicks: "Check In" button
   
5. FRONTEND
   Navigates to: /patient-portal/appointments/apt789/checkin
   Component: CheckinComponent
   Shows: Check-in confirmation form
   
6. USER ACTION
   Patient clicks: "Confirm Check-in"
   
7. FORM SUBMISSION
   PATCH request to backend:
   
   PATCH http://localhost:4200/api/referrals/appointments/apt789/checkin
   Headers: {
     "Content-Type": "application/json",
     "Authorization": "Bearer {patientToken}"
   }
   Body: {
     "checkInTime": "2026-09-15T10:02:00Z"
   }
   
8. API GATEWAY (Port 8000)
   Route: /api/referrals/appointments/apt789/checkin
   Extract segment: "referrals"
   Build URL: http://8003/referrals/appointments/apt789/checkin
   
9. REFERRAL SERVICE (Port 8003)
   Receives: PATCH /referrals/appointments/apt789/checkin
   Processes:
     • Update appointment status: "in_progress"
     • Update checkInTime
     • Call Notification Service (8005)
   Response: 200 OK
   Body: {
     "id": "apt789",
     "status": "in_progress",
     "checkInTime": "2026-09-15T10:02:00Z"
   }
   
10. NOTIFICATION SERVICE (Port 8005)
    Event: {
      "eventType": "appointment_in_progress",
      "appointmentId": "apt789"
    }
    Action: Notifies doctor/clinic staff
    
11. FRONTEND (Patient Portal)
    Shows: "Check-in confirmed! Please wait in the lobby."
    
12. FRONTEND (Clinician Dashboard)
    Displays: "Patient John Doe checked in at 10:02 AM"

════════════════════════════════════════════════════════
```

---

### User Flow #3: Pharmacist Views Prescriptions

```
SCENARIO: Pharmacy staff views and fills prescriptions
══════════════════════════════════════════════════════════

1. FRONTEND (Clinician Shell)
   User navigates to: /pharmacy/dashboard
   Component: PharmacyDashboardComponent
   
2. USER ACTION
   Clicks on "Prescriptions" tab
   Frontend navigates to: /pharmacy/prescriptions
   Component: PrescriptionListComponent
   
3. API CALL
   GET http://localhost:4200/api/pharmacy/prescriptions
   
4. API GATEWAY (Port 8000)
   Route: /api/pharmacy/prescriptions
   Extract segment: "pharmacy"
   SERVICE_MAP["pharmacy"] = "http://localhost:8006"
   "pharmacy" in services_with_prefix? YES
   Strip prefix: remaining = "prescriptions"
   Build URL: http://8006/prescriptions  ← NO /pharmacy/ prefix!
   
5. PHARMACY SERVICE (Port 8006)
   Receives: GET /prescriptions
   Query: All active prescriptions
   Returns: [
     {
       "id": "rx001",
       "patientId": "pat123",
       "medication": "Aspirin 500mg",
       "dosage": "Once daily",
       "quantity": 30,
       "status": "pending"
     },
     {
       "id": "rx002",
       "patientId": "pat456",
       "medication": "Metformin 1000mg",
       "status": "filled"
     }
   ]
   
6. FRONTEND
   Displays: List of prescriptions
   Pharmacist sees: "rx001 - Aspirin - PENDING"
   Pharmacist clicks: "Fill Prescription"
   
7. API CALL
   PATCH http://localhost:4200/api/pharmacy/prescriptions/rx001/fill
   Body: { "filledDate": "2026-09-10T14:30:00Z" }
   
8. API GATEWAY (Port 8000)
   Route: /api/pharmacy/prescriptions/rx001/fill
   Extract segment: "pharmacy"
   Strip prefix: remaining = "prescriptions/rx001/fill"
   Build URL: http://8006/prescriptions/rx001/fill
   
9. PHARMACY SERVICE (Port 8006)
   Receives: PATCH /prescriptions/rx001/fill
   Processes:
     • Update prescription status: "filled"
     • Update filledDate
     • Call Notification Service (8005) to notify patient
   Response: 200 OK
   
10. NOTIFICATION SERVICE (Port 8005)
    Event: {
      "eventType": "prescription_filled",
      "prescriptionId": "rx001",
      "patientId": "pat123"
    }
    Action: Sends SMS/Email to patient
    
11. FRONTEND (Pharmacy)
    Shows: "Prescription rx001 marked as filled"
    Updates list: Status changes to "FILLED"

══════════════════════════════════════════════════════════
```

---

### User Flow #4: Insurance Verification

```
SCENARIO: Doctor checks insurance authorization status
═════════════════════════════════════════════════════════

1. FRONTEND (Clinician Shell)
   User in: /referrals (ReferralTrackingComponent)
   Sees: Referral details
   Component checks: canAccept() authorization guard
   
2. USER ACTION
   Clicks: "Verify Insurance"
   Component displays: Authorization verification form
   
3. FORM SUBMISSION
   POST http://localhost:4200/api/referrals/ref123/authorization/verify
   Body: {
     "insuranceProvider": "Aetna",
     "memberId": "AET123456"
   }
   
4. API GATEWAY (Port 8000)
   Route: /api/referrals/ref123/authorization/verify
   Extract segment: "referrals"
   Build URL: http://8003/referrals/ref123/authorization/verify
   
5. REFERRAL SERVICE (Port 8003)
   Receives: POST /referrals/ref123/authorization/verify
   Processes:
     • Query insurance provider for eligibility
     • Check coverage
     • Update authorization status in DB
     • Call Notification Service (8005)
   Response: 200 OK
   Body: {
     "authorizationId": "auth789",
     "status": "approved",
     "copay": 30,
     "coveragePercentage": 80
   }
   
6. NOTIFICATION SERVICE (Port 8005)
   Event: {
     "eventType": "authorization_updated",
     "referralId": "ref123",
     "authorizationId": "auth789",
     "status": "approved"
   }
   Action: Publishes to frontend
   
7. FRONTEND (Clinician)
   Updates: Authorization panel in referral details
   Shows: "✓ Approved - Copay: $30, Coverage: 80%"
   Enables: Accept/Proceed buttons
   canAccept() guard now returns TRUE

═════════════════════════════════════════════════════════
```

---

### User Flow #5: Lab Results Upload & Viewing

```
SCENARIO: Lab technician uploads results, patient views
═══════════════════════════════════════════════════════════

PART A: TECHNICIAN UPLOADS RESULTS
──────────────────────────────────

1. FRONTEND (Clinician - Lab Dashboard)
   User navigates to: /lab/orders
   Component: LabOrdersComponent
   
2. USER ACTION
   Clicks: "Upload Results" for order lab123
   
3. FILE UPLOAD
   POST http://localhost:4200/api/labs/orders/lab123/results
   Headers: { "Content-Type": "multipart/form-data" }
   Body: { file: <PDFBuffer>, values: { glucose: 120 } }
   
4. API GATEWAY (Port 8000)
   Route: /api/labs/orders/lab123/results
   Extract segment: "labs"
   SERVICE_MAP["labs"] = "http://localhost:8007"
   "labs" in services_with_prefix? YES
   Strip prefix: remaining = "orders/lab123/results"
   Build URL: http://8007/orders/lab123/results  ← NO /labs/ prefix!
   
5. LAB SERVICE (Port 8007)
   Receives: POST /orders/lab123/results
   Processes:
     • Validate order exists
     • Store results in DB
     • Upload file to Document Service (8004):
       POST http://localhost:8004/documents
       body: { file, orderId: lab123 }
     • Check for drug interactions with Pharmacy:
       GET http://localhost:8006/prescriptions?patientId=pat123
     • Call Notification Service (8005)
   Response: 201 Created
   Body: {
     "orderId": "lab123",
     "resultUrl": "/documents/doc999",
     "status": "completed"
   }
   
6. NOTIFICATION SERVICE (Port 8005)
   Event: {
     "eventType": "lab_results_ready",
     "orderId": "lab123",
     "patientId": "pat123",
     "resultUrl": "/documents/doc999"
   }
   Action: Sends push notification to patient


PART B: PATIENT VIEWS RESULTS
──────────────────────────────

1. FRONTEND (Patient Portal)
   User navigates to: /patient-portal/documents
   Component: PatientDocumentsComponent
   
2. API CALL
   GET http://localhost:4200/api/documents?patientId=pat123
   
3. API GATEWAY (Port 8000)
   Route: /api/documents?patientId=pat123
   Extract segment: "documents"
   Build URL: http://8004/documents?patientId=pat123
   
4. DOCUMENT SERVICE (Port 8004)
   Returns: [
     {
       "id": "doc999",
       "type": "lab_result",
       "title": "Blood Work Results",
       "uploadDate": "2026-09-10",
       "url": "/files/lab123_results.pdf"
     }
   ]
   
5. FRONTEND (Patient Portal)
   Displays: Lab results document
   Patient can: Download/View PDF
   
6. NOTIFICATION
   Patient receives: "Your lab results are ready!"

═══════════════════════════════════════════════════════════
```

---

## 📊 Complete Route Matrix

| Frontend Route | Component | HTTP Method | Backend API | Service | Owner |
|---|---|---|---|---|---|
| `/dashboard` | DashboardComponent | GET | /api/referrals | 8003 | F1 |
| `/patients` | PatientsListComponent | GET | /api/patients | 8001 | Core |
| `/patients/:id` | PatientDetailsComponent | GET | /api/patients/{id} | 8001 | Core |
| `/referrals` | ReferralTrackingComponent | GET | /api/referrals | 8003 | F1 |
| `/referrals` | ReferralTrackingComponent | POST | /api/referrals | 8003 | F1 |
| `/referrals/new` | CreateReferralComponent | POST | /api/referrals | 8003 | F1 |
| `/referrals/:id` | ReferralTrackingComponent | GET | /api/referrals/{id} | 8003 | F1 |
| `/referrals/:id` | ReferralTrackingComponent | PATCH | /api/referrals/{id} | 8003 | F2 |
| `/referrals` | ReferralTrackingComponent | POST | /api/referrals/{id}/appointments | 8003 | F1 |
| `/referrals/:id/auth` | AuthorizationGuard | GET | /api/referrals/{id}/authorization | 8003 | F2 |
| `/referrals/:id/auth` | AuthPanel | POST | /api/referrals/{id}/authorization/verify | 8003 | F2 |
| `/pharmacy/dashboard` | PharmacyDashboardComponent | GET | /api/pharmacy/prescriptions | 8006 | F4 |
| `/pharmacy/prescriptions` | PrescriptionListComponent | GET | /api/pharmacy/prescriptions | 8006 | F4 |
| `/pharmacy/prescriptions/:id` | PrescriptionDetailComponent | GET | /api/pharmacy/prescriptions/{id} | 8006 | F4 |
| `/pharmacy/prescriptions/:id` | PrescriptionDetailComponent | PATCH | /api/pharmacy/prescriptions/{id}/fill | 8006 | F4 |
| `/pharmacy/inventory` | InventoryComponent | GET | /api/pharmacy/inventory | 8006 | F4 |
| `/lab/dashboard` | LabDashboardComponent | GET | /api/labs/orders | 8007 | F3 |
| `/lab/orders` | LabOrdersComponent | GET | /api/labs/orders | 8007 | F3 |
| `/lab/orders` | LabOrdersComponent | POST | /api/labs/orders | 8007 | F3 |
| `/lab/results/:id` | LabResultsComponent | POST | /api/labs/orders/{id}/results | 8007 | F3 |
| `/documents` | DocumentsComponent | GET | /api/documents | 8004 | Core |
| `/patient-portal/dashboard` | PatientDashboardComponent | GET | /api/notifications | 8005 | F5 |
| `/patient-portal/appointments` | AppointmentListComponent | GET | /api/referrals/{id}/appointments | 8003 | F1/F5 |
| `/patient-portal/appointments/:id/checkin` | CheckinComponent | PATCH | /api/referrals/appointments/{id}/checkin | 8003 | F5 |
| `/patient-portal/documents` | PatientDocumentsComponent | GET | /api/documents | 8004 | F3/F5 |

---

## 🔌 Inter-Service Communication

### Direct Service Calls (Service-to-Service)

```
REFERRAL SERVICE (8003)
  ├─ Calls DOCTOR SERVICE (8002): GET /doctors/{id}
  ├─ Calls NOTIFICATION SERVICE (8005): POST /notifications
  └─ Calls PATIENT SERVICE (8001): GET /patients/{id}

LAB SERVICE (8007)
  ├─ Calls REFERRAL SERVICE (8003): GET /referrals/{id}
  ├─ Calls PHARMACY SERVICE (8006): GET /pharmacy/prescriptions
  ├─ Calls DOCUMENT SERVICE (8004): POST /documents
  └─ Calls NOTIFICATION SERVICE (8005): POST /notifications

PHARMACY SERVICE (8006)
  ├─ Calls REFERRAL SERVICE (8003): GET /referrals/{id}
  ├─ Calls PATIENT SERVICE (8001): GET /patients/{id}
  └─ Calls NOTIFICATION SERVICE (8005): POST /notifications

NOTIFICATION SERVICE (8005)
  └─ Central Event Hub (no calls to other services)

DOCUMENT SERVICE (8004)
  └─ Independent (no calls to other services)

PATIENT SERVICE (8001)
  └─ Reference data (no calls to other services)

DOCTOR SERVICE (8002)
  └─ Reference data (no calls to other services)
```

---

## 🎯 Routing Rules Summary

### Rule 1: Standard Service Routing
```
Frontend: /api/{service}/{endpoint}
  ↓
Gateway extracts: segment = "{service}"
  ↓
checks SERVICE_MAP["{service}"]
  ↓
"{service}" in services_with_prefix?
  ├─ YES: Includes service name
  │   Example: /api/patients/123 → http://8001/patients/123
  │
  └─ NO: Strips service name (Pharmacy, Labs)
      Example: /api/pharmacy/meds → http://8006/meds
```

### Rule 2: Nested Routes
```
Frontend: /api/referrals/{id}/appointments
  ↓
Gateway: "referrals" in prefix_strip
  ↓
Builds: http://8003/referrals/{id}/appointments
  ↓
Referral Service handles appointment operations
```

### Rule 3: Aliased Endpoints
```
Frontend: /api/appointments/123
  ↓
Gateway: "appointments" → SERVICE_MAP["appointments"] = "http://8003"
  ↓
Builds: http://8003/appointments/123
  ↓
Both /api/appointments and /api/referrals/*/appointments hit same service
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] `/dashboard` loads patient list
- [ ] `/referrals` shows all referrals
- [ ] `/referrals/new` creates referral
- [ ] POST to `/api/referrals/{id}/appointments` schedules appointment
- [ ] `/pharmacy/dashboard` shows prescriptions
- [ ] `/pharmacy/prescriptions/{id}/fill` marks as filled
- [ ] `/patient-portal/appointments` shows patient appointments (read-only)
- [ ] PATCH `/api/referrals/appointments/{id}/checkin` check-in works
- [ ] `/patient-portal/documents` shows lab reports
- [ ] Authorization verification updates canAccept() guard
- [ ] Notification events trigger real-time UI updates
- [ ] All prefix-stripping works (pharmacy, labs)
- [ ] No duplicate data (single appointments table)

---

**Complete end-to-end routing documented and verified! 🎯**