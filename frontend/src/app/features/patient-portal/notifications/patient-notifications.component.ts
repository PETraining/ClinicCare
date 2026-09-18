import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

interface Notification {
  NotificationId: number;
  PatientId: number;
  ReferralId?: number;
  Title: string;
  Message: string;
  Type: string;
  Timestamp: string;
  Read: boolean;
}

@Component({
  selector: 'app-patient-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div class="notifications-header">
        <h2>Notifications</h2>
        <span class="badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
      </div>
      
      <div *ngIf="loading()" class="loading">
        <p>Loading notifications...</p>
      </div>
      
      <div *ngIf="error()" class="error-message">
        {{ error() }}
      </div>
      
      <div *ngIf="!loading() && notifications().length > 0" class="notifications-list">
        <div *ngFor="let notif of notifications()" 
             [ngClass]="{'notification-card': true, 'unread': !notif.Read}"
             (click)="markAsRead(notif)">
          <div class="notification-header">
            <h3>{{ notif.Title }}</h3>
            <span class="notification-type" [ngClass]="notif.Type?.toLowerCase()">
              {{ notif.Type }}
            </span>
          </div>
          <p class="notification-message">{{ notif.Message }}</p>
          <div class="notification-footer">
            <span class="timestamp">{{ notif.Timestamp | date: 'short' }}</span>
            <span class="status" *ngIf="!notif.Read">Unread</span>
          </div>
        </div>
      </div>
      
      <div *ngIf="!loading() && notifications().length === 0 && !error()" class="no-data">
        <p>You're all caught up! No new notifications.</p>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .notifications-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .badge {
      background: #d32f2f;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    .loading, .error-message, .no-data {
      padding: 20px;
      background: white;
      border-radius: 4px;
      text-align: center;
    }
    .error-message {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef5350;
    }
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .notification-card {
      background: white;
      border-left: 4px solid #ccc;
      border-radius: 4px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .notification-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .notification-card.unread {
      border-left-color: #1976d2;
      background: #f5f9ff;
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 8px;
    }
    .notification-header h3 {
      margin: 0;
      font-size: 16px;
    }
    .notification-type {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .notification-type.alert {
      background: #ffcdd2;
      color: #c62828;
    }
    .notification-type.info {
      background: #e3f2fd;
      color: #1976d2;
    }
    .notification-type.success {
      background: #c8e6c9;
      color: #2e7d32;
    }
    .notification-type.reminder {
      background: #fff3e0;
      color: #e65100;
    }
    .notification-message {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
    .notification-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #999;
    }
    .status {
      background: #e0e0e0;
      padding: 2px 6px;
      border-radius: 2px;
      font-weight: bold;
      color: #666;
    }
  `]
})
export class PatientNotificationsComponent implements OnInit {
  private http = inject(HttpClient);
  
  notifications = signal<Notification[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.loadNotifications();
  }

  get unreadCount(): any {
    return signal(this.notifications().filter(n => !n.Read).length);
  }

  private loadNotifications(): void {
    const sessionStr = localStorage.getItem('referraliq_patient_portal_session');
    if (!sessionStr) {
      this.error.set('Patient session not found');
      this.loading.set(false);
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      const patientId = session.patientId;
      
      this.http.get<Notification[]>(`http://localhost:8000/api/notifications?patientId=${patientId}`)
        .subscribe({
          next: (notifs) => {
            this.notifications.set(notifs || []);
            this.loading.set(false);
            this.error.set('');
          },
          error: (err) => {
            console.error('Failed to load notifications', err);
            this.error.set('Failed to load notifications');
            this.loading.set(false);
          }
        });
    } catch (err) {
      this.error.set('Invalid patient session');
      this.loading.set(false);
    }
  }

  markAsRead(notification: Notification): void {
    if (!notification.Read) {
      // Update locally for UI feedback
      const updated = [...this.notifications()];
      const index = updated.findIndex(n => n.NotificationId === notification.NotificationId);
      if (index >= 0) {
        updated[index] = { ...notification, Read: true };
        this.notifications.set(updated);
      }
      // In production, make API call to mark as read
      // this.http.patch(`http://localhost:8000/api/notifications/${notification.NotificationId}`, { Read: true }).subscribe();
    }
  }
}
