import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { LabOrdersListComponent } from './lab-orders-list.component';
import { DoctorService } from '../../core/services/doctor.service';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { LabOrder } from '../../core/models/lab.model';

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

describe('LabOrdersListComponent', () => {
  let labServiceStub: any;
  let patientServiceStub: any;
  let doctorServiceStub: any;

  function setup(queryParams: Record<string, string> = {}) {
    labServiceStub = {
      orders: signal<LabOrder[]>([]),
      loadOrders: jasmine.createSpy('loadOrders'),
      refreshOrdersSilently: jasmine.createSpy('refreshOrdersSilently'),
    };
    patientServiceStub = {
      patients: signal([{ PatientId: 1, Name: 'Alice', DOB: '', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };
    doctorServiceStub = { doctors: signal([]), search: jasmine.createSpy('search') };

    TestBed.configureTestingModule({
      imports: [LabOrdersListComponent],
      providers: [
        { provide: LabService, useValue: labServiceStub },
        { provide: PatientService, useValue: patientServiceStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap(queryParams)) },
        },
      ],
    });
  }

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    setup();
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit searches patients/doctors and loads orders with filters', () => {
    setup({ patientId: '1', referralId: '2' });
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(patientServiceStub.search).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalled();
    expect(labServiceStub.loadOrders).toHaveBeenCalledWith({ patient_id: 1, referral_id: 2 });
    comp.ngOnDestroy();
  });

  it('filteredOrders returns all orders when filter is All, else filters by status', () => {
    setup();
    labServiceStub.orders.set([makeOrder(1, 'draft'), makeOrder(2, 'completed')]);
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    const comp = fixture.componentInstance;
    expect(comp.filteredOrders().length).toBe(2);
    comp.setFilter('completed');
    expect(comp.filteredOrders().map((o) => o.order_id)).toEqual([2]);
  });

  it('hasActiveOrders is true when any order is not completed', () => {
    setup();
    labServiceStub.orders.set([makeOrder(1, 'completed')]);
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    const comp = fixture.componentInstance;
    expect(comp.hasActiveOrders()).toBeFalse();
    labServiceStub.orders.set([makeOrder(1, 'completed'), makeOrder(2, 'placed')]);
    expect(comp.hasActiveOrders()).toBeTrue();
  });

  it('patientName returns matched name or fallback placeholder', () => {
    setup();
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    const comp = fixture.componentInstance;
    expect(comp.patientName(1)).toBe('Alice');
    expect(comp.patientName(999)).toBe('Patient #999');
  });

  it('polling refreshes silently only while there are active orders, and stops after destroy', () => {
    jasmine.clock().install();
    setup({ patientId: '3' });
    labServiceStub.orders.set([makeOrder(1, 'placed')]);
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    labServiceStub.refreshOrdersSilently.calls.reset();

    jasmine.clock().tick(30000);
    expect(labServiceStub.refreshOrdersSilently).toHaveBeenCalledWith({
      patient_id: 3,
      referral_id: undefined,
    });

    labServiceStub.orders.set([makeOrder(1, 'completed')]);
    labServiceStub.refreshOrdersSilently.calls.reset();
    jasmine.clock().tick(30000);
    expect(labServiceStub.refreshOrdersSilently).not.toHaveBeenCalled();

    comp.ngOnDestroy();
    labServiceStub.orders.set([makeOrder(1, 'placed')]);
    labServiceStub.refreshOrdersSilently.calls.reset();
    jasmine.clock().tick(60000);
    expect(labServiceStub.refreshOrdersSilently).not.toHaveBeenCalled();
  });

  it('ngOnDestroy is a no-op when polling was never started', () => {
    setup();
    const fixture = TestBed.createComponent(LabOrdersListComponent);
    const comp = fixture.componentInstance;
    expect(() => comp.ngOnDestroy()).not.toThrow();
  });
});
