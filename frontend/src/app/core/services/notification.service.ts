import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { NotificationEvent } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/notifications`;

  notifications = signal<NotificationEvent[]>([]);

  loadByReferral(referralId: number): void {
    this.http
      .get<NotificationEvent[]>(this.base, { params: { referralId } })
      .subscribe((r) => this.notifications.set(r));
  }

  loadByPatient(patientId: number, unreadOnly: boolean = false): void {
    const params: any = { patientId };
    if (unreadOnly) {
      params.unreadOnly = true;
    }
    this.http
      .get<NotificationEvent[]>(this.base, { params })
      .subscribe((r) => this.notifications.set(r));
  }

  markRead(notificationId: number): void {
    this.http
      .patch<NotificationEvent>(`${this.base}/${notificationId}/read`, {})
      .subscribe((updated) => {
        const current = this.notifications();
        const idx = current.findIndex((n) => n.NotificationId === notificationId);
        if (idx !== -1) {
          current[idx] = updated;
          this.notifications.set([...current]);
        }
      });
  }
}
