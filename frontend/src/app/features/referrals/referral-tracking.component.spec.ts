import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ReferralTrackingComponent } from './referral-tracking.component';
import { PatientService } from '../../core/services/patient.service';
import { DoctorService } from '../../core/services/doctor.service';
import { ReferralService } from '../../core/services/referral.service';
import { Patient } from '../../core/models/patient.model';
import { Doctor } from '../../core/models/doctor.model';
import { Referral } from '../../core/models/referral.model';

function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    ReferralId: 1,
    PatientId: 1,
    ReferringDoctorId: 2,
    SpecialistId: 3,
    Reason: 'Checkup',
    Priority: 'Routine',
    Status: 'Draft',
    CreatedAt: '2024-01-01',
    UpdatedAt: '2024-01-01',
    ...overrides,
  };
}

describe('ReferralTrackingComponent', () => {
  let patientServiceStub: { patients: ReturnType<typeof signal<Patient[]>>; search: jasmine.Spy };
  let doctorServiceStub: { doctors: ReturnType<typeof signal<Doctor[]>>; search: jasmine.Spy };
  let referralServiceStub: {
    referrals: ReturnType<typeof signal<Referral[]>>;
    loadAll: jasmine.Spy;
    submit: jasmine.Spy;
    accept: jasmine.Spy;
    reject: jasmine.Spy;
    complete: jasmine.Spy;
  };

  beforeEach(async () => {
    patientServiceStub = {
      patients: signal<Patient[]>([{ PatientId: 1, Name: 'Jane Doe', DOB: '1990-01-01', Gender: 'F' }]),
      search: jasmine.createSpy('search'),
    };
    doctorServiceStub = {
      doctors: signal<Doctor[]>([
        { DoctorId: 2, Name: 'Dr. Ref', Specialty: 'Cardiology', Department: 'Cardio', ContactInfo: '', Role: 'Physician' },
      ]),
      search: jasmine.createSpy('search'),
    };
    referralServiceStub = {
      referrals: signal<Referral[]>([]),
      loadAll: jasmine.createSpy('loadAll'),
      submit: jasmine.createSpy('submit').and.returnValue(of(makeReferral())),
      accept: jasmine.createSpy('accept').and.returnValue(of(makeReferral())),
      reject: jasmine.createSpy('reject').and.returnValue(of(makeReferral())),
      complete: jasmine.createSpy('complete').and.returnValue(of(makeReferral())),
    };

    await TestBed.configureTestingModule({
      imports: [ReferralTrackingComponent],
      providers: [
        provideRouter([]),
        { provide: PatientService, useValue: patientServiceStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        { provide: ReferralService, useValue: referralServiceStub },
      ],
    }).compileComponents();
  });

  it('should create and load referrals/patients/doctors on init', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(referralServiceStub.loadAll).toHaveBeenCalled();
    expect(patientServiceStub.search).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalled();
  });

  it('resolves patientName from the patient list and falls back when unknown', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.patientName(1)).toBe('Jane Doe');
    expect(fixture.componentInstance.patientName(999)).toBe('Patient #999');
  });

  it('resolves doctorName from the doctor list and falls back when unknown', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.doctorName(2)).toBe('Dr. Ref (Cardiology)');
    expect(fixture.componentInstance.doctorName(999)).toBe('Doctor #999');
  });

  it('filteredReferrals returns all referrals when filter is "All"', () => {
    referralServiceStub.referrals.set([
      makeReferral({ ReferralId: 1, Status: 'Draft' }),
      makeReferral({ ReferralId: 2, Status: 'Accepted' }),
    ]);
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredReferrals().length).toBe(2);
  });

  it('filteredReferrals filters by the active status', () => {
    referralServiceStub.referrals.set([
      makeReferral({ ReferralId: 1, Status: 'Draft' }),
      makeReferral({ ReferralId: 2, Status: 'Accepted' }),
    ]);
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.setFilter('Accepted');
    expect(fixture.componentInstance.filteredReferrals().length).toBe(1);
    expect(fixture.componentInstance.filteredReferrals()[0].ReferralId).toBe(2);
  });

  it('setFilter updates activeFilter', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.setFilter('Rejected');
    expect(fixture.componentInstance.activeFilter()).toBe('Rejected');
  });

  it('submit() calls referralService.submit with the referral id and clears actionError on success', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.actionError.set('stale');
    const referral = makeReferral({ ReferralId: 5 });
    fixture.componentInstance.submit(referral);
    expect(referralServiceStub.submit).toHaveBeenCalledWith(5);
    expect(fixture.componentInstance.actionError()).toBeNull();
  });

  it('submit() sets actionError from the server detail on failure', () => {
    referralServiceStub.submit.and.returnValue(throwError(() => ({ error: { detail: 'Cannot submit' } })));
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.submit(makeReferral({ ReferralId: 5 }));
    expect(fixture.componentInstance.actionError()).toBe('Cannot submit');
  });

  it('submit() falls back to a generic error message when none is provided', () => {
    referralServiceStub.submit.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.submit(makeReferral({ ReferralId: 5 }));
    expect(fixture.componentInstance.actionError()).toBe('Action failed.');
  });

  it('accept() calls referralService.accept with the referral id', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.accept(makeReferral({ ReferralId: 6 }));
    expect(referralServiceStub.accept).toHaveBeenCalledWith(6);
  });

  it('reject() calls referralService.reject with the referral id', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.reject(makeReferral({ ReferralId: 7 }));
    expect(referralServiceStub.reject).toHaveBeenCalledWith(7);
  });

  it('complete() calls referralService.complete with the referral id', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.complete(makeReferral({ ReferralId: 8 }));
    expect(referralServiceStub.complete).toHaveBeenCalledWith(8);
  });

  it('renders the Submit action for Draft referrals', () => {
    referralServiceStub.referrals.set([makeReferral({ ReferralId: 1, Status: 'Draft' })]);
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.actions button')?.textContent).toContain('Submit');
  });

  it('renders Accept/Reject actions for Submitted referrals', () => {
    referralServiceStub.referrals.set([makeReferral({ ReferralId: 1, Status: 'Submitted' })]);
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('.actions button')).map((b) => b.textContent?.trim());
    expect(buttons).toContain('Accept');
    expect(buttons).toContain('Reject');
  });

  it('renders the Complete action for Accepted referrals', () => {
    referralServiceStub.referrals.set([makeReferral({ ReferralId: 1, Status: 'Accepted' })]);
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.actions button')?.textContent).toContain('Complete');
  });

  it('renders no action buttons for Rejected/Completed referrals', () => {
    referralServiceStub.referrals.set([makeReferral({ ReferralId: 1, Status: 'Completed' })]);
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.actions button').length).toBe(0);
  });

  it('shows the actionError banner when set', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    fixture.componentInstance.actionError.set('Boom');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error')?.textContent).toContain('Boom');
  });

  it('renders the empty row when there are no referrals for the current filter', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No referrals in this status.');
  });

  it('clicking a filter button invokes setFilter', () => {
    const fixture = TestBed.createComponent(ReferralTrackingComponent);
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.filters button')) as HTMLButtonElement[];
    const acceptedButton = buttons.find((b) => b.textContent?.trim() === 'Accepted')!;
    acceptedButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeFilter()).toBe('Accepted');
    expect(acceptedButton.classList.contains('active')).toBeTrue();
  });
});
