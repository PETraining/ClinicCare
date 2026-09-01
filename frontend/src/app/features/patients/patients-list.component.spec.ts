import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientsListComponent } from './patients-list.component';
import { PatientService } from '../../core/services/patient.service';
import { signal } from '@angular/core';

describe('PatientsListComponent - Referral Status Badge', () => {
  let component: PatientsListComponent;
  let fixture: ComponentFixture<PatientsListComponent>;
  let patientService: jasmine.SpyObj<PatientService>;

  beforeEach(async () => {
    const patientServiceSpy = jasmine.createSpyObj('PatientService', ['search']);

    await TestBed.configureTestingModule({
      imports: [PatientsListComponent],
      providers: [{ provide: PatientService, useValue: patientServiceSpy }],
    }).compileComponents();

    patientService = TestBed.inject(PatientService) as jasmine.SpyObj<PatientService>;
    fixture = TestBed.createComponent(PatientsListComponent);
    component = fixture.componentInstance;
  });

  it('should display "Referral" badge for referral patients', () => {
    // Mock patients with IsReferralPatient = true
    patientService.patients = signal([
      {
        PatientId: 1,
        Name: 'John Doe',
        DOB: '1990-01-01',
        Gender: 'M',
        IsReferralPatient: true,
        LastReferralId: 5,
      },
    ]);

    fixture.detectChanges();
    const badgeElement = fixture.nativeElement.querySelector('.badge-referral-small');

    expect(badgeElement).toBeTruthy();
    expect(badgeElement.textContent).toContain('📋 Referral');
  });

  it('should display "Ordinary" badge for non-referral patients', () => {
    // Mock patients with IsReferralPatient = false
    patientService.patients = signal([
      {
        PatientId: 2,
        Name: 'Jane Smith',
        DOB: '1985-05-15',
        Gender: 'F',
        IsReferralPatient: false,
      },
    ]);

    fixture.detectChanges();
    const badgeElement = fixture.nativeElement.querySelector('.badge-ordinary-small');

    expect(badgeElement).toBeTruthy();
    expect(badgeElement.textContent).toContain('👤 Ordinary');
  });

  it('should display correct badge for each patient type', () => {
    // Mock mixed patient list
    patientService.patients = signal([
      {
        PatientId: 1,
        Name: 'Referral Patient',
        DOB: '1990-01-01',
        Gender: 'M',
        IsReferralPatient: true,
        LastReferralId: 5,
      },
      {
        PatientId: 2,
        Name: 'Ordinary Patient',
        DOB: '1985-05-15',
        Gender: 'F',
        IsReferralPatient: false,
      },
    ]);

    fixture.detectChanges();
    const referralBadges = fixture.nativeElement.querySelectorAll('.badge-referral-small');
    const ordinaryBadges = fixture.nativeElement.querySelectorAll('.badge-ordinary-small');

    expect(referralBadges.length).toBe(1);
    expect(ordinaryBadges.length).toBe(1);
  });
});
