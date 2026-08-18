import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentListComponent } from './appointment-list.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { signal } from '@angular/core';
import { Appointment } from '../../core/models/appointment.model';

describe('AppointmentListComponent', () => {
  let component: AppointmentListComponent;
  let fixture: ComponentFixture<AppointmentListComponent>;
  let appointmentService: jasmine.SpyObj<AppointmentService>;

  beforeEach(async () => {
    const appointmentServiceSpy = jasmine.createSpyObj('AppointmentService', [
      'listByReferral',
      'reschedule',
      'complete',
      'cancel'
    ]);
    appointmentServiceSpy.appointments = signal<Appointment[]>([]);

    await TestBed.configureTestingModule({
      imports: [AppointmentListComponent],
      providers: [
        { provide: AppointmentService, useValue: appointmentServiceSpy }
      ]
    }).compileComponents();

    appointmentService = TestBed.inject(AppointmentService) as jasmine.SpyObj<AppointmentService>;
    fixture = TestBed.createComponent(AppointmentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments when referralId is set', () => {
    component.referralId = 5;
    expect(appointmentService.listByReferral).toHaveBeenCalledWith(5);
  });

  it('should display empty message when no appointments', () => {
    appointmentService.appointments.set([]);
    fixture.detectChanges();
    const emptyMsg = fixture.nativeElement.querySelector('.empty');
    expect(emptyMsg?.textContent).toContain('No appointments scheduled');
  });

  it('should display appointments in table', () => {
    const mockAppointments: Appointment[] = [
      {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: new Date('2026-08-15T10:00:00'),
        Location: 'Clinic A',
        Status: 'Scheduled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      }
    ];
    appointmentService.appointments.set(mockAppointments);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
  });

  it('should show reschedule button only for Scheduled appointments', () => {
    const mockAppointments: Appointment[] = [
      {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: new Date('2026-08-15T10:00:00'),
        Location: 'Clinic A',
        Status: 'Scheduled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      }
    ];
    appointmentService.appointments.set(mockAppointments);
    fixture.detectChanges();

    const rescheduleBtn = fixture.nativeElement.querySelector('button:contains("Reschedule")');
    expect(rescheduleBtn).toBeTruthy();
  });

  it('should open reschedule modal when clicking reschedule', () => {
    const mockAppointment: Appointment = {
      AppointmentId: 1,
      ReferralId: 5,
      PatientId: 3,
      SpecialistId: 2,
      ScheduledDate: new Date('2026-08-15T10:00:00'),
      Location: 'Clinic A',
      Status: 'Scheduled',
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };
    appointmentService.appointments.set([mockAppointment]);

    component.openReschedule(mockAppointment);
    expect(component.reschedulingId()).toBe(1);
    expect(component.rescheduleForm.ScheduledDate).toEqual(mockAppointment.ScheduledDate);
  });

  it('should call cancel on cancel button click', () => {
    const mockAppointments: Appointment[] = [
      {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: new Date('2026-08-15T10:00:00'),
        Location: 'Clinic A',
        Status: 'Scheduled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      }
    ];
    appointmentService.appointments.set(mockAppointments);
    appointmentService.cancel.and.returnValue({ subscribe: () => {} } as any);

    component.onCancel(1);
    expect(appointmentService.cancel).toHaveBeenCalledWith(1);
  });

  it('should call complete on complete button click', () => {
    const mockAppointments: Appointment[] = [
      {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: new Date('2026-08-15T10:00:00'),
        Location: 'Clinic A',
        Status: 'Scheduled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      }
    ];
    appointmentService.appointments.set(mockAppointments);
    appointmentService.complete.and.returnValue({ subscribe: () => {} } as any);

    component.onComplete(1);
    expect(appointmentService.complete).toHaveBeenCalledWith(1);
  });

  it('should close reschedule modal on cancel', () => {
    component.reschedulingId.set(1);
    component.cancelReschedule();
    expect(component.reschedulingId()).toBeNull();
  });

  it('should submit reschedule and update signal', () => {
    appointmentService.reschedule.and.returnValue({
      subscribe: (cb: any) => {
        cb({
          AppointmentId: 1,
          ReferralId: 5,
          PatientId: 3,
          SpecialistId: 2,
          ScheduledDate: new Date('2026-08-25T15:00:00'),
          Location: 'New Office',
          Status: 'Scheduled',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }
    } as any);

    component.reschedulingId.set(1);
    component.rescheduleForm = {
      ScheduledDate: new Date('2026-08-25T15:00:00'),
      Location: 'New Office'
    };

    component.submitReschedule();
    expect(appointmentService.reschedule).toHaveBeenCalledWith(1, component.rescheduleForm);
  });
});
