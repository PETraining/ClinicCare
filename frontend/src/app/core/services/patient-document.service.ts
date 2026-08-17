import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { ClinicalDocument, DocumentUploadResponse } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class PatientDocumentService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/documents`;

  documents = signal<ClinicalDocument[]>([]);

  loadMyDocuments(): void {
    this.http.get<ClinicalDocument[]>(`${this.base}/me`).subscribe((docs) => this.documents.set(docs));
  }

  uploadDocument(file: File) {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<DocumentUploadResponse>(`${this.base}/me`, form);
  }

  downloadDocument(id: number, filename: string): void {
    this.http.get(`${this.base}/me/${id}/download`, { responseType: 'blob' }).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
