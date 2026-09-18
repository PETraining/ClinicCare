import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PatientDocumentService } from '../../../core/services/patient-document.service';
import { PatientAuthService } from '../../../core/services/patient-auth.service';
import { ClinicalDocument } from '../../../core/models/document.model';

@Component({
  selector: 'app-patient-documents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-documents.component.html',
  styleUrl: './patient-documents.component.css',
})
export class PatientDocumentsComponent implements OnInit {
  private documentService = inject(PatientDocumentService);
  private patientAuthService = inject(PatientAuthService);

  documents = this.documentService.documents;
  patientId = 0;

  ngOnInit(): void {
    const current = this.patientAuthService.currentPatient();
    if (current) {
      this.patientId = current.patientId;
      this.documentService.loadByPatient(this.patientId);
    }
  }

  getDownloadUrl(document: ClinicalDocument): string {
    return document.StoragePath ? this.documentService.downloadUrl(document.DocumentId) : '';
  }

  canDownload(document: ClinicalDocument): boolean {
    return !!document.StoragePath;
  }
}
