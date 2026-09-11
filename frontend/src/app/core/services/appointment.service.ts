import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Appointment, AppointmentCreate } from '../models/appointment.model';
import { API_BASE_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/referrals`;

  appointments = signal<Appointment[]>([]);

  listByReferral(referralId: number): void {
    this.http.get<Appointment[]>(`${this.base}/${referralId}/appointments`)
      .subscribe(appointments => this.appointments.set(appointments));
  }

  create(referralId: number, payload: AppointmentCreate): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/${referralId}/appointments`, payload)
      .pipe(tap(apt => this.appointments.update(appts => [...appts, apt])));
  }

  reschedule(appointmentId: number, payload: AppointmentCreate): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/appointments/${appointmentId}/reschedule`, payload)
      .pipe(tap(apt => this.appointments.update(appts => appts.map(a => a.AppointmentId === appointmentId ? apt : a))));
  }

  complete(appointmentId: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/appointments/${appointmentId}/complete`, {})
      .pipe(tap(apt => this.appointments.update(appts => appts.map(a => a.AppointmentId === appointmentId ? apt : a))));
  }

  cancel(appointmentId: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/appointments/${appointmentId}/cancel`, {})
      .pipe(tap(apt => this.appointments.update(appts => appts.map(a => a.AppointmentId === appointmentId ? apt : a))));
  }
}
