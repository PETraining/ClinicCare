import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config';
import { LabOrder, LabOrderCreate, LabTest, TestResult } from '../models/lab.model';
import { LabService } from './lab.service';

describe('LabService', () => {
  let service: LabService;
  let httpMock: HttpTestingController;
  const base = `${API_BASE_URL}/labs`;

  const mockTest: LabTest = {
    test_id: 1,
    test_code: 'CBC',
    test_name: 'Complete Blood Count',
    sample_type: 'Blood',
    processing_time_days: 1,
  };

  const mockOrder: LabOrder = {
    order_id: 1,
    patient_id: 10,
    ordered_by: 2,
    ordered_date: '2026-01-01',
    priority: 'routine',
    status: 'draft',
    order_tests: [],
  };

  const mockResult: TestResult = {
    result_id: 1,
    order_test_id: 1,
    result_value: '5.0',
    result_date: '2026-01-01',
    is_abnormal: false,
    is_critical: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(LabService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTests', () => {
    it('should load tests without specialty filter', () => {
      service.loadTests();

      const req = httpMock.expectOne((r) => r.url === `${base}/tests`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([mockTest]);

      expect(service.tests()).toEqual([mockTest]);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });

    it('should load tests with specialty filter', () => {
      service.loadTests('Cardiology');

      const req = httpMock.expectOne((r) => r.url === `${base}/tests`);
      expect(req.request.params.get('specialty')).toBe('Cardiology');
      req.flush([mockTest]);

      expect(service.tests()).toEqual([mockTest]);
    });

    it('should handle error when loading tests', () => {
      service.loadTests();

      const req = httpMock.expectOne((r) => r.url === `${base}/tests`);
      req.flush({ detail: 'Boom' }, { status: 500, statusText: 'Server Error' });

      expect(service.tests()).toEqual([]);
      expect(service.error()).toBe('Boom');
      expect(service.loading()).toBeFalse();
    });

    it('should fall back to default error message when detail missing', () => {
      service.loadTests();

      const req = httpMock.expectOne((r) => r.url === `${base}/tests`);
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.error()).toBe('Failed to load test catalog.');
    });
  });

  describe('loadOrders', () => {
    it('should load orders with no filters', () => {
      service.loadOrders();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([mockOrder]);

      expect(service.orders()).toEqual([mockOrder]);
      expect(service.loading()).toBeFalse();
    });

    it('should load orders with all filters', () => {
      service.loadOrders({ patient_id: 10, referral_id: 5, status: 'placed' });

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.get('patient_id')).toBe('10');
      expect(req.request.params.get('referral_id')).toBe('5');
      expect(req.request.params.get('status')).toBe('placed');
      req.flush([mockOrder]);

      expect(service.orders()).toEqual([mockOrder]);
    });

    it('should handle error when loading orders', () => {
      service.loadOrders();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      req.flush({ detail: 'Load failed' }, { status: 400, statusText: 'Bad Request' });

      expect(service.orders()).toEqual([]);
      expect(service.error()).toBe('Load failed');
      expect(service.loading()).toBeFalse();
    });
  });

  describe('refreshOrdersSilently', () => {
    it('should refresh orders with no filters', () => {
      service.refreshOrdersSilently();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      req.flush([mockOrder]);

      expect(service.orders()).toEqual([mockOrder]);
    });

    it('should refresh orders with filters', () => {
      service.refreshOrdersSilently({ patient_id: 10, referral_id: 5, status: 'placed' });

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      expect(req.request.params.get('patient_id')).toBe('10');
      expect(req.request.params.get('referral_id')).toBe('5');
      expect(req.request.params.get('status')).toBe('placed');
      req.flush([mockOrder]);

      expect(service.orders()).toEqual([mockOrder]);
    });

    it('should silently ignore errors and not update orders', () => {
      service.orders.set([mockOrder]);
      service.refreshOrdersSilently();

      const req = httpMock.expectOne((r) => r.url === `${base}/orders`);
      req.flush({ detail: 'oops' }, { status: 500, statusText: 'Server Error' });

      expect(service.orders()).toEqual([mockOrder]);
    });
  });

  describe('loadOrder', () => {
    it('should load a single order', () => {
      service.loadOrder(1);

      const req = httpMock.expectOne(`${base}/orders/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);

      expect(service.selectedOrder()).toEqual(mockOrder);
      expect(service.loading()).toBeFalse();
    });

    it('should handle error when loading a single order', () => {
      service.loadOrder(1);

      const req = httpMock.expectOne(`${base}/orders/1`);
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(service.selectedOrder()).toBeNull();
      expect(service.error()).toBe('Not found');
      expect(service.loading()).toBeFalse();
    });
  });

  describe('loadResults', () => {
    it('should load results for an order', () => {
      service.loadResults(1);

      const req = httpMock.expectOne(`${base}/orders/1/results`);
      expect(req.request.method).toBe('GET');
      req.flush([mockResult]);

      expect(service.results()).toEqual([mockResult]);
    });

    it('should handle error and set empty results', () => {
      service.loadResults(1);

      const req = httpMock.expectOne(`${base}/orders/1/results`);
      req.flush({ detail: 'err' }, { status: 500, statusText: 'Server Error' });

      expect(service.results()).toEqual([]);
    });
  });

  describe('createOrder', () => {
    it('should create an order and prepend it to the orders signal', () => {
      service.orders.set([mockOrder]);
      const payload: LabOrderCreate = {
        patient_id: 10,
        ordered_by: 2,
        priority: 'routine',
        test_ids: [1],
      };
      const newOrder: LabOrder = { ...mockOrder, order_id: 2 };

      service.createOrder(payload).subscribe((r) => {
        expect(r).toEqual(newOrder);
      });

      const req = httpMock.expectOne(`${base}/orders`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(newOrder);

      expect(service.orders()).toEqual([newOrder, mockOrder]);
    });
  });

  describe('reviewResult', () => {
    it('should review a result and update the results signal', () => {
      service.results.set([mockResult]);
      const updated: TestResult = { ...mockResult, reviewed_by: 99 };

      service.reviewResult(1, 99).subscribe((r) => {
        expect(r).toEqual(updated);
      });

      const req = httpMock.expectOne(`${base}/results/1/review`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ reviewed_by: 99 });
      req.flush(updated);

      expect(service.results()).toEqual([updated]);
    });

    it('should not modify unrelated results', () => {
      const other: TestResult = { ...mockResult, result_id: 2 };
      service.results.set([mockResult, other]);
      const updated: TestResult = { ...mockResult, reviewed_by: 99 };

      service.reviewResult(1, 99).subscribe();

      const req = httpMock.expectOne(`${base}/results/1/review`);
      req.flush(updated);

      expect(service.results()).toEqual([updated, other]);
    });
  });
});
