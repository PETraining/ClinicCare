import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import { Patient, PatientDetail } from '../models/patient.model';
import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/patients`;

  const mockPatients: Patient[] = [
    { PatientId: 1, Name: 'John Smith', DOB: '1980-01-01', Gender: 'Male' },
  ];

  const mockPatientDetail: PatientDetail = {
    PatientId: 1,
    Name: 'John Smith',
    DOB: '1980-01-01',
    Gender: 'Male',
    allergies: [],
    conditions: [],
    medications: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search with no name param', () => {
    service.search();

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(mockPatients);

    expect(service.patients()).toEqual(mockPatients);
  });

  it('should search with a name param', () => {
    service.search('John');

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.params.get('name')).toBe('John');
    req.flush(mockPatients);

    expect(service.patients()).toEqual(mockPatients);
  });

  it('should load patient by id', () => {
    service.loadById(1);

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPatientDetail);

    expect(service.selected()).toEqual(mockPatientDetail);
  });
});
