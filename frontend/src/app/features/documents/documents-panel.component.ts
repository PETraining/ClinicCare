import { Component, effect, inject, input } from '@angular/core';

import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-documents-panel',
  standalone: true,
  templateUrl: './documents-panel.component.html',
  styleUrl: './documents-panel.component.css',
})
export class DocumentsPanelComponent {
  documentService = inject(DocumentService);

  patientId = input<number | undefined>(undefined);
  referralId = input<number | undefined>(undefined);

  constructor() {
    effect(() => {
      const patientId = this.patientId();
      const referralId = this.referralId();
      if (referralId !== undefined) {
        this.documentService.loadByReferral(referralId);
      } else if (patientId !== undefined) {
        this.documentService.loadByPatient(patientId);
      }
    });
  }
}
