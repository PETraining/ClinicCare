import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { PatientAuthService } from '../../../core/services/patient-auth.service';

interface DemoPatient {
  id: number;
  name: string;
}

const DEMO_PATIENTS: DemoPatient[] = [
  { id: 1, name: 'Anjali Verma' },
  { id: 2, name: 'Rajesh Kumar' },
  { id: 3, name: 'Divya Menon' },
  { id: 4, name: 'Suresh Iyengar' },
  { id: 5, name: 'Neha Bhatt' },
];

@Component({
  selector: 'app-patient-login',
  standalone: true,
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>ClinicCare Patient Portal</h1>
        <p class="subtitle">Select your patient record to continue</p>
        <div class="patient-list">
          @for (patient of patients; track patient.id) {
            <button type="button" class="patient-btn" (click)="select(patient)">
              <span class="patient-name">{{ patient.name }}</span>
              <span class="patient-id">Patient #{{ patient.id }}</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e3f2fd;
    }
    .login-card {
      background: white;
      border-radius: 8px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      text-align: center;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 8px;
      color: #1565c0;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      margin: 0 0 28px;
    }
    .patient-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .patient-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      width: 100%;
      transition: background 0.15s, border-color 0.15s;
    }
    .patient-btn:hover {
      background: #e3f2fd;
      border-color: #1565c0;
    }
    .patient-name {
      font-weight: 500;
      color: #333;
      font-size: 15px;
    }
    .patient-id {
      color: #888;
      font-size: 13px;
    }
  `],
})
export class PatientLoginComponent {
  protected patients = DEMO_PATIENTS;
  private auth = inject(PatientAuthService);
  private router = inject(Router);

  select(patient: DemoPatient): void {
    this.auth.demoLogin(patient.id, patient.name);
    this.router.navigate(['/patient-portal']);
  }
}
