import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config';
import { PatientAuthService } from '../../../core/services/patient-auth.service';

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

interface Doctor {
  DoctorId: number;
  Name: string;
  Specialty: string;
}

@Component({
  selector: 'app-patient-referral-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-referral-tracking.component.html',
  styleUrl: './patient-referral-tracking.component.css',
})
export class PatientReferralTrackingComponent implements OnInit {
  private http = inject(HttpClient);
  private patientAuth = inject(PatientAuthService);

  referrals: Referral[] = [];
  doctors: Map<number, Doctor> = new Map();
  loading = true;
  error = '';

  statusColors = {
    Draft: '#ffc107',
    Submitted: '#2196f3',
    Accepted: '#4caf50',
    Completed: '#8bc34a',
    Rejected: '#f44336',
  };

  ngOnInit(): void {
    const patientId = this.patientAuth.currentPatient()?.patientId;
    if (!patientId) return;

    // Load referrals and doctors in parallel
    this.http
      .get<Referral[]>(`${API_BASE_URL}/referrals`, {
        params: { patientId: patientId.toString() },
      })
      .subscribe({
        next: (refs) => {
          this.referrals = refs;
          this.loadDoctors();
        },
        error: (err) => {
          this.error = 'Failed to load referrals';
          this.loading = false;
        },
      });
  }

  private loadDoctors(): void {
    this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`).subscribe({
      next: (doctors) => {
        doctors.forEach((d) => this.doctors.set(d.DoctorId, d));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load doctor information';
        this.loading = false;
      },
    });
  }

  getSpecialistName(specialistId: number): string {
    const doc = this.doctors.get(specialistId);
    return doc ? `Dr. ${doc.Name} (${doc.Specialty})` : `Specialist #${specialistId}`;
  }

  getStatusColor(status: string): string {
    return this.statusColors[status as keyof typeof this.statusColors] || '#999';
  }

  getProgressPercentage(status: string): number {
    const statuses = ['Draft', 'Submitted', 'Accepted', 'Completed'];
    const index = statuses.indexOf(status);
    return index >= 0 ? ((index + 1) / statuses.length) * 100 : 0;
  }
}
