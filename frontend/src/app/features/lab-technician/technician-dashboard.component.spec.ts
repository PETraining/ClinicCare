import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { TechnicianDashboardComponent } from './technician-dashboard.component';
import { DoctorService } from '../../core/services/doctor.service';
import { LabTechService } from '../../core/services/lab-tech.service';
import { PatientService } from '../../core/services/patient.service';
import { LabOrder } from '../../core/models/lab.model';

function makeOrder(
  id: number,
  status: LabOrder['status'],
  orderTestStatuses: LabOrder['order_tests'][number]['order_status'][] = [],
): LabOrder {
  return {
    order_id: id,
    patient_id: 1,
    referral_id: null,
    ordered_by: 1,
    ordered_date: '2026-01-01',
    priority: 'routine',
    clinical_indication: null,
    status,
    order_tests: orderTestStatuses.map((s, i) => ({
      order_test_id: id * 100 + i,
      order_id: id,
      test_id: i,
      order_status: s,
      test: {
        test_id: i,
        test_code: `T${i}`,
        test_name: `Test ${i}`,
        sample_type: 'blood',
        processing_time_days: 1,
      },
    })),
  };
}

describe('TechnicianDashboardComponent', () => {
  let labTechStub: any;
  let doctorServiceStub: any;
  let patientServiceStub: any;

  beforeEach(() => {
    labTechStub = {
      orders: signal<LabOrder[]>([]),
      loadOrders: jasmine.createSpy('loadOrders'),
      loadStats: jasmine.createSpy('loadStats'),
      setStaffId: jasmine.createSpy('setStaffId'),
    };
    doctorServiceStub = { search: jasmine.createSpy('search') };
    patientServiceStub = {
      patients: signal([{ PatientId: 1, Name: 'Alice', DOB: '', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };

    TestBed.configureTestingModule({
      imports: [TechnicianDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: LabTechService, useValue: labTechStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        { provide: PatientService, useValue: patientServiceStub },
      ],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit loads orders, stats, doctors, and patients', () => {
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    fixture.componentInstance.ngOnInit();
    expect(labTechStub.loadOrders).toHaveBeenCalled();
    expect(labTechStub.loadStats).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalledWith(undefined, 'lab_technician');
    expect(patientServiceStub.search).toHaveBeenCalled();
  });

  it('patientName returns matched name or fallback placeholder', () => {
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    const comp = fixture.componentInstance;
    expect(comp.patientName(1)).toBe('Alice');
    expect(comp.patientName(50)).toBe('Patient #50');
  });

  it('pendingCollection and inProgressOrders filter orders by status', () => {
    labTechStub.orders.set([
      makeOrder(1, 'placed'),
      makeOrder(2, 'processing'),
      makeOrder(3, 'completed'),
    ]);
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    const comp = fixture.componentInstance;
    expect(comp.pendingCollection().map((o) => o.order_id)).toEqual([1]);
    expect(comp.inProgressOrders().map((o) => o.order_id)).toEqual([2]);
  });

  it('samplesNeedingProcessing and testsAwaitingResults filter order_tests by status', () => {
    labTechStub.orders.set([
      makeOrder(1, 'processing', ['sample_collected', 'in_progress', 'completed']),
    ]);
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    const comp = fixture.componentInstance;
    expect(comp.samplesNeedingProcessing().length).toBe(1);
    expect(comp.samplesNeedingProcessing()[0].orderTest.order_status).toBe('sample_collected');
    expect(comp.testsAwaitingResults().length).toBe(1);
    expect(comp.testsAwaitingResults()[0].orderTest.order_status).toBe('in_progress');
  });

  it('onStaffChange sets a numeric staff id when value provided', () => {
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    fixture.componentInstance.onStaffChange('12');
    expect(labTechStub.setStaffId).toHaveBeenCalledWith(12);
  });

  it('onStaffChange sets null when value is empty', () => {
    const fixture = TestBed.createComponent(TechnicianDashboardComponent);
    fixture.componentInstance.onStaffChange('');
    expect(labTechStub.setStaffId).toHaveBeenCalledWith(null);
  });
});
