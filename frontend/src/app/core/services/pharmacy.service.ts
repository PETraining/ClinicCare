import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { API_BASE_URL } from '../config';
import {
  Medication,
  Prescription,
  PrescriptionDetail,
  DispensingRecord,
  DispenseRequest,
  DispenseResponse,
  LowStockResponse,
} from '../models/pharmacy.model';

/**
 * Pharmacy Service
 * Manages medications, prescriptions, and dispensing operations
 */
@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/pharmacy`;

  // ============ STATE SIGNALS ============

  /** All medications in inventory */
  medications = signal<Medication[]>([]);

  /** All prescriptions */
  prescriptions = signal<Prescription[]>([]);

  /** Currently selected prescription (for detail view) */
  selectedPrescription = signal<PrescriptionDetail | null>(null);

  /** Medications below minimum stock level */
  lowStockItems = signal<Medication[]>([]);

  /** Loading state */
  loading = signal<boolean>(false);

  /** Error message */
  error = signal<string | null>(null);

  // ============ COMPUTED SIGNALS ============

  /** Count of pending (active) prescriptions */
  pendingPrescriptionsCount = computed(() => {
    return this.prescriptions().filter(p => p.Status === 'Active').length;
  });

  /** Count of low-stock items */
  lowStockCount = computed(() => this.lowStockItems().length);

  // ============ MEDICATION METHODS ============

  /**
   * Load all medications from the API
   */
  loadMedications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Medication[]>(`${this.base}/medications`).subscribe({
      next: (data) => {
        this.medications.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load medications');
        console.error('Error loading medications:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Get a specific medication by ID
   */
  getMedicationById(medicationId: number) {
    return this.http.get<Medication>(
      `${this.base}/medications/${medicationId}`
    );
  }

  /**
   * Create a new medication
   */
  createMedication(medication: Omit<Medication, 'MedicationId' | 'CreatedAt'>) {
    return this.http.post<Medication>(
      `${this.base}/medications`,
      medication
    );
  }

  /**
   * Update a medication
   */
  updateMedication(medicationId: number, updates: Partial<Medication>) {
    return this.http.patch<Medication>(
      `${this.base}/medications/${medicationId}`,
      updates
    );
  }

  // ============ PRESCRIPTION METHODS ============

  /**
   * Load all prescriptions with optional filters
   */
  loadPrescriptions(filters?: {
    status?: string;
    patientId?: number;
    referralId?: number;
  }): void {
    this.loading.set(true);
    this.error.set(null);

    let url = `${this.base}/prescriptions`;
    const params = new URLSearchParams();

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.patientId) {
      params.append('patient_id', filters.patientId.toString());
    }
    if (filters?.referralId) {
      params.append('referral_id', filters.referralId.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    this.http.get<Prescription[]>(url).subscribe({
      next: (data) => {
        this.prescriptions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load prescriptions');
        console.error('Error loading prescriptions:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Get a specific prescription with dispensing history
   */
  getPrescriptionById(prescriptionId: number) {
    return this.http.get<PrescriptionDetail>(
      `${this.base}/prescriptions/${prescriptionId}`
    );
  }

  /**
   * Create a new prescription
   */
  createPrescription(prescription: Omit<Prescription, 'PrescriptionId' | 'CreatedAt' | 'UpdatedAt'>) {
    return this.http.post<Prescription>(
      `${this.base}/prescriptions`,
      prescription
    );
  }

  /**
   * Update prescription status
   */
  updatePrescriptionStatus(prescriptionId: number, status: string) {
    return this.http.patch<Prescription>(
      `${this.base}/prescriptions/${prescriptionId}`,
      { Status: status }
    );
  }

  // ============ DISPENSING METHODS ============

  /**
   * Dispense medication from a prescription
   * Decreases stock level and records dispensing action
   */
  dispenseMedication(prescriptionId: number, request: DispenseRequest) {
    return this.http.post<DispenseResponse>(
      `${this.base}/prescriptions/${prescriptionId}/dispense`,
      request
    );
  }

  /**
   * Get dispensing history for a prescription
   */
  getDispensingHistory(prescriptionId: number) {
    return this.http.get<DispensingRecord[]>(
      `${this.base}/prescriptions/${prescriptionId}/dispensing-history`
    );
  }

  // ============ INVENTORY METHODS ============

  /**
   * Load medications with stock below minimum level
   */
  loadLowStockItems(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<LowStockResponse>(`${this.base}/inventory/low-stock`).subscribe({
      next: (data) => {
        this.lowStockItems.set(data.medications);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load low-stock items');
        console.error('Error loading low-stock items:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Reserve stock when medication is prescribed
   * Gets current stock, deducts quantity, and updates
   */
  reserveStockForPrescription(medicationId: number, quantityToReserve: number) {
    return this.getMedicationById(medicationId).pipe(
      switchMap((medication: Medication) => {
        const newStockLevel = Math.max(0, medication.StockLevel - quantityToReserve);
        return this.updateMedication(medicationId, {
          StockLevel: newStockLevel,
        });
      })
    );
  }

  // ============ UTILITY METHODS ============

  /**
   * Refresh all pharmacy data
   */
  refresh(): void {
    this.loadMedications();
    this.loadPrescriptions();
    this.loadLowStockItems();
  }

  /**
   * Clear selected prescription
   */
  clearSelection(): void {
    this.selectedPrescription.set(null);
  }

  /**
   * Select a prescription for detail view
   */
  selectPrescription(prescriptionId: number): void {
    const existing = this.prescriptions().find(p => p.PrescriptionId === prescriptionId);
    if (existing) {
      // Convert Prescription to PrescriptionDetail if needed
      this.selectedPrescription.set(existing as unknown as PrescriptionDetail);

      // Also fetch full detail with dispensing history
      this.getPrescriptionById(prescriptionId).subscribe({
        next: (detail) => {
          this.selectedPrescription.set(detail);
        },
        error: (err) => {
          console.error('Error loading prescription detail:', err);
        },
      });
    }
  }
}
