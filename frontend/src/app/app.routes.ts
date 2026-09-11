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
import { PharmacyDashboardComponent } from './features/pharmacy/pharmacy-dashboard.component';
import { PrescriptionListComponent } from './features/pharmacy/prescription-list.component';
import { PrescriptionDetailComponent } from './features/pharmacy/prescription-detail.component';
import { InventoryManagementComponent } from './features/pharmacy/inventory-management.component';
import { TechnicianDashboardComponent } from './features/lab-technician/technician-dashboard.component';
import { SampleTrackerComponent } from './features/lab-technician/sample-tracker.component';
import { TestProcessingComponent } from './features/lab-technician/test-processing.component';
import { LabStatsComponent } from './features/lab-technician/lab-stats.component';
import { LabOrdersListComponent } from './features/lab/lab-orders-list.component';
import { CreateLabOrderComponent } from './features/lab/create-lab-order.component';
import { LabResultsComponent } from './features/lab/lab-results.component';
import { LabTestCatalogComponent } from './features/lab/lab-test-catalog.component';
import { PatientPortalShellComponent } from './features/patient-portal/shell/patient-portal-shell.component';
import { PatientLoginComponent } from './features/patient-portal/login/patient-login.component';
import { PatientDashboardComponent } from './features/patient-portal/dashboard/patient-dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
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
      { path: 'pharmacy/dashboard', component: PharmacyDashboardComponent },
      { path: 'pharmacy/prescriptions', component: PrescriptionListComponent },
      { path: 'pharmacy/prescriptions/:id', component: PrescriptionDetailComponent },
      { path: 'pharmacy/inventory', component: InventoryManagementComponent },
      { path: 'lab/tests', component: LabTestCatalogComponent },
      { path: 'lab/orders', component: LabOrdersListComponent },
      { path: 'lab/orders/new', component: CreateLabOrderComponent },
      { path: 'lab/orders/:id', component: LabResultsComponent },
      {
        path: 'lab-tech',
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: TechnicianDashboardComponent },
          { path: 'samples', component: SampleTrackerComponent },
          { path: 'process', component: TestProcessingComponent },
          { path: 'stats', component: LabStatsComponent },
        ],
      },
    ],
  },
  // Patient-facing portal: entirely separate identity model, shell, and
  // guard from the clinician routes above (see features/patient-portal).
  { path: 'patient-portal/login', component: PatientLoginComponent },
  {
    path: 'patient-portal',
    component: PatientPortalShellComponent,
    canActivate: [patientAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PatientDashboardComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
