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
import { PatientLoginComponent } from './features/patient-portal/login/patient-login.component';
import { PatientPortalShellComponent } from './features/patient-portal/shell/patient-portal-shell.component';
import { PatientReferralListComponent } from './features/patient-portal/patient-referral-list.component';
import { PatientReferralViewComponent } from './features/patient-portal/patient-referral-view.component';
import { PatientDocumentsComponent } from './features/patient-portal/documents/patient-documents.component';
import { DocumentUploadComponent } from './features/patient-portal/documents/document-upload.component';
import { QuestionnaireListComponent } from './features/patient-portal/questionnaires/questionnaire-list.component';
import { QuestionnaireFormComponent } from './features/patient-portal/questionnaires/questionnaire-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'patient-portal/login', component: PatientLoginComponent },
  {
    path: 'patient-portal',
    component: PatientPortalShellComponent,
    canActivate: [patientAuthGuard],
    children: [
      { path: '', redirectTo: 'referrals', pathMatch: 'full' },
      { path: 'referrals', component: PatientReferralListComponent },
      { path: 'referrals/:id', component: PatientReferralViewComponent },
      { path: 'documents', component: PatientDocumentsComponent },
      { path: 'documents/upload', component: DocumentUploadComponent },
      { path: 'questionnaires', component: QuestionnaireListComponent },
      { path: 'questionnaires/:id', component: QuestionnaireFormComponent },
    ],
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsListComponent },
      { path: 'patients/:id', component: PatientDetailsComponent },
      { path: 'referrals', component: ReferralTrackingComponent },
      { path: 'referrals/new', component: CreateReferralComponent },
      { path: 'documents', component: DocumentsComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
