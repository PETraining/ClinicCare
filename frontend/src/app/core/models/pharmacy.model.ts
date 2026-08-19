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
  // PHASE 1: Stock Status Fields
  StockStatus?: 'InStock' | 'LowStock' | 'OutOfStock' | 'Discontinued';
  IsDiscontinued?: boolean;
  LastRestockedAt?: string;
  CreatedAt?: string;
}

/**
 * Stock status type definition (PHASE 1)
 */
export type StockStatus = 'InStock' | 'LowStock' | 'OutOfStock' | 'Discontinued';

/**
 * Medication within a prescription
 */
export interface MedicationInPrescription {
  medication_id: number;
  Name?: string;           // Optional - populated by backend when returning prescription
  Dosage?: string;         // Optional - populated by backend when returning prescription
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
  ReferralId?: number;
  PatientId: number;
  PrescribingDoctorId: number;
  Medications: MedicationInPrescription[];
  Status: 'Draft' | 'Prescribed' | 'PartiallyFulfilled' | 'Fulfilled' | 'Voided';
  // PHASE 2: Refill Tracking Fields
  RefillsAllowed?: number;      // 0=no refill, -1=unlimited
  RefillsRemaining?: number;    // How many refills left
  LastRefillDate?: string;      // When was it last refilled
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Refill request (PHASE 2)
 */
export interface RefillRequest {
  RefillRequestId: number;
  PrescriptionId: number;
  PatientId: number;
  Status: 'Pending' | 'Approved' | 'Fulfilled' | 'Rejected';
  RequestedAt: string;
  ApprovedAt?: string;
  ApprovedBy?: number;
  FulfilledAt?: string;
  FulfilledBy?: number;
  RejectionReason?: string;
  Notes?: string;
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
  dispensed_by?: string;  // Optional: pharmacist name, defaults to "Pharmacy"
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
