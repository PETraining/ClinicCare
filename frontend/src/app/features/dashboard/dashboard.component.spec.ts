import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { DashboardComponent } from './dashboard.component';
import { ReferralService } from '../../core/services/referral.service';
import { Referral } from '../../core/models/referral.model';

function makeReferral(overrides: Partial<Referral>): Referral {
  return {
    ReferralId: 1,
    PatientId: 1,
    ReferringDoctorId: 1,
    SpecialistId: 2,
    Reason: 'Reason',
    Priority: 'Routine',
    Status: 'Draft',
    CreatedAt: '2024-01-01',
    UpdatedAt: '2024-01-01',
    ...overrides,
  };
}

describe('DashboardComponent', () => {
  let referralServiceStub: { referrals: ReturnType<typeof signal<Referral[]>>; loadAll: jasmine.Spy };

  beforeEach(async () => {
    referralServiceStub = {
      referrals: signal<Referral[]>([]),
      loadAll: jasmine.createSpy('loadAll'),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ReferralService, useValue: referralServiceStub },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('calls loadAll on init', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(referralServiceStub.loadAll).toHaveBeenCalled();
  });

  it('computes total as referral count', () => {
    referralServiceStub.referrals.set([
      makeReferral({ ReferralId: 1 }),
      makeReferral({ ReferralId: 2 }),
    ]);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(2);
  });

  it('computes counts by status', () => {
    referralServiceStub.referrals.set([
      makeReferral({ ReferralId: 1, Status: 'Draft' }),
      makeReferral({ ReferralId: 2, Status: 'Draft' }),
      makeReferral({ ReferralId: 3, Status: 'Submitted' }),
      makeReferral({ ReferralId: 4, Status: 'Accepted' }),
      makeReferral({ ReferralId: 5, Status: 'Rejected' }),
      makeReferral({ ReferralId: 6, Status: 'Completed' }),
    ]);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const counts = fixture.componentInstance.counts();
    expect(counts['Draft']).toBe(2);
    expect(counts['Submitted']).toBe(1);
    expect(counts['Accepted']).toBe(1);
    expect(counts['Rejected']).toBe(1);
    expect(counts['Completed']).toBe(1);
  });

  it('returns zero counts when there are no referrals', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const counts = fixture.componentInstance.counts();
    for (const status of fixture.componentInstance.statuses) {
      expect(counts[status]).toBe(0);
    }
  });

  it('renders total and per-status counts in the template', () => {
    referralServiceStub.referrals.set([makeReferral({ ReferralId: 1, Status: 'Draft' })]);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.subtitle')?.textContent).toContain('1 total referrals');
    expect(compiled.querySelectorAll('.card').length).toBe(fixture.componentInstance.statuses.length);
  });
});
