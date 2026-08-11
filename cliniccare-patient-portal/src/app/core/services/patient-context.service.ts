import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'patient_portal_demo_patient_id';

export interface DemoPatient {
  id: number;
  name: string;
}

// Matches PatientId 1-5 in the seeded demo data used across the document/questionnaire services.
export const DEMO_PATIENTS: DemoPatient[] = [
  { id: 1, name: 'Anjali Verma' },
  { id: 2, name: 'Rajesh Kumar' },
  { id: 3, name: 'Divya Menon' },
  { id: 4, name: 'Suresh Iyengar' },
  { id: 5, name: 'Neha Bhatt' },
];

@Injectable({ providedIn: 'root' })
export class PatientContextService {
  private stored = localStorage.getItem(STORAGE_KEY);
  patientId = signal<number | null>(this.stored ? Number(this.stored) : null);

  get currentPatientName(): string | null {
    const id = this.patientId();
    return DEMO_PATIENTS.find((p) => p.id === id)?.name ?? null;
  }

  select(id: number): void {
    localStorage.setItem(STORAGE_KEY, String(id));
    this.patientId.set(id);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.patientId.set(null);
  }
}
