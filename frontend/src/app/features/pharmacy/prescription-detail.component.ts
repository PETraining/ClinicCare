import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { PrescriptionDetail, DispensingRecord } from '../../core/models/pharmacy.model';

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

  // Expose service signals
  selectedPrescription = this.pharmacyService.selectedPrescription;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  // Dispensing form state
  selectedMedicationId = signal<number | null>(null);
  dispenseQuantity = signal<number>(1);
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
   */
  get availableMedicationsToDispense(): any[] {
    const prescription = this.selectedPrescription();
    if (!prescription) return [];

    // Map medication IDs to their details from prescription
    return prescription.Medications.map((med) => ({
      medication_id: med.medication_id,
      quantity: med.quantity,
      frequency: med.frequency,
      instructions: med.instructions,
    }));
  }

  /**
   * Submit dispensing action
   */
  dispenseMedication(): void {
    const prescription = this.selectedPrescription();
    if (!prescription || this.selectedMedicationId() === null) {
      this.dispenseError.set('Please select a medication');
      return;
    }

    const quantity = this.dispenseQuantity();
    if (quantity <= 0) {
      this.dispenseError.set('Quantity must be greater than 0');
      return;
    }

    this.dispensing.set(true);
    this.dispenseError.set(null);
    this.dispenseSuccess.set(false);

    this.pharmacyService
      .dispenseMedication(prescription.PrescriptionId, {
        medication_id: this.selectedMedicationId() || 0,
        quantity_dispensed: quantity,
      })
      .subscribe({
        next: (response) => {
          this.dispenseSuccess.set(true);
          this.dispensing.set(false);

          // Reset form
          this.selectedMedicationId.set(null);
          this.dispenseQuantity.set(1);

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
}
