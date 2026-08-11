export type DocumentType = 'Lab Report' | 'Imaging' | 'Referral Letter' | 'Discharge Summary';

export interface ClinicalDocument {
  DocumentId: number;
  PatientId: number;
  ReferralId: number | null;
  Type: DocumentType;
  UploadedDate: string;
  FileName: string;
  FilePath: string | null;
}

export interface DocumentUploadResponse {
  document_id: number;
  filename: string;
}
