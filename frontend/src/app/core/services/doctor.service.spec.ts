import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import { Doctor } from '../models/doctor.model';
import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/doctors`;

  const mockDoctors: Doctor[] = [
    {
      DoctorId: 1,
      Name: 'Dr. Jane Doe',
      Specialty: 'Cardiology',
      Department: 'Cardio',
      ContactInfo: 'jane@example.com',
      Role: 'Physician',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search with no params and set doctors signal', () => {
    service.search();

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockDoctors);

    expect(service.doctors()).toEqual(mockDoctors);
  });

  it('should search with specialty and role params', () => {
    service.search('Cardiology', 'Physician');

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.params.get('specialty')).toBe('Cardiology');
    expect(req.request.params.get('role')).toBe('Physician');
    req.flush(mockDoctors);

    expect(service.doctors()).toEqual(mockDoctors);
  });

  it('should search with only specialty param', () => {
    service.search('Cardiology');

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.params.get('specialty')).toBe('Cardiology');
    expect(req.request.params.has('role')).toBeFalse();
    req.flush(mockDoctors);
  });

  it('should search with only role param', () => {
    service.search(undefined, 'Physician');

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.params.has('specialty')).toBeFalse();
    expect(req.request.params.get('role')).toBe('Physician');
    req.flush(mockDoctors);
  });
});
