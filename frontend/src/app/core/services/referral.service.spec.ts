import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import { Referral, ReferralCreate } from '../models/referral.model';
import { ReferralService } from './referral.service';

describe('ReferralService', () => {
  let service: ReferralService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/referrals`;

  const mockReferral: Referral = {
    ReferralId: 1,
    PatientId: 10,
    ReferringDoctorId: 2,
    SpecialistId: 3,
    Reason: 'Checkup',
    Priority: 'Routine',
    Status: 'Draft',
    CreatedAt: '2026-01-01T00:00:00Z',
    UpdatedAt: '2026-01-01T00:00:00Z',
  };

  const mockReferrals: Referral[] = [mockReferral];

  const mockCreate: ReferralCreate = {
    PatientId: 10,
    ReferringDoctorId: 2,
    SpecialistId: 3,
    Reason: 'Checkup',
    Priority: 'Routine',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ReferralService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load all referrals', () => {
    service.loadAll();

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mockReferrals);

    expect(service.referrals()).toEqual(mockReferrals);
  });

  it('should load referrals by patient', () => {
    service.loadByPatient(10);

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.params.get('patientId')).toBe('10');
    req.flush(mockReferrals);

    expect(service.referrals()).toEqual(mockReferrals);
  });

  it('should create a referral', () => {
    service.create(mockCreate).subscribe((r) => {
      expect(r).toEqual(mockReferral);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCreate);
    req.flush(mockReferral);
  });

  it('should submit a referral and update the referrals signal', () => {
    service.referrals.set(mockReferrals);
    const updated: Referral = { ...mockReferral, Status: 'Submitted' };

    service.submit(1).subscribe((r) => {
      expect(r).toEqual(updated);
    });

    const req = httpMock.expectOne(`${base}/1/submit`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(updated);

    expect(service.referrals()).toEqual([updated]);
  });

  it('should accept a referral and update the referrals signal', () => {
    service.referrals.set(mockReferrals);
    const updated: Referral = { ...mockReferral, Status: 'Accepted' };

    service.accept(1).subscribe((r) => {
      expect(r).toEqual(updated);
    });

    const req = httpMock.expectOne(`${base}/1/accept`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);

    expect(service.referrals()).toEqual([updated]);
  });

  it('should reject a referral and update the referrals signal', () => {
    service.referrals.set(mockReferrals);
    const updated: Referral = { ...mockReferral, Status: 'Rejected' };

    service.reject(1).subscribe((r) => {
      expect(r).toEqual(updated);
    });

    const req = httpMock.expectOne(`${base}/1/reject`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);

    expect(service.referrals()).toEqual([updated]);
  });

  it('should complete a referral and update the referrals signal', () => {
    service.referrals.set(mockReferrals);
    const updated: Referral = { ...mockReferral, Status: 'Completed' };

    service.complete(1).subscribe((r) => {
      expect(r).toEqual(updated);
    });

    const req = httpMock.expectOne(`${base}/1/complete`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);

    expect(service.referrals()).toEqual([updated]);
  });

  it('should not modify unrelated referrals when applying an update', () => {
    const other: Referral = { ...mockReferral, ReferralId: 2 };
    service.referrals.set([mockReferral, other]);
    const updated: Referral = { ...mockReferral, Status: 'Submitted' };

    service.submit(1).subscribe();

    const req = httpMock.expectOne(`${base}/1/submit`);
    req.flush(updated);

    expect(service.referrals()).toEqual([updated, other]);
  });
});
