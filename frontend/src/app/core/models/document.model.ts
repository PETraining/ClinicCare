export type DocumentType = 'Lab Report' | 'Imaging' | 'Referral Letter' | 'Discharge Summary' | 'Pre-Visit Form';
export type UploadedByType = 'Clinician' | 'Patient';

export interface ClinicalDocument {
  DocumentId: number;
  PatientId: number;
  ReferralId: number | null;
  Type: DocumentType;
  UploadedDate: string;
  FileName: string;
  StoragePath: string | null;
  UploadedBy: UploadedByType;
}
