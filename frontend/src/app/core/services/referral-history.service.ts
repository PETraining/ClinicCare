import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { ReferralStatusHistory } from '../models/referral-history.model';

@Injectable({ providedIn: 'root' })
export class ReferralHistoryService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/referrals`;

  history = signal<ReferralStatusHistory[]>([]);

  loadForReferral(referralId: number): void {
    this.http
      .get<ReferralStatusHistory[]>(`${this.base}/${referralId}/history`)
      .subscribe((r) => this.history.set(r));
  }
}
