import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { Medication } from '../../core/models/pharmacy.model';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory-management.component.html',
  styleUrls: ['./inventory-management.component.css'],
})
export class InventoryManagementComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);

  // Expose service signals to template
  medications = this.pharmacyService.medications;
  lowStockItems = this.pharmacyService.lowStockItems;
  loading = this.pharmacyService.loading;
  error = this.pharmacyService.error;

  // Local state for filtering and editing
  searchQuery = '';
  filterBy: 'all' | 'low-stock' | 'critical' = 'all';
  editingId: number | null = null;
  editingValues: Partial<Medication> = {};

  ngOnInit(): void {
    // Load all medications
    this.pharmacyService.loadMedications();
    this.pharmacyService.loadLowStockItems();
  }

  /**
   * Get filtered medications based on search and filter settings
   */
  get filteredMedications(): Medication[] {
    let filtered = this.medications();

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        m => m.Name.toLowerCase().includes(query) ||
             m.Dosage.toLowerCase().includes(query)
      );
    }

    // Filter by stock level
    if (this.filterBy === 'low-stock') {
      filtered = filtered.filter(m => m.StockLevel < m.MinStockLevel);
    } else if (this.filterBy === 'critical') {
      filtered = filtered.filter(m => m.StockLevel < (m.MinStockLevel * 0.5));
    }

    return filtered.sort((a, b) => a.MedicationId - b.MedicationId);
  }

  /**
   * Get stock status CSS class
   */
  getStockStatus(medication: Medication): string {
    if (medication.StockLevel === 0) return 'out-of-stock';
    if (medication.StockLevel < (medication.MinStockLevel * 0.5)) return 'critical';
    if (medication.StockLevel < medication.MinStockLevel) return 'low';
    return 'healthy';
  }

  /**
   * Get stock status label
   */
  getStockStatusLabel(medication: Medication): string {
    if (medication.StockLevel === 0) return 'OUT OF STOCK';
    if (medication.StockLevel < (medication.MinStockLevel * 0.5)) return 'CRITICAL';
    if (medication.StockLevel < medication.MinStockLevel) return 'LOW STOCK';
    return 'IN STOCK';
  }

  /**
   * Start editing a medication
   */
  startEdit(medication: Medication): void {
    this.editingId = medication.MedicationId;
    this.editingValues = {
      StockLevel: medication.StockLevel,
      MinStockLevel: medication.MinStockLevel,
      UnitPrice: medication.UnitPrice,
    };
  }

  /**
   * Save medication update
   */
  saveEdit(medicationId: number): void {
    if (this.editingValues.StockLevel === undefined ||
        this.editingValues.MinStockLevel === undefined) {
      alert('Please enter valid values');
      return;
    }

    this.pharmacyService
      .updateMedication(medicationId, this.editingValues)
      .subscribe({
        next: () => {
          // Refresh medications and low stock items
          this.pharmacyService.loadMedications();
          this.pharmacyService.loadLowStockItems();
          this.editingId = null;
          this.editingValues = {};
        },
        error: (err) => {
          console.error('Error updating medication:', err);
          alert('Failed to update medication');
        },
      });
  }

  /**
   * Cancel edit
   */
  cancelEdit(): void {
    this.editingId = null;
    this.editingValues = {};
  }

  /**
   * Restock medication
   */
  restock(medication: Medication): void {
    const quantity = prompt(
      `How many units to add to ${medication.Name}?\nCurrent stock: ${medication.StockLevel}`
    );

    if (quantity && !isNaN(Number(quantity))) {
      const newStock = medication.StockLevel + Number(quantity);
      this.pharmacyService
        .updateMedication(medication.MedicationId, { StockLevel: newStock })
        .subscribe({
          next: () => {
            this.pharmacyService.loadMedications();
            this.pharmacyService.loadLowStockItems();
          },
          error: (err) => {
            console.error('Error updating stock:', err);
            alert('Failed to update stock');
          },
        });
    }
  }

  /**
   * Get stock level percentage
   */
  getStockPercentage(medication: Medication): number {
    return Math.min(100, (medication.StockLevel / (medication.MinStockLevel * 2)) * 100);
  }
}
