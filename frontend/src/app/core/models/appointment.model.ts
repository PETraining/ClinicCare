export interface Appointment {
  AppointmentId: number;
  ReferralId: number;
  PatientId: number;
  SpecialistId: number;
  ScheduledDate: Date;
  Location: string;
  Status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface AppointmentCreate {
  ScheduledDate: Date;
  Location: string;
  SpecialistId: number;
}
