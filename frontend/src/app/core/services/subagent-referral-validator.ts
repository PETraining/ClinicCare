import { Injectable } from '@angular/core';
import { ReferralCreate, Referral } from '../models/referral.model';
import { ValidationResult } from './referral-validation.service';

/**
 * SubagentReferralValidator
 *
 * This service demonstrates how to use Claude as a validation subagent
 * to perform intelligent validation on referral data.
 *
 * Usage: Pass referral data to validate and the service will format it
 * for subagent validation, including context about business rules.
 */
@Injectable({
  providedIn: 'root',
})
export class SubagentReferralValidator {
  /**
   * Prepares referral data for subagent validation
   * Returns a structured prompt that a subagent can validate
   */
  prepareReferralForValidation(
    referral: ReferralCreate,
    context: {
      patientAge?: number;
      patientName?: string;
      referringDoctorName?: string;
      specialistName?: string;
      hasUrgentFlag?: boolean;
    },
  ): string {
    return `
Validate this medical referral for clinical consistency and completeness:

**Referral Details:**
- Patient: ${context.patientName || 'Unknown'} (Age: ${context.patientAge || 'Unknown'})
- Referring Doctor: ${context.referringDoctorName || 'Unknown'}
- Specialist: ${context.specialistName || 'Unknown'}
- Specialty Needed: ${referral.Reason}
- Priority: ${referral.Priority}
- Has Urgent Flag: ${context.hasUrgentFlag ? 'Yes' : 'No'}

**Validation Rules:**
1. CRITICAL: Priority must match reason urgency
   - If Emergent: reason should contain emergency keywords (critical, acute, immediate)
   - If Urgent: reason should indicate time-sensitive issue
   - If Routine: reasonable for non-urgent referrals

2. CLINICAL: Is the referral reason clear and complete?
   - At least 10 characters
   - Describes specific condition or concern
   - Appropriate for the selected specialist type

3. BUSINESS: Are there any conflicts?
   - Different referring doctor and specialist selected
   - Urgent flag and priority are consistent
   - Age-appropriate specialist (e.g., pediatric for patients <18)

4. COMPLETENESS: Required fields present
   - Patient ID: ${referral.PatientId > 0 ? '✓' : '✗'}
   - Referring Doctor: ${referral.ReferringDoctorId > 0 ? '✓' : '✗'}
   - Specialist: ${referral.SpecialistId > 0 ? '✓' : '✗'}
   - Reason: ${referral.Reason ? '✓' : '✗'} (length: ${referral.Reason?.length || 0})
   - Priority: ${referral.Priority ? '✓' : '✗'}

**Your Task:**
Review the referral and identify:
1. Any ERRORS (blocking issues that prevent submission)
2. Any WARNINGS (should be reviewed but not blocking)
3. Overall verdict: Can this referral be safely submitted?

Respond with a JSON object with this structure:
{
  "canSubmit": boolean,
  "errors": [{"field": string, "message": string}],
  "warnings": [{"field": string, "message": string}],
  "reasoning": string
}
    `;
  }

  /**
   * Prepares patient referral screen data for validation
   * Used to validate what a patient sees in their portal
   */
  preparePatientScreenForValidation(screenData: {
    referralId: number;
    patientId: number;
    status: string;
    appointmentDate?: string;
    documentsUploaded: string[];
    requiredDocuments: string[];
    questionnairesCompleted: boolean;
    specialistName: string;
  }): string {
    const missingDocs = screenData.requiredDocuments.filter(
      (doc) => !screenData.documentsUploaded.includes(doc),
    );

    return `
Validate this patient's referral display for completeness and clarity:

**Referral Information:**
- Referral ID: ${screenData.referralId}
- Patient ID: ${screenData.patientId}
- Status: ${screenData.status}
- Specialist: ${screenData.specialistName}
- Appointment Date: ${screenData.appointmentDate || 'Not yet scheduled'}

**Documents:**
- Required: ${screenData.requiredDocuments.join(', ') || 'None'}
- Uploaded: ${screenData.documentsUploaded.join(', ') || 'None'}
- Missing: ${missingDocs.join(', ') || 'None'}

**Questionnaire:**
- Completed: ${screenData.questionnairesCompleted ? 'Yes' : 'No'}

**Patient Portal Display Validation Rules:**

1. SECURITY:
   - Patient can only see their own referral (patient ID matches)
   - No leakage of other patients' data

2. READINESS:
   - If status is 'Accepted': patient should be prompted to upload required documents
   - If status is 'Accepted': patient should complete questionnaire before appointment
   - If appointment is scheduled: clear date shown to patient

3. CLARITY:
   - Status explanation is clear to patient (avoid medical jargon)
   - Next steps are obvious (what to do now)
   - Required actions are highlighted

4. COMPLETENESS:
   - All relevant information displayed
   - No missing critical details

**Your Task:**
Review what this patient would see and identify:
1. Any ERRORS (security issues, data inconsistencies)
2. Any WARNINGS (patient experience, missing guidance)
3. ACTION ITEMS: What should the patient do next?

Respond with a JSON object with this structure:
{
  "displayValid": boolean,
  "errors": [{"field": string, "message": string}],
  "warnings": [{"field": string, "message": string}],
  "nextSteps": string[],
  "reasoning": string
}
    `;
  }

  /**
   * Formats validation result from subagent into structured format
   */
  parseSubagentResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          error: 'Could not parse subagent response',
          rawResponse: response,
        };
      }
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return {
        error: 'Invalid JSON in subagent response',
        rawResponse: response,
      };
    }
  }
}
