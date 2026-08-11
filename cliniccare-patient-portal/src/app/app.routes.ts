import { Routes } from '@angular/router';

import { patientSelectedGuard } from './core/guards/patient-selected.guard';
import { ShellComponent } from './shell/shell.component';
import { PatientSelectComponent } from './features/patient-select/patient-select.component';
import { DocumentListComponent } from './features/documents/document-list.component';
import { DocumentUploadComponent } from './features/documents/document-upload.component';
import { QuestionnaireListComponent } from './features/questionnaires/questionnaire-list.component';
import { QuestionnaireFormComponent } from './features/questionnaires/questionnaire-form.component';

export const routes: Routes = [
  { path: 'select-patient', component: PatientSelectComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [patientSelectedGuard],
    children: [
      { path: '', redirectTo: 'documents', pathMatch: 'full' },
      { path: 'documents', component: DocumentListComponent },
      { path: 'documents/upload', component: DocumentUploadComponent },
      { path: 'questionnaires', component: QuestionnaireListComponent },
      { path: 'questionnaires/:id', component: QuestionnaireFormComponent },
    ],
  },
  { path: '**', redirectTo: 'select-patient' },
];
