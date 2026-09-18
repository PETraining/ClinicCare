import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

interface Referral {
  Id: number;
  PatientId: number;
  SpecialistId: number;
  Status: string;
  PriorityLevel: string;
  CreatedDate: string;
  UpdatedDate: string;
  Notes: string;
}

interface Doctor {
  Id: number;
  Name: string;
  Specialization: string;
}

@Component({
  selector: 'app-patient-referral-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-referral-tracking.component.html',
  styleUrl: './patient-referral-tracking.component.css'
})
export class PatientReferralTrackingComponent implements OnInit {
  referrals: Referral[] = [];
  doctors: Map<number, Doctor> = new Map();
  loading = signal(false);
  error = signal('');

  private statusColors: { [key: string]: string } = {
    'Draft': '#FFC107',
    'Submitted': '#2196F3',
    'Approved': '#4CAF50',
    'Denied': '#F44336',
    'Completed': '#4CAF50'
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const patientId = this.route.snapshot.params['patientId'];
    if (patientId) {
      this.loading.set(true);
      this.http.get<Referral[]>(`/api/referrals`, {
        params: { patientId: patientId.toString() }
      }).subscribe({
        next: (refs) => {
          this.referrals = refs;
          this.loadDoctors();
        },
        error: (err) => {
          this.error.set('Failed to load referrals');
          this.loading.set(false);
        }
      });
    }
  }

  private loadDoctors(): void {
    this.http.get<Doctor[]>(`/api/doctors`).subscribe({
      next: (doctors) => {
        doctors.forEach(d => this.doctors.set(d.Id, d));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getSpecialistName(specialistId: number): string {
    return this.doctors.get(specialistId)?.Name || 'Unknown Specialist';
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || '#999';
  }

  getProgressPercentage(status: string): number {
    const progressMap: { [key: string]: number } = {
      'Draft': 25,
      'Submitted': 50,
      'Approved': 75,
      'Completed': 100,
      'Denied': 0
    };
    return progressMap[status] || 0;
  }
}
