export type ReferralPriority = 'Routine' | 'Urgent' | 'Emergent';
export type ReferralStatus = 'Draft' | 'Submitted' | 'Accepted' | 'Rejected' | 'Completed';
export type AuthorizationStatus = 'Not Required' | 'Pending' | 'Approved' | 'Denied';

export interface Authorization {
  AuthorizationId: number;
  ReferralId: number;
  Status: AuthorizationStatus;
  RequestedDate: string | null;
  DecisionDate: string | null;
  DecisionNotes: string | null;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface AuthorizationUpdate {
  Status: AuthorizationStatus;
  DecisionNotes?: string | null;
}

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
  authorization: Authorization | null;
}

export interface ReferralCreate {
  PatientId: number;
  ReferringDoctorId: number;
  SpecialistId: number;
  Reason: string;
  Priority: ReferralPriority;
}
