# Patient Portal Referral Validation with Subagent

## Overview

This guide shows how to implement **referral validation using a subagent** (Claude AI) in your Patient Portal. The subagent performs intelligent validation of referral data and patient screen displays.

## Why Use a Subagent for Validation?

- **Intelligent Analysis**: AI can understand clinical context (e.g., "Emergent priority but reason doesn't mention urgency")
- **Business Rules**: Complex validations that are hard to code (e.g., age-appropriate specialists)
- **Patient Guidance**: Provide helpful suggestions to patients on referral status
- **Parallel Processing**: Validate multiple referrals simultaneously without blocking UI
- **Audit Trail**: Track validation results for compliance

---

## Architecture

```
Patient Portal (Angular)
    ↓
Referral Component (create-referral or patient-referral-view)
    ↓
ReferralValidationService (local validation)
    ↓
SubagentReferralValidator (prepares data for AI)
    ↓
Claude API / Agent Tool
    ↓
Validation Result (parsed and displayed to user)
```

---

## Step 1: Local Validation (Synchronous)

Use `ReferralValidationService` for fast, immediate validation:

### Example: Validating a New Referral Form

```typescript
// In create-referral.component.ts
import { ReferralValidationService } from '../../core/services/referral-validation.service';

export class CreateReferralComponent {
  private validationService = inject(ReferralValidationService);

  submit(): void {
    // Quick local validation first
    const result = this.validationService.validateReferralForm(this.form);
    
    if (!result.isValid) {
      // Show errors to user
      this.errorMessage.set(result.summary);
      return;
    }

    // If warnings exist, optionally show them
    if (result.warnings.length > 0) {
      console.warn('Validation warnings:', result.warnings);
    }

    // Proceed with submission
    this.referralService.create(this.form).subscribe(...);
  }
}
```

### Local Validation Rules (Synchronous)

```typescript
// In ReferralValidationService

validateReferralForm(referral: ReferralCreate): ValidationResult {
  // ✓ Fast: Field presence validation
  // ✓ Fast: Format validation (email, phone, etc.)
  // ✓ Fast: Range validation (age, amount, etc.)
  // ✓ Fast: Reference validation (doctor IDs exist locally)
  
  // ✗ Slow: External service calls
  // ✗ Slow: Database lookups
  // ✗ Slow: AI-based analysis
}
```

---

## Step 2: Subagent Validation (Asynchronous)

Use **Claude as a subagent** for intelligent, context-aware validation:

### Example: Validating Referral with Subagent

```typescript
// In a validation component or service
import { Agent } from '@anthropic-ai/sdk';
import { SubagentReferralValidator } from '../../core/services/subagent-referral-validator';

export class ReferralSubagentValidator {
  private subagentValidator = inject(SubagentReferralValidator);

  /**
   * Validates a referral using Claude as a subagent
   * Returns intelligent feedback on clinical appropriateness
   */
  async validateWithSubagent(
    referral: ReferralCreate,
    context: {
      patientAge?: number;
      patientName?: string;
      referringDoctorName?: string;
      specialistName?: string;
    },
  ): Promise<any> {
    // 1. Prepare data for subagent
    const prompt = this.subagentValidator.prepareReferralForValidation(referral, {
      ...context,
      hasUrgentFlag: referral.Priority === 'Emergent',
    });

    // 2. Call Claude API with Agent
    // NOTE: In Angular, you'd typically call your backend API that invokes Claude
    const response = await this.callValidationAPI(prompt);

    // 3. Parse and return structured result
    const parsed = this.subagentValidator.parseSubagentResponse(response);
    
    return {
      canSubmit: parsed.canSubmit,
      errors: parsed.errors,
      warnings: parsed.warnings,
      reasoning: parsed.reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  // In real app: call your backend validation endpoint
  private callValidationAPI(prompt: string): Promise<string> {
    return fetch('/api/validate/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then(r => r.json()).then(d => d.response);
  }
}
```

---

## Step 3: Backend Endpoint for Subagent Validation

Create a backend endpoint that invokes Claude:

### FastAPI Endpoint Example

```python
# In backend/main.py or services/validation/main.py

from anthropic import Anthropic

client = Anthropic()

@app.post("/api/validate/referral")
async def validate_referral(request: ValidateReferralRequest):
    """
    Validates a referral using Claude as an intelligent validator.
    
    Request body:
    {
        "prompt": "Validate this referral...",
        "referralId": 123  # Optional, for audit logging
    }
    
    Response:
    {
        "response": "{\"canSubmit\": true, \"errors\": [...], \"warnings\": [...]}",
        "validationId": "val_abc123",
        "processingTime": 1.2  # seconds
    }
    """
    
    try:
        # Call Claude with structured prompt
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": request.prompt
                }
            ]
        )
        
        response_text = message.content[0].text
        
        # Log validation for audit
        validation_log = ValidationLog(
            referralId=request.referralId,
            validationType="SUBAGENT_REFERRAL",
            response=response_text,
            usageTokens=message.usage.output_tokens,
            timestamp=datetime.now()
        )
        db.add(validation_log)
        db.commit()
        
        return {
            "response": response_text,
            "validationId": validation_log.id,
            "processingTime": message.usage.output_tokens / 1000  # Rough estimate
        }
    
    except Exception as e:
        logger.error(f"Validation failed: {e}")
        return {
            "error": "Validation service temporarily unavailable",
            "status": 500
        }
```

---

## Step 4: Using Subagent in Patient Referral View

Example: Validate a patient's referral display before showing

```typescript
// In patient-referral-view.component.ts

export class PatientReferralViewComponent implements OnInit {
  private validationService = inject(ReferralValidationService);
  private subagentValidator = inject(ReferralSubagentValidator);

  referral = signal<Referral | null>(null);
  validationResult = signal<any>(null);
  subagentFeedback = signal<any>(null);
  validatingWithAI = signal(false);

  async ngOnInit(): Promise<void> {
    // 1. Load referral
    const id = this.referralId();
    this.loadReferral(id);

    // 2. Immediate local validation
    const localResult = this.validationService.validatePatientScreenData(screenData);
    this.validationResult.set(localResult);

    // 3. Background: Intelligent subagent validation
    this.validatingWithAI.set(true);
    try {
      const aiResult = await this.subagentValidator.validateWithSubagent(
        this.referral()!,
        {
          patientName: 'Patient Name',
          referringDoctorName: 'Dr. Sharma',
          specialistName: 'Cardiologist',
        }
      );
      this.subagentFeedback.set(aiResult);
    } catch (e) {
      console.error('Subagent validation failed:', e);
    } finally {
      this.validatingWithAI.set(false);
    }
  }
}
```

### Display Subagent Feedback in Template

```html
<!-- Show AI-based suggestions -->
@if (subagentFeedback(); let feedback) {
  <div class="ai-validation">
    <h4>AI-Powered Insights</h4>
    
    @if (!feedback.canSubmit) {
      <div class="error-box">
        <p><strong>Issues Found:</strong></p>
        <ul>
          @for (error of feedback.errors; track error.field) {
            <li>{{ error.message }}</li>
          }
        </ul>
      </div>
    }

    @if (feedback.warnings?.length > 0) {
      <div class="warning-box">
        <p><strong>Recommendations:</strong></p>
        <ul>
          @for (warning of feedback.warnings; track warning.field) {
            <li>{{ warning.message }}</li>
          }
        </ul>
      </div>
    }

    <p class="reasoning"><em>Analysis: {{ feedback.reasoning }}</em></p>
  </div>
}
```

---

## Step 5: Validation Prompts Used by Subagent

### Referral Validation Prompt

```
Validate this medical referral for clinical consistency and completeness:

**Referral Details:**
- Patient: Anjali Verma (Age: 45)
- Referring Doctor: Dr. Rohan Sharma
- Specialist: Dr. Jonathan Johnson (Cardiology)
- Specialty Needed: Cardiac evaluation for hypertension
- Priority: Urgent
- Has Urgent Flag: Yes

**Validation Rules:**
1. CRITICAL: Priority must match reason urgency
2. CLINICAL: Is the referral reason clear and complete?
3. BUSINESS: Are there any conflicts?
4. COMPLETENESS: Required fields present

**Your Task:**
Review and identify:
1. Any ERRORS (blocking issues)
2. Any WARNINGS (should be reviewed)
3. Overall verdict: Can this referral be safely submitted?

Respond with JSON:
{
  "canSubmit": boolean,
  "errors": [{"field": string, "message": string}],
  "warnings": [{"field": string, "message": string}],
  "reasoning": string
}
```

### Patient Screen Validation Prompt

```
Validate this patient's referral display for completeness and clarity:

**Referral Information:**
- Referral ID: 42
- Patient ID: 5
- Status: Accepted
- Specialist: Dr. Johnson (Cardiology)
- Appointment Date: 2024-08-20

**Documents:**
- Required: Insurance Card, Medical History
- Uploaded: Insurance Card
- Missing: Medical History

**Questionnaire:** Not yet completed

**Validation Rules:**
1. SECURITY: Patient can only see their own referral
2. READINESS: Patient should upload docs and complete questionnaire
3. CLARITY: Instructions are clear
4. COMPLETENESS: All information displayed

**Your Task:**
Identify:
1. ERRORS (data inconsistencies)
2. WARNINGS (user experience issues)
3. ACTION ITEMS: What should patient do next?

Respond with JSON:
{
  "displayValid": boolean,
  "errors": [...],
  "warnings": [...],
  "nextSteps": [...],
  "reasoning": string
}
```

---

## Step 6: Running Validation in Parallel with Multiple Referrals

For efficiency, validate multiple referrals simultaneously:

```typescript
/**
 * Validates multiple referrals in parallel using subagent
 */
async validateMultipleReferrals(
  referrals: Referral[],
): Promise<Map<number, any>> {
  const results = new Map<number, any>();

  // Create validation promises for all referrals
  const promises = referrals.map(async (referral) => {
    try {
      const result = await this.subagentValidator.validateWithSubagent(referral, {
        patientName: this.getPatientName(referral.PatientId),
        specialistName: this.getSpecialistName(referral.SpecialistId),
      });
      return { id: referral.ReferralId, result };
    } catch (e) {
      console.error(`Validation failed for referral ${referral.ReferralId}`);
      return { id: referral.ReferralId, result: null };
    }
  });

  // Resolve all in parallel
  const resolved = await Promise.all(promises);

  // Map results by referral ID
  resolved.forEach(({ id, result }) => {
    if (result) results.set(id, result);
  });

  return results;
}
```

---

## Step 7: Caching Validation Results

Avoid re-validating the same referral multiple times:

```typescript
/**
 * Cache validation results to avoid redundant API calls
 */
private validationCache = new Map<string, { result: any; timestamp: number }>();
private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async validateWithCache(
  referral: Referral,
  context: any,
): Promise<any> {
  const cacheKey = `ref_${referral.ReferralId}_v${referral.UpdatedAt}`;
  
  // Check cache
  const cached = this.validationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
    console.log('Using cached validation result');
    return cached.result;
  }

  // Fetch fresh validation
  const result = await this.validateWithSubagent(referral, context);
  
  // Store in cache
  this.validationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });

  return result;
}
```

---

## Step 8: Error Handling & Fallback

Handle subagent failures gracefully:

```typescript
async validateWithFallback(
  referral: Referral,
  context: any,
): Promise<any> {
  try {
    // Try subagent validation first
    return await this.validateWithSubagent(referral, context);
  } catch (error) {
    console.error('Subagent validation failed, falling back to local validation', error);

    // Fallback to local validation
    const localResult = this.validationService.validateComplete(
      referral as ReferralCreate,
      context.patientAge,
    );

    return {
      canSubmit: localResult.isValid,
      errors: localResult.errors.map(e => ({ field: e.field, message: e.message })),
      warnings: localResult.warnings.map(w => ({ field: w.field, message: w.message })),
      reasoning: 'Local validation only (AI service unavailable)',
      isFallback: true,
    };
  }
}
```

---

## Step 9: Validation Audit Trail

Log all validations for compliance and debugging:

```python
# Backend: Log validation results

class ValidationLog(Base):
    __tablename__ = "validation_logs"

    id = Column(Integer, primary_key=True)
    referralId = Column(Integer, ForeignKey("referrals.ReferralId"))
    validationType = Column(String)  # "SUBAGENT_REFERRAL", "LOCAL", etc.
    requestPrompt = Column(Text)  # Store what was validated
    response = Column(Text)  # Store AI response
    usageTokens = Column(Integer)  # For billing/analytics
    timestamp = Column(DateTime, default=datetime.now)
    patientId = Column(Integer, ForeignKey("patients.PatientId"))

    # Useful for: debugging, compliance audits, cost tracking
```

### Query Validations for a Referral

```typescript
// In frontend
async getValidationHistory(referralId: number): Promise<ValidationLog[]> {
  return await fetch(`/api/validations?referralId=${referralId}`)
    .then(r => r.json());
}
```

---

## Step 10: Monitoring & Metrics

Track subagent validation performance:

```typescript
interface ValidationMetrics {
  totalValidations: number;
  averageProcessingTime: number;
  successRate: number;
  cacheHitRate: number;
  errorRate: number;
  tokensUsed: number;  // For cost tracking
}

/**
 * Track metrics for analytics
 */
trackValidationMetric(metric: 'success' | 'error' | 'cacheHit' | 'cacheMiss'): void {
  const metrics = this.metrics.get(new Date().toDateString()) || {
    total: 0,
    successes: 0,
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  switch (metric) {
    case 'success':
      metrics.successes++;
      break;
    case 'error':
      metrics.errors++;
      break;
    case 'cacheHit':
      metrics.cacheHits++;
      break;
    case 'cacheMiss':
      metrics.cacheMisses++;
      break;
  }

  metrics.total++;
  this.metrics.set(new Date().toDateString(), metrics);
}
```

---

## Complete Example: Patient Referral Form with Subagent Validation

```typescript
// Complete integration example

export class PatientReferralFormComponent {
  private validationService = inject(ReferralValidationService);
  private subagentValidator = inject(ReferralSubagentValidator);
  private referralService = inject(ReferralService);

  form = signal<ReferralCreate>({
    PatientId: 0,
    ReferringDoctorId: 0,
    SpecialistId: 0,
    Reason: '',
    Priority: 'Routine',
  });

  localValidationResult = signal<ValidationResult | null>(null);
  aiValidationResult = signal<any>(null);
  isValidating = signal(false);
  isSubmitting = signal(false);

  // Step 1: Local validation on form blur/change
  onReasonChange(reason: string): void {
    this.form.update(f => ({ ...f, Reason: reason }));
    
    // Quick local validation
    const result = this.validationService.validateReferralForm(this.form());
    this.localValidationResult.set(result);
  }

  // Step 2: Subagent validation on demand
  async validateWithAI(): Promise<void> {
    // Don't validate if local validation has errors
    const localResult = this.localValidationResult();
    if (!localResult?.isValid) {
      return;
    }

    this.isValidating.set(true);
    try {
      const result = await this.subagentValidator.validateWithSubagent(
        this.form(),
        {
          patientName: 'Current Patient',
          specialistName: 'Selected Specialist',
        },
      );
      this.aiValidationResult.set(result);
    } finally {
      this.isValidating.set(false);
    }
  }

  // Step 3: Submit with both validations
  async submit(): Promise<void> {
    // Check local validation
    const localResult = this.validationService.validateReferralForm(this.form());
    if (!localResult.isValid) {
      console.error('Local validation failed');
      return;
    }

    // Check AI validation if available
    const aiResult = this.aiValidationResult();
    if (aiResult && !aiResult.canSubmit) {
      console.error('AI validation failed');
      return;
    }

    // Proceed with submission
    this.isSubmitting.set(true);
    try {
      const created = await this.referralService.create(this.form()).toPromise();
      console.log('Referral created:', created);
      // Navigate to success page
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
```

---

## Benefits Summary

✅ **Intelligent Validation**: AI understands clinical context
✅ **User Experience**: Helpful suggestions instead of cryptic errors
✅ **Compliance**: Audit trail of validations
✅ **Scalability**: Parallel validation of multiple referrals
✅ **Fallback**: Works even if AI service is unavailable
✅ **Cost Optimized**: Caching reduces API calls
✅ **Monitoring**: Track validation metrics for improvement

---

## Next Steps

1. **Implement Backend Endpoint** - Create `/api/validate/referral` in FastAPI
2. **Update Component** - Use `SubagentReferralValidator` in your form
3. **Add Caching** - Implement validation result caching
4. **Monitor Performance** - Track validation metrics
5. **Audit Logging** - Log all validations for compliance
