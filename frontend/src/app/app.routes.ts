import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { patientAuthGuard } from './core/guards/patient-auth.guard';
import { ShellComponent } from './shell/shell.component';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PatientsListComponent } from './features/patients/patients-list.component';
import { PatientDetailsComponent } from './features/patients/patient-details.component';
import { CreateReferralComponent } from './features/referrals/create-referral.component';
import { ReferralTrackingComponent } from './features/referrals/referral-tracking.component';
import { DocumentsComponent } from './features/documents/documents.component';
import { PatientPortalShellComponent } from './features/patient-portal/shell/patient-portal-shell.component';
import { PatientLoginComponent } from './features/patient-portal/login/patient-login.component';
import { PatientDashboardComponent } from './features/patient-portal/dashboard/patient-dashboard.component';

export const routes: Routes = [
  
  // Patient-facing portal: entirely separate identity model, shell, and
  // guard from the clinician routes above (see teamupdates/features/patient-portal).
  { path: 'patient-portal/login', component: PatientLoginComponent },
  {
    path: 'patient-portal',
    component: PatientPortalShellComponent,
    canActivate: [patientAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PatientDashboardComponent },
      { path: 'documents', loadComponent: () => import('./features/patient-portal/documents/patient-documents.component').then(m => m.PatientDocumentsComponent) },
      { path: 'referrals', loadComponent: () => import('./features/patient-portal/referrals/patient-referral-tracking.component').then(m => m.PatientReferralTrackingComponent) },
      { path: 'appointments', loadComponent: () => import('./features/patient-portal/appointments/patient-appointments.component').then(m => m.PatientAppointmentsComponent) },
      { path: 'questionnaires', loadComponent: () => import('./features/patient-portal/questionnaires/patient-questionnaires.component').then(m => m.PatientQuestionnairesComponent) },
    ],
  },
  { path: '**', redirectTo: 'patient-portal/login' },
];
