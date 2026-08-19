import { Component, effect, inject, signal, computed, WritableSignal, EffectRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { PatientService } from '../../core/services/patient.service';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { DocumentsPanelComponent } from '../documents/documents-panel.component';
import { RefillRequestModalComponent } from './refill-request-modal.component';
import { API_BASE_URL } from '../../core/config';

/**
 * Patient Details Component - PATIENT VIEW
 *
 * This component displays a patient's complete medical profile and prescription history.
 *
 * Responsibilities:
 * ✅ Display patient demographics
 * ✅ Show prescription history (Active & Completed)
 * ✅ Allow patients to REQUEST PRESCRIPTION REFILLS
 * ✅ Show medical documents
 * ✅ Display patient conditions & medications
 *
 * NOT Responsible For:
 * ❌ Doctors adding medications (see prescription-detail.component)
 * ❌ Pharmacists dispensing medications (see prescription-detail.component)
 * ❌ Clinical prescription management
 *
 * Refill Requests:
 * - Patients can request refills via the "Request Refill" button
 * - This is a PATIENT action, not a doctor/pharmacist action
 * - Refill modal only appears for patients viewing their own prescriptions
 */
@Component({
  selector: 'app-patient-details',
  standalone: true,
  imports: [RouterLink, DocumentsPanelComponent, CommonModule, RefillRequestModalComponent],
  templateUrl: './patient-details.component.html',
  styleUrl: './patient-details.component.css',
})
export class PatientDetailsComponent {
  patientService = inject(PatientService);
  pharmacyService = inject(PharmacyService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  patientId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );

  // Prescription history for this patient
  patientPrescriptions = signal<any[]>([]);
  prescriptionLoading = signal(false);
  prescriptionError = signal<string | null>(null);

  // UI state
  expandedPrescriptionId = signal<number | null>(null);

  // Refill modal state
  showRefillModal = signal(false);
  selectedPrescriptionForRefill = signal<any>(null);

  // Computed properties
  activePrescriptions = computed(() =>
    this.patientPrescriptions().filter(
      p => p.Status === 'Prescribed' || p.Status === 'PartiallyFulfilled' || p.Status === 'Active'
    )
  );

  completedPrescriptions = computed(() =>
    this.patientPrescriptions().filter(p => p.Status === 'Fulfilled' || p.Status === 'Completed')
  );

  constructor() {
    // Use allowSignalWrites to allow signal updates inside the effect
    effect(
      () => {
        const id = this.patientId();
        if (id) {
          this.patientService.loadById(id);
          this.loadPatientPrescriptions(id);
        }
      },
      { allowSignalWrites: true }
    );

    // Also refresh prescriptions whenever this route is activated
    // This ensures newly created prescriptions appear when redirecting back
    this.route.params.subscribe(() => {
      const id = this.patientId();
      if (id) {
        console.log('🔄 Route activated - refreshing prescriptions');
        // Wait longer to ensure backend has committed the data
        setTimeout(() => {
          this.loadPatientPrescriptions(id);
        }, 1000);
      }
    });

    // Also listen to route data for explicit refresh signal
    this.route.data.subscribe((data) => {
      if (data['refreshPrescriptions']) {
        console.log('📋 Route data triggered prescription refresh');
        const id = this.patientId();
        if (id) {
          setTimeout(() => {
            this.loadPatientPrescriptions(id);
          }, 500);
        }
      }
    });
  }

  /**
   * Load prescription history for this patient
   */
  private loadPatientPrescriptions(patientId: number): void {
    this.prescriptionLoading.set(true);
    this.prescriptionError.set(null);

    console.log(`📋 Loading prescriptions for patient ${patientId}`);

    // Use the pharmacy service to get prescriptions filtered by patient_id
    this.pharmacyService.getPrescriptionsByPatient(patientId).subscribe({
      next: (prescriptions) => {
        console.log(`✅ Loaded ${prescriptions.length} prescriptions:`, prescriptions);
        this.patientPrescriptions.set(prescriptions);
        this.prescriptionLoading.set(false);
      },
      error: (err) => {
        this.prescriptionError.set('Failed to load prescription history');
        console.error('Error loading prescriptions:', err);
        this.prescriptionLoading.set(false);
      },
    });
  }

  /**
   * Toggle prescription details visibility
   */
  togglePrescriptionDetails(prescriptionId: number): void {
    const current = this.expandedPrescriptionId();
    this.expandedPrescriptionId.set(current === prescriptionId ? null : prescriptionId);
  }

  /**
   * Get refill status text
   */
  getRefillStatus(prescription: any): string {
    if (prescription.RefillsAllowed === 0) {
      return 'No refills';
    } else if (prescription.RefillsAllowed === -1) {
      return 'Unlimited refills';
    } else {
      return `${prescription.RefillsRemaining}/${prescription.RefillsAllowed} refills remaining`;
    }
  }

  /**
   * Check if prescription can be refilled
   */
  canRefill(prescription: any): boolean {
    const isActive = prescription.Status === 'Prescribed' ||
                     prescription.Status === 'PartiallyFulfilled' ||
                     prescription.Status === 'Active'; // Support both old and new statuses
    const hasRefills = prescription.RefillsRemaining > 0 || prescription.RefillsAllowed === -1;
    return isActive && hasRefills;
  }

  /**
   * Open refill request modal
   */
  requestRefill(prescription: any): void {
    this.selectedPrescriptionForRefill.set(prescription);
    this.showRefillModal.set(true);
  }

  /**
   * Close refill modal and reload prescriptions
   */
  closeRefillModal(): void {
    this.showRefillModal.set(false);
    this.selectedPrescriptionForRefill.set(null);
    // Reload prescriptions to show any updates
    setTimeout(() => {
      this.loadPatientPrescriptions(this.patientId());
    }, 1000);
  }

  /**
   * Maps to store fetched names
   */
  private patientNames = new Map<number, WritableSignal<string>>();
  private doctorNames = new Map<number, WritableSignal<string>>();

  /**
   * Get patient name signal for display in template
   */
  getPatientNameSignal(patientId: number): WritableSignal<string> {
    if (!this.patientNames.has(patientId)) {
      const nameSignal = signal(`Patient #${patientId}`);
      this.patientNames.set(patientId, nameSignal);

      // Fetch real name
      this.http.get<any>(`${API_BASE_URL}/patients/${patientId}`).subscribe({
        next: (patient) => {
          nameSignal.set(patient.Name || `Patient #${patientId}`);
        },
        error: () => {
          // Keep the default if fetch fails
        }
      });
    }
    return this.patientNames.get(patientId)!;
  }

  /**
   * Get doctor name signal for display in template
   */
  getDoctorNameSignal(doctorId: number): WritableSignal<string> {
    if (!this.doctorNames.has(doctorId)) {
      const nameSignal = signal(`Doctor #${doctorId}`);
      this.doctorNames.set(doctorId, nameSignal);

      // Fetch real name
      this.http.get<any>(`${API_BASE_URL}/doctors/${doctorId}`).subscribe({
        next: (doctor) => {
          nameSignal.set(doctor.Name || `Doctor #${doctorId}`);
        },
        error: () => {
          // Keep the default if fetch fails
        }
      });
    }
    return this.doctorNames.get(doctorId)!;
  }
}
