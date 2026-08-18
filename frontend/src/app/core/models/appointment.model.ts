export interface Appointment {
  AppointmentId: number;
  PatientId: number;
  ReferralId: number | null;
  DoctorId: number;
  ScheduledDate: string;
  Location: string;
  Status: string;
}
