import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lab-tech-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lab-tech-container">
      <h1>Lab Technician Portal</h1>
      <div class="info-box">
        <p>Sample Processing & Result Entry</p>
        <p>Process lab samples and enter test results</p>
      </div>
    </div>
  `,
  styles: ['.lab-tech-container { padding: 20px; } .info-box { background: #f5f5f5; padding: 20px; border-radius: 4px; }']
})
export class LabTechDashboardComponent {}
