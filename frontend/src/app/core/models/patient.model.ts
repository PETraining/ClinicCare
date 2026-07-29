export interface Allergy {
  AllergyId: number;
  PatientId: number;
  Substance: string;
  Severity: string;
}

export interface ChronicCondition {
  ConditionId: number;
  PatientId: number;
  Name: string;
  DiagnosedDate: string;
}

export interface Medication {
  MedicationId: number;
  PatientId: number;
  Name: string;
  Dosage: string;
  Active: boolean;
}

export interface Patient {
  PatientId: number;
  Name: string;
  DOB: string;
  Gender: string;
}

export interface PatientDetail extends Patient {
  allergies: Allergy[];
  conditions: ChronicCondition[];
  medications: Medication[];
}
