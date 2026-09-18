import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Referral {
  ReferralId: number;
  PatientId: number;
  ReferringDoctorId: number;
  SpecialistId: number;
  Status: string;
  AuthorizationStatus?: string;
  CreatedDate: string;
}

interface Patient {
  Id: number;
  Name: string;
}

interface Doctor {
  Id: number;
  Name: string;
}

@Component({
  selector: 'app-referral-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './referral-tracking.component.html',
  styleUrl: './referral-tracking.component.css'
})
export class ReferralTrackingComponent implements OnInit {
  referrals = signal<Referral[]>([]);
  patients: Map<number, Patient> = new Map();
  doctors: Map<number, Doctor> = new Map();
  
  activeFilter = signal<string>('All');
  activeAuthFilter = signal<string>('All');
  
  statusFilters = ['All', 'Draft', 'Submitted', 'Approved', 'Denied', 'Completed'];
  authStatusFilters = ['All', 'Pending', 'Approved', 'Denied'];
  
  filteredReferrals = computed(() => {
    const refs = this.referrals();
    const statusFilter = this.activeFilter();
    const authFilter = this.activeAuthFilter();
    
    return refs.filter(r => {
      const statusMatch = statusFilter === 'All' || r.Status === statusFilter;
      const authMatch = authFilter === 'All' || r.AuthorizationStatus === authFilter;
      return statusMatch && authMatch;
    });
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReferrals();
    this.loadPatients();
    this.loadDoctors();
  }

  private loadReferrals(): void {
    this.http.get<Referral[]>('/api/referrals').subscribe(
      referrals => this.referrals.set(referrals),
      error => console.error('Failed to load referrals:', error)
    );
  }

  private loadPatients(): void {
    this.http.get<Patient[]>('/api/patients').subscribe(
      patients => patients.forEach(p => this.patients.set(p.Id, p)),
      error => console.error('Failed to load patients:', error)
    );
  }

  private loadDoctors(): void {
    this.http.get<Doctor[]>('/api/doctors').subscribe(
      doctors => doctors.forEach(d => this.doctors.set(d.Id, d)),
      error => console.error('Failed to load doctors:', error)
    );
  }

  setFilter(status: string): void {
    this.activeFilter.set(status);
  }

  setAuthFilter(status: string): void {
    this.activeAuthFilter.set(status);
  }

  patientName(id: number): string {
    return this.patients.get(id)?.Name || 'Unknown Patient';
  }

  doctorName(id: number): string {
    return this.doctors.get(id)?.Name || 'Unknown Doctor';
  }

  submit(referral: Referral): void {
    this.http.patch(`/api/referrals/${referral.ReferralId}`, {
      Status: 'Submitted'
    }).subscribe(
      () => this.loadReferrals(),
      error => console.error('Failed to submit referral:', error)
    );
  }

  accept(referral: Referral): void {
    this.http.patch(`/api/referrals/${referral.ReferralId}`, {
      Status: 'Approved'
    }).subscribe(
      () => this.loadReferrals(),
      error => console.error('Failed to approve referral:', error)
    );
  }

  reject(referral: Referral): void {
    this.http.patch(`/api/referrals/${referral.ReferralId}`, {
      Status: 'Denied'
    }).subscribe(
      () => this.loadReferrals(),
      error => console.error('Failed to reject referral:', error)
    );
  }

  canSubmit(referral: Referral): boolean {
    return referral.Status === 'Draft';
  }

  isSpecialist(referral: Referral): boolean {
    return referral.SpecialistId > 0;
  }

  canAccept(referral: Referral): boolean {
    return referral.Status === 'Submitted' && this.isSpecialist(referral);
  }
}
