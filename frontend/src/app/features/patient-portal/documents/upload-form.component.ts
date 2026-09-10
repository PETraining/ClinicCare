import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PatientDocumentService } from '../../../core/services/patient-document.service';
import { ReferralService } from '../../../core/services/referral.service';
import { PatientAuthService } from '../../../core/services/patient-auth.service';
import { Referral } from '../../../core/models/referral.model';

@Component({
  selector: 'app-upload-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-form.component.html',
  styleUrl: './upload-form.component.css',
})
export class UploadFormComponent implements OnInit {
  private documentService = inject(PatientDocumentService);
  private referralService = inject(ReferralService);
  private patientAuthService = inject(PatientAuthService);
  private router = inject(Router);

  selectedFile: File | null = null;
  selectedReferralId: number | null = null;
  documentType = 'Pre-Visit Form';
  isUploading = false;
  uploadError = '';
  uploadSuccess = false;

  referrals: Referral[] = [];
  patientId = 0;

  documentTypes = [
    'Pre-Visit Form',
    'Lab Report',
    'Imaging',
    'Discharge Summary',
  ];

  ngOnInit(): void {
    const current = this.patientAuthService.currentPatient();
    if (current) {
      this.patientId = current.patientId;
      this.loadReferrals();
    }
  }

  loadReferrals(): void {
    this.referralService.listByPatient(this.patientId).subscribe({
      next: (referrals) => {
        this.referrals = referrals;
      },
      error: (err) => {
        console.error('Failed to load referrals', err);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError = '';
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file';
      return;
    }

    if (this.selectedFile.size > 10 * 1024 * 1024) {
      this.uploadError = 'File size must be less than 10MB';
      return;
    }

    this.isUploading = true;
    this.uploadError = '';

    this.documentService
      .upload(
        this.patientId,
        this.selectedReferralId,
        this.documentType,
        this.selectedFile
      )
      .subscribe({
        next: () => {
          this.uploadSuccess = true;
          this.isUploading = false;
          this.documentService.loadByPatient(this.patientId);
          setTimeout(() => {
            this.router.navigate(['../documents'], { relativeTo: undefined });
          }, 2000);
        },
        error: (err) => {
          this.isUploading = false;
          this.uploadError =
            err?.error?.detail || 'Upload failed. Please try again.';
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['../documents'], { relativeTo: undefined });
  }
}
