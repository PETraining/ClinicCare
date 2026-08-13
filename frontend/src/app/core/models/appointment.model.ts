export interface Appointment {
  AppointmentId: number;
  ReferralId: number;
  PatientId: number;
  ScheduledAt: string;
  Location: string;
  CheckInInstructions: string | null;
}
