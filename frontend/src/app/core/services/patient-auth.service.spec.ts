import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PatientAuthService } from './patient-auth.service';
import { API_BASE_URL } from '../config';

const STORAGE_KEY = 'referraliq_patient_portal_session';
const CLINICIAN_KEY = 'referraliq_demo_user';

describe('PatientAuthService', () => {
  describe('with no prior session in localStorage', () => {
    let service: PatientAuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      localStorage.clear();
      TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
      service = TestBed.inject(PatientAuthService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
      localStorage.clear();
    });

    it('isAuthenticated is false when localStorage is empty', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('login() calls GET /api/patients/{id} and writes session to localStorage', fakeAsync(() => {
      service.login(42).subscribe();

      const req = httpMock.expectOne(`${API_BASE_URL}/patients/42`);
      expect(req.request.method).toBe('GET');
      req.flush({ PatientId: 42, Name: 'Alice Smith' });
      tick();

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual({ patientId: 42, patientName: 'Alice Smith' });
    }));

    it('login() sets the session signal so isAuthenticated becomes true', fakeAsync(() => {
      service.login(42).subscribe();
      httpMock.expectOne(`${API_BASE_URL}/patients/42`).flush({ PatientId: 42, Name: 'Alice Smith' });
      tick();

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentPatient()?.patientId).toBe(42);
    }));

    it('logout() clears localStorage and resets the session signal to null', fakeAsync(() => {
      service.login(42).subscribe();
      httpMock.expectOne(`${API_BASE_URL}/patients/42`).flush({ PatientId: 42, Name: 'Alice' });
      tick();

      service.logout();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.currentPatient()).toBeNull();
    }));

    it('login() does not write to the clinician session key', fakeAsync(() => {
      service.login(1).subscribe();
      httpMock.expectOne(`${API_BASE_URL}/patients/1`).flush({ PatientId: 1, Name: 'X' });
      tick();

      expect(localStorage.getItem(CLINICIAN_KEY)).toBeNull();
    }));
  });

  describe('with an existing session already in localStorage', () => {
    let service: PatientAuthService;

    beforeEach(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ patientId: 7, patientName: 'Bob' }));
      TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
      service = TestBed.inject(PatientAuthService);
    });

    afterEach(() => localStorage.clear());

    it('rehydrates the session from localStorage on construction', () => {
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.currentPatient()).toEqual({ patientId: 7, patientName: 'Bob' });
    });
  });
});
