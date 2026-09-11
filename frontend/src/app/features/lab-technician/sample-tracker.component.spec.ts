import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { SampleTrackerComponent } from './sample-tracker.component';
import { DoctorService } from '../../core/services/doctor.service';
import { LabTechService } from '../../core/services/lab-tech.service';
import { PatientService } from '../../core/services/patient.service';
import { LabOrder, LabSample } from '../../core/models/lab.model';

function makeOrder(id: number, status: LabOrder['status']): LabOrder {
  return {
    order_id: id,
    patient_id: 1,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status,
    order_tests: [],
  };
}

function makeSample(orderId: number): LabSample {
  return {
    sample_id: orderId * 10,
    order_id: orderId,
    sample_type: 'blood',
    collection_date: '2026-01-01T00:00:00Z',
    collected_by: 3,
    sample_label: `LBL-${orderId}`,
    status: 'collected',
  };
}

describe('SampleTrackerComponent', () => {
  let labTechStub: any;
  let doctorServiceStub: any;
  let patientServiceStub: any;

  beforeEach(() => {
    labTechStub = {
      orders: signal<LabOrder[]>([]),
      staffId: signal<number | null>(9),
      loadOrders: jasmine.createSpy('loadOrders'),
      collectSample: jasmine.createSpy('collectSample'),
    };
    doctorServiceStub = { search: jasmine.createSpy('search') };
    patientServiceStub = {
      patients: signal([{ PatientId: 1, Name: 'Alice', DOB: '', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };

    TestBed.configureTestingModule({
      imports: [SampleTrackerComponent],
      providers: [
        { provide: LabTechService, useValue: labTechStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        { provide: PatientService, useValue: patientServiceStub },
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit loads orders/doctors/patients and initializes collectedBy from staffId', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(labTechStub.loadOrders).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalledWith(undefined, 'lab_technician');
    expect(patientServiceStub.search).toHaveBeenCalled();
    expect(comp.collectedBy()).toBe(9);
  });

  it('patientName returns matched name or fallback placeholder', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    expect(comp.patientName(1)).toBe('Alice');
    expect(comp.patientName(42)).toBe('Patient #42');
  });

  it('pendingOrders and alreadyCollectedOrders computed filter by status', () => {
    labTechStub.orders.set([
      makeOrder(1, 'placed'),
      makeOrder(2, 'draft'),
      makeOrder(3, 'collected'),
      makeOrder(4, 'completed'),
    ]);
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    expect(comp.pendingOrders().map((o) => o.order_id)).toEqual([1]);
    expect(comp.alreadyCollectedOrders().map((o) => o.order_id)).toEqual([3, 4]);
  });

  it('isSelected/toggleSelected track selection state', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    expect(comp.isSelected(1)).toBeFalse();
    comp.toggleSelected(1);
    expect(comp.isSelected(1)).toBeTrue();
    comp.toggleSelected(1);
    expect(comp.isSelected(1)).toBeFalse();
  });

  it('toggleSelectAll selects all pending orders, then deselects all', () => {
    labTechStub.orders.set([makeOrder(1, 'placed'), makeOrder(2, 'placed')]);
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.toggleSelectAll();
    expect(comp.selectedOrderIds().size).toBe(2);
    comp.toggleSelectAll();
    expect(comp.selectedOrderIds().size).toBe(0);
  });

  it('openCollectModal sets a single order id and resets the form', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.notes.set('stale');
    comp.formError.set('stale error');
    comp.openCollectModal(5);
    expect(comp.modalOrderIds()).toEqual([5]);
    expect(comp.notes()).toBe('');
    expect(comp.formError()).toBeNull();
  });

  it('openBulkCollectModal does nothing when no orders selected', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.openBulkCollectModal();
    expect(comp.modalOrderIds()).toBeNull();
  });

  it('openBulkCollectModal sets modalOrderIds from current selection', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.toggleSelected(1);
    comp.toggleSelected(2);
    comp.openBulkCollectModal();
    expect(comp.modalOrderIds()?.sort()).toEqual([1, 2]);
  });

  it('closeModal clears modalOrderIds', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.openCollectModal(1);
    comp.closeModal();
    expect(comp.modalOrderIds()).toBeNull();
  });

  it('submitCollection does nothing when no modal is open', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.submitCollection();
    expect(labTechStub.collectSample).not.toHaveBeenCalled();
  });

  it('submitCollection sets formError when collectedBy is not selected', () => {
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.openCollectModal(1);
    comp.collectedBy.set(null);
    comp.submitCollection();
    expect(comp.formError()).toBe('Please select who collected the sample.');
    expect(labTechStub.collectSample).not.toHaveBeenCalled();
  });

  it('submitCollection success stores collected samples, clears selection, and closes modal', () => {
    labTechStub.orders.set([makeOrder(1, 'placed'), makeOrder(2, 'placed')]);
    labTechStub.collectSample.and.callFake((id: number) => of(makeSample(id)));
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.toggleSelected(1);
    comp.toggleSelected(2);
    comp.openBulkCollectModal();
    comp.collectedBy.set(3);
    comp.submitCollection();

    expect(labTechStub.collectSample).toHaveBeenCalledTimes(2);
    expect(comp.collectedSamples().size).toBe(2);
    expect(comp.selectedOrderIds().size).toBe(0);
    expect(comp.submitting()).toBeFalse();
    expect(comp.modalOrderIds()).toBeNull();
  });

  it('submitCollection error sets formError from backend detail and keeps submitting false', () => {
    labTechStub.orders.set([makeOrder(1, 'placed')]);
    labTechStub.collectSample.and.returnValue(throwError(() => ({ error: { detail: 'collect failed' } })));
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.openCollectModal(1);
    comp.collectedBy.set(3);
    comp.submitCollection();
    expect(comp.formError()).toBe('collect failed');
    expect(comp.submitting()).toBeFalse();
  });

  it('submitCollection error sets default formError when backend detail missing', () => {
    labTechStub.orders.set([makeOrder(1, 'placed')]);
    labTechStub.collectSample.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.openCollectModal(1);
    comp.collectedBy.set(3);
    comp.submitCollection();
    expect(comp.formError()).toBe('Failed to record sample collection.');
  });

  it('orderById finds an order by id or returns undefined', () => {
    labTechStub.orders.set([makeOrder(1, 'placed')]);
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    expect(comp.orderById(1)?.order_id).toBe(1);
    expect(comp.orderById(999)).toBeUndefined();
  });

  it('sessionCollectedEntries pairs collected samples with their known orders, skipping unknown ones', () => {
    labTechStub.orders.set([makeOrder(1, 'placed')]);
    labTechStub.collectSample.and.callFake((id: number) => of(makeSample(id)));
    const fixture = TestBed.createComponent(SampleTrackerComponent);
    const comp = fixture.componentInstance;
    comp.openCollectModal(1);
    comp.collectedBy.set(3);
    comp.submitCollection();
    // remove the order from the underlying list to simulate an order that vanished
    const entries = comp.sessionCollectedEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].order.order_id).toBe(1);
    expect(entries[0].sample.order_id).toBe(1);
  });
});
