import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { PrescriptionDetail, DispensingRecord } from '../../core/models/pharmacy.model';
import { API_BASE_URL } from '../../core/config';

/**
 * Prescription Detail Component - DOCTOR/PHARMACIST VIEW
 *
 * This component is for clinical staff (doctors & pharmacists) to manage prescriptions.
 *
 * Responsibilities:
 * ✅ View prescription details
 * ✅ Add medications to prescription (doctor action)
 * ✅ Dispense medications (pharmacist action)
 *
 * NOT Responsible For:
 * ❌ Patient refill requests (see patient-details.component)
 * ❌ Patient communications
 * ❌ Patient-facing UI
 */
@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prescription-detail.component.html',
  styleUrls: ['./prescription-detail.component.css'],
})
export class PrescriptionDetailComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // Expose service signals
  selectedPrescription = this.pharmacyService.selectedPrescription;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  // Dispensing form state
  selectedMedicationId = signal<number | null>(null);
  dispenseQuantity = signal<number>(1);
  dispensedBy = signal<string>('Pharmacy');
  dispensing = signal<boolean>(false);
  dispenseSuccess = signal<boolean>(false);
  dispenseError = signal<string | null>(null);

  // Add medication form state
  showAddMedicationForm = signal<boolean>(false);
  addMedicationId = signal<number | null>(null);
  addMedicationQuantity = signal<number>(1);
  addMedicationFrequency = signal<string>('Once daily');
  addMedicationInstructions = signal<string>('');
  addingMedication = signal<boolean>(false);
  addMedicationSuccess = signal<boolean>(false);
  addMedicationError = signal<string | null>(null);

  ngOnInit(): void {
    // Get prescription ID from route params
    this.route.paramMap.subscribe((params) => {
      const prescriptionId = params.get('id');
      if (prescriptionId) {
        this.loadPrescription(parseInt(prescriptionId, 10));
      }
    });
  }

  /**
   * Load prescription detail from API
   */
  private loadPrescription(prescriptionId: number): void {
    this.loading.set(true);
    this.pharmacyService.getPrescriptionById(prescriptionId).subscribe({
      next: (prescription) => {
        this.selectedPrescription.set(prescription);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load prescription');
        console.error('Error loading prescription:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Get available medications to dispense (from prescription medications)
   * Includes medication names from inventory
   */
  get availableMedicationsToDispense(): any[] {
    const prescription = this.selectedPrescription();
    if (!prescription) return [];

    const inventoryMedications = this.pharmacyService.medications();

    // Map medication IDs to their details from prescription, with names from inventory
    return prescription.Medications.map((med) => {
      const inventoryMed = inventoryMedications.find(
        m => m.MedicationId === med.medication_id
      );
      return {
        medication_id: med.medication_id,
        name: inventoryMed?.Name || `Medication #${med.medication_id}`,
        dosage: inventoryMed?.Dosage || '',
        quantity: med.quantity,
        frequency: med.frequency,
        instructions: med.instructions,
      };
    });
  }

  /**
   * Submit dispensing action
   * Validates against:
   * 1. Prescription medication quantity
   * 2. Already dispensed quantity
   * 3. Current inventory stock level
   */
  dispenseMedication(): void {
    const prescription = this.selectedPrescription();
    if (!prescription || this.selectedMedicationId() === null) {
      this.dispenseError.set('Please select a medication');
      return;
    }

    // Convert to number to ensure proper type matching
    const medicationId = Number(this.selectedMedicationId()) || 0;
    const quantityRequested = this.dispenseQuantity();

    // Validate quantity > 0
    if (quantityRequested <= 0) {
      this.dispenseError.set('Quantity must be greater than 0');
      return;
    }

    // Validate medications exist
    if (!prescription.Medications || prescription.Medications.length === 0) {
      this.dispenseError.set('No medications in this prescription');
      return;
    }

    // Get prescription medication details (convert both to number for comparison)
    const prescriptionMed = prescription.Medications.find(
      m => Number(m.medication_id) === medicationId
    );
    if (!prescriptionMed) {
      console.error('Medication not found:', {
        medicationId,
        medicationIdType: typeof medicationId,
        availableMedications: prescription.Medications.map(m => ({
          id: m.medication_id,
          idType: typeof m.medication_id,
        })),
      });
      this.dispenseError.set(
        `Selected medication (ID: ${medicationId}) not found in prescription. ` +
        `Available: ${prescription.Medications.map(m => m.medication_id).join(', ')}`
      );
      return;
    }

    // Calculate already dispensed quantity
    const alreadyDispensed = prescription.DispensingRecords?.reduce(
      (total: number, record: any) =>
        record.MedicationId === medicationId ? total + record.QuantityDispensed : total,
      0
    ) || 0;

    const prescriptionQuantity = prescriptionMed.quantity;
    const remainingToBDispense = prescriptionQuantity - alreadyDispensed;

    // Validate against prescription quantity
    if (quantityRequested > remainingToBDispense) {
      this.dispenseError.set(
        `Cannot dispense ${quantityRequested} units. ` +
        `Prescription has ${prescriptionQuantity} units total, ` +
        `${alreadyDispensed} already dispensed, ` +
        `${remainingToBDispense} remaining.`
      );
      return;
    }

    // Validate against inventory stock (ensure number comparison)
    const inventoryMed = this.pharmacyService.medications().find(
      m => Number(m.MedicationId) === medicationId
    );
    if (!inventoryMed) {
      this.dispenseError.set(
        `Medication ${medicationId} not found in inventory. ` +
        `Please check medication database.`
      );
      return;
    }

    if (inventoryMed.StockLevel < quantityRequested) {
      this.dispenseError.set(
        `Insufficient stock. Requested: ${quantityRequested} units, ` +
        `Available: ${inventoryMed.StockLevel} units`
      );
      return;
    }

    // All validations passed - proceed with dispensing
    this.dispensing.set(true);
    this.dispenseError.set(null);
    this.dispenseSuccess.set(false);

    this.pharmacyService
      .dispenseMedication(prescription.PrescriptionId, {
        medication_id: medicationId,
        quantity_dispensed: quantityRequested,
        dispensed_by: this.dispensedBy(),
      })
      .subscribe({
        next: (response) => {
          this.dispenseSuccess.set(true);
          this.dispensing.set(false);

          // Reset form
          this.selectedMedicationId.set(null);
          this.dispenseQuantity.set(1);
          this.dispensedBy.set('Pharmacy');

          // Reload prescription to show updated dispensing history
          // Also refresh pharmacy data (medications, low-stock) to reflect inventory changes
          setTimeout(() => {
            this.loadPrescription(prescription.PrescriptionId);
            this.pharmacyService.loadMedications();
            this.pharmacyService.loadLowStockItems();
            this.dispenseSuccess.set(false);
          }, 2000);
        },
        error: (err) => {
          const errorMsg = err.error?.detail || 'Failed to dispense medication';
          this.dispenseError.set(errorMsg);
          this.dispensing.set(false);
        },
      });
  }

  /**
   * Get medication name from ID
   */
  getMedicationName(medicationId: number | string): string {
    const numId = Number(medicationId);
    const med = this.pharmacyService.medications().find(
      m => Number(m.MedicationId) === numId
    );
    return med?.Name || `Medication #${medicationId}`;
  }

  /**
   * Get medication dosage from ID
   */
  getMedicationDosage(medicationId: number | string): string {
    const numId = Number(medicationId);
    const med = this.pharmacyService.medications().find(
      m => Number(m.MedicationId) === numId
    );
    return med?.Dosage || '-';
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  /**
   * Toggle add medication form
   */
  toggleAddMedicationForm(): void {
    this.showAddMedicationForm.update(val => !val);
    if (!this.showAddMedicationForm()) {
      this.resetAddMedicationForm();
    }
  }

  /**
   * Reset add medication form
   */
  private resetAddMedicationForm(): void {
    this.addMedicationId.set(null);
    this.addMedicationQuantity.set(1);
    this.addMedicationFrequency.set('Once daily');
    this.addMedicationInstructions.set('');
    this.addMedicationError.set(null);
  }

  /**
   * Add medication to prescription
   */
  addMedicationToPrescription(): void {
    const prescription = this.selectedPrescription();
    if (!prescription || this.addMedicationId() === null) {
      this.addMedicationError.set('Please select a medication');
      return;
    }

    const quantityRequested = this.addMedicationQuantity();
    if (quantityRequested <= 0) {
      this.addMedicationError.set('Quantity must be greater than 0');
      return;
    }

    // Check if medication already in prescription
    const alreadyExists = prescription.Medications.some(
      m => m.medication_id === this.addMedicationId()
    );
    if (alreadyExists) {
      this.addMedicationError.set('This medication is already in the prescription');
      return;
    }

    // Check available stock before proceeding
    const medicationId = this.addMedicationId();
    const medications = this.pharmacyService.medications();
    const medication = medications.find(m => m.MedicationId === medicationId);

    if (!medication) {
      this.addMedicationError.set('Medication not found in inventory');
      return;
    }

    if (medication.StockLevel < quantityRequested) {
      this.addMedicationError.set(
        `Insufficient stock. Available: ${medication.StockLevel} units, Requested: ${quantityRequested} units`
      );
      return;
    }

    this.addingMedication.set(true);
    this.addMedicationError.set(null);
    this.addMedicationSuccess.set(false);

    // Reserve stock for the prescribed medication
    this.pharmacyService
      .reserveStockForPrescription(medicationId || 0, quantityRequested)
      .subscribe({
        next: () => {
          // Stock reserved successfully, now update prescription
          this.addMedicationSuccess.set(true);
          this.addingMedication.set(false);

          setTimeout(() => {
            // Reload prescription and refresh inventory
            this.loadPrescription(prescription.PrescriptionId);
            this.pharmacyService.loadMedications();
            this.pharmacyService.loadLowStockItems();
            this.showAddMedicationForm.set(false);
            this.resetAddMedicationForm();
            this.addMedicationSuccess.set(false);
          }, 1500);
        },
        error: (err) => {
          const errorMsg = err.error?.detail || 'Failed to add medication';
          this.addMedicationError.set(errorMsg);
          this.addingMedication.set(false);
        },
      });
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
