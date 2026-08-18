import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CreateReferralComponent } from './create-referral.component';
import { PatientService } from '../../core/services/patient.service';
import { DoctorService } from '../../core/services/doctor.service';
import { ReferralService } from '../../core/services/referral.service';
import { Patient } from '../../core/models/patient.model';
import { Doctor } from '../../core/models/doctor.model';
import { Referral } from '../../core/models/referral.model';

function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    ReferralId: 99,
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

describe('CreateReferralComponent', () => {
  let patientServiceStub: { patients: ReturnType<typeof signal<Patient[]>>; search: jasmine.Spy };
  let doctorServiceStub: { doctors: ReturnType<typeof signal<Doctor[]>>; search: jasmine.Spy };
  let referralServiceStub: { create: jasmine.Spy };
  let routerStub: { navigate: jasmine.Spy };

  function configure(queryParams: Record<string, string>) {
    return TestBed.configureTestingModule({
      imports: [CreateReferralComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap(queryParams)) },
        },
        { provide: Router, useValue: routerStub },
        { provide: PatientService, useValue: patientServiceStub },
        { provide: DoctorService, useValue: doctorServiceStub },
        { provide: ReferralService, useValue: referralServiceStub },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    patientServiceStub = { patients: signal<Patient[]>([]), search: jasmine.createSpy('search') };
    doctorServiceStub = { doctors: signal<Doctor[]>([]), search: jasmine.createSpy('search') };
    referralServiceStub = { create: jasmine.createSpy('create') };
    routerStub = { navigate: jasmine.createSpy('navigate') };
  });

  it('should create and load patients/doctors on init', async () => {
    await configure({});
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(patientServiceStub.search).toHaveBeenCalled();
    expect(doctorServiceStub.search).toHaveBeenCalled();
  });

  it('prefills PatientId from the patientId query param', async () => {
    await configure({ patientId: '55' });
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.PatientId).toBe(55);
  });

  it('leaves PatientId at default when there is no patientId query param', async () => {
    await configure({});
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.PatientId).toBe(0);
  });

  it('submits successfully and navigates to /referrals with the created id', async () => {
    await configure({});
    const created = makeReferral({ ReferralId: 123 });
    referralServiceStub.create.and.returnValue(of(created));
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(referralServiceStub.create).toHaveBeenCalledWith(fixture.componentInstance.form);
    expect(fixture.componentInstance.submitting()).toBeFalse();
    expect(fixture.componentInstance.errorMessage()).toBeNull();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/referrals'], { queryParams: { created: 123 } });
  });

  it('sets errorMessage from the server detail on failure', async () => {
    await configure({});
    referralServiceStub.create.and.returnValue(throwError(() => ({ error: { detail: 'Doctor not found' } })));
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.submitting()).toBeFalse();
    expect(fixture.componentInstance.errorMessage()).toBe('Doctor not found');
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic error message when the server provides no detail', async () => {
    await configure({});
    referralServiceStub.create.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Failed to create referral.');
  });

  it('sets submitting to true while the request is in flight and clears prior error', async () => {
    await configure({});
    referralServiceStub.create.and.returnValue(of(makeReferral()));
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();
    fixture.componentInstance.errorMessage.set('stale error');

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('renders patient and doctor options and the error message', async () => {
    await configure({});
    patientServiceStub.patients.set([{ PatientId: 1, Name: 'Jane Doe', DOB: '1990-01-01', Gender: 'F' }]);
    doctorServiceStub.doctors.set([
      { DoctorId: 2, Name: 'Dr. Smith', Specialty: 'Cardiology', Department: 'Cardio', ContactInfo: '', Role: 'Physician' },
    ]);
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();
    fixture.componentInstance.errorMessage.set('Something went wrong');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Jane Doe');
    expect(compiled.textContent).toContain('Dr. Smith');
    expect(compiled.querySelector('.error')?.textContent).toContain('Something went wrong');
  });

  it('shows "Creating..." label on the submit button while submitting', async () => {
    await configure({});
    const fixture = TestBed.createComponent(CreateReferralComponent);
    fixture.detectChanges();
    fixture.componentInstance.submitting.set(true);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.textContent).toContain('Creating...');
    expect(button.disabled).toBeTrue();
  });
});
