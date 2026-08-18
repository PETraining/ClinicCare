import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CreateLabOrderComponent } from './create-lab-order.component';
import { DoctorService } from '../../core/services/doctor.service';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { ReferralService } from '../../core/services/referral.service';

describe('CreateLabOrderComponent', () => {
  let patientServiceStub: any;
  let doctorServiceStub: any;
  let referralServiceStub: any;
  let labServiceStub: any;
  let routerStub: any;
  let queryParamMap: any;

  function setup() {
    patientServiceStub = {
      patients: signal([{ PatientId: 1, Name: 'Alice', DOB: '2000-01-01', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };
    doctorServiceStub = {
      doctors: signal([{ DoctorId: 2, Name: 'Dr Bob', Specialty: 'Cardio', Department: 'D', ContactInfo: 'x', Role: 'doctor' }]),
      search: jasmine.createSpy('search'),
    };
    referralServiceStub = {
      loadByPatient: jasmine.createSpy('loadByPatient'),
      referrals: signal([]),
    };
    labServiceStub = {
      tests: signal([
        { test_id: 10, test_code: 'T1', test_name: 'Test1', sample_type: 'blood', processing_time_days: 1 },
        { test_id: 11, test_code: 'T2', test_name: 'Test2', sample_type: 'blood', processing_time_days: 2 },
      ]),
      loadTests: jasmine.createSpy('loadTests'),
      createOrder: jasmine.createSpy('createOrder'),
    };
    routerStub = { navigate: jasmine.createSpy('navigate') };
    queryParamMap = of(convertToParamMap({}));

    TestBed.configureTestingModule({
      imports: [CreateLabOrderComponent],
      providers: [
        { provide: PatientService, useValue: patientServiceStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        { provide: ReferralService, useValue: referralServiceStub },
        { provide: LabService, useValue: labServiceStub },
        { provide: Router, useValue: routerStub },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap,
            snapshot: { paramMap: convertToParamMap({}) },
          },
        },
      ],
    });
  }

  it('should create', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit loads patients, doctors, tests and applies no prefill when absent', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(patientServiceStub.search).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalled();
    expect(labServiceStub.loadTests).toHaveBeenCalled();
    expect(comp.form.patientId).toBe(0);
    expect(comp.form.referralId).toBe(0);
  });

  it('ngOnInit applies prefilled patientId and referralId from query params', () => {
    patientServiceStub = {
      patients: signal([]),
      search: jasmine.createSpy('search'),
    };
    doctorServiceStub = { doctors: signal([]), search: jasmine.createSpy('search') };
    referralServiceStub = { loadByPatient: jasmine.createSpy('loadByPatient'), referrals: signal([]) };
    labServiceStub = { tests: signal([]), loadTests: jasmine.createSpy('loadTests'), createOrder: jasmine.createSpy('createOrder') };
    routerStub = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [CreateLabOrderComponent],
      providers: [
        { provide: PatientService, useValue: patientServiceStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        { provide: ReferralService, useValue: referralServiceStub },
        { provide: LabService, useValue: labServiceStub },
        { provide: Router, useValue: routerStub },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ patientId: '5', referralId: '9' })),
            snapshot: { paramMap: convertToParamMap({}) },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    expect(comp.form.patientId).toBe(5);
    expect(comp.form.referralId).toBe(9);
  });

  it('patientName computed returns matched patient name or empty string', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    expect(comp.patientName()).toBe('');
    comp.form.patientId = 1;
    expect(comp.patientName()).toBe('Alice');
    comp.form.patientId = 999;
    expect(comp.patientName()).toBe('');
  });

  it('doctorName computed returns formatted name or empty string', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    expect(comp.doctorName()).toBe('');
    comp.form.orderedBy = 2;
    expect(comp.doctorName()).toBe('Dr Bob (Cardio)');
    comp.form.orderedBy = 999;
    expect(comp.doctorName()).toBe('');
  });

  it('selectedTests computed filters tests by selected ids', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    expect(comp.selectedTests().length).toBe(0);
    comp.toggleTest(10);
    expect(comp.selectedTests().map((t) => t.test_id)).toEqual([10]);
  });

  it('goTo/next/back navigate steps and clamp within bounds', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.goTo(3);
    expect(comp.currentStep()).toBe(3);
    comp.back();
    expect(comp.currentStep()).toBe(2);
    comp.goTo(1);
    comp.back();
    expect(comp.currentStep()).toBe(1);
    comp.goTo(5);
    comp.next();
    expect(comp.currentStep()).toBe(5);
  });

  it('toggleTest adds and removes ids; isTestSelected reflects state', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    expect(comp.isTestSelected(10)).toBeFalse();
    comp.toggleTest(10);
    expect(comp.isTestSelected(10)).toBeTrue();
    comp.toggleTest(10);
    expect(comp.isTestSelected(10)).toBeFalse();
  });

  it('canProceedFromStep1/3/4 reflect form state', () => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    expect(comp.canProceedFromStep1()).toBeFalse();
    comp.form.patientId = 1;
    expect(comp.canProceedFromStep1()).toBeTrue();

    expect(comp.canProceedFromStep3()).toBeFalse();
    comp.toggleTest(10);
    expect(comp.canProceedFromStep3()).toBeTrue();

    expect(comp.canProceedFromStep4()).toBeFalse();
    comp.form.orderedBy = 2;
    expect(comp.canProceedFromStep4()).toBeTrue();
  });

  it('submit omits referral_id when standalone order flag set', () => {
    setup();
    labServiceStub.createOrder.and.returnValue(of({ order_id: 42 } as any));
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.form.patientId = 1;
    comp.form.referralId = 9;
    comp.standaloneOrder.set(true);
    comp.submit();
    expect(labServiceStub.createOrder).toHaveBeenCalledWith(
      jasmine.objectContaining({ referral_id: undefined }),
    );
    expect(routerStub.navigate).toHaveBeenCalledWith(['/lab/orders', 42]);
  });

  it('submit omits referral_id when referralId is falsy', () => {
    setup();
    labServiceStub.createOrder.and.returnValue(of({ order_id: 5 } as any));
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.form.patientId = 1;
    comp.form.referralId = 0;
    comp.submit();
    expect(labServiceStub.createOrder).toHaveBeenCalledWith(
      jasmine.objectContaining({ referral_id: undefined }),
    );
  });

  it('submit includes referral_id when set and not standalone', () => {
    setup();
    labServiceStub.createOrder.and.returnValue(of({ order_id: 6 } as any));
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.form.patientId = 1;
    comp.form.referralId = 7;
    comp.submit();
    expect(labServiceStub.createOrder).toHaveBeenCalledWith(
      jasmine.objectContaining({ referral_id: 7 }),
    );
  });

  it('submit sets errorMessage from backend detail on failure', () => {
    setup();
    labServiceStub.createOrder.and.returnValue(throwError(() => ({ error: { detail: 'boom' } })));
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.submit();
    expect(comp.errorMessage()).toBe('boom');
    expect(comp.submitting()).toBeFalse();
  });

  it('submit sets default errorMessage when backend detail missing', () => {
    setup();
    labServiceStub.createOrder.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.submit();
    expect(comp.errorMessage()).toBe('Failed to create lab order.');
  });

  it('constructor effect triggers loadByPatient when patientId set', fakeAsync(() => {
    setup();
    const fixture = TestBed.createComponent(CreateLabOrderComponent);
    const comp = fixture.componentInstance;
    comp.form.patientId = 1;
    fixture.detectChanges();
    tick();
    expect(referralServiceStub.loadByPatient).toHaveBeenCalledWith(1);
  }));
});
