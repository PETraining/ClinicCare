import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <h2>Notifications & Alerts</h2>
      <p>Important updates and alerts about your care will appear here.</p>
      <div class="placeholder">
        <p>No notifications</p>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .placeholder {
      margin-top: 20px;
      padding: 20px;
      text-align: center;
      background: white;
      border-radius: 4px;
    }
  `]
})
export class PatientNotificationsComponent {}
