import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config';
import { Appointment } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/appointments`;

  appointments = signal<Appointment[]>([]);

  loadMyAppointments(): void {
    this.http
      .get<Appointment[]>(`${this.base}/me`)
      .subscribe((list) => this.appointments.set(list));
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.base}/me/${id}`);
  }
}
