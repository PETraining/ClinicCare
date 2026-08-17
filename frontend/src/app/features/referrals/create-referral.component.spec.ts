import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { CreateReferralComponent } from './create-referral.component';
import { ReferralService } from '../../core/services/referral.service';
import { API_BASE_URL } from '../../core/config';
import { Referral } from '../../core/models/referral.model';

function deniedReferralFor(patientId: number): Referral {
  return {
    ReferralId: 1,
    PatientId: patientId,
    ReferringDoctorId: 6,
    SpecialistId: 1,
    Reason: 'Prior visit',
    Priority: 'Routine',
    Status: 'Submitted',
    CreatedAt: '2026-01-01T00:00:00',
    UpdatedAt: '2026-01-01T00:00:00',
    authorization: {
      AuthorizationId: 1,
      ReferralId: 1,
      Status: 'Denied',
      RequestedDate: null,
      DecisionDate: null,
      DecisionNotes: 'Insurer requires step therapy documentation.',
      CreatedAt: '2026-01-01T00:00:00',
      UpdatedAt: '2026-01-01T00:00:00',
    },
  };
}

describe('CreateReferralComponent', () => {
  let fixture: ComponentFixture<CreateReferralComponent>;
  let component: CreateReferralComponent;
  let httpTesting: HttpTestingController;
  let referralService: ReferralService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateReferralComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateReferralComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    referralService = TestBed.inject(ReferralService);

    fixture.detectChanges(); // ngOnInit -> patientService.search() + doctorService.search()
    httpTesting.expectOne(`${API_BASE_URL}/patients`).flush([]);
    httpTesting.expectOne(`${API_BASE_URL}/doctors`).flush([]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('computes deniedAuthorizations() from the selected patient\'s referral history', () => {
    component.selectedPatientId.set(1);
    referralService.referrals.set([deniedReferralFor(1)]);

    expect(component.deniedAuthorizations().length).toBe(1);
  });

  it('does not compute deniedAuthorizations() for a different patient\'s referrals', () => {
    component.selectedPatientId.set(2);
    referralService.referrals.set([deniedReferralFor(1)]);

    expect(component.deniedAuthorizations().length).toBe(0);
  });

  // Known bug — validationresult.md "FAIL: Referral Creation Not Blocked When
  // Authorization Is Denied". submit() (create-referral.component.ts:74-87)
  // never checks deniedAuthorizations() before calling
  // referralService.create(...); only a warning paragraph is shown in the
  // template. This test encodes the desired behavior from plan.md:2.2 ("Block
  // referral creation if status is Denied") and is expected to FAIL (red)
  // until that guard is added to submit()/the submit button's disabled binding.
  it('should not submit a new referral while the patient has a Denied authorization on record', () => {
    component.selectedPatientId.set(1);
    referralService.referrals.set([deniedReferralFor(1)]);
    component.form = {
      PatientId: 1,
      ReferringDoctorId: 6,
      SpecialistId: 1,
      Reason: 'New unrelated complaint',
      Priority: 'Routine',
    };

    component.submit();

    const attempted = httpTesting.match(`${API_BASE_URL}/referrals`);
    expect(attempted.length).toBe(0);
    // Keep the mock backend clean even when this assertion above fails.
    attempted.forEach((req) =>
      req.flush({ ReferralId: 999, ...component.form, Status: 'Draft', CreatedAt: '', UpdatedAt: '', authorization: null }),
    );
  });

  it('does submit when the patient has no Denied authorization on record', () => {
    component.selectedPatientId.set(1);
    component.form = {
      PatientId: 1,
      ReferringDoctorId: 6,
      SpecialistId: 1,
      Reason: 'New unrelated complaint',
      Priority: 'Routine',
    };

    component.submit();

    const req = httpTesting.expectOne(`${API_BASE_URL}/referrals`);
    expect(req.request.method).toBe('POST');
    req.flush({ ReferralId: 42, ...component.form, Status: 'Draft', CreatedAt: '', UpdatedAt: '', authorization: null });
  });
});
