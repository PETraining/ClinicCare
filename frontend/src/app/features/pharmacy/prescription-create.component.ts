import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { PatientService } from '../../core/services/patient.service';
import { Medication } from '../../core/models/pharmacy.model';
import { API_BASE_URL } from '../../core/config';

interface Doctor {
  DoctorId: number;
  Name: string;
  Specialty: string;
  Department: string;
  ContactInfo: string;
}

interface Referral {
  ReferralId: number;
  PatientId: number;
  ReferralDate: string;
  Reason: string;
  Status: string;
  SpecialistId?: number;
  Notes?: string;
}

interface MedicationOption extends Medication {
  stockStatusLabel?: string;
}

@Component({
  selector: 'app-prescription-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './prescription-create.component.html',
  styleUrl: './prescription-create.component.css',
})
export class PrescriptionCreateComponent {
  private fb = inject(FormBuilder);
  private pharmacyService = inject(PharmacyService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  prescriptionForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  patientId: number | null = null;
  patientName = signal<string>('');
  referralId: number | null = null;
  referral = signal<Referral | null>(null);
  referralLoading = signal(false);

  // Doctors and Medications
  doctors = signal<Doctor[]>([]);
  allMedications = signal<MedicationOption[]>([]);
  doctorsLoading = signal(false);
  medicationsLoading = signal(false);

  // Selected doctor tracking
  selectedDoctor = computed(() => {
    const doctorId = this.prescriptionForm.get('PrescribingDoctorId')?.value;
    if (!doctorId) return null;
    return this.doctors().find(d => d.DoctorId === doctorId) || null;
  });

  // Medication search
  medicationSearch = signal('');
  filteredMedications = computed(() => {
    const search = this.medicationSearch().toLowerCase();
    if (!search) return this.allMedications();
    return this.allMedications().filter(
      m => m.Name.toLowerCase().includes(search) ||
           m.Dosage.toLowerCase().includes(search)
    );
  });

  constructor() {
    this.prescriptionForm = this.fb.group({
      PatientId: ['', Validators.required],
      PrescribingDoctorId: ['', [Validators.required, Validators.min(1)]],
      ReferralId: [''],
      Status: ['Prescribed', Validators.required],
      RefillsAllowed: [0, Validators.required],
      Medications: this.fb.array([]),
    });

    // Load doctors and medications
    this.loadDoctors();
    this.loadMedications();

    // Get patient ID and referral ID from route query params
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        this.patientId = +params['patientId'];
        this.prescriptionForm.patchValue({ PatientId: this.patientId });
        this.loadPatientName(this.patientId);
      }
      if (params['referralId']) {
        this.referralId = +params['referralId'];
        this.prescriptionForm.patchValue({ ReferralId: this.referralId });
        this.loadReferralDetails(this.referralId);
      }
    });
  }

  /**
   * Load patient name from patient service
   */
  private loadPatientName(patientId: number): void {
    this.patientService.loadById(patientId);
    // Get patient name from service
    const patient = this.patientService.selected();
    if (patient) {
      this.patientName.set(patient.Name || `Patient #${patientId}`);
    }
  }

  /**
   * Load referral details from API
   */
  private loadReferralDetails(referralId: number): void {
    this.referralLoading.set(true);
    this.http.get<Referral>(`${API_BASE_URL}/referrals/${referralId}`).subscribe({
      next: (referral) => {
        this.referral.set(referral);
        this.referralLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading referral:', err);
        this.referralLoading.set(false);
      },
    });
  }

  /**
   * Load doctors from API
   */
  private loadDoctors(): void {
    this.doctorsLoading.set(true);
    this.http.get<Doctor[]>(`${API_BASE_URL}/doctors`).subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.doctorsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading doctors:', err);
        this.doctorsLoading.set(false);
      },
    });
  }

  /**
   * Load medications from API
   */
  private loadMedications(): void {
    this.medicationsLoading.set(true);
    this.http.get<Medication[]>(`${API_BASE_URL}/pharmacy/medications`).subscribe({
      next: (medications) => {
        const withLabels = medications.map(m => ({
          ...m,
          stockStatusLabel: this.getStockStatusLabel(m.StockStatus),
        }));
        this.allMedications.set(withLabels);
        this.medicationsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading medications:', err);
        this.medicationsLoading.set(false);
      },
    });
  }

  /**
   * Get human-readable stock status label
   */
  getStockStatusLabel(status?: string): string {
    switch (status) {
      case 'InStock':
        return '✅ In Stock';
      case 'LowStock':
        return '⚠️ Low Stock';
      case 'OutOfStock':
        return '❌ Out of Stock';
      case 'Discontinued':
        return '🚫 Discontinued';
      default:
        return 'Unknown';
    }
  }

  /**
   * Handle medication search input change
   */
  onMedicationSearchChange(value: string): void {
    this.medicationSearch.set(value);
  }

  /**
   * Get medications form array
   */
  get medicationsArray(): FormArray {
    return this.prescriptionForm.get('Medications') as FormArray;
  }

  /**
   * Add medication to prescription
   */
  addMedication(medication: MedicationOption): void {
    const medicationGroup = this.fb.group({
      medication_id: [medication.MedicationId, Validators.required],
      Name: [medication.Name, Validators.required],
      Dosage: [medication.Dosage, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      frequency: ['Once daily', Validators.required],
      instructions: [''],
      StockStatus: [medication.StockStatus],
    });

    this.medicationsArray.push(medicationGroup);
    this.medicationSearch.set(''); // Clear search
  }

  /**
   * Remove medication from prescription
   */
  removeMedication(index: number): void {
    this.medicationsArray.removeAt(index);
  }

  /**
   * Submit prescription creation form
   */
  onSubmit(): void {
    if (this.prescriptionForm.invalid) {
      this.error.set('Please fill in all required fields');
      return;
    }

    if (this.medicationsArray.length === 0) {
      this.error.set('Please add at least one medication');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formData = this.prescriptionForm.value;

    // Transform medications to match API expectations
    const medications = formData.Medications.map((med: any) => ({
      medication_id: med.medication_id,
      quantity: med.quantity,
      frequency: med.frequency,
      instructions: med.instructions || '',
    }));

    // Transform form data to match API expectations
    const prescriptionData = {
      PatientId: formData.PatientId,
      PrescribingDoctorId: formData.PrescribingDoctorId,
      ReferralId: formData.ReferralId || null,
      Status: formData.Status,
      RefillsAllowed: formData.RefillsAllowed,
      RefillsRemaining: formData.RefillsAllowed,
      Medications: medications,
    };

    // Create prescription
    this.pharmacyService.createPrescription(prescriptionData).subscribe({
      next: (prescription) => {
        // Success - redirect immediately, update stock in background
        this.success.set(true);
        this.loading.set(false);
        console.log('✅ Prescription created successfully:', prescription);

        // Update stock levels first, then redirect
        if (medications.length === 0) {
          // No medications to update, redirect immediately
          this.redirectToPatient();
        } else {
          // Update stock levels in background (non-blocking)
          this.updateMedicationStock(medications);
        }
      },
      error: (err) => {
        const errorMsg = err.error?.detail || err.message || 'Failed to create prescription';
        this.error.set(errorMsg);
        this.loading.set(false);
        console.error('❌ Error creating prescription:', err);
      },
    });
  }

  /**
   * Update medication stock levels after prescription creation
   */
  private updateMedicationStock(medications: any[]): void {
    let completed = 0;

    medications.forEach(med => {
      // First fetch current medication to get stock level
      this.http.get<Medication>(`${API_BASE_URL}/pharmacy/medications/${med.medication_id}`)
        .subscribe({
          next: (medication) => {
            const newStockLevel = Math.max(0, medication.StockLevel - med.quantity);

            // Update stock via gateway API
            this.http.patch(
              `${API_BASE_URL}/pharmacy/medications/${med.medication_id}`,
              { StockLevel: newStockLevel }
            ).subscribe({
              next: () => {
                completed++;
                console.log(`✅ Stock updated for medication ${med.medication_id}: ${medication.StockLevel} - ${med.quantity} = ${newStockLevel}`);
                if (completed === medications.length) {
                  // All stock updates complete - redirect to patient
                  this.redirectToPatient();
                }
              },
              error: (err) => {
                console.error(`❌ Error updating stock for medication ${med.medication_id}:`, err);
                completed++;
                if (completed === medications.length) {
                  // Continue anyway if stock update fails
                  this.redirectToPatient();
                }
              },
            });
          },
          error: (err) => {
            console.error(`❌ Error fetching medication ${med.medication_id}:`, err);
            completed++;
            if (completed === medications.length) {
              // Continue anyway if fetch fails
              this.redirectToPatient();
            }
          },
        });
    });
  }

  /**
   * Redirect to patient details page and force refresh
   */
  private redirectToPatient(): void {
    this.success.set(true);
    this.loading.set(false);

    console.log('🔄 Redirecting to patient details with refresh signal');

    // Show success message for 2 seconds before redirecting
    // This gives user time to see the confirmation
    setTimeout(() => {
      this.router.navigate(['/patients', this.patientId], {
        state: { refreshPrescriptions: true }
      });
    }, 2000);
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    if (this.patientId) {
      this.router.navigate(['/patients', this.patientId]);
    } else {
      this.router.navigate(['/patients']);
    }
  }
}
