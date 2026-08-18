import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentCreate } from '../models/appointment.model';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService]
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('listByReferral', () => {
    it('should fetch appointments for a referral and update signal', () => {
      const referralId = 5;
      const mockAppointments: Appointment[] = [
        {
          AppointmentId: 1,
          ReferralId: 5,
          PatientId: 3,
          SpecialistId: 3,
          ScheduledDate: new Date('2026-08-15T10:00:00'),
          Location: 'Clinic A',
          Status: 'Scheduled',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        }
      ];

      service.listByReferral(referralId);

      const req = httpMock.expectOne(`${baseUrl}/referrals/${referralId}/appointments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAppointments);

      expect(service.appointments()).toEqual(mockAppointments);
    });
  });

  describe('create', () => {
    it('should create appointment and update signal', (done) => {
      const referralId = 5;
      const payload: AppointmentCreate = {
        ScheduledDate: new Date('2026-08-20T14:00:00'),
        Location: 'Office B',
        SpecialistId: 2
      };
      const mockResponse: Appointment = {
        AppointmentId: 2,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: payload.ScheduledDate,
        Location: payload.Location,
        Status: 'Scheduled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      service.create(referralId, payload).subscribe((apt) => {
        expect(apt).toEqual(mockResponse);
        expect(service.appointments()).toContain(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/referrals/${referralId}/appointments`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('reschedule', () => {
    it('should reschedule appointment and update signal', (done) => {
      const appointmentId = 1;
      const payload: AppointmentCreate = {
        ScheduledDate: new Date('2026-08-25T15:00:00'),
        Location: 'New Office',
        SpecialistId: 3
      };
      const mockResponse: Appointment = {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 3,
        ScheduledDate: payload.ScheduledDate,
        Location: payload.Location,
        Status: 'Scheduled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      // Set up initial appointment in signal
      service.appointments.set([
        {
          AppointmentId: 1,
          ReferralId: 5,
          PatientId: 3,
          SpecialistId: 2,
          ScheduledDate: new Date(),
          Location: 'Old Office',
          Status: 'Scheduled',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        }
      ]);

      service.reschedule(appointmentId, payload).subscribe((apt) => {
        expect(apt.Location).toBe('New Office');
        expect(service.appointments()[0].Location).toBe('New Office');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/referrals/appointments/${appointmentId}/reschedule`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockResponse);
    });
  });

  describe('complete', () => {
    it('should mark appointment as completed and update signal', (done) => {
      const appointmentId = 1;
      const mockResponse: Appointment = {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: new Date(),
        Location: 'Clinic A',
        Status: 'Completed',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      // Set up initial appointment
      service.appointments.set([
        {
          AppointmentId: 1,
          ReferralId: 5,
          PatientId: 3,
          SpecialistId: 2,
          ScheduledDate: new Date(),
          Location: 'Clinic A',
          Status: 'Scheduled',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        }
      ]);

      service.complete(appointmentId).subscribe((apt) => {
        expect(apt.Status).toBe('Completed');
        expect(service.appointments()[0].Status).toBe('Completed');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/referrals/appointments/${appointmentId}/complete`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockResponse);
    });
  });

  describe('cancel', () => {
    it('should cancel appointment and update signal', (done) => {
      const appointmentId = 1;
      const mockResponse: Appointment = {
        AppointmentId: 1,
        ReferralId: 5,
        PatientId: 3,
        SpecialistId: 2,
        ScheduledDate: new Date(),
        Location: 'Clinic A',
        Status: 'Cancelled',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      // Set up initial appointment
      service.appointments.set([
        {
          AppointmentId: 1,
          ReferralId: 5,
          PatientId: 3,
          SpecialistId: 2,
          ScheduledDate: new Date(),
          Location: 'Clinic A',
          Status: 'Scheduled',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        }
      ]);

      service.cancel(appointmentId).subscribe((apt) => {
        expect(apt.Status).toBe('Cancelled');
        expect(service.appointments()[0].Status).toBe('Cancelled');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/referrals/appointments/${appointmentId}/cancel`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockResponse);
    });
  });
});
