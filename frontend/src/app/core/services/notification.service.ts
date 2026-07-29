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
}
