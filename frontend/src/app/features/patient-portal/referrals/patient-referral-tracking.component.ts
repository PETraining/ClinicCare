import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

interface Referral {
  ReferralId: number;
  PatientId: number;
  ReferringDoctorId: number;
  SpecialistId: number;
  Reason: string;
  Priority: string;
  Status: string;
  CreatedAt: string;
  UpdatedAt: string;
}

@Component({
  selector: 'app-patient-referral-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="referral-tracking-container">
      <h2>Referral Tracking</h2>
      
      <div *ngIf="error()" class="error-message">
        {{ error() }}
      </div>
      
      <div *ngIf="referrals().length === 0 && !error()" class="no-data">
        No referrals found
      </div>
      
      <div *ngFor="let referral of referrals()" class="referral-card">
        <div class="referral-header">
          <h3>Referral #{{ referral.ReferralId }}</h3>
          <span class="status" [ngClass]="'status-' + referral.Status.toLowerCase()">
            {{ referral.Status }}
          </span>
        </div>
        <div class="referral-details">
          <p><strong>Reason:</strong> {{ referral.Reason }}</p>
          <p><strong>Priority:</strong> <span class="priority" [ngClass]="'priority-' + referral.Priority.toLowerCase()">{{ referral.Priority }}</span></p>
          <p><strong>Created:</strong> {{ referral.CreatedAt | date: 'short' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: ['.referral-tracking-container { padding: 20px; } .error-message { background: #ffebee; color: #c62828; padding: 12px; border-radius: 4px; margin-bottom: 16px; } .no-data { padding: 20px; text-align: center; background: #f5f5f5; border-radius: 4px; } .referral-card { border: 1px solid #ddd; border-radius: 4px; padding: 16px; margin-bottom: 12px; background: white; } .referral-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; } .referral-header h3 { margin: 0; } .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; } .status-draft { background: #e0e0e0; color: #424242; } .status-submitted { background: #fff3e0; color: #e65100; } .status-accepted { background: #e8f5e9; color: #2e7d32; } .status-completed { background: #e1f5fe; color: #01579b; } .status-rejected { background: #ffebee; color: #c62828; } .priority { font-weight: 500; } .priority-urgent { color: #d32f2f; } .priority-routine { color: #1976d2; }']
})
export class PatientReferralTrackingComponent implements OnInit {
  referrals = signal<Referral[]>([]);
  error = signal<string>('');
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.loadReferrals();
  }
  
  private loadReferrals() {
    const sessionStr = localStorage.getItem('referraliq_patient_portal_session');
    if (!sessionStr) {
      this.error.set('Patient session not found');
      return;
    }
    
    try {
      const session = JSON.parse(sessionStr);
      const patientId = session.patientId;
      
      this.http.get<Referral[]>(`http://localhost:8000/api/referrals?patientId=${patientId}`)
        .subscribe({
          next: (response: any) => {
            const data = Array.isArray(response) ? response : (response.data || []);
            this.referrals.set(data);
            this.error.set('');
          },
          error: (err: any) => {
            console.error('Failed to load referrals', err);
            this.error.set('Failed to load referrals');
            this.referrals.set([]);
          }
        });
    } catch (err) {
      this.error.set('Invalid patient session');
    }
  }
}
