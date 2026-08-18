import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { LabResultsComponent } from './lab-results.component';
import { DoctorService } from '../../core/services/doctor.service';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { LabOrder, OrderTest, TestResult } from '../../core/models/lab.model';

function makeOrder(): LabOrder {
  return {
    order_id: 1,
    patient_id: 5,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status: 'completed',
    order_tests: [],
  };
}

function makeOrderTest(overrides: Partial<OrderTest['test']> = {}): OrderTest {
  return {
    order_test_id: 100,
    order_id: 1,
    test_id: 10,
    order_status: 'completed',
    test: {
      test_id: 10,
      test_code: 'T1',
      test_name: 'Test',
      sample_type: 'blood',
      processing_time_days: 1,
      normal_range_min: null,
      normal_range_max: null,
      unit: null,
      ...overrides,
    },
  };
}

describe('LabResultsComponent', () => {
  let labServiceStub: any;
  let patientServiceStub: any;
  let doctorServiceStub: any;

  function setup(routeId = '1') {
    labServiceStub = {
      selectedOrder: signal<LabOrder | null>(null),
      results: signal<TestResult[]>([]),
      loadOrder: jasmine.createSpy('loadOrder'),
      loadResults: jasmine.createSpy('loadResults'),
      reviewResult: jasmine.createSpy('reviewResult'),
    };
    patientServiceStub = {
      patients: signal([{ PatientId: 5, Name: 'Alice', DOB: '', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };
    doctorServiceStub = { doctors: signal([]), search: jasmine.createSpy('search') };

    TestBed.configureTestingModule({
      imports: [LabResultsComponent],
      providers: [
        { provide: LabService, useValue: labServiceStub },
        { provide: PatientService, useValue: patientServiceStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: routeId })) },
        },
      ],
    });
  }

  it('should create', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit searches patients and doctors', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    fixture.componentInstance.ngOnInit();
    expect(patientServiceStub.search).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalled();
  });

  it('constructor effect loads order and results for a nonzero id', fakeAsync(() => {
    setup('7');
    const fixture = TestBed.createComponent(LabResultsComponent);
    fixture.detectChanges();
    tick();
    expect(labServiceStub.loadOrder).toHaveBeenCalledWith(7);
    expect(labServiceStub.loadResults).toHaveBeenCalledWith(7);
  }));

  it('patientName returns empty string when no order selected', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    expect(fixture.componentInstance.patientName()).toBe('');
  });

  it('patientName returns matched patient or fallback placeholder', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    labServiceStub.selectedOrder.set(makeOrder());
    expect(comp.patientName()).toBe('Alice');
    labServiceStub.selectedOrder.set({ ...makeOrder(), patient_id: 999 });
    expect(comp.patientName()).toBe('Patient #999');
  });

  it('resultByOrderTestId maps results by order_test_id', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    const result: TestResult = {
      result_id: 1,
      order_test_id: 100,
      result_value: '5',
      result_date: '2026-01-01',
      is_abnormal: false,
      is_critical: false,
    };
    labServiceStub.results.set([result]);
    expect(comp.resultByOrderTestId().get(100)).toBe(result);
    expect(comp.resultFor(makeOrderTest())).toBe(result);
    expect(comp.resultFor({ ...makeOrderTest(), order_test_id: 999 })).toBeUndefined();
  });

  it('rangeLabel handles missing range, partial range, and full range with unit', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    expect(comp.rangeLabel(makeOrderTest())).toBe('—');
    expect(comp.rangeLabel(makeOrderTest({ normal_range_min: 1, normal_range_max: null }))).toBe('1 – ?');
    expect(comp.rangeLabel(makeOrderTest({ normal_range_min: 1, normal_range_max: 5, unit: 'mg' }))).toBe('1 – 5 mg');
  });

  it('markReviewed sets error when no reviewer selected', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    const result: TestResult = {
      result_id: 1,
      order_test_id: 100,
      result_value: '5',
      result_date: '2026-01-01',
      is_abnormal: false,
      is_critical: false,
    };
    comp.markReviewed(result);
    expect(comp.reviewError()).toBe('Select a reviewing doctor first.');
    expect(labServiceStub.reviewResult).not.toHaveBeenCalled();
  });

  it('markReviewed calls service when reviewer selected, and clears prior error', () => {
    setup();
    labServiceStub.reviewResult.and.returnValue(of({} as TestResult));
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    comp.reviewerId.set(3);
    const result: TestResult = {
      result_id: 1,
      order_test_id: 100,
      result_value: '5',
      result_date: '2026-01-01',
      is_abnormal: false,
      is_critical: false,
    };
    comp.markReviewed(result);
    expect(labServiceStub.reviewResult).toHaveBeenCalledWith(1, 3);
    expect(comp.reviewError()).toBeNull();
  });

  it('markReviewed sets error message from backend detail on failure', () => {
    setup();
    labServiceStub.reviewResult.and.returnValue(throwError(() => ({ error: { detail: 'nope' } })));
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    comp.reviewerId.set(3);
    comp.markReviewed({
      result_id: 1,
      order_test_id: 100,
      result_value: '5',
      result_date: '2026-01-01',
      is_abnormal: false,
      is_critical: false,
    });
    expect(comp.reviewError()).toBe('nope');
  });

  it('markReviewed sets default error message when backend detail missing', () => {
    setup();
    labServiceStub.reviewResult.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(LabResultsComponent);
    const comp = fixture.componentInstance;
    comp.reviewerId.set(3);
    comp.markReviewed({
      result_id: 1,
      order_test_id: 100,
      result_value: '5',
      result_date: '2026-01-01',
      is_abnormal: false,
      is_critical: false,
    });
    expect(comp.reviewError()).toBe('Failed to mark result as reviewed.');
  });

  it('print calls window.print', () => {
    setup();
    const fixture = TestBed.createComponent(LabResultsComponent);
    const spy = spyOn(window, 'print');
    fixture.componentInstance.print();
    expect(spy).toHaveBeenCalled();
  });
});
