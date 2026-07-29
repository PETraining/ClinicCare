import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../config';
import { Doctor } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/doctors`;

  doctors = signal<Doctor[]>([]);

  search(specialty?: string): void {
    this.http
      .get<Doctor[]>(this.base, { params: specialty ? { specialty } : {} })
      .subscribe((r) => this.doctors.set(r));
  }
}
