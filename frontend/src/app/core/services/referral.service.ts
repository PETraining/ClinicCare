import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

import { API_BASE_URL } from '../config';
import { Referral, ReferralCreate } from '../models/referral.model';

@Injectable({ providedIn: 'root' })
export class ReferralService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/referrals`;

  referrals = signal<Referral[]>([]);

  loadAll(): void {
    this.http.get<Referral[]>(this.base).subscribe((r) => this.referrals.set(r));
  }

  loadByPatient(patientId: number): void {
    this.http
      .get<Referral[]>(this.base, { params: { patientId } })
      .subscribe((r) => this.referrals.set(r));
  }

  listByPatient(patientId: number) {
    return this.http.get<Referral[]>(this.base, { params: { patientId } });
  }

  get(referralId: number) {
    return this.http.get<Referral>(`${this.base}/${referralId}`);
  }

  create(payload: ReferralCreate) {
    return this.http.post<Referral>(this.base, payload);
  }

  private transition(id: number, action: 'submit' | 'accept' | 'reject' | 'complete') {
    return this.http
      .patch<Referral>(`${this.base}/${id}/${action}`, {})
      .pipe(tap((updated) => this.applyUpdate(updated)));
  }

  private applyUpdate(updated: Referral): void {
    this.referrals.update((list) => list.map((r) => (r.ReferralId === updated.ReferralId ? updated : r)));
  }

  submit(id: number) {
    return this.transition(id, 'submit');
  }

  accept(id: number) {
    return this.transition(id, 'accept');
  }

  reject(id: number) {
    return this.transition(id, 'reject');
  }

  complete(id: number) {
    return this.transition(id, 'complete');
  }
}
