import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config';
import { PatientAuthService } from '../../../core/services/patient-auth.service';

interface Document {
  DocumentId: number;
  PatientId: number;
  ReferralId?: number;
  Type: string;
  FileName: string;
  UploadedDate: string;
}

@Component({
  selector: 'app-patient-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-documents.component.html',
  styleUrl: './patient-documents.component.css',
})
export class PatientDocumentsComponent implements OnInit {
  private http = inject(HttpClient);
  private patientAuth = inject(PatientAuthService);

  documents: Document[] = [];
  loading = true;
  error = '';

  ngOnInit(): void {
    const patientId = this.patientAuth.currentPatient()?.patientId;
    if (!patientId) return;

    this.http
      .get<Document[]>(`${API_BASE_URL}/documents`, {
        params: { patientId: patientId.toString() },
      })
      .subscribe({
        next: (docs) => {
          this.documents = docs;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load documents';
          this.loading = false;
        },
      });
  }

  downloadDocument(doc: Document): void {
    // In a real app, this would fetch the actual document file
    alert(`Downloading: ${doc.FileName}\n\nType: ${doc.Type}\nUploaded: ${new Date(doc.UploadedDate).toLocaleDateString()}`);
  }
}
