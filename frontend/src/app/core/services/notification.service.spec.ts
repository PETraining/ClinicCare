import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import { NotificationEvent } from '../models/notification.model';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/notifications`;

  const mockEvents: NotificationEvent[] = [
    {
      NotificationId: 1,
      ReferralId: 5,
      EventType: 'Submitted',
      Timestamp: '2026-01-01T00:00:00Z',
      Message: 'Referral submitted',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load notifications by referral', () => {
    service.loadByReferral(5);

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('referralId')).toBe('5');
    req.flush(mockEvents);

    expect(service.notifications()).toEqual(mockEvents);
  });
});
