import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { Referral } from '../../core/models/referral.model';
import { PatientAuthService } from '../../core/services/patient-auth.service';
import { ReferralService } from '../../core/services/referral.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ReferralValidationService } from '../../core/services/referral-validation.service';
import { PatientReferralScreenData } from '../../core/services/referral-validation.service';

@Component({
  selector: 'app-patient-referral-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="patient-portal-container">
      <header class="patient-header">
        <h1>My Referral Status</h1>
        <p>Track your specialist referral and prepare for your appointment</p>
      </header>

      @if (referral() && !loading()) {
        <div class="referral-card">
          <!-- Referral Status -->
          <div class="status-section">
            <h2>{{ getStatusLabel(referral()!.Status) }}</h2>
            <p class="status-description">{{ getStatusDescription(referral()!.Status) }}</p>
          </div>

          <!-- Specialist Info -->
          <div class="specialist-section">
            <h3>Your Specialist</h3>
            <p>{{ specialistName() || 'Specialist to be assigned' }}</p>
          </div>

          <!-- Appointment Info -->
          <div class="appointment-section">
            @if (appointment()) {
              <h3>Appointment Scheduled</h3>
              <p>{{ appointment()!.ScheduledDate | date: 'fullDate' }}</p>
              <p class="location">📍 {{ appointment()!.Location }}</p>
              <p class="status">Status: <strong>{{ appointment()!.Status }}</strong></p>
            } @else {
              <h3>Appointment</h3>
              <p class="no-appointment">Appointment being scheduled. Check back soon.</p>
            }
          </div>

          <!-- Documents Section -->
          <div class="documents-section">
            <h3>Documents to Upload</h3>
            @if (requiredDocuments().length > 0) {
              <ul class="document-list">
                @for (doc of requiredDocuments(); track doc) {
                  <li [class.uploaded]="isDocumentUploaded(doc)">
                    {{ doc }}
                    @if (isDocumentUploaded(doc)) {
                      <span class="badge">✓ Uploaded</span>
                    }
                  </li>
                }
              </ul>
            } @else {
              <p>No documents required for this referral</p>
            }
          </div>

          <!-- Questionnaire Section -->
          <div class="questionnaire-section">
            <h3>Pre-Visit Questionnaire</h3>
            @if (!questionnaireCompleted()) {
              <button class="btn-secondary" (click)="startQuestionnaire()">
                Start Questionnaire
              </button>
            } @else {
              <p class="success">✓ Questionnaire completed</p>
            }
          </div>

          <!-- Validation Results -->
          @if (validationResult()) {
            <div class="validation-section">
              <div [class]="'validation-' + (validationResult()!.isValid ? 'success' : 'warning')">
                <h4>Validation Status</h4>
                <p>{{ validationResult()!.summary }}</p>

                @if (validationResult()!.warnings.length > 0) {
                  <div class="warnings">
                    <h5>Recommendations:</h5>
                    <ul>
                      @for (warning of validationResult()!.warnings; track warning.field) {
                        <li>{{ warning.message }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else if (loading()) {
        <p>Loading referral information...</p>
      } @else {
        <p class="error">Referral not found</p>
      }
    </div>
  `,
  styles: [
    `
      .patient-portal-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .patient-header {
        margin-bottom: 30px;
        text-align: center;
      }

      .patient-header h1 {
        font-size: 28px;
        margin-bottom: 10px;
      }

      .referral-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
      }

      .status-section {
        border-bottom: 2px solid #f0f0f0;
        margin-bottom: 20px;
        padding-bottom: 20px;
      }

      .status-description {
        color: #666;
        font-size: 14px;
      }

      .specialist-section,
      .appointment-section,
      .documents-section,
      .questionnaire-section {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f0f0f0;
      }

      .specialist-section h3,
      .appointment-section h3,
      .documents-section h3,
      .questionnaire-section h3 {
        font-size: 16px;
        margin-bottom: 10px;
      }

      .no-appointment {
        color: #ff9800;
        font-style: italic;
      }

      .location {
        color: #666;
        font-size: 14px;
        margin: 5px 0;
      }

      .status {
        color: #666;
        font-size: 14px;
        margin: 5px 0;
      }

      .document-list {
        list-style: none;
        padding: 0;
      }

      .document-list li {
        padding: 8px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .document-list li.uploaded {
        color: #4caf50;
      }

      .badge {
        background: #4caf50;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
      }

      .btn-secondary {
        background: #2196f3;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-secondary:hover {
        background: #1976d2;
      }

      .success {
        color: #4caf50;
        font-weight: bold;
      }

      .validation-section {
        margin-top: 20px;
      }

      .validation-success,
      .validation-warning {
        padding: 15px;
        border-radius: 4px;
        border-left: 4px solid;
      }

      .validation-success {
        background: #e8f5e9;
        border-color: #4caf50;
      }

      .validation-warning {
        background: #fff3e0;
        border-color: #ff9800;
      }

      .warnings {
        margin-top: 10px;
      }

      .warnings ul {
        list-style: none;
        padding-left: 0;
      }

      .warnings li {
        padding: 5px 0;
        font-size: 14px;
      }

      .error {
        color: #f44336;
        text-align: center;
        padding: 20px;
      }
    `,
  ],
})
export class PatientReferralViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientAuth = inject(PatientAuthService);
  private referralService = inject(ReferralService);
  private appointmentService = inject(AppointmentService);
  private validationService = inject(ReferralValidationService);

  private referralId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
  );

  referral = signal<Referral | null>(null);
  loading = signal(true);
  validationResult = signal<any>(null);

  appointment = computed(() => {
    return this.appointmentService
      .appointments()
      .find((a) => a.ReferralId === this.referral()?.ReferralId);
  });

  specialistName = signal<string | null>(null);
  requiredDocuments = signal<string[]>([
    'Insurance Card',
    'Photo ID',
    'Medical History Form',
  ]);
  questionnaireCompleted = signal(false);

  ngOnInit(): void {
    const id = this.referralId();
    if (id) {
      this.loadReferral(id);
    } else {
      this.loading.set(false);
    }
  }

  private loadReferral(id: number): void {
    const patientId = this.patientAuth.currentPatientId();
    if (patientId) {
      this.referralService.loadByPatient(patientId);
      this.appointmentService.loadMyAppointments();
    }
    setTimeout(() => {
      const ref = this.referralService.referrals().find((r) => r.ReferralId === id);
      if (ref) {
        this.referral.set(ref);
        this.validateReferral(ref);
      }
      this.loading.set(false);
    }, 500);
  }

  private validateReferral(referral: Referral): void {
    const appt = this.appointment();
    const screenData: PatientReferralScreenData = {
      referral,
      patientId: this.patientAuth.currentPatientId() || 0,
      documentsUploaded: false,
      questionnairesCompleted: this.questionnaireCompleted(),
      appointmentScheduled: !!appt,
      appointmentDate: appt?.ScheduledDate,
      allRequiredDocuments: this.requiredDocuments(),
      uploadedDocuments: [],
    };

    const result = this.validationService.validatePatientComplete(screenData);
    this.validationResult.set(result);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Draft: '📝 Draft',
      Submitted: '📤 Submitted',
      Accepted: '✓ Accepted',
      Rejected: '✗ Rejected',
      Completed: '✓ Completed',
    };
    return labels[status] || status;
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      Draft: 'Your referral is being prepared',
      Submitted: 'Your referral has been sent to the specialist',
      Accepted: 'The specialist has accepted your referral. Prepare for your appointment.',
      Rejected: 'The specialist was unable to accept your referral. Contact your doctor.',
      Completed: 'Your appointment has been completed',
    };
    return descriptions[status] || '';
  }

  isDocumentUploaded(docName: string): boolean {
    // In real app, would check against actual uploaded documents
    return false;
  }

  startQuestionnaire(): void {
    this.router.navigate(['/patient-portal/questionnaires']);
  }
}
