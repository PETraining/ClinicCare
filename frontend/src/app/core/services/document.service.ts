import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { ClinicalDocument } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/documents`;

  documents = signal<ClinicalDocument[]>([]);

  loadByPatient(patientId: number): void {
    this.http
      .get<ClinicalDocument[]>(this.base, { params: { patientId } })
      .subscribe((r) => this.documents.set(r));
  }

  loadByReferral(referralId: number): void {
    this.http
      .get<ClinicalDocument[]>(this.base, { params: { referralId } })
      .subscribe((r) => this.documents.set(r));
  }
}
