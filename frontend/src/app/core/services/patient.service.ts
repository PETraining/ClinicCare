import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { Patient, PatientDetail } from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/patients`;

  patients = signal<Patient[]>([]);
  selected = signal<PatientDetail | null>(null);

  search(name?: string): void {
    this.http
      .get<Patient[]>(this.base, { params: name ? { name } : {} })
      .subscribe((r) => this.patients.set(r));
  }

  loadById(id: number): void {
    this.http.get<PatientDetail>(`${this.base}/${id}`).subscribe((r) => this.selected.set(r));
  }
}
