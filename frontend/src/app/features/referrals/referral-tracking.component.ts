import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { ReferralService } from '../../core/services/referral.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { Referral, ReferralStatus } from '../../core/models/referral.model';
import { AppointmentListComponent } from '../appointments/appointment-list.component';
import { ScheduleAppointmentComponent } from '../appointments/schedule-appointment.component';

const STATUS_FILTERS: (ReferralStatus | 'All')[] = ['All', 'Draft', 'Submitted', 'Accepted', 'Rejected', 'Completed'];

@Component({
  selector: 'app-referral-tracking',
  standalone: true,
  imports: [RouterLink, AppointmentListComponent, ScheduleAppointmentComponent],
  templateUrl: './referral-tracking.component.html',
  styleUrl: './referral-tracking.component.css',
})
export class ReferralTrackingComponent implements OnInit {
  referralService = inject(ReferralService);
  appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  statusFilters = STATUS_FILTERS;
  activeFilter = signal<ReferralStatus | 'All'>('All');
  actionError = signal<string | null>(null);
  showScheduleForm = signal<number | null>(null);

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
    const all = this.referralService.referrals();
    return filter === 'All' ? all : all.filter((r: Referral) => r.Status === filter);
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

  private runAction(action: (id: number) => ReturnType<ReferralService['submit']>, referral: Referral): void {
    this.actionError.set(null);
    action.call(this.referralService, referral.ReferralId).subscribe({
      error: (err: any) => this.actionError.set(err?.error?.detail ?? 'Action failed.'),
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

  openScheduleForm(referral: Referral): void {
    this.showScheduleForm.set(referral.ReferralId);
    this.appointmentService.listByReferral(referral.ReferralId);
  }

  onAppointmentSuccess(referralId: number): void {
    this.showScheduleForm.set(null);
    this.appointmentService.listByReferral(referralId);
  }

  onAppointmentCancel(): void {
    this.showScheduleForm.set(null);
  }
}
