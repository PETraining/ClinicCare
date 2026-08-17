import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { PatientDocumentService } from '../../../core/services/patient-document.service';

const MAX_BYTES = 1_000_000;

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css',
})
export class DocumentUploadComponent {
  private docService = inject(PatientDocumentService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  error = signal<string | null>(null);
  uploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error.set(null);
    if (file && file.size > MAX_BYTES) {
      this.error.set(`File too large (${(file.size / 1_000_000).toFixed(2)} MB). Maximum is 1 MB.`);
      this.selectedFile.set(null);
      return;
    }
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.docService.uploadDocument(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.router.navigate(['/patient-portal/documents']);
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.detail ?? 'Upload failed. Please try again.');
      },
    });
  }
}
