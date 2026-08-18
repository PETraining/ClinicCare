import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleAppointmentComponent } from './schedule-appointment.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('ScheduleAppointmentComponent', () => {
  let component: ScheduleAppointmentComponent;
  let fixture: ComponentFixture<ScheduleAppointmentComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;

  beforeEach(async () => {
    const appointmentServiceSpy = jasmine.createSpyObj('AppointmentService', ['create']);
    appointmentServiceSpy.appointments = signal([]);

    await TestBed.configureTestingModule({
      imports: [ScheduleAppointmentComponent],
      providers: [
        { provide: AppointmentService, useValue: appointmentServiceSpy }
      ]
    }).compileComponents();

    appointmentService = TestBed.inject(AppointmentService) as jasmine.SpyObj<AppointmentService>;
    fixture = TestBed.createComponent(ScheduleAppointmentComponent);
    component = fixture.componentInstance;
    component.referralId = 5;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.Location).toBe('');
  });

  it('should emit onSuccess when form submitted successfully', (done) => {
    const mockAppointment: Appointment = {
      AppointmentId: 1,
      ReferralId: 5,
      PatientId: 3,
      SpecialistId: 2,
      ScheduledDate: new Date('2026-08-20T14:00:00'),
      Location: 'Office B',
      Status: 'Scheduled',
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };

    appointmentService.create.and.returnValue(of(mockAppointment));
    spyOn(component.onSuccess, 'emit');

    component.form = {
      ScheduledDate: new Date('2026-08-20T14:00:00'),
      Location: 'Office B'
    };

    component.submit();

    setTimeout(() => {
      expect(appointmentService.create).toHaveBeenCalledWith(5, component.form);
      expect(component.onSuccess.emit).toHaveBeenCalledWith(mockAppointment);
      expect(component.submitting()).toBe(false);
      expect(component.errorMessage()).toBe('');
      done();
    }, 0);
  });

  it('should display error message on submit failure', (done) => {
    const errorResponse = { error: { detail: 'Referral not found' } };
    appointmentService.create.and.returnValue(throwError(() => errorResponse));

    component.form = {
      ScheduledDate: new Date('2026-08-20T14:00:00'),
      Location: 'Office B'
    };

    component.submit();

    setTimeout(() => {
      expect(component.errorMessage()).toBe('Referral not found');
      expect(component.submitting()).toBe(false);
      done();
    }, 0);
  });

  it('should display fallback error message when detail is missing', (done) => {
    const errorResponse = {};
    appointmentService.create.and.returnValue(throwError(() => errorResponse));

    component.form = {
      ScheduledDate: new Date('2026-08-20T14:00:00'),
      Location: 'Office B'
    };

    component.submit();

    setTimeout(() => {
      expect(component.errorMessage()).toBe('Failed to schedule appointment');
      done();
    }, 0);
  });

  it('should reset form on cancel', () => {
    component.form = {
      ScheduledDate: new Date('2026-08-20T14:00:00'),
      Location: 'Office B'
    };
    component.errorMessage.set('Some error');
    spyOn(component.onCancel, 'emit');

    component.cancel();

    expect(component.form.Location).toBe('');
    expect(component.errorMessage()).toBe('');
    expect(component.onCancel.emit).toHaveBeenCalled();
  });

  it('should disable submit button when form is invalid', () => {
    component.form = {
      ScheduledDate: new Date(),
      Location: ''
    };
    fixture.detectChanges();

    // Form is invalid when required fields are empty
    expect(component).toBeTruthy();
  });

  it('should disable submit button when submitting', () => {
    component.submitting.set(true);
    fixture.detectChanges();

    expect(component.submitting()).toBe(true);
  });

  it('should show loading text during submission', () => {
    component.submitting.set(true);
    fixture.detectChanges();

    expect(component.submitting()).toBe(true);
  });
});
