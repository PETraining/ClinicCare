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
  // Clinician routes
  { path: 'login', component: LoginComponent },
  {
    path: 'shell',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsListComponent },
      { path: 'patients/:id', component: PatientDetailsComponent },
      { path: 'referrals/create', component: CreateReferralComponent },
      { path: 'referrals/tracking', component: ReferralTrackingComponent },
      { path: 'documents', component: DocumentsComponent },
    ],
  },

  // Patient-facing portal: entirely separate identity model, shell, and
  // guard from the clinician routes above.
  { path: 'patient-portal/login', component: PatientLoginComponent },
  {
    path: 'patient-portal',
    component: PatientPortalShellComponent,
    canActivate: [patientAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PatientDashboardComponent },
      { path: 'documents', loadComponent: () => import('./features/patient-portal/documents/patient-documents.component').then(m => m.PatientDocumentsComponent) },
      { path: 'tracking', loadComponent: () => import('./features/patient-portal/referrals/patient-referral-tracking.component').then(m => m.PatientReferralTrackingComponent) },
      { path: 'tracking/:referralId', loadComponent: () => import('./features/patient-portal/referrals/patient-referral-tracking.component').then(m => m.PatientReferralTrackingComponent) },
      { path: 'questionnaires', loadComponent: () => import('./features/patient-portal/questionnaires/patient-questionnaires.component').then(m => m.PatientQuestionnairesComponent) },
      { path: 'notifications', loadComponent: () => import('./features/patient-portal/notifications/patient-notifications.component').then(m => m.PatientNotificationsComponent) },
    ],
  },

  { path: '**', redirectTo: 'patient-portal/login' },
];
