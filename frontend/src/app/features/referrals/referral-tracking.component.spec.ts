import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ReferralTrackingComponent } from './referral-tracking.component';
import { API_BASE_URL } from '../../core/config';
import { AuthorizationStatus, Referral, ReferralStatus } from '../../core/models/referral.model';

function makeReferral(status: ReferralStatus, authStatus: AuthorizationStatus | null): Referral {
  return {
    ReferralId: 1,
    PatientId: 1,
    ReferringDoctorId: 6,
    SpecialistId: 1,
    Reason: 'x',
    Priority: 'Routine',
    Status: status,
    CreatedAt: '2026-01-01T00:00:00',
    UpdatedAt: '2026-01-01T00:00:00',
    authorization: authStatus
      ? {
          AuthorizationId: 1,
          ReferralId: 1,
          Status: authStatus,
          RequestedDate: null,
          DecisionDate: null,
          DecisionNotes: null,
          CreatedAt: '2026-01-01T00:00:00',
          UpdatedAt: '2026-01-01T00:00:00',
        }
      : null,
  };
}

// Regression coverage for the fix documented in
// teamupdates/insurance-authorization/plan.md "Defects Found & Fixed" —
// pins canAccept()/canSubmit() so a future edit can't silently reintroduce
// "Accept available despite unresolved authorization."
describe('ReferralTrackingComponent — authorization guards', () => {
  let component: ReferralTrackingComponent;
  let fixture: ComponentFixture<ReferralTrackingComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferralTrackingComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReferralTrackingComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);

    fixture.detectChanges(); // ngOnInit -> loadAll() + patient/doctor search()
    httpTesting.expectOne(`${API_BASE_URL}/referrals`).flush([]);
    httpTesting.expectOne(`${API_BASE_URL}/patients`).flush([]);
    httpTesting.expectOne(`${API_BASE_URL}/doctors`).flush([]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('canAccept() is false when the referral\'s own authorization is Pending', () => {
    expect(component.canAccept(makeReferral('Submitted', 'Pending'))).toBeFalse();
  });

  it('canAccept() is false when the referral\'s own authorization is Denied', () => {
    expect(component.canAccept(makeReferral('Submitted', 'Denied'))).toBeFalse();
  });

  it('canAccept() is true when authorization is Approved, Not Required, or absent', () => {
    expect(component.canAccept(makeReferral('Submitted', 'Approved'))).toBeTrue();
    expect(component.canAccept(makeReferral('Submitted', 'Not Required'))).toBeTrue();
    expect(component.canAccept(makeReferral('Submitted', null))).toBeTrue();
  });

  it('canSubmit() is false when the referral is Draft and its authorization is Denied', () => {
    expect(component.canSubmit(makeReferral('Draft', 'Denied'))).toBeFalse();
  });

  it('canSubmit() is false for a non-Draft referral even without a Denied authorization', () => {
    expect(component.canSubmit(makeReferral('Submitted', 'Approved'))).toBeFalse();
  });

  it('canSubmit() is true for a Draft referral with no Denied authorization', () => {
    expect(component.canSubmit(makeReferral('Draft', 'Approved'))).toBeTrue();
    expect(component.canSubmit(makeReferral('Draft', null))).toBeTrue();
  });
});
