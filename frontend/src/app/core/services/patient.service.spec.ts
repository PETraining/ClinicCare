import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PatientService } from './patient.service';
import { API_BASE_URL } from '../config';
import { Insurance } from '../models/patient.model';

describe('PatientService — Insurance CRUD', () => {
  let service: PatientService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PatientService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('createInsurance()', () => {
    it('POST to /api/patients/{id}/insurance with payload', (done) => {
      const payload = {
        InsurerName: 'Test Insurer',
        PolicyNumber: 'POL-123',
        GroupNumber: 'GRP-01',
        MemberId: 'MEM-456',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      };

      service.createInsurance(1, payload).subscribe({
        next: (result) => {
          expect(result.InsurerName).toBe('Test Insurer');
          expect(result.InsuranceId).toBe(1);
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({
        InsuranceId: 1,
        PatientId: 1,
        ...payload,
      });
    });

    it('updates selected signal with insurance record on success', (done) => {
      service.selected.set({
        PatientId: 1,
        Name: 'Test Patient',
        DOB: '1990-01-01',
        Gender: 'Male',
        allergies: [],
        conditions: [],
        medications: [],
        insurance: [],
      });

      const payload = {
        InsurerName: 'Test Insurer',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      };

      service.createInsurance(1, payload).subscribe(() => {
        const selectedPatient = service.selected();
        expect(selectedPatient?.insurance.length).toBe(1);
        expect(selectedPatient?.insurance[0].InsurerName).toBe('Test Insurer');
        done();
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance`);
      req.flush({
        InsuranceId: 1,
        PatientId: 1,
        ...payload,
      });
    });
  });

  describe('updateInsurance()', () => {
    it('PUT to /api/patients/{id}/insurance/{insuranceId} with payload', (done) => {
      const payload = {
        InsurerName: 'Updated Insurer',
        PolicyNumber: 'POL-456',
        GroupNumber: null,
        MemberId: 'MEM-789',
        EffectiveDate: '2026-06-01',
        TerminationDate: null,
      };

      service.updateInsurance(1, 1, payload).subscribe({
        next: (result) => {
          expect(result.InsurerName).toBe('Updated Insurer');
          expect(result.PolicyNumber).toBe('POL-456');
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({
        InsuranceId: 1,
        PatientId: 1,
        ...payload,
      });
    });

    it('updates selected signal with new values on success', (done) => {
      const originalInsurance: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Old Insurer',
        PolicyNumber: 'OLD-POL',
        GroupNumber: 'OLD-GRP',
        MemberId: 'OLD-MEM',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };

      service.selected.set({
        PatientId: 1,
        Name: 'Test Patient',
        DOB: '1990-01-01',
        Gender: 'Male',
        allergies: [],
        conditions: [],
        medications: [],
        insurance: [originalInsurance],
      });

      const updatedPayload = {
        InsurerName: 'New Insurer',
        PolicyNumber: 'NEW-POL',
        GroupNumber: null,
        MemberId: 'NEW-MEM',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      };

      service.updateInsurance(1, 1, updatedPayload).subscribe(() => {
        const selectedPatient = service.selected();
        expect(selectedPatient?.insurance[0].InsurerName).toBe('New Insurer');
        expect(selectedPatient?.insurance[0].PolicyNumber).toBe('NEW-POL');
        expect(selectedPatient?.insurance[0].GroupNumber).toBeNull();
        done();
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/1`);
      req.flush({
        InsuranceId: 1,
        PatientId: 1,
        ...updatedPayload,
      });
    });

    it('handles full-replace semantics (nulls optional fields)', (done) => {
      const originalInsurance: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Test Insurer',
        PolicyNumber: 'POL-123',
        GroupNumber: 'GRP-KEEP',
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: '2026-12-31',
      };

      service.selected.set({
        PatientId: 1,
        Name: 'Test Patient',
        DOB: '1990-01-01',
        Gender: 'Male',
        allergies: [],
        conditions: [],
        medications: [],
        insurance: [originalInsurance],
      });

      const payloadWithoutOptional = {
        InsurerName: 'Test Insurer',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };

      service.updateInsurance(1, 1, payloadWithoutOptional).subscribe(() => {
        const selectedPatient = service.selected();
        expect(selectedPatient?.insurance[0].GroupNumber).toBeNull();
        expect(selectedPatient?.insurance[0].TerminationDate).toBeNull();
        done();
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/1`);
      req.flush({
        InsuranceId: 1,
        PatientId: 1,
        ...payloadWithoutOptional,
      });
    });
  });

  describe('deleteInsurance()', () => {
    it('DELETE to /api/patients/{id}/insurance/{insuranceId}', (done) => {
      service.deleteInsurance(1, 1).subscribe({
        next: () => {
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('removes insurance record from selected signal on success', (done) => {
      const insurance: Insurance = {
        InsuranceId: 1,
        PatientId: 1,
        InsurerName: 'Test Insurer',
        PolicyNumber: 'POL-123',
        GroupNumber: null,
        MemberId: 'MEM-456',
        EffectiveDate: '2025-01-01',
        TerminationDate: null,
      };

      service.selected.set({
        PatientId: 1,
        Name: 'Test Patient',
        DOB: '1990-01-01',
        Gender: 'Male',
        allergies: [],
        conditions: [],
        medications: [],
        insurance: [insurance],
      });

      service.deleteInsurance(1, 1).subscribe(() => {
        const selectedPatient = service.selected();
        expect(selectedPatient?.insurance.length).toBe(0);
        done();
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/1`);
      req.flush(null);
    });

    it('handles 204 No Content response', (done) => {
      service.selected.set({
        PatientId: 1,
        Name: 'Test Patient',
        DOB: '1990-01-01',
        Gender: 'Male',
        allergies: [],
        conditions: [],
        medications: [],
        insurance: [
          {
            InsuranceId: 1,
            PatientId: 1,
            InsurerName: 'Test',
            PolicyNumber: 'POL',
            GroupNumber: null,
            MemberId: 'MEM',
            EffectiveDate: '2025-01-01',
            TerminationDate: null,
          },
        ],
      });

      service.deleteInsurance(1, 1).subscribe({
        next: () => {
          expect(service.selected()?.insurance.length).toBe(0);
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/1`);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('Error Handling', () => {
    it('createInsurance() propagates 404 error', (done) => {
      service.createInsurance(999, {
        InsurerName: 'Test',
        PolicyNumber: 'POL',
        GroupNumber: null,
        MemberId: 'MEM',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/999/insurance`);
      req.flush({ detail: 'Patient not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('updateInsurance() propagates 404 error for stale insurance ID', (done) => {
      service.updateInsurance(1, 999, {
        InsurerName: 'Test',
        PolicyNumber: 'POL',
        GroupNumber: null,
        MemberId: 'MEM',
        EffectiveDate: '2026-01-01',
        TerminationDate: null,
      }).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/999`);
      req.flush({ detail: 'Insurance not found for patient 1' }, { status: 404, statusText: 'Not Found' });
    });

    it('deleteInsurance() propagates 404 error', (done) => {
      service.deleteInsurance(1, 999).subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        },
      });

      const req = httpTesting.expectOne(`${API_BASE_URL}/patients/1/insurance/999`);
      req.flush({ detail: 'Insurance not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
