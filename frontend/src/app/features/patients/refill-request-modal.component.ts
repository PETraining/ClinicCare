import { Component, Input, Output, EventEmitter, inject, signal, WritableSignal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/config';

interface RefillRequest {
  PrescriptionId: number;
  PatientId: number;
  Status: string;
  RequestedAt?: string;
  Message?: string;
}

@Component({
  selector: 'app-refill-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpenSignal()" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Request Prescription Refill</h2>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Error Message -->
          <div *ngIf="error()" class="alert alert-error">
            {{ error() }}
          </div>

          <!-- Success Message -->
          <div *ngIf="success()" class="alert alert-success">
            ✅ Refill request submitted successfully!
            <br />
            <small>Status: {{ refillResponse()?.Status }}</small>
          </div>

          <!-- Form -->
          <form *ngIf="!success()" (ngSubmit)="submitRefillRequest()">
            <!-- Prescription Info -->
            <div class="form-section">
              <label>Prescription Details</label>
              <div class="info-box">
                <div class="info-row">
                  <span class="label">Prescription ID:</span>
                  <span class="value">#{{ prescriptionSignal().PrescriptionId }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Status:</span>
                  <span class="value" [ngClass]="'status-' + prescriptionSignal().Status.toLowerCase()">
                    {{ prescriptionSignal().Status }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">Medications:</span>
                  <span class="value">{{ prescriptionSignal().Medications?.length || 0 }} item(s)</span>
                </div>
                <div class="info-row">
                  <span class="label">Refills Remaining:</span>
                  <span class="value">
                    {{ getRefillStatus(prescriptionSignal()) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Medications List -->
            <div class="form-section">
              <label>Medications to Refill</label>
              <div *ngIf="prescriptionSignal().Medications && prescriptionSignal().Medications.length > 0; else noMeds" class="medications-list">
                <div *ngFor="let med of prescriptionSignal().Medications" class="med-item">
                  <span class="med-name">{{ med.Name || 'Medication #' + med.medication_id }}</span>
                  <span class="med-dosage">{{ med.Dosage }}</span>
                  <span class="med-qty">Qty: {{ med.quantity }}</span>
                </div>
              </div>
              <ng-template #noMeds>
                <p class="no-data">No medications in this prescription</p>
              </ng-template>
            </div>

            <!-- Notes -->
            <div class="form-section">
              <label for="notes">Additional Notes (Optional)</label>
              <textarea
                id="notes"
                [(ngModel)]="notes"
                name="notes"
                placeholder="Add any special instructions or notes..."
                rows="3"
                class="form-input"
              ></textarea>
            </div>

            <!-- Refill Eligibility Check -->
            <div class="form-section">
              <div *ngIf="!isEligibleForRefill(prescriptionSignal())" class="alert alert-warning">
                ⚠️ This prescription is not eligible for refilling:
                <ul>
                  <li *ngIf="!isEligibleForRefill(prescriptionSignal())">Status is {{ prescriptionSignal().Status }} (must be Prescribed or PartiallyFulfilled)</li>
                  <li *ngIf="prescriptionSignal().RefillsRemaining <= 0 && prescriptionSignal().RefillsAllowed !== -1">
                    No refills remaining
                  </li>
                </ul>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            (click)="onClose()"
            [disabled]="loading()"
          >
            {{ success() ? 'Close' : 'Cancel' }}
          </button>
          <button
            *ngIf="!success()"
            class="btn btn-primary"
            (click)="submitRefillRequest()"
            [disabled]="loading() || !isEligibleForRefill(prescriptionSignal())"
          >
            <span *ngIf="!loading()">Submit Refill Request</span>
            <span *ngIf="loading()">Submitting...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      background-color: #f9f9f9;
    }

    .form-section {
      margin-bottom: 20px;
    }

    .form-section label {
      display: block;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }

    .info-box {
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-row .label {
      font-weight: 500;
      color: #666;
    }

    .info-row .value {
      color: #333;
      font-weight: 500;
    }

    .status-prescribed {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 12px;
    }

    .medications-list {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .med-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }

    .med-item:last-child {
      border-bottom: none;
    }

    .med-name {
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .med-dosage {
      color: #666;
      margin-right: 15px;
      font-size: 13px;
    }

    .med-qty {
      background-color: #f0f0f0;
      padding: 4px 8px;
      border-radius: 3px;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      font-size: 14px;
    }

    .form-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .alert {
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 15px;
      font-size: 14px;
    }

    .alert-error {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ef5350;
    }

    .alert-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #66bb6a;
    }

    .alert-warning {
      background-color: #fff3e0;
      color: #f57c00;
      border: 1px solid #ffb74d;
    }

    .alert ul {
      margin: 8px 0 0 20px;
      padding: 0;
    }

    .alert li {
      margin-bottom: 4px;
    }

    .no-data {
      color: #999;
      font-style: italic;
      text-align: center;
      padding: 20px 10px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #1565c0;
    }

    .btn-secondary {
      background-color: #e0e0e0;
      color: #333;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #d0d0d0;
    }
  `,
})
export class RefillRequestModalComponent {
  private http = inject(HttpClient);

  @Input() isOpen: boolean = false;
  @Input() prescription: any = {};
  @Input() patientId: number = 0;
  @Output() close = new EventEmitter<void>();

  // Internal signal state for reactive updates
  isOpenSignal = signal(false);
  prescriptionSignal = signal<any>({});
  patientIdSignal = signal(0);

  // Form state
  notes = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  refillResponse = signal<any>(null);

  ngOnChanges(): void {
    // Sync input values to internal signals
    this.isOpenSignal.set(this.isOpen);
    this.prescriptionSignal.set(this.prescription);
    this.patientIdSignal.set(this.patientId);
  }

  /**
   * Check if prescription is eligible for refilling
   */
  isEligibleForRefill(prescription: any): boolean {
    if (!prescription || !prescription.PrescriptionId) return false;

    const hasRefills =
      prescription.RefillsRemaining > 0 || prescription.RefillsAllowed === -1;
    const isActive = prescription.Status === 'Prescribed' ||
                     prescription.Status === 'PartiallyFulfilled' ||
                     prescription.Status === 'Active'; // Support both old and new statuses

    return isActive && hasRefills;
  }

  /**
   * Get refill status text
   */
  getRefillStatus(prescription: any): string {
    if (!prescription) return 'N/A';
    if (prescription.RefillsAllowed === 0) {
      return 'No refills';
    } else if (prescription.RefillsAllowed === -1) {
      return 'Unlimited refills';
    } else {
      return `${prescription.RefillsRemaining}/${prescription.RefillsAllowed} remaining`;
    }
  }

  /**
   * Submit refill request
   */
  submitRefillRequest(): void {
    const prescription = this.prescriptionSignal();
    const patientId = this.patientIdSignal();

    if (!prescription.PrescriptionId || !patientId) {
      this.error.set('Missing prescription or patient information');
      return;
    }

    if (!this.isEligibleForRefill(prescription)) {
      this.error.set('This prescription is not eligible for refilling');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Call the request-refill endpoint with patient_id as query parameter
    this.http
      .post<RefillRequest>(
        `${API_BASE_URL}/pharmacy/prescriptions/${prescription.PrescriptionId}/request-refill?patient_id=${patientId}`,
        {}
      )
      .subscribe({
        next: (response) => {
          this.success.set(true);
          this.refillResponse.set(response);
          this.loading.set(false);

          // Close modal after 3 seconds
          setTimeout(() => {
            this.onClose();
          }, 3000);
        },
        error: (err) => {
          const errorMsg =
            err.error?.detail ||
            err.error?.message ||
            'Failed to submit refill request';
          this.error.set(errorMsg);
          this.loading.set(false);
        },
      });
  }

  /**
   * Close modal
   */
  onClose(): void {
    // Reset form state
    this.notes = '';
    this.error.set(null);
    this.success.set(false);
    this.refillResponse.set(null);
    this.loading.set(false);

    // Emit close event
    this.close.emit();
  }
}
