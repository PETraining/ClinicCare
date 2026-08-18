import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment, AppointmentCreate } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { extractErrorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
                    <button (click)="openReschedule(apt)" class="btn-small" [disabled]="completing() || cancelling()">Reschedule</button>
                    <button (click)="onComplete(apt.AppointmentId)" class="btn-small" [disabled]="completing() || cancelling()">
                      {{ completing() ? 'Completing...' : 'Mark Complete' }}
                    </button>
                    <button (click)="onCancel(apt.AppointmentId)" class="btn-small btn-danger" [disabled]="completing() || cancelling()">
                      {{ cancelling() ? 'Cancelling...' : 'Cancel' }}
                    </button>
                  }
                  @if (completeError()) {
                    <div class="error-msg">{{ completeError() }}</div>
                  }
                  @if (cancelError()) {
                    <div class="error-msg">{{ cancelError() }}</div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (reschedulingId() !== null) {
        <div class="reschedule-modal">
          <div class="modal-overlay" (click)="cancelReschedule()"></div>
          <div class="modal-content">
            <h4>Reschedule Appointment</h4>
            <form (ngSubmit)="submitReschedule()" #f="ngForm">
              <div class="form-group">
                <label>Date & Time *</label>
                <input type="datetime-local" name="date" [(ngModel)]="rescheduleForm.ScheduledDate" required>
              </div>
              <div class="form-group">
                <label>Location *</label>
                <input type="text" name="location" [(ngModel)]="rescheduleForm.Location" placeholder="e.g., Dr. Smith's Office" required>
              </div>
              @if (rescheduleError()) {
                <p class="error">{{ rescheduleError() }}</p>
              }
              <div class="modal-actions">
                <button type="submit" [disabled]="!f.valid || rescheduling()" class="btn-primary">
                  {{ rescheduling() ? 'Updating...' : 'Update Appointment' }}
                </button>
                <button type="button" (click)="cancelReschedule()" class="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
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
    .status.no { background-color: #fff3e0; color: #f57c00; }
    .actions { white-space: nowrap; }
    .btn-small { padding: 6px 12px; margin-right: 5px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background-color: #f5f5f5; }
    .btn-small:hover { background-color: #e0e0e0; }
    .btn-danger { background-color: #d32f2f; color: white; border: none; }
    .btn-danger:hover { background-color: #c62828; }
    .btn-small:disabled { opacity: 0.6; cursor: not-allowed; }
    .empty { color: #999; font-style: italic; }
    .error-msg { color: #d32f2f; font-size: 0.85em; margin-top: 5px; }
    .reschedule-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; }
    .modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
    .modal-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .modal-content h4 { margin-top: 0; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
    .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 1em; }
    .error { color: #d32f2f; margin: 10px 0; font-weight: bold; }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
    .btn-primary, .btn-secondary { flex: 1; padding: 10px; cursor: pointer; border: none; border-radius: 4px; font-size: 1em; }
    .btn-primary { background-color: #1976d2; color: white; }
    .btn-primary:hover:not(:disabled) { background-color: #1565c0; }
    .btn-primary:disabled { background-color: #bdbdbd; cursor: not-allowed; }
    .btn-secondary { background-color: #ccc; color: #333; }
    .btn-secondary:hover { background-color: #aaa; }
  `]
})
export class AppointmentListComponent {
  @Input() set referralId(id: number) {
    if (id) this.appointmentService.listByReferral(id);
  }

  appointmentService = inject(AppointmentService);
  appointments = computed(() => this.appointmentService.appointments());

  reschedulingId = signal<number | null>(null);
  rescheduling = signal(false);
  rescheduleError = signal('');
  rescheduleForm: AppointmentCreate = { ScheduledDate: new Date(), Location: '', SpecialistId: 0 };

  completeError = signal('');
  cancelError = signal('');
  completing = signal(false);
  cancelling = signal(false);

  openReschedule(apt: Appointment): void {
    this.reschedulingId.set(apt.AppointmentId);
    this.rescheduleForm = {
      ScheduledDate: new Date(apt.ScheduledDate),
      Location: apt.Location,
      SpecialistId: apt.SpecialistId
    };
    this.rescheduleError.set('');
  }

  submitReschedule(): void {
    const id = this.reschedulingId();
    if (!id) return;

    this.rescheduling.set(true);
    this.appointmentService.reschedule(id, this.rescheduleForm).subscribe({
      next: () => {
        this.rescheduling.set(false);
        this.rescheduleError.set('');
        this.reschedulingId.set(null);
      },
      error: (err) => {
        this.rescheduleError.set(extractErrorMessage(err, 'Failed to reschedule appointment'));
        this.rescheduling.set(false);
      }
    });
  }

  cancelReschedule(): void {
    this.reschedulingId.set(null);
    this.rescheduleError.set('');
  }

  onComplete(appointmentId: number): void {
    this.completing.set(true);
    this.completeError.set('');
    this.appointmentService.complete(appointmentId).subscribe({
      next: () => {
        this.completing.set(false);
        this.completeError.set('');
      },
      error: (err) => {
        this.completeError.set(extractErrorMessage(err, 'Failed to complete appointment'));
        this.completing.set(false);
      }
    });
  }

  onCancel(appointmentId: number): void {
    this.cancelling.set(true);
    this.cancelError.set('');
    this.appointmentService.cancel(appointmentId).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.cancelError.set('');
      },
      error: (err) => {
        this.cancelError.set(extractErrorMessage(err, 'Failed to cancel appointment'));
        this.cancelling.set(false);
      }
    });
  }
}
