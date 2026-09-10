import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../../../core/services/notification.service';
import { PatientSessionService } from '../../../core/services/patient-session.service';
import { NotificationEvent } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-inbox.component.html',
  styleUrls: ['./notification-inbox.component.css'],
})
export class NotificationInboxComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private sessionService = inject(PatientSessionService);

  notifications = this.notificationService.notifications;
  unreadCount = 0;
  currentPatientId: number | null = null;

  ngOnInit(): void {
    const session = this.sessionService.session();
    if (session && session.patientId) {
      this.currentPatientId = session.patientId;
      this.loadNotifications(session.patientId);
    }
  }

  private loadNotifications(patientId: number): void {
    this.notificationService.loadByPatient(patientId);
    this.updateUnreadCount();
  }

  markAsRead(notification: NotificationEvent): void {
    if (!notification.Read) {
      this.notificationService.markRead(notification.NotificationId);
      this.updateUnreadCount();
    }
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications().filter((n) => !n.Read).length;
  }

  getEventTypeColor(eventType: string): string {
    const colors: Record<string, string> = {
      'Submitted': 'warning',
      'Accepted': 'success',
      'Rejected': 'danger',
      'Completed': 'info',
    };
    return colors[eventType] || 'secondary';
  }
}
