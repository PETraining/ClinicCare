import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { Prescription } from '../../core/models/pharmacy.model';

@Component({
  selector: 'app-prescription-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css'],
})
export class PrescriptionListComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);

  // Expose service signals
  prescriptions = this.pharmacyService.prescriptions;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  // Filter state
  statusFilter = signal<string>('');
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
    return this.prescriptions().sort(
      (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
    );
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.statusFilter.set('');
    this.patientIdFilter.set('');
    this.referralIdFilter.set('');
    this.loadPrescriptions();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!(this.statusFilter() || this.patientIdFilter() || this.referralIdFilter());
  }
}
