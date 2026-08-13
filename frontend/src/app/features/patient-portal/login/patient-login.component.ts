import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PatientAuthService } from '../../../core/services/patient-auth.service';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-login',
  standalone: true,
  templateUrl: './patient-login.component.html',
  styleUrl: './patient-login.component.css',
})
export class PatientLoginComponent implements OnInit {
  patientService = inject(PatientService);
  private patientAuth = inject(PatientAuthService);
  private router = inject(Router);

  selectedPatientId = signal<number | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.patientService.search();
  }

  onSelect(value: string): void {
    this.selectedPatientId.set(value ? Number(value) : null);
  }

  login(): void {
    const patientId = this.selectedPatientId();
    if (patientId === null) {
      this.error.set('Please choose who you are.');
      return;
    }
    this.error.set(null);
    this.patientAuth.login(patientId).subscribe({
      next: () => this.router.navigateByUrl('/patient-portal/dashboard'),
      error: () => this.error.set('Could not load that patient record. Please try again.'),
    });
  }
}
