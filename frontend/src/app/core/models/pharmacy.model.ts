/**
 * Pharmacy Domain Models
 * Represents medications, prescriptions, and dispensing records
 */

/**
 * Medication in inventory
 */
export interface Medication {
  MedicationId: number;
  Name: string;
  Dosage: string;
  StockLevel: number;
  MinStockLevel: number;
  UnitPrice?: number;
  CreatedAt?: string;
}

/**
 * Medication within a prescription
 */
export interface MedicationInPrescription {
  medication_id: number;
  quantity: number;
  frequency: string;
  instructions?: string;
}

/**
 * Dispensing record - audit trail
 */
export interface DispensingRecord {
  DispensingId: number;
  PrescriptionId: number;
  MedicationId: number;
  QuantityDispensed: number;
  DispensedAt: string;
  DispensedBy: string;
}

/**
 * Prescription
 */
export interface Prescription {
  PrescriptionId: number;
  ReferralId: number;
  PatientId: number;
  PrescribingDoctorId: number;
  Medications: MedicationInPrescription[];
  Status: 'Active' | 'Completed' | 'Voided';
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Prescription with dispensing history
 */
export interface PrescriptionDetail extends Prescription {
  DispensingRecords?: DispensingRecord[];
}

/**
 * Request payload for dispensing medication
 */
export interface DispenseRequest {
  medication_id: number;
  quantity_dispensed: number;
}

/**
 * Response from dispensing action
 */
export interface DispenseResponse {
  success: boolean;
  dispensing_id: number;
  remaining_stock: number;
  message?: string;
}

/**
 * Low stock response
 */
export interface LowStockResponse {
  medications: Medication[];
  count: number;
}
