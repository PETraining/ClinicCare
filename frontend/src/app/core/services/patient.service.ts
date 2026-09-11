import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

import { API_BASE_URL } from '../config';
import { Insurance, InsuranceCreate, Patient, PatientDetail } from '../models/patient.model';

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

  createInsurance(patientId: number, payload: InsuranceCreate) {
    return this.http
      .post<Insurance>(`${this.base}/${patientId}/insurance`, payload)
      .pipe(tap((created) => this.applyInsuranceCreate(created)));
  }

  updateInsurance(patientId: number, insuranceId: number, payload: InsuranceCreate) {
    return this.http
      .put<Insurance>(`${this.base}/${patientId}/insurance/${insuranceId}`, payload)
      .pipe(tap((updated) => this.applyInsuranceUpdate(updated)));
  }

  deleteInsurance(patientId: number, insuranceId: number) {
    return this.http
      .delete<void>(`${this.base}/${patientId}/insurance/${insuranceId}`)
      .pipe(tap(() => this.applyInsuranceDelete(insuranceId)));
  }

  private applyInsuranceCreate(created: Insurance): void {
    this.selected.update((p) => (p ? { ...p, insurance: [...p.insurance, created] } : p));
  }

  private applyInsuranceUpdate(updated: Insurance): void {
    this.selected.update((p) =>
      p
        ? {
            ...p,
            insurance: p.insurance.map((i) => (i.InsuranceId === updated.InsuranceId ? updated : i)),
          }
        : p,
    );
  }

  private applyInsuranceDelete(insuranceId: number): void {
    this.selected.update((p) =>
      p ? { ...p, insurance: p.insurance.filter((i) => i.InsuranceId !== insuranceId) } : p,
    );
  }
}
