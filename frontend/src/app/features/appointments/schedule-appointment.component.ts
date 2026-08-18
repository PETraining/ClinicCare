import { Component, Input, Output, EventEmitter, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Appointment, AppointmentCreate } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { extractErrorMessage } from '../../core/utils/error-message';

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
        <div class="form-group">
          <label>Specialist *</label>
          <select name="specialistId" [(ngModel)]="form.SpecialistId" required>
            <option value="" disabled selected>Select a specialist...</option>
            @for (doctor of doctors(); track doctor.DoctorId) {
              <option [value]="doctor.DoctorId">{{ doctor.Name }} ({{ doctor.Specialty }})</option>
            }
          </select>
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
    .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 1em; }
    .form-group select { cursor: pointer; }
    .error { color: #d32f2f; margin: 10px 0; font-weight: bold; }
    .btn-primary, .btn-secondary { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; font-size: 1em; }
    .btn-primary { background-color: #1976d2; color: white; }
    .btn-primary:hover:not(:disabled) { background-color: #1565c0; }
    .btn-primary:disabled { background-color: #bdbdbd; cursor: not-allowed; }
    .btn-secondary { background-color: #ccc; color: #333; }
    .btn-secondary:hover { background-color: #aaa; }
  `]
})
export class ScheduleAppointmentComponent implements OnInit {
  @Input() referralId!: number;
  @Output() onSuccess = new EventEmitter<Appointment>();
  @Output() onCancel = new EventEmitter<void>();

  appointmentService = inject(AppointmentService);
  doctorService = inject(DoctorService);
  form: AppointmentCreate = { ScheduledDate: new Date(), Location: '', SpecialistId: 0 };
  errorMessage = signal('');
  submitting = signal(false);
  doctors = computed(() => this.doctorService.doctors());

  ngOnInit(): void {
    this.doctorService.search();
  }

  submit(): void {
    this.submitting.set(true);
    this.appointmentService.create(this.referralId, this.form).subscribe({
      next: (apt) => {
        this.form = { ScheduledDate: new Date(), Location: '', SpecialistId: 0 };
        this.submitting.set(false);
        this.errorMessage.set('');
        this.onSuccess.emit(apt);
      },
      error: (err) => {
        this.errorMessage.set(extractErrorMessage(err, 'Failed to schedule appointment'));
        this.submitting.set(false);
      }
    });
  }

  cancel(): void {
    this.form = { ScheduledDate: new Date(), Location: '', SpecialistId: 0 };
    this.errorMessage.set('');
    this.onCancel.emit();
  }
}
