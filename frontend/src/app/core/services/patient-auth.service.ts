import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { API_BASE_URL } from '../config';
import { PatientSession } from '../models/patient-session.model';

// Distinct from the clinician session key (`referraliq_demo_user`) so the two
// identity models never collide in the same browser storage.
const STORAGE_KEY = 'referraliq_patient_portal_session';

function readSession(): PatientSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PatientSession;
  } catch {
    return null;
  }
}

/**
 * Password-less "pick your identity" session for the patient-facing portal.
 * This is NOT real authentication — there is no credential model on the
 * Patient entity, and none should be added. See context-map Open Question 2.
 */
@Injectable({ providedIn: 'root' })
export class PatientAuthService {
  private http = inject(HttpClient);

  private session = signal<PatientSession | null>(readSession());

  currentPatient = this.session.asReadonly();
  isAuthenticated = computed(() => this.session() !== null);

  /** Looks up the patient's display name via the existing GET /api/patients/{id} endpoint. */
  login(patientId: number): Observable<PatientSession> {
    return this.http.get<{ PatientId: number; Name: string }>(`${API_BASE_URL}/patients/${patientId}`).pipe(
      map((patient) => ({ patientId: patient.PatientId, patientName: patient.Name })),
      tap((patientSession) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patientSession));
        this.session.set(patientSession);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }
}
