import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

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
  template: `
    <div class="documents-container">
      <h2>Medical Documents</h2>
      
      <div *ngIf="loading()" class="loading">
        <p>Loading documents...</p>
      </div>
      
      <div *ngIf="error()" class="error-message">
        {{ error() }}
      </div>
      
      <div *ngIf="!loading() && documents().length > 0" class="documents-list">
        <p class="subtitle">Your medical documents, lab results, and prescriptions</p>
        <div class="documents-grid">
          <div *ngFor="let doc of documents()" class="document-card">
            <div class="document-header">
              <h3>{{ doc.FileName }}</h3>
              <span class="document-type">{{ doc.Type }}</span>
            </div>
            <div class="document-details">
              <p><strong>Uploaded:</strong> {{ doc.UploadedDate | date: 'short' }}</p>
              <p *ngIf="doc.ReferralId"><strong>Referral:</strong> #{{ doc.ReferralId }}</p>
            </div>
            <button (click)="downloadDocument(doc)" class="download-btn">
              Download
            </button>
          </div>
        </div>
      </div>
      
      <div *ngIf="!loading() && documents().length === 0 && !error()" class="no-data">
        <p>Your medical documents, lab results, and prescriptions will appear here.</p>
        <p class="placeholder">No documents available</p>
      </div>
    </div>
  `,
  styles: [`
    .documents-container {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .loading, .error-message, .no-data {
      padding: 20px;
      background: white;
      border-radius: 4px;
      text-align: center;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef5350;
    }
    .subtitle {
      color: #666;
      margin-bottom: 20px;
    }
    .documents-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    .document-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
    .document-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }
    .document-header h3 {
      margin: 0;
      font-size: 16px;
    }
    .document-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
    }
    .document-details {
      margin-bottom: 12px;
      font-size: 14px;
    }
    .document-details p {
      margin: 4px 0;
      color: #666;
    }
    .download-btn {
      width: 100%;
      padding: 8px 16px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .download-btn:hover {
      background: #1565c0;
    }
    .placeholder {
      color: #999;
      font-style: italic;
    }
  `]
})
export class PatientDocumentsComponent implements OnInit {
  private http = inject(HttpClient);
  
  documents = signal<Document[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    // Get patient ID from localStorage
    const sessionStr = localStorage.getItem('referraliq_patient_portal_session');
    if (!sessionStr) {
      this.error.set('Patient session not found');
      this.loading.set(false);
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      const patientId = session.patientId;
      
      this.http.get<Document[]>(`http://localhost:8000/api/documents?patientId=${patientId}`)
        .subscribe({
          next: (docs) => {
            this.documents.set(docs || []);
            this.loading.set(false);
            this.error.set('');
          },
          error: (err) => {
            console.error('Failed to load documents', err);
            this.error.set('Failed to load documents');
            this.loading.set(false);
          }
        });
    } catch (err) {
      this.error.set('Invalid patient session');
      this.loading.set(false);
    }
  }

  downloadDocument(doc: Document): void {
    alert(`Downloading: ${doc.FileName}\n\nType: ${doc.Type}\nUploaded: ${new Date(doc.UploadedDate).toLocaleDateString()}`);
  }
}
