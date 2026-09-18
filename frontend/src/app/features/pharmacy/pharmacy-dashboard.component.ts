import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pharmacy-container">
      <h1>Pharmacy Management</h1>
      <div class="info-box">
        <p>Prescription Management System</p>
        <p>Manage patient prescriptions and medications</p>
      </div>
    </div>
  `,
  styles: ['.pharmacy-container { padding: 20px; } .info-box { background: #f5f5f5; padding: 20px; border-radius: 4px; }']
})
export class PharmacyDashboardComponent {}
