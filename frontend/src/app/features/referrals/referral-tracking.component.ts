import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { ReferralService } from '../../core/services/referral.service';
import { AuthorizationStatus, Referral, ReferralStatus } from '../../core/models/referral.model';

const STATUS_FILTERS: (ReferralStatus | 'All')[] = ['All', 'Draft', 'Submitted', 'Accepted', 'Rejected', 'Completed'];
const AUTH_STATUS_FILTERS: (AuthorizationStatus | 'All' | 'None')[] = [
  'All',
  'None',
  'Not Required',
  'Pending',
  'Approved',
  'Denied',
];

@Component({
  selector: 'app-referral-tracking',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './referral-tracking.component.html',
  styleUrl: './referral-tracking.component.css',
})
export class ReferralTrackingComponent implements OnInit {
  referralService = inject(ReferralService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  statusFilters = STATUS_FILTERS;
  activeFilter = signal<ReferralStatus | 'All'>('All');
  authStatusFilters = AUTH_STATUS_FILTERS;
  activeAuthFilter = signal<AuthorizationStatus | 'All' | 'None'>('All');
  actionError = signal<string | null>(null);

  private patientNames = computed(() => {
    const map = new Map<number, string>();
    for (const p of this.patientService.patients()) {
      map.set(p.PatientId, p.Name);
    }
    return map;
  });

  private doctorNames = computed(() => {
    const map = new Map<number, string>();
    for (const d of this.doctorService.doctors()) {
      map.set(d.DoctorId, `${d.Name} (${d.Specialty})`);
    }
    return map;
  });

  filteredReferrals = computed(() => {
    const filter = this.activeFilter();
    const authFilter = this.activeAuthFilter();
    let list = this.referralService.referrals();
    if (filter !== 'All') {
      list = list.filter((r) => r.Status === filter);
    }
    if (authFilter !== 'All') {
      list = list.filter((r) =>
        authFilter === 'None' ? !r.authorization : r.authorization?.Status === authFilter,
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.referralService.loadAll();
    this.patientService.search();
    this.doctorService.search();
  }

  patientName(id: number): string {
    return this.patientNames().get(id) ?? `Patient #${id}`;
  }

  doctorName(id: number): string {
    return this.doctorNames().get(id) ?? `Doctor #${id}`;
  }

  setFilter(status: ReferralStatus | 'All'): void {
    this.activeFilter.set(status);
  }

  setAuthFilter(status: AuthorizationStatus | 'All' | 'None'): void {
    this.activeAuthFilter.set(status);
  }

  canSubmit(referral: Referral): boolean {
    return referral.Status === 'Draft' && referral.authorization?.Status !== 'Denied';
  }

  canAccept(referral: Referral): boolean {
    const authStatus = referral.authorization?.Status;
    return authStatus !== 'Pending' && authStatus !== 'Denied';
  }

  requestAuthorization(referral: Referral): void {
    this.actionError.set(null);
    this.referralService.requestAuthorization(referral.ReferralId, { Status: 'Pending' }).subscribe({
      error: (err) => this.actionError.set(err?.error?.detail ?? 'Failed to request authorization.'),
    });
  }

  setAuthorizationStatus(referral: Referral, status: AuthorizationStatus): void {
    this.actionError.set(null);
    this.referralService.updateAuthorization(referral.ReferralId, { Status: status }).subscribe({
      error: (err) => this.actionError.set(err?.error?.detail ?? 'Failed to update authorization.'),
    });
  }

  private runAction(action: (id: number) => ReturnType<ReferralService['submit']>, referral: Referral): void {
    this.actionError.set(null);
    action.call(this.referralService, referral.ReferralId).subscribe({
      error: (err) => this.actionError.set(err?.error?.detail ?? 'Action failed.'),
    });
  }

  submit(referral: Referral): void {
    this.runAction(this.referralService.submit, referral);
  }

  accept(referral: Referral): void {
    this.runAction(this.referralService.accept, referral);
  }

  reject(referral: Referral): void {
    this.runAction(this.referralService.reject, referral);
  }

  complete(referral: Referral): void {
    this.runAction(this.referralService.complete, referral);
  }
}
