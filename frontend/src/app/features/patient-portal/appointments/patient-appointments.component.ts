import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientAuthService } from '../../../core/services/patient-auth.service';

interface Appointment {
  AppointmentId: number;
  ReferralId: number;
  PatientId: number;
  ScheduledAt: string;
  Location: string;
  CheckInInstructions: string | null;
}

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-appointments.component.html',
  styleUrl: './patient-appointments.component.css',
})
export class PatientAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private patientAuth = inject(PatientAuthService);

  appointments = this.appointmentService.appointments;
  loading = true;

  ngOnInit(): void {
    const patientId = this.patientAuth.currentPatient()?.patientId;
    if (patientId) {
      this.appointmentService.loadByPatient(patientId);
      // Simulate loading complete after service call
      setTimeout(() => (this.loading = false), 500);
    }
  }

  isUpcoming(scheduledAt: string): boolean {
    return new Date(scheduledAt) > new Date();
  }
}
