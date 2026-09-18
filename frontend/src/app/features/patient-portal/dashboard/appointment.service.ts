import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Appointment {
  Id: number;
  PatientId: number;
  DoctorId: number;
  DoctorName: string;
  ScheduledDate: string;
  AppointmentType: string;
  Location: string;
  Status: string;
  Notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  appointments$ = this.appointmentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadByPatient(patientId: number): void {
    this.http.get<Appointment[]>(`/api/appointments`, {
      params: { patientId: patientId.toString() }
    }).subscribe({
      next: (appointments) => {
        this.appointmentsSubject.next(appointments);
      }
    });
  }

  getAppointments(): Observable<Appointment[]> {
    return this.appointments$;
  }
}
