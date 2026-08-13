import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { Appointment } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/appointments`;

  appointments = signal<Appointment[]>([]);

  loadByPatient(patientId: number): void {
    this.http
      .get<Appointment[]>(this.base, { params: { patientId } })
      .subscribe((r) => this.appointments.set(r));
  }
}
