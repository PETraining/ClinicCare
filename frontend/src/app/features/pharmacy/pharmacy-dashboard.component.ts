import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { Medication, Prescription } from '../../core/models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pharmacy-dashboard.component.html',
  styleUrls: ['./pharmacy-dashboard.component.css'],
})
export class PharmacyDashboardComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);

  // Expose service signals to template
  medications = this.pharmacyService.medications;
  prescriptions = this.pharmacyService.prescriptions;
  lowStockItems = this.pharmacyService.lowStockItems;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  pendingCount = this.pharmacyService.pendingPrescriptionsCount;
  lowStockCount = this.pharmacyService.lowStockCount;

  ngOnInit(): void {
    // Load all pharmacy data
    this.pharmacyService.refresh();
  }

  /**
   * Get recent prescriptions (last 5)
   */
  get recentPrescriptions(): Prescription[] {
    return this.prescriptions()
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
      .slice(0, 5);
  }

  /**
   * Get critical low-stock items (below 50% of minimum)
   */
  get criticalLowStock(): Medication[] {
    return this.lowStockItems().filter(
      m => m.StockLevel < (m.MinStockLevel * 0.5)
    );
  }
}
