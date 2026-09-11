import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { TestProcessingComponent } from './test-processing.component';
import { LabTechService } from '../../core/services/lab-tech.service';
import { PatientService } from '../../core/services/patient.service';
import { LabOrder, OrderTest } from '../../core/models/lab.model';

function makeOrderTest(id: number, orderId: number, status: OrderTest['order_status']): OrderTest {
  return {
    order_test_id: id,
    order_id: orderId,
    test_id: id,
    order_status: status,
    test: {
      test_id: id,
      test_code: `T${id}`,
      test_name: `Test ${id}`,
      sample_type: 'blood',
      processing_time_days: 1,
    },
  };
}

function makeOrder(id: number, orderTests: OrderTest[]): LabOrder {
  return {
    order_id: id,
    patient_id: 1,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status: 'processing',
    order_tests: orderTests,
  };
}

describe('TestProcessingComponent', () => {
  let labTechStub: any;
  let patientServiceStub: any;

  beforeEach(() => {
    labTechStub = {
      orders: signal<LabOrder[]>([]),
      staffId: signal<number | null>(9),
      loadOrders: jasmine.createSpy('loadOrders'),
      updateTestStatus: jasmine.createSpy('updateTestStatus'),
    };
    patientServiceStub = {
      patients: signal([{ PatientId: 1, Name: 'Alice', DOB: '', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };

    TestBed.configureTestingModule({
      imports: [TestProcessingComponent],
      providers: [
        { provide: LabTechService, useValue: labTechStub },
        { provide: PatientService, useValue: patientServiceStub },
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestProcessingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit loads orders and patients', () => {
    const fixture = TestBed.createComponent(TestProcessingComponent);
    fixture.componentInstance.ngOnInit();
    expect(labTechStub.loadOrders).toHaveBeenCalled();
    expect(patientServiceStub.search).toHaveBeenCalled();
  });

  it('patientName returns matched name or fallback placeholder', () => {
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    expect(comp.patientName(1)).toBe('Alice');
    expect(comp.patientName(9)).toBe('Patient #9');
  });

  it('readyToStart and inProgress computed filter order_tests by status', () => {
    const orderTests = [
      makeOrderTest(1, 100, 'sample_collected'),
      makeOrderTest(2, 100, 'in_progress'),
      makeOrderTest(3, 100, 'completed'),
    ];
    labTechStub.orders.set([makeOrder(100, orderTests)]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    expect(comp.readyToStart().map((e) => e.orderTest.order_test_id)).toEqual([1]);
    expect(comp.inProgress().map((e) => e.orderTest.order_test_id)).toEqual([2]);
  });

  it('orderProgress reports completed vs total counts', () => {
    const orderTests = [
      makeOrderTest(1, 100, 'completed'),
      makeOrderTest(2, 100, 'in_progress'),
    ];
    const order = makeOrder(100, orderTests);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    expect(fixture.componentInstance.orderProgress(order)).toBe('1 of 2 tests completed');
  });

  it('isSelected/toggleSelected track selection state', () => {
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    expect(comp.isSelected(1)).toBeFalse();
    comp.toggleSelected(1);
    expect(comp.isSelected(1)).toBeTrue();
    comp.toggleSelected(1);
    expect(comp.isSelected(1)).toBeFalse();
  });

  it('toggleSelectAll selects all readyToStart entries then deselects all', () => {
    const orderTests = [makeOrderTest(1, 100, 'sample_collected'), makeOrderTest(2, 100, 'sample_collected')];
    labTechStub.orders.set([makeOrder(100, orderTests)]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.toggleSelectAll();
    expect(comp.selectedTestIds().size).toBe(2);
    comp.toggleSelectAll();
    expect(comp.selectedTestIds().size).toBe(0);
  });

  it('startProcessing sets actionError when no staff is selected, without calling updateTestStatus', () => {
    labTechStub.staffId.set(null);
    const orderTests = [makeOrderTest(1, 100, 'sample_collected')];
    labTechStub.orders.set([makeOrder(100, orderTests)]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.startProcessing({ order: makeOrder(100, orderTests), orderTest: orderTests[0] });
    expect(comp.actionError()).toBe('Select "Acting as" technician on the dashboard before processing tests.');
    expect(labTechStub.updateTestStatus).not.toHaveBeenCalled();
  });

  it('startProcessing succeeds: clears selection and processing ids on success', () => {
    labTechStub.updateTestStatus.and.returnValue(of({}));
    const orderTests = [makeOrderTest(1, 100, 'sample_collected')];
    const order = makeOrder(100, orderTests);
    labTechStub.orders.set([order]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.toggleSelected(1);
    comp.startProcessing({ order, orderTest: orderTests[0] });
    expect(labTechStub.updateTestStatus).toHaveBeenCalledWith(100, 1, { new_status: 'in_progress', changed_by: 9 });
    expect(comp.selectedTestIds().size).toBe(0);
    expect(comp.processingIds().size).toBe(0);
    expect(comp.actionError()).toBeNull();
  });

  it('startProcessing error sets actionError from backend detail and clears processing ids', () => {
    labTechStub.updateTestStatus.and.returnValue(throwError(() => ({ error: { detail: 'cannot start' } })));
    const orderTests = [makeOrderTest(1, 100, 'sample_collected')];
    const order = makeOrder(100, orderTests);
    labTechStub.orders.set([order]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.startProcessing({ order, orderTest: orderTests[0] });
    expect(comp.actionError()).toBe('cannot start');
    expect(comp.processingIds().size).toBe(0);
  });

  it('startProcessing error sets default actionError when backend detail missing', () => {
    labTechStub.updateTestStatus.and.returnValue(throwError(() => ({})));
    const orderTests = [makeOrderTest(1, 100, 'sample_collected')];
    const order = makeOrder(100, orderTests);
    labTechStub.orders.set([order]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.startProcessing({ order, orderTest: orderTests[0] });
    expect(comp.actionError()).toBe('Failed to update test status.');
  });

  it('startSelected does nothing when no matching selection exists', () => {
    const orderTests = [makeOrderTest(1, 100, 'sample_collected')];
    labTechStub.orders.set([makeOrder(100, orderTests)]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.startSelected();
    expect(labTechStub.updateTestStatus).not.toHaveBeenCalled();
  });

  it('startSelected runs status update for all selected ready entries', () => {
    labTechStub.updateTestStatus.and.returnValue(of({}));
    const orderTests = [makeOrderTest(1, 100, 'sample_collected'), makeOrderTest(2, 100, 'sample_collected')];
    labTechStub.orders.set([makeOrder(100, orderTests)]);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    comp.toggleSelected(1);
    comp.toggleSelected(2);
    comp.startSelected();
    expect(labTechStub.updateTestStatus).toHaveBeenCalledTimes(2);
  });

  it('openResultEntry/closeResultEntry/onResultSubmitted manage resultEntryTarget', () => {
    const orderTests = [makeOrderTest(1, 100, 'sample_collected')];
    const order = makeOrder(100, orderTests);
    const fixture = TestBed.createComponent(TestProcessingComponent);
    const comp = fixture.componentInstance;
    const entry = { order, orderTest: orderTests[0] };
    comp.openResultEntry(entry);
    expect(comp.resultEntryTarget()).toBe(entry);
    comp.closeResultEntry();
    expect(comp.resultEntryTarget()).toBeNull();
    comp.openResultEntry(entry);
    comp.onResultSubmitted();
    expect(comp.resultEntryTarget()).toBeNull();
  });
});
