import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lab-container">
      <h1>Laboratory Orders</h1>
      <div class="info-box">
        <p>Lab Test Management</p>
        <p>View and manage laboratory test orders and results</p>
      </div>
    </div>
  `,
  styles: ['.lab-container { padding: 20px; } .info-box { background: #f5f5f5; padding: 20px; border-radius: 4px; }']
})
export class LabDashboardComponent {}
