import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ReferralService } from '../../core/services/referral.service';
import { PatientAuthService } from '../../core/services/patient-auth.service';
import { Referral } from '../../core/models/referral.model';

@Component({
  selector: 'app-patient-referral-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="patient-portal-container">
      <header class="patient-header">
        <h1>My Referrals</h1>
        <p>Track all your specialist referrals and manage appointments</p>
      </header>

      @if (loading()) {
        <div class="loading">Loading your referrals...</div>
      } @else if (referrals().length === 0) {
        <div class="empty-state">
          <p>You have no referrals at this time.</p>
          <p>Contact your doctor if you expect a referral.</p>
        </div>
      } @else {
        <div class="referral-grid">
          @for (referral of referrals(); track referral.ReferralId) {
            <div class="referral-card">
              <div class="card-header">
                <h3>{{ specialtyFromId(referral.SpecialistId) }}</h3>
                <span [class]="'status-badge status-' + referral.Status.toLowerCase()">
                  {{ referral.Status }}
                </span>
              </div>

              <div class="card-body">
                <p class="reason">{{ referral.Reason }}</p>

                <div class="details">
                  <div class="detail-row">
                    <span class="label">Priority:</span>
                    <span [class]="'priority-' + referral.Priority.toLowerCase()">
                      {{ referral.Priority }}
                    </span>
                  </div>

                  <div class="detail-row">
                    <span class="label">Created:</span>
                    <span>{{ referral.CreatedAt | date: 'short' }}</span>
                  </div>

                  <div class="detail-row">
                    <span class="label">Updated:</span>
                    <span>{{ referral.UpdatedAt | date: 'short' }}</span>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <a [routerLink]="['/patient-portal/referrals', referral.ReferralId]" class="btn-primary">
                  View Details
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .patient-portal-container {
        max-width: 1200px;
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

      .patient-header p {
        color: #666;
        font-size: 16px;
      }

      .loading,
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        background: #f9f9f9;
        border-radius: 8px;
        color: #666;
      }

      .referral-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
      }

      .referral-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .referral-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      .card-header {
        background: #f5f5f5;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-header h3 {
        margin: 0;
        font-size: 16px;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
      }

      .status-draft {
        background: #e0e0e0;
        color: #333;
      }

      .status-submitted {
        background: #bbdefb;
        color: #1565c0;
      }

      .status-accepted {
        background: #c8e6c9;
        color: #2e7d32;
      }

      .status-rejected {
        background: #ffcdd2;
        color: #c62828;
      }

      .status-completed {
        background: #fff9c4;
        color: #f57f17;
      }

      .card-body {
        padding: 15px;
      }

      .reason {
        margin: 0 0 15px 0;
        color: #333;
        font-weight: 500;
      }

      .details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        color: #666;
      }

      .label {
        font-weight: 500;
      }

      .priority-routine {
        color: #666;
      }

      .priority-urgent {
        color: #ff9800;
        font-weight: bold;
      }

      .priority-emergent {
        color: #f44336;
        font-weight: bold;
      }

      .card-footer {
        padding: 15px;
        background: #fafafa;
        border-top: 1px solid #eee;
      }

      .btn-primary {
        display: inline-block;
        background: #2196f3;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: #1976d2;
      }

      @media (max-width: 768px) {
        .referral-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PatientReferralListComponent implements OnInit {
  private referralService = inject(ReferralService);
  private patientAuth = inject(PatientAuthService);

  referrals = signal<Referral[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadReferrals();
  }

  private loadReferrals(): void {
    const patientId = this.patientAuth.currentPatientId();
    if (patientId) {
      this.referralService.loadByPatient(patientId);
      setTimeout(() => {
        this.referrals.set(this.referralService.referrals());
        this.loading.set(false);
      }, 500);
    } else {
      this.loading.set(false);
    }
  }

  specialtyFromId(doctorId: number): string {
    // In real app, would fetch from doctor service
    const specialties: Record<number, string> = {
      2: 'Cardiology',
      3: 'Orthopedics',
      4: 'Neurology',
      5: 'Dermatology',
    };
    return specialties[doctorId] || `Specialist #${doctorId}`;
  }
}
