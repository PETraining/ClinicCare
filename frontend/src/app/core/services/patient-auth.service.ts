import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config';

export interface PatientLogin {
  patientId: number;
  password: string;
}

export interface PatientAuthResponse {
  patientId: number;
  patientName: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class PatientAuthService {
  private http = HttpClient | undefined;
  private base = `${API_BASE_URL}/patients`;

  isAuthenticated = signal<boolean>(this.hasToken());
  currentPatientId = signal<number | null>(this.getStoredPatientId());
  currentPatientName = signal<string | null>(this.getStoredPatientName());

  constructor(http: HttpClient) {
    this.http = http;
  }

  login(patientId: number, password: string): Observable<PatientAuthResponse> {
    return this.http!.post<PatientAuthResponse>(`${this.base}/login`, {
      patientId,
      password,
    }).pipe(
      tap((response) => {
        this.storeAuth(response);
        this.isAuthenticated.set(true);
        this.currentPatientId.set(response.patientId);
        this.currentPatientName.set(response.patientName);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('patient_token');
    localStorage.removeItem('patient_id');
    localStorage.removeItem('patient_name');
    this.isAuthenticated.set(false);
    this.currentPatientId.set(null);
    this.currentPatientName.set(null);
  }

  demoLogin(patientId: number, patientName: string): void {
    const response: PatientAuthResponse = {
      patientId,
      patientName,
      token: `demo_token_${patientId}`,
    };
    this.storeAuth(response);
    this.isAuthenticated.set(true);
    this.currentPatientId.set(patientId);
    this.currentPatientName.set(patientName);
  }

  private storeAuth(response: PatientAuthResponse): void {
    localStorage.setItem('patient_token', response.token);
    localStorage.setItem('patient_id', response.patientId.toString());
    localStorage.setItem('patient_name', response.patientName);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('patient_token');
  }

  private getStoredPatientId(): number | null {
    const id = localStorage.getItem('patient_id');
    return id ? parseInt(id, 10) : null;
  }

  private getStoredPatientName(): string | null {
    return localStorage.getItem('patient_name');
  }

  getToken(): string | null {
    return localStorage.getItem('patient_token');
  }
}
