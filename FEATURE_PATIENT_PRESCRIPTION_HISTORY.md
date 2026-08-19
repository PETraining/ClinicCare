# 📋 FEATURE REQUEST: PATIENT PRESCRIPTION HISTORY VIEW

**Status:** ✅ **BACKEND READY** | ⏳ **FRONTEND ENHANCEMENT NEEDED**  
**Requested By:** User Feedback  
**Date:** August 19, 2026  
**Priority:** HIGH

---

## 📌 REQUIREMENT

> "When we select a patient we should be able to view prescription history"

### Description
Users should be able to:
1. Navigate to Patients section
2. Select/view a patient
3. See all prescriptions for that patient
4. View prescription details, status, medications, and dispensing history

---

## ✅ CURRENT STATUS

### Backend: READY ✅

The API endpoint already supports filtering by patient:

```
GET /prescriptions?patient_id={patient_id}
```

**Example:**
```bash
curl "http://localhost:8006/prescriptions?patient_id=1"
```

**Response:**
```json
[
  {
    "PrescriptionId": 1,
    "ReferralId": 1,
    "PatientId": 1,
    "PrescribingDoctorId": 10,
    "Medications": [
      {
        "medication_id": 1,
        "quantity": 30,
        "frequency": "Once daily",
        "instructions": "Take with food"
      }
    ],
    "Status": "Active",
    "CreatedAt": "2026-08-18T15:02:31.027494",
    "UpdatedAt": "2026-08-18T15:02:31.027497"
  }
]
```

### Frontend: ENHANCEMENT NEEDED ⏳

The feature requires frontend UI work:
- Add patient detail view component
- Call prescription API with patient_id filter
- Display prescription list for that patient
- Show status, dates, medications, and dispensing history

---

## 🎯 IMPLEMENTATION PLAN

### Phase 1: Patient Detail View Component
**File:** `frontend/src/app/features/patients/patient-detail.component.ts`

```typescript
export class PatientDetailComponent implements OnInit {
  patientId = signal<number | null>(null);
  patientPrescriptions = signal<Prescription[]>([]);
  loading = signal(false);
  
  constructor(
    private pharmacyService: PharmacyService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.loadPatientPrescriptions(id);
    });
  }

  loadPatientPrescriptions(patientId: number) {
    this.loading.set(true);
    this.pharmacyService.getPrescriptionsByPatient(patientId)
      .subscribe({
        next: (prescriptions) => {
          this.patientPrescriptions.set(prescriptions);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading prescriptions', err);
          this.loading.set(false);
        }
      });
  }

  // Get prescriptions by status for this patient
  get activePrescriptions() {
    return this.patientPrescriptions().filter(p => p.Status === 'Active');
  }

  get completedPrescriptions() {
    return this.patientPrescriptions().filter(p => p.Status === 'Completed');
  }
}
```

### Phase 2: Update PharmacyService
**File:** `frontend/src/app/core/services/pharmacy.service.ts`

Add method to pharmacy service:
```typescript
/**
 * Get prescriptions for a specific patient
 */
getPrescriptionsByPatient(patientId: number) {
  return this.http.get<Prescription[]>(
    `${this.base}/prescriptions?patient_id=${patientId}`
  );
}
```

### Phase 3: Patient Detail Template
**File:** `frontend/src/app/features/patients/patient-detail.component.html`

```html
<div class="patient-detail-container">
  <h2>Patient Prescription History</h2>
  
  <div *ngIf="loading()" class="loading">
    Loading prescriptions...
  </div>

  <div *ngIf="!loading()">
    <h3>Active Prescriptions</h3>
    <table *ngIf="activePrescriptions.length > 0">
      <thead>
        <tr>
          <th>Rx #</th>
          <th>Date</th>
          <th>Doctor</th>
          <th>Medications</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let rx of activePrescriptions">
          <td>{{ rx.PrescriptionId }}</td>
          <td>{{ rx.CreatedAt | date }}</td>
          <td>Doctor {{ rx.PrescribingDoctorId }}</td>
          <td>{{ rx.Medications.length }} medication(s)</td>
          <td><span class="status-active">{{ rx.Status }}</span></td>
          <td>
            <button (click)="viewPrescriptionDetail(rx.PrescriptionId)">
              View Details
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p *ngIf="activePrescriptions.length === 0">No active prescriptions</p>

    <h3>Completed Prescriptions</h3>
    <table *ngIf="completedPrescriptions.length > 0">
      <!-- Similar structure as above -->
    </table>
    <p *ngIf="completedPrescriptions.length === 0">No completed prescriptions</p>
  </div>
</div>
```

### Phase 4: Add Route
**File:** `frontend/src/app/app.routes.ts`

```typescript
{
  path: 'patients/:id',
  component: PatientDetailComponent,
  data: { title: 'Patient Prescription History' }
}
```

---

## 📊 SAMPLE DATA

### Patient 1 Prescriptions
```
✓ Rx #1 - Active
  ├─ Created: 2026-08-18
  ├─ Doctor: 10
  ├─ Medications: Aspirin 30 units (Once daily)
  └─ Status: Active - Ready for fulfillment

Patient 1 has 1 prescription (1 active, 0 completed)
```

### Patient 2 Prescriptions
```
✓ Rx #2 - Active
  ├─ Created: 2026-08-18
  ├─ Doctor: 11
  ├─ Medications: Metformin 60 units (Twice daily)
  └─ Status: Active - Ready for fulfillment

Patient 2 has 1 prescription (1 active, 0 completed)
```

### Patient 3 Prescriptions
```
✓ Rx #3 - Completed
  ├─ Created: 2026-08-18
  ├─ Doctor: 12
  ├─ Medications: Lisinopril 30 units (Once daily)
  ├─ Status: Completed - Fulfilled
  └─ Dispensing History:
     └─ 30 units dispensed on 2026-08-18

Patient 3 has 1 prescription (0 active, 1 completed)
```

---

## 🔗 INTEGRATION POINTS

### From Patients Module
```
Patient List → Click Patient → View Patient Detail
              ↓
          Load Prescriptions for that patient
              ↓
          Display all Rx (Active & Completed)
              ↓
          Link to Prescription Detail for more info
```

### From Pharmacy Module
```
Pharmacy Dashboard → Prescriptions → Patient 1
                      ↓
                  (Already filters by patient if available)
```

---

## 📋 ACCEPTANCE CRITERIA

- [ ] Patient detail page loads prescription data via API
- [ ] Prescriptions are correctly filtered by patient_id
- [ ] Active prescriptions display separately from completed
- [ ] Each prescription shows: ID, date, doctor, medications, status
- [ ] "View Details" link goes to prescription detail page
- [ ] Dispensing history is visible from prescription detail
- [ ] Page handles "no prescriptions" case gracefully
- [ ] Loading state shows while fetching data
- [ ] Error handling for failed API calls

---

## ⚠️ USER FEEDBACK NOTE

**Reported Issue:** Patient prescription history not visible in UI

**Root Cause:** Backend API supports it, but frontend doesn't have the UI component to display it

**Impact:** Users can't easily see a patient's full prescription history from the patient view

**Priority:** HIGH - Essential for patient care management

---

## 🚀 NEXT STEPS TO IMPLEMENT

1. **Create Patient Detail Component**
   ```bash
   ng generate component features/patients/patient-detail
   ```

2. **Update PharmacyService**
   - Add `getPrescriptionsByPatient()` method
   - Call with patient_id parameter

3. **Create Patient Detail Template**
   - Show prescription table
   - Filter by status
   - Link to prescription details

4. **Add Route**
   - `/patients/{id}` → PatientDetailComponent

5. **Test End-to-End**
   - Click patient → see prescriptions
   - Click prescription → see details
   - Verify data is correct

---

## 💡 BONUS FEATURES

Once basic implementation is done, consider adding:

1. **Prescription Statistics**
   - Total prescriptions
   - Active count
   - Completed count
   - Average time to complete

2. **Medication Summary**
   - Total medications ever prescribed
   - Current active medications
   - Medication allergy checks

3. **Dispensing Summary**
   - Total amount dispensed
   - Last dispensing date
   - Refill availability

4. **Export Functionality**
   - Download prescription history as PDF
   - Print prescription list

---

## 📞 API REFERENCE

### Get Prescriptions by Patient
```
GET /prescriptions?patient_id={patientId}

Response: Array of Prescription objects
```

### Get Prescription Detail
```
GET /prescriptions/{prescriptionId}

Response: Prescription object with dispensing history
```

### Get Dispensing History
```
GET /prescriptions/{prescriptionId}/dispensing-history

Response: Array of DispensingRecord objects
```

---

## ✅ BACKEND VERIFICATION

The backend API is ready and tested:

```bash
# Test Patient 1 prescriptions
curl "http://localhost:8006/prescriptions?patient_id=1"

# Test Patient 2 prescriptions
curl "http://localhost:8006/prescriptions?patient_id=2"

# Test Patient 3 prescriptions
curl "http://localhost:8006/prescriptions?patient_id=3"
```

All return correct prescription data. ✅

---

## 📌 SUMMARY

| Aspect | Status | Notes |
|--------|--------|-------|
| Backend API | ✅ Ready | Endpoint exists and filters work |
| API Testing | ✅ Verified | Data returns correctly |
| Frontend Component | ⏳ Needed | Need to create patient-detail component |
| Service Method | ⏳ Needed | Add getPrescriptionsByPatient() |
| Routing | ⏳ Needed | Add patient detail route |
| UI Template | ⏳ Needed | Create patient prescription history view |

---

**Estimated Effort:** 2-3 hours for full implementation  
**Complexity:** Medium  
**Dependencies:** None (backend ready)  
**Priority:** HIGH

🎯 **This feature is ready to implement. Backend is waiting for frontend work!**

