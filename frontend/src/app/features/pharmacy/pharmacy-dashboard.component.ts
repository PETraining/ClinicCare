import { Component, OnInit, inject, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { Medication, Prescription } from '../../core/models/pharmacy.model';
import { API_BASE_URL } from '../../core/config';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.css'],
})
export class PharmacyDashboardComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private http = inject(HttpClient);

  // Expose service signals to template
  medications = this.pharmacyService.medications;
  prescriptions = this.pharmacyService.prescriptions;
  lowStockItems = this.pharmacyService.lowStockItems;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  pendingCount = this.pharmacyService.pendingPrescriptionsCount;
  lowStockCount = this.pharmacyService.lowStockCount;

  // Filter state
  patientNameFilter = signal<string>('');
  patientIdFilter = signal<string>('');
  doctorNameFilter = signal<string>('');
  doctorIdFilter = signal<string>('');
  statusFilter = signal<string>('');

  // Maps to store fetched names
  private patientNames = new Map<number, WritableSignal<string>>();
  private doctorNames = new Map<number, WritableSignal<string>>();

  // Refill requests
  refillRequests = signal<any[]>([]);
  pendingRefillRequests = computed(() =>
    this.refillRequests().filter(r => r.Status === 'Pending')
  );

  ngOnInit(): void {
    // Load all pharmacy data
    this.pharmacyService.refresh();
    // Load refill requests
    this.loadRefillRequests();
  }

  /**
   * Load pending refill requests
   */
  private loadRefillRequests(): void {
    this.pharmacyService.getRefillRequests('Pending').subscribe({
      next: (requests) => {
        this.refillRequests.set(requests);
      },
      error: (err) => {
        console.error('Error loading refill requests:', err);
      },
    });
  }

  /**
   * Approve refill request
   */
  approveRefill(refillId: number): void {
    this.pharmacyService.approveRefillRequest(refillId, 'Pharmacist').subscribe({
      next: () => {
        console.log('✅ Refill approved');
        this.loadRefillRequests();
      },
      error: (err) => console.error('Error approving refill:', err),
    });
  }

  /**
   * Fulfill refill request (dispense)
   */
  fulfillRefill(refillId: number): void {
    this.pharmacyService.fulfillRefillRequest(refillId, 'Pharmacist').subscribe({
      next: () => {
        console.log('✅ Refill fulfilled');
        this.loadRefillRequests();
        this.pharmacyService.refresh();
      },
      error: (err) => console.error('Error fulfilling refill:', err),
    });
  }

  /**
   * Reject refill request
   */
  rejectRefill(refillId: number, reason: string = 'Cannot fulfill at this time'): void {
    this.pharmacyService.rejectRefillRequest(refillId, reason, 'Pharmacist').subscribe({
      next: () => {
        console.log('❌ Refill rejected');
        this.loadRefillRequests();
      },
      error: (err) => console.error('Error rejecting refill:', err),
    });
  }

  /**
   * Get filtered prescriptions with patient name and doctor name filters
   */
  get filteredPrescriptions(): Prescription[] {
    let filtered = this.prescriptions();

    // Filter by patient name if specified
    const patientNameSearch = this.patientNameFilter().toLowerCase();
    if (patientNameSearch) {
      filtered = filtered.filter(prescription => {
        const signal = this.patientNames.get(prescription.PatientId);
        if (signal) {
          const name = signal().toLowerCase();
          return name.includes(patientNameSearch);
        }
        return false;
      });
    }

    // Filter by doctor name if specified
    const doctorNameSearch = this.doctorNameFilter().toLowerCase();
    if (doctorNameSearch) {
      filtered = filtered.filter(prescription => {
        const signal = this.doctorNames.get(prescription.PrescribingDoctorId);
        if (signal) {
          const name = signal().toLowerCase();
          return name.includes(doctorNameSearch);
        }
        return false;
      });
    }

    // Filter by patient ID if specified
    if (this.patientIdFilter()) {
      const patientId = parseInt(this.patientIdFilter(), 10);
      filtered = filtered.filter(p => p.PatientId === patientId);
    }

    // Filter by doctor ID if specified
    if (this.doctorIdFilter()) {
      const doctorId = parseInt(this.doctorIdFilter(), 10);
      filtered = filtered.filter(p => p.PrescribingDoctorId === doctorId);
    }

    // Filter by status if specified
    if (this.statusFilter()) {
      filtered = filtered.filter(p => p.Status === this.statusFilter());
    }

    return filtered.sort(
      (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    );
  }

  /**
   * Get recent prescriptions (last 5)
   */
  get recentPrescriptions(): Prescription[] {
    return this.filteredPrescriptions.slice(0, 5);
  }

  /**
   * Get critical low-stock items (below 50% of minimum)
   */
  get criticalLowStock(): Medication[] {
    return this.lowStockItems().filter(
      m => m.StockLevel < (m.MinStockLevel * 0.5)
    );
  }

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

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!(this.patientNameFilter() || this.patientIdFilter() ||
              this.doctorNameFilter() || this.doctorIdFilter() ||
              this.statusFilter());
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.patientNameFilter.set('');
    this.patientIdFilter.set('');
    this.doctorNameFilter.set('');
    this.doctorIdFilter.set('');
    this.statusFilter.set('');
  }
}
