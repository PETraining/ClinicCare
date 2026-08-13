import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';

import { AppointmentService } from '../../../core/services/appointment.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { PatientAuthService } from '../../../core/services/patient-auth.service';
import { ReferralService } from '../../../core/services/referral.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css',
})
export class PatientDashboardComponent implements OnInit {
  private patientAuth = inject(PatientAuthService);
  private referralService = inject(ReferralService);
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);

  currentPatient = this.patientAuth.currentPatient;
  referrals = this.referralService.referrals;
  appointments = this.appointmentService.appointments;

  private doctorNames = computed(() => {
    const map = new Map<number, string>();
    for (const d of this.doctorService.doctors()) {
      map.set(d.DoctorId, `${d.Name} (${d.Specialty})`);
    }
    return map;
  });

  ngOnInit(): void {
    const patientId = this.currentPatient()?.patientId;
    if (patientId === undefined) {
      return;
    }
    this.referralService.loadByPatient(patientId);
    this.appointmentService.loadByPatient(patientId);
    this.doctorService.search();
  }

  specialistName(id: number): string {
    return this.doctorNames().get(id) ?? `Doctor #${id}`;
  }

  referralReason(referralId: number): string {
    const referral = this.referrals().find((r) => r.ReferralId === referralId);
    return referral ? referral.Reason : `Referral #${referralId}`;
  }
}
