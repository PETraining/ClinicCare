import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import { ClinicalDocument } from '../models/document.model';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/documents`;

  const mockDocuments: ClinicalDocument[] = [
    {
      DocumentId: 1,
      PatientId: 10,
      ReferralId: null,
      Type: 'Lab Report',
      UploadedDate: '2026-01-01',
      FileName: 'report.pdf',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load documents by patient', () => {
    service.loadByPatient(10);

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('patientId')).toBe('10');
    req.flush(mockDocuments);

    expect(service.documents()).toEqual(mockDocuments);
  });

  it('should load documents by referral', () => {
    service.loadByReferral(5);

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('referralId')).toBe('5');
    req.flush(mockDocuments);

    expect(service.documents()).toEqual(mockDocuments);
  });
});
