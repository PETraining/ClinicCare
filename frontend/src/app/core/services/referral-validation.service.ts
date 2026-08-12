import { Injectable } from '@angular/core';
import { ReferralCreate, Referral } from '../models/referral.model';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  category: 'patient' | 'referral' | 'documents' | 'business-rules' | 'security';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: string;
  timestamp: string;
}

export interface PatientReferralScreenData {
  referral: Referral;
  patientId: number;
  documentsUploaded: boolean;
  questionnairesCompleted: boolean;
  appointmentScheduled: boolean;
  appointmentDate?: string;
  allRequiredDocuments: string[];
  uploadedDocuments: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ReferralValidationService {
  /**
   * Validates referral creation form data
   */
  validateReferralForm(referral: ReferralCreate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Patient validation
    if (!referral.PatientId || referral.PatientId <= 0) {
      errors.push({
        field: 'PatientId',
        message: 'Patient must be selected',
        severity: 'error',
        category: 'patient',
      });
    }

    // Referring doctor validation
    if (!referral.ReferringDoctorId || referral.ReferringDoctorId <= 0) {
      errors.push({
        field: 'ReferringDoctorId',
        message: 'Referring doctor must be selected',
        severity: 'error',
        category: 'referral',
      });
    }

    // Specialist validation
    if (!referral.SpecialistId || referral.SpecialistId <= 0) {
      errors.push({
        field: 'SpecialistId',
        message: 'Specialist must be selected',
        severity: 'error',
        category: 'referral',
      });
    }

    // Reason validation
    if (!referral.Reason || referral.Reason.trim().length === 0) {
      errors.push({
        field: 'Reason',
        message: 'Reason for referral is required',
        severity: 'error',
        category: 'referral',
      });
    } else if (referral.Reason.trim().length < 10) {
      warnings.push({
        field: 'Reason',
        message: 'Reason should be at least 10 characters for clinical clarity',
        severity: 'warning',
        category: 'referral',
      });
    }

    // Priority validation
    const validPriorities = ['Routine', 'Urgent', 'Emergent'];
    if (!validPriorities.includes(referral.Priority)) {
      errors.push({
        field: 'Priority',
        message: 'Priority must be Routine, Urgent, or Emergent',
        severity: 'error',
        category: 'referral',
      });
    }

    // Referrer and specialist must be different
    if (referral.ReferringDoctorId === referral.SpecialistId) {
      errors.push({
        field: 'SpecialistId',
        message: 'Specialist must be different from referring doctor',
        severity: 'error',
        category: 'business-rules',
      });
    }

    return this.buildResult(errors, warnings);
  }

  /**
   * Validates patient portal referral screen data
   */
  validatePatientScreenData(screenData: PatientReferralScreenData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const referral = screenData.referral;

    // Security: Patient access control - validate patient can only see their own referral
    if (referral.PatientId !== screenData.patientId) {
      errors.push({
        field: 'PatientId',
        message: 'SECURITY: Patient cannot access this referral (patient ID mismatch)',
        severity: 'error',
        category: 'security',
      });
    }

    // Referral status validation
    const validStatuses = ['Draft', 'Submitted', 'Accepted', 'Rejected', 'Completed'];
    if (!validStatuses.includes(referral.Status)) {
      errors.push({
        field: 'Status',
        message: 'Invalid referral status in system',
        severity: 'error',
        category: 'referral',
      });
    }

    // Rejected referral - patient should be aware
    if (referral.Status === 'Rejected') {
      warnings.push({
        field: 'Status',
        message: 'Your referral was rejected. Please contact your clinician for details.',
        severity: 'warning',
        category: 'referral',
      });
    }

    // Document validation - required for accepted referrals
    if (referral.Status === 'Accepted') {
      const missingDocs = screenData.allRequiredDocuments.filter(
        (doc) => !screenData.uploadedDocuments.includes(doc),
      );

      if (missingDocs.length > 0) {
        warnings.push({
          field: 'documents',
          message: `Missing documents: ${missingDocs.join(', ')}. Upload them to prepare for your appointment.`,
          severity: 'warning',
          category: 'documents',
        });
      }
    }

    // Questionnaire validation - required before appointment
    if (referral.Status === 'Accepted' && !screenData.questionnairesCompleted) {
      warnings.push({
        field: 'questionnaires',
        message: 'Complete your pre-visit questionnaire to help your specialist prepare for your appointment.',
        severity: 'warning',
        category: 'documents',
      });
    }

    // Appointment validation
    if (referral.Status === 'Accepted' && !screenData.appointmentScheduled) {
      warnings.push({
        field: 'appointment',
        message: 'Your appointment is being scheduled. Check back soon for confirmation.',
        severity: 'warning',
        category: 'referral',
      });
    }

    // Appointment date validation (should be in future)
    if (screenData.appointmentDate) {
      const appointmentDate = new Date(screenData.appointmentDate);
      if (appointmentDate <= new Date()) {
        errors.push({
          field: 'appointmentDate',
          message: 'Appointment date is in the past (data consistency error)',
          severity: 'error',
          category: 'referral',
        });
      }
    }

    return this.buildResult(errors, warnings);
  }

  /**
   * Validates business rules and clinical consistency
   */
  validateBusinessRules(
    referral: ReferralCreate | Referral,
    patientAge?: number,
    hasUrgentFlag?: boolean,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Emergency priority validation
    if (referral.Priority === 'Emergent') {
      if (!referral.Reason.toLowerCase().match(/emerg|urgent|critical|immediate|acute/)) {
        warnings.push({
          field: 'Priority',
          message:
            'Emergent priority selected but reason may not reflect urgency. Please verify.',
          severity: 'warning',
          category: 'business-rules',
        });
      }
    }

    // Age-based validation - pediatric considerations
    if (patientAge && patientAge < 18) {
      if (!referral.Reason.toLowerCase().includes('pediatric')) {
        warnings.push({
          field: 'Reason',
          message:
            'Patient is under 18. The specialist may have different protocols for pediatric cases.',
          severity: 'warning',
          category: 'patient',
        });
      }
    }

    // Urgent flag mismatch
    if (hasUrgentFlag && referral.Priority === 'Routine') {
      warnings.push({
        field: 'Priority',
        message: 'System flagged as urgent but priority set to Routine. Please review.',
        severity: 'warning',
        category: 'business-rules',
      });
    }

    return this.buildResult(errors, warnings);
  }

  /**
   * Complete validation combining all checks (for referral submission)
   */
  validateComplete(
    referral: ReferralCreate,
    patientAge?: number,
    hasUrgentFlag?: boolean,
  ): ValidationResult {
    const formValidation = this.validateReferralForm(referral);
    const businessValidation = this.validateBusinessRules(referral, patientAge, hasUrgentFlag);

    const allErrors = [...formValidation.errors, ...businessValidation.errors];
    const allWarnings = [...formValidation.warnings, ...businessValidation.warnings];

    return this.buildResult(allErrors, allWarnings);
  }

  /**
   * Complete patient screen validation (for patient portal display)
   */
  validatePatientComplete(screenData: PatientReferralScreenData): ValidationResult {
    const screenValidation = this.validatePatientScreenData(screenData);
    const businessValidation = this.validateBusinessRules(screenData.referral);

    const allErrors = [...screenValidation.errors, ...businessValidation.errors];
    const allWarnings = [...screenValidation.warnings, ...businessValidation.warnings];

    return this.buildResult(allErrors, allWarnings);
  }

  /**
   * Validate patient access to referral (security check)
   */
  validatePatientAccess(referralPatientId: number, currentPatientId: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (referralPatientId !== currentPatientId) {
      errors.push({
        field: 'PatientId',
        message: 'SECURITY: Access denied - you cannot view this referral',
        severity: 'error',
        category: 'security',
      });
    }

    return this.buildResult(errors, []);
  }

  private buildResult(errors: ValidationError[], warnings: ValidationError[]): ValidationResult {
    const summary = this.generateSummary(errors, warnings);
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  private generateSummary(errors: ValidationError[], warnings: ValidationError[]): string {
    if (errors.length === 0 && warnings.length === 0) {
      return 'All validations passed ✓';
    }

    let summary = '';
    if (errors.length > 0) {
      summary += `${errors.length} error(s)`;
    }
    if (warnings.length > 0) {
      summary += (summary ? ', ' : '') + `${warnings.length} warning(s)`;
    }

    return summary;
  }
}
