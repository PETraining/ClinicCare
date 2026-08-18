# Plan: Implement ReferralIQ Phase 2 — Appointments Feature

## Context

**Problem:** Version 1 of ReferralIQ ends when a referral reaches `Accepted` status — there is no next step defined for accepted referrals.

**Solution:** Phase 2 adds appointment scheduling. Once a referral is `Accepted`, users can manually create appointments to track scheduled consultations with scheduled date, location, and status (Scheduled | Completed | Cancelled).

**Scope:** Appointments are added to the existing **Referral Service** only — no new service, no new port. This is a schema and API extension, not an architectural change.

**Design Philosophy (per spec):** Minimal and intentional. No calendar integration, no availability checks, no conflict detection, no automatic reminders. Date/time fields are unconstrained. This leaves room for future enhancements but keeps Phase 2 lean.

---

## Phase 1 Exploration Results

### Backend Patterns (Referral Service)

From code inspection of `services/referral/`:

- **ORM:** SQLAlchemy with `Base` declarative class inheritance
- **Models:** ReferralId (PK), PatientId, ReferringDoctorId, SpecialistId, Reason, Priority (enum as string), Status (enum as string), CreatedAt, UpdatedAt
- **Schemas:** Pydantic with pattern: BaseModel → Create (input) → Read (output); PascalCase field names; `ConfigDict(from_attributes=True)` for ORM serialization
- **Endpoints:** GET list, GET by id, POST create (201), PATCH for state transitions
- **Error handling:** HTTPException with status codes: 404 (not found), 400 (invalid state), 502 (upstream unavailable)
- **Validation:** Foreign key checks via async service calls; state transitions validated against a TRANSITIONS map
- **Database:** SQLite file-based, auto-created via `Base.metadata.create_all(bind=engine)`
- **Dependency injection:** `Depends(get_db)` for session management
- **Seeding:** Only seeds if table empty; uses dictionaries mapping to model fields

### Frontend Patterns (Angular 18)

From code inspection of `frontend/src/app/`:

- **Architecture:** Standalone components (Angular 14+), signal-based state management
- **Structure:** `/core/models/`, `/core/services/`, `/features/` (feature modules), `/core/guards/` (auth)
- **Services:** `@Injectable({ providedIn: 'root' })`, signal state (`signal<Type>()`), methods update signals with `.set()` or `.update()`
- **HTTP:** Angular HttpClient, `.subscribe(r => signal.set(r))` pattern, `.pipe(tap(...))` for side effects
- **Components:** Standalone with imports declaration, signals as state, `computed()` for derived state, `effect()` for side effects
- **Forms:** Template-driven, `FormsModule`, `[(ngModel)]` two-way binding, validation via `#f="ngForm"`, `f.valid` checks
- **Templates:** `{{ signal() }}` to invoke signal, `@if`, `@for`, `@empty` control flow, `track` in loops, `[class.name]` binding
- **Tables:** Thead/tbody, filter buttons above, inline actions, empty state message
- **Routing:** Via `RouterLink` or `router.navigate()`

---

## Implementation Plan

### Backend Implementation (Referral Service)

**1. Update `services/referral/models.py`**

Add Appointment model after Referral (follows same pattern):

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

class Appointment(Base):
    __tablename__ = "appointments"
    
    AppointmentId = Column(Integer, primary_key=True, index=True)
    ReferralId = Column(Integer, ForeignKey("referrals.ReferralId"), nullable=False, index=True)
    ScheduledDate = Column(DateTime, nullable=False)
    Location = Column(String, nullable=False)
    Status = Column(String, nullable=False, default="Scheduled", index=True)
    CreatedAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    referral = relationship("Referral", back_populates="appointments")
```

Update Referral model to add relationship:
```python
appointments = relationship("Appointment", back_populates="referral", cascade="all, delete-orphan")
```

**2. Update `services/referral/schemas.py`**

Add schemas before or after existing Referral schemas:

```python
from enum import Enum
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AppointmentStatus(str, Enum):
    scheduled = "Scheduled"
    completed = "Completed"
    cancelled = "Cancelled"

class AppointmentCreate(BaseModel):
    ScheduledDate: datetime
    Location: str

class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    AppointmentId: int
    ReferralId: int
    ScheduledDate: datetime
    Location: str
    Status: AppointmentStatus
    CreatedAt: datetime
```

**3. Update `services/referral/main.py`**

Add helper function (follows existing pattern):
```python
def _get_appointment_or_404(appointment_id: int, db: Session) -> models.Appointment:
    appointment = db.get(models.Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail=f"Appointment {appointment_id} not found")
    return appointment
```

Add 4 endpoints (after existing referral endpoints):

```python
@app.post("/referrals/{referral_id}/appointments", response_model=schemas.AppointmentRead, status_code=201)
def create_appointment(referral_id: int, payload: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    referral = _get_referral_or_404(referral_id, db)
    if referral.Status != "Accepted":
        raise HTTPException(status_code=400, detail="Appointment can only be created for Accepted referrals")
    
    appointment = models.Appointment(ReferralId=referral_id, **payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@app.get("/referrals/{referral_id}/appointments", response_model=list[schemas.AppointmentRead])
def list_appointments(referral_id: int, db: Session = Depends(get_db)):
    _get_referral_or_404(referral_id, db)
    appointments = db.query(models.Appointment).filter(models.Appointment.ReferralId == referral_id).order_by(models.Appointment.CreatedAt).all()
    return appointments

@app.patch("/appointments/{appointment_id}/complete", response_model=schemas.AppointmentRead)
def complete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = _get_appointment_or_404(appointment_id, db)
    if appointment.Status != "Scheduled":
        raise HTTPException(status_code=400, detail="Only Scheduled appointments can be completed")
    
    appointment.Status = "Completed"
    db.commit()
    db.refresh(appointment)
    return appointment

@app.patch("/appointments/{appointment_id}/cancel", response_model=schemas.AppointmentRead)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = _get_appointment_or_404(appointment_id, db)
    if appointment.Status != "Scheduled":
        raise HTTPException(status_code=400, detail="Only Scheduled appointments can be cancelled")
    
    appointment.Status = "Cancelled"
    db.commit()
    db.refresh(appointment)
    return appointment
```

**4. Update `services/referral/seed.py`**

Add sample appointments to the seed data:

```python
SEED_APPOINTMENTS = [
    dict(ReferralId=2, ScheduledDate=datetime(2026, 8, 15, 10, 0), Location="Dr. Smith's Office, Room 201", Status="Scheduled", CreatedAt=datetime(2026, 7, 25, 10, 0)),
]

def seed_if_empty(db: Session) -> None:
    # ... existing referral seeding code ...
    
    if db.query(models.Appointment).count() == 0:
        for row in SEED_APPOINTMENTS:
            db.add(models.Appointment(**row))
    
    db.commit()
```

**5. No changes to `db.py`** — existing session management works as-is.

---

### Frontend Implementation (Angular)

**1. Create `frontend/src/app/core/models/appointment.model.ts`**

```typescript
export interface Appointment {
  AppointmentId: number;
  ReferralId: number;
  ScheduledDate: Date;
  Location: string;
  Status: 'Scheduled' | 'Completed' | 'Cancelled';
  CreatedAt: Date;
}

export interface AppointmentCreate {
  ScheduledDate: Date;
  Location: string;
}
```

**2. Create `frontend/src/app/core/services/appointment.service.ts`**

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Appointment, AppointmentCreate } from '../models/appointment.model';
import { API_BASE_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/referrals`;
  
  appointments = signal<Appointment[]>([]);
  
  listByReferral(referralId: number): void {
    this.http.get<Appointment[]>(`${this.base}/${referralId}/appointments`)
      .subscribe(appointments => this.appointments.set(appointments));
  }
  
  create(referralId: number, payload: AppointmentCreate): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/${referralId}/appointments`, payload)
      .pipe(tap(apt => this.appointments.update(appts => [...appts, apt])));
  }
  
  complete(appointmentId: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${API_BASE_URL}/appointments/${appointmentId}/complete`, {})
      .pipe(tap(apt => this.appointments.update(appts => appts.map(a => a.AppointmentId === appointmentId ? apt : a))));
  }
  
  cancel(appointmentId: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {})
      .pipe(tap(apt => this.appointments.update(appts => appts.map(a => a.AppointmentId === appointmentId ? apt : a))));
  }
}
```

**3. Create `frontend/src/app/features/appointments/appointment-list.component.ts`**

```typescript
import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="appointments-section">
      <h4>Appointments</h4>
      @if (appointments().length === 0) {
        <p class="empty">No appointments scheduled.</p>
      } @else {
        <table class="appointments-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (apt of appointments(); track apt.AppointmentId) {
              <tr>
                <td>{{ apt.ScheduledDate | date: 'MMM d, y, h:mm a' }}</td>
                <td>{{ apt.Location }}</td>
                <td><span [class]="'status ' + apt.Status.toLowerCase()">{{ apt.Status }}</span></td>
                <td class="actions">
                  @if (apt.Status === 'Scheduled') {
                    <button (click)="onComplete(apt.AppointmentId)" class="btn-small">Mark Complete</button>
                    <button (click)="onCancel(apt.AppointmentId)" class="btn-small btn-danger">Cancel</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .appointments-section { margin: 20px 0; }
    .appointments-table { width: 100%; border-collapse: collapse; }
    .appointments-table th, .appointments-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    .appointments-table th { background-color: #f5f5f5; font-weight: bold; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 0.9em; }
    .status.scheduled { background-color: #e3f2fd; color: #1976d2; }
    .status.completed { background-color: #e8f5e9; color: #388e3c; }
    .status.cancelled { background-color: #ffebee; color: #d32f2f; }
    .actions { white-space: nowrap; }
    .btn-small { padding: 6px 12px; margin-right: 5px; cursor: pointer; }
    .btn-danger { background-color: #d32f2f; color: white; }
    .empty { color: #999; font-style: italic; }
  `]
})
export class AppointmentListComponent {
  @Input() set referralId(id: number) {
    if (id) this.appointmentService.listByReferral(id);
  }
  
  appointmentService = inject(AppointmentService);
  appointments = computed(() => this.appointmentService.appointments());
  
  onComplete(appointmentId: number): void {
    this.appointmentService.complete(appointmentId).subscribe();
  }
  
  onCancel(appointmentId: number): void {
    this.appointmentService.cancel(appointmentId).subscribe();
  }
}
```

**4. Create `frontend/src/app/features/appointments/schedule-appointment.component.ts`**

```typescript
import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppointmentCreate, Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';

@Component({
  selector: 'app-schedule-appointment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="schedule-form">
      <h4>Schedule Appointment</h4>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-group">
          <label>Scheduled Date & Time *</label>
          <input type="datetime-local" name="scheduledDate" [(ngModel)]="form.ScheduledDate" required>
        </div>
        <div class="form-group">
          <label>Location *</label>
          <input type="text" name="location" [(ngModel)]="form.Location" placeholder="e.g., Dr. Smith's Office, Room 201" required>
        </div>
        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }
        <button type="submit" [disabled]="!f.valid || submitting()" class="btn-primary">
          {{ submitting() ? 'Scheduling...' : 'Schedule Appointment' }}
        </button>
        <button type="button" (click)="cancel()" class="btn-secondary">Cancel</button>
      </form>
    </div>
  `,
  styles: [`
    .schedule-form { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 4px; background-color: #fafafa; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
    .form-group input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .error { color: #d32f2f; margin: 10px 0; }
    .btn-primary, .btn-secondary { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; }
    .btn-primary { background-color: #1976d2; color: white; }
    .btn-secondary { background-color: #ccc; color: #333; }
  `]
})
export class ScheduleAppointmentComponent {
  @Input() referralId!: number;
  @Output() onSuccess = new EventEmitter<Appointment>();
  @Output() onCancel = new EventEmitter<void>();
  
  appointmentService = inject(AppointmentService);
  form: AppointmentCreate = { ScheduledDate: new Date(), Location: '' };
  errorMessage = signal('');
  submitting = signal(false);
  
  submit(): void {
    this.submitting.set(true);
    this.appointmentService.create(this.referralId, this.form).subscribe({
      next: (apt) => {
        this.form = { ScheduledDate: new Date(), Location: '' };
        this.submitting.set(false);
        this.errorMessage.set('');
        this.onSuccess.emit(apt);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to schedule appointment');
        this.submitting.set(false);
      }
    });
  }
  
  cancel(): void {
    this.form = { ScheduledDate: new Date(), Location: '' };
    this.errorMessage.set('');
    this.onCancel.emit();
  }
}
```

**5. Update existing referral-tracking component** (`features/referrals/referral-tracking.component.ts`)

- Import ScheduleAppointmentComponent and AppointmentListComponent
- Add `showScheduleForm = signal(false)` to manage form visibility
- In template, after referral details:
  - Show "Schedule Appointment" button only when referral Status === 'Accepted' and !showScheduleForm
  - Show ScheduleAppointmentComponent when showScheduleForm
  - Show AppointmentListComponent with referralId prop
  - Handle form success/cancel to toggle showScheduleForm

---

## Files to Create/Modify

### Backend
- **Modify:** `services/referral/models.py` — add Appointment model, update Referral relationship
- **Modify:** `services/referral/schemas.py` — add AppointmentCreate/Read schemas and enum
- **Modify:** `services/referral/main.py` — add 4 endpoints + helper function
- **Modify:** `services/referral/seed.py` — add appointment seed data

### Frontend
- **Create:** `frontend/src/app/core/models/appointment.model.ts` — interfaces
- **Create:** `frontend/src/app/core/services/appointment.service.ts` — HTTP service
- **Create:** `frontend/src/app/features/appointments/appointment-list.component.ts` — list/action component
- **Create:** `frontend/src/app/features/appointments/schedule-appointment.component.ts` — form component
- **Modify:** `frontend/src/app/features/referrals/referral-tracking.component.ts` — integrate components

---

## Testing & Verification

**Backend:**
1. Rebuild and start services: `docker compose up -d --build referral-service`
2. Test POST (create with invalid referral): should return 404
3. Test POST (create with non-Accepted referral): should return 400
4. Test POST (create with Accepted referral): should return 201
5. Test GET (list): should return array of appointments
6. Test PATCH complete/cancel: should transition status, reject if not Scheduled

**Frontend:**
1. Start frontend: `npm start` in `frontend/`
2. Navigate to referral with Accepted status
3. Verify "Schedule Appointment" button appears
4. Click button, fill form, submit
5. Verify appointment appears in list below
6. Test "Mark Complete" — verify status changes
7. Test "Cancel" — verify status changes
8. Refresh page — verify changes persisted

**End-to-End:**
1. Run `./start_all.sh`
2. Via UI: Create patient → Create referral → Accept referral → Schedule appointment
3. Verify UI shows appointment with actions
4. Test complete/cancel actions
5. Verify state persists across page refreshes
