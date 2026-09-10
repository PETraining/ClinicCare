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
import { PatientDocumentsComponent } from './features/patient-portal/documents/patient-documents.component';
import { UploadFormComponent } from './features/patient-portal/documents/upload-form.component';
import { QuestionnaireListComponent } from './features/patient-portal/questionnaires/questionnaire-list.component';
import { QuestionnaireDetailComponent } from './features/patient-portal/questionnaires/questionnaire-detail.component';
import { PatientReferralProgressComponent } from './features/patient-portal/tracking/patient-referral-progress.component';
import { NotificationInboxComponent } from './features/patient-portal/notifications/notification-inbox.component';
import { PharmacyDashboardComponent } from './features/pharmacy/pharmacy-dashboard.component';
import { PrescriptionListComponent } from './features/pharmacy/prescription-list.component';
import { PrescriptionDetailComponent } from './features/pharmacy/prescription-detail.component';
import { InventoryManagementComponent } from './features/pharmacy/inventory-management.component';

export const routes: Routes = [
  // ========== PUBLIC ROUTES ==========
  { path: 'login', component: LoginComponent },
  { path: 'patient-portal/login', component: PatientLoginComponent },

  // ========== CLINICIAN/ADMIN DASHBOARD (F1, F2, F3, F4) ==========
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // Dashboard & Navigation Hub
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },

      // Patient Management (Core) - Hierarchical structure
      {
        path: 'patients',
        children: [
          // Patients List - default route
          { path: '', component: PatientsListComponent },
          // Individual Patient Details
          { path: ':id', component: PatientDetailsComponent },
          // Referral Management (nested under patients)
          { path: 'referrals', component: ReferralTrackingComponent },
          { path: 'referrals/new', component: CreateReferralComponent },
          // Document Management (nested under patients)
          { path: 'documents', component: DocumentsComponent },
        ],
      },

      // Pharmacy Management (F4-Pharmacy-Ann) - Routes via /api/pharmacy/*
      { path: 'pharmacy/dashboard', component: PharmacyDashboardComponent },
      { path: 'pharmacy/prescriptions', component: PrescriptionListComponent },
      { path: 'pharmacy/prescriptions/:id', component: PrescriptionDetailComponent },
      { path: 'pharmacy/inventory', component: InventoryManagementComponent },

      // Lab Management (F3-DiagnosticLab) - Routes via /api/labs/*
      // { path: 'lab/dashboard', component: LabDashboardComponent },
      // { path: 'lab/orders', component: LabOrdersComponent },
      // { path: 'lab/results', component: LabResultsComponent },
    ],
  },

  // ========== PATIENT PORTAL (F5.2-Patient Portal) ==========
  // Entirely separate identity model, shell, and guard from clinician routes
  {
    path: 'patient-portal',
    component: PatientPortalShellComponent,
    canActivate: [patientAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Patient Dashboard & Appointments (F1 integration, F5 consumption)
      { path: 'dashboard', component: PatientDashboardComponent },

      // Appointments & Check-in (consumes F1 endpoints: GET /api/referrals/{id}/appointments)
      // { path: 'appointments', component: AppointmentListComponent },
      // { path: 'appointments/:id/checkin', component: CheckinComponent },

      // Referral Progress Tracking (F5.3-Patient Portal - Sub-Feature 2)
      { path: 'tracking/:referralId', component: PatientReferralProgressComponent },

      // Notification Inbox (F5.3-Patient Portal - Sub-Feature 2)
      { path: 'notifications', component: NotificationInboxComponent },

      // Documents & Forms Management (F5.3-Patient Portal)
      { path: 'documents', component: PatientDocumentsComponent },
      { path: 'documents/upload', component: UploadFormComponent },

      // Questionnaires (F5.3-Patient Portal)
      { path: 'questionnaires', component: QuestionnaireListComponent },
      { path: 'questionnaires/:id', component: QuestionnaireDetailComponent },
    ],
  },

  // ========== DEFAULT REDIRECT ==========
  { path: '**', redirectTo: 'login' },
];
