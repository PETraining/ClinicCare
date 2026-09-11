import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import {
  CollectSamplePayload,
  LabOrder,
  LabSample,
  LabStats,
  StatusHistoryEntry,
  SubmitResultPayload,
  TestResult,
  UpdateTestStatusPayload,
} from '../models/lab.model';
import { LabTechService } from './lab-tech.service';

const STAFF_ID_KEY = 'cliniccare_lab_tech_staff_id';

describe('LabTechService', () => {
  let service: LabTechService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/labs`;

  const mockOrder: LabOrder = {
    order_id: 1,
    patient_id: 10,
    ordered_by: 2,
    ordered_date: '2026-01-01',
    priority: 'routine',
    status: 'placed',
    order_tests: [],
  };

  const mockStats: LabStats = {
    orders: { total: 1, by_status: { placed: 1 } },
    tests: { catalog_total: 5, by_status: {} },
    results: { total: 0, abnormal: 0, critical: 0, reviewed: 0 },
  };

  afterEach(() => {
    localStorage.removeItem(STAFF_ID_KEY);
    httpMock.verify();
  });

  function setup(): void {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(LabTechService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  it('should be created', () => {
    localStorage.removeItem(STAFF_ID_KEY);
    setup();
    expect(service).toBeTruthy();
  });

  it('should initialize staffId as null when localStorage is empty', () => {
    localStorage.removeItem(STAFF_ID_KEY);
    setup();

    expect(service.staffId()).toBeNull();
  });

  it('should initialize staffId from localStorage when present', () => {
    localStorage.setItem(STAFF_ID_KEY, '42');
    setup();

    expect(service.staffId()).toBe(42);
  });

  describe('setStaffId', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should set staffId and persist to localStorage', () => {
      service.setStaffId(7);

      expect(service.staffId()).toBe(7);
      expect(localStorage.getItem(STAFF_ID_KEY)).toBe('7');
    });

    it('should clear staffId and remove from localStorage when null', () => {
      service.setStaffId(7);
      service.setStaffId(null);

      expect(service.staffId()).toBeNull();
      expect(localStorage.getItem(STAFF_ID_KEY)).toBeNull();
    });
  });

  describe('loadOrders', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should load orders with no status filter', () => {
      service.loadOrders();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([mockOrder]);

      expect(service.orders()).toEqual([mockOrder]);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('should load orders with a status filter', () => {
      service.loadOrders('placed');

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.get('status')).toBe('placed');
      req.flush([mockOrder]);

      expect(service.orders()).toEqual([mockOrder]);
    });

    it('should handle error when loading orders', () => {
      service.loadOrders();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      req.flush({ detail: 'Load failed' }, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBe('Load failed');
      expect(service.loading()).toBeFalse();
    });

    it('should fall back to default error message when detail missing', () => {
      service.loadOrders();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBe('Failed to load lab orders.');
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should reload orders using the last status filter', () => {
      service.loadOrders('placed');
      httpMock.expectOne((r) => r.url === `${base}/orders`).flush([mockOrder]);

      service.refresh();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.get('status')).toBe('placed');
      req.flush([mockOrder]);
    });

    it('should reload orders with no filter if none was previously set', () => {
      service.refresh();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([mockOrder]);
    });
  });

  describe('collectSample', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should collect a sample and trigger a refresh', () => {
      const payload: CollectSamplePayload = { collection_date: '2026-01-01', collected_by: 1 };
      const mockSample: LabSample = {
        sample_id: 1,
        order_id: 1,
        sample_type: 'Blood',
        collection_date: '2026-01-01',
        collected_by: 1,
        sample_label: 'A1',
        status: 'collected',
      };

      service.collectSample(1, payload).subscribe((r) => {
        expect(r).toEqual(mockSample);
      });

      const req = httpMock.expectOne(`${base}/orders/1/collect`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockSample);

      const refreshReq = httpMock.expectOne((r) => r.url === `${base}/orders`);
      refreshReq.flush([mockOrder]);
    });
  });

  describe('updateTestStatus', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should update test status and trigger a refresh', () => {
      const payload: UpdateTestStatusPayload = { new_status: 'in_progress', changed_by: 1 };

      service.updateTestStatus(1, 2, payload).subscribe();

      const req = httpMock.expectOne(`${base}/orders/1/tests/2/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush({});

      const refreshReq = httpMock.expectOne((r) => r.url === `${base}/orders`);
      refreshReq.flush([mockOrder]);
    });
  });

  describe('submitResult', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should submit a result and trigger a refresh', () => {
      const payload: SubmitResultPayload = { result_value: '5.0' };
      const mockResult: TestResult = {
        result_id: 1,
        order_test_id: 2,
        result_value: '5.0',
        result_date: '2026-01-01',
        is_abnormal: false,
        is_critical: false,
      };

      service.submitResult(1, 2, payload).subscribe((r) => {
        expect(r).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${base}/orders/1/tests/2/result`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResult);

      const refreshReq = httpMock.expectOne((r) => r.url === `${base}/orders`);
      refreshReq.flush([mockOrder]);
    });
  });

  describe('getHistory', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should fetch order status history', () => {
      const mockHistory: StatusHistoryEntry[] = [
        {
          history_id: 1,
          order_test_id: 2,
          old_status: 'ordered',
          new_status: 'in_progress',
          changed_at: '2026-01-01',
          changed_by: 1,
        },
      ];

      service.getHistory(1).subscribe((r) => {
        expect(r).toEqual(mockHistory);
      });

      const req = httpMock.expectOne(`${base}/orders/1/history`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('loadStats', () => {
    beforeEach(() => {
      localStorage.removeItem(STAFF_ID_KEY);
      setup();
    });

    it('should load lab stats', () => {
      service.loadStats();

      const req = httpMock.expectOne(`${base}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);

      expect(service.stats()).toEqual(mockStats);
    });

    it('should handle error when loading stats', () => {
      service.loadStats();

      const req = httpMock.expectOne(`${base}/stats`);
      req.flush({ detail: 'Stats failed' }, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBe('Stats failed');
    });

    it('should fall back to default error message when detail missing', () => {
      service.loadStats();

      const req = httpMock.expectOne(`${base}/stats`);
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBe('Failed to load lab statistics.');
    });
  });
});
