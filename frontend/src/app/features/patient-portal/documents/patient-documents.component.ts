import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PatientDocumentService } from '../../../core/services/patient-document.service';

@Component({
  selector: 'app-patient-documents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-documents.component.html',
  styleUrl: './patient-documents.component.css',
})
export class PatientDocumentsComponent implements OnInit {
  protected docService = inject(PatientDocumentService);

  ngOnInit(): void {
    this.docService.loadMyDocuments();
  }

  download(id: number, filename: string): void {
    this.docService.downloadDocument(id, filename);
  }
}
