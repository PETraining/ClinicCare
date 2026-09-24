import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { PatientService } from '../../core/services/patient.service';
import { Prescription } from '../../core/models/pharmacy.model';
import { API_BASE_URL } from '../../core/config';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css'],
})
export class PrescriptionListComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private http = inject(HttpClient);
  private patientService = inject(PatientService);

  // Expose service signals
  prescriptions = this.pharmacyService.prescriptions;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  // Filter state
  statusFilter = signal<string>('');
  patientNameFilter = signal<string>('');
  patientIdFilter = signal<string>('');
  referralIdFilter = signal<string>('');

  ngOnInit(): void {
    this.loadPrescriptions();
  }

  /**
   * Load prescriptions with current filters
   */
  loadPrescriptions(): void {
    const filters: any = {};

    if (this.statusFilter()) {
      filters.status = this.statusFilter();
    }
    if (this.patientIdFilter()) {
      filters.patientId = parseInt(this.patientIdFilter(), 10);
    }
    if (this.referralIdFilter()) {
      filters.referralId = parseInt(this.referralIdFilter(), 10);
    }

    this.pharmacyService.loadPrescriptions(filters);
  }

  /**
   * Get filtered prescriptions
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

    return filtered.sort(
      (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    );
  }

  /**
   * Apply filters (for client-side filtering like patient name)
   */
  applyFilters(): void {
    // Patient name filtering happens in the getter, just mark prescriptions as needing refresh
    // This triggers change detection
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.statusFilter.set('');
    this.patientNameFilter.set('');
    this.patientIdFilter.set('');
    this.referralIdFilter.set('');
    this.loadPrescriptions();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!(this.statusFilter() || this.patientNameFilter() || this.patientIdFilter() || this.referralIdFilter());
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
