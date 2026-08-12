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
          setTimeout(() => {
            this.loadPrescription(prescription.PrescriptionId);
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
}
