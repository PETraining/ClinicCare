export type ReferralPriority = 'Routine' | 'Urgent' | 'Emergent';
export type ReferralStatus = 'Draft' | 'Submitted' | 'Accepted' | 'Rejected' | 'Completed';

export interface Referral {
  ReferralId: number;
  PatientId: number;
  ReferringDoctorId: number;
  SpecialistId: number;
  Reason: string;
  Priority: ReferralPriority;
  Status: ReferralStatus;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ReferralCreate {
  PatientId: number;
  ReferringDoctorId: number;
  SpecialistId: number;
  Reason: string;
  Priority: ReferralPriority;
}
