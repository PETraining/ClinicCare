# Quick Start: Referral Validation with Subagent

## 5-Minute Setup

### What You're Getting

✅ Patient portal referral page
✅ Local validation (form checks, security)
✅ Subagent validation (Claude AI analysis)
✅ Patient access control
✅ Document upload checklist
✅ Questionnaire tracking

---

## File Locations

```
frontend/src/app/
├── core/services/
│   ├── patient-auth.service.ts                    ← Patient login
│   ├── referral-validation.service.ts             ← Validation rules
│   └── subagent-referral-validator.ts             ← Claude AI prep
└── features/patient-portal/
    ├── patient-referral-list.component.ts         ← Show all referrals
    └── patient-referral-view.component.ts         ← Show details + validation
```

---

## Step 1: Import Services

```typescript
// In your component
import { ReferralValidationService } from '../../core/services/referral-validation.service';
import { SubagentReferralValidator } from '../../core/services/subagent-referral-validator';

export class YourComponent {
  private validationService = inject(ReferralValidationService);
  private subagentValidator = inject(SubagentReferralValidator);
}
```

---

## Step 2: Validate Referral Locally (Synchronous)

```typescript
// Fast validation - runs immediately
const referral: ReferralCreate = {
  PatientId: 5,
  ReferringDoctorId: 1,
  SpecialistId: 2,
  Reason: 'Cardiac evaluation needed',
  Priority: 'Urgent',
};

const result = this.validationService.validateReferralForm(referral);

if (result.isValid) {
  console.log('✓ Referral is valid');
} else {
  console.log('✗ Errors:', result.errors);
  console.log('⚠ Warnings:', result.warnings);
}

// Output:
// {
//   isValid: true,
//   errors: [],
//   warnings: [],
//   summary: "All validations passed ✓",
//   timestamp: "2025-08-12T10:30:00Z"
// }
```

---

## Step 3: Validate Patient Screen Data (Security)

```typescript
// Check if patient can access this referral
const screenData: PatientReferralScreenData = {
  referral: referralObject,
  patientId: 5,  // Logged-in patient
  documentsUploaded: false,
  questionnairesCompleted: false,
  appointmentScheduled: true,
  appointmentDate: '2024-08-20',
  allRequiredDocuments: ['Insurance Card', 'Medical History'],
  uploadedDocuments: ['Insurance Card'],
};

const result = this.validationService.validatePatientScreenData(screenData);

// Checks:
// ✓ Patient owns this referral (patientId match)
// ✓ Status is valid
// ✓ Appointment date is future
// ✓ Documents are tracked correctly
// ⚠ Missing: Medical History document
```

---

## Step 4: Validate with Subagent (Claude AI)

```typescript
// Prepare data for Claude
const prompt = this.subagentValidator.prepareReferralForValidation(
  referral,
  {
    patientAge: 45,
    patientName: 'John Doe',
    referringDoctorName: 'Dr. Smith',
    specialistName: 'Dr. Johnson (Cardiology)',
    hasUrgentFlag: referral.Priority === 'Emergent',
  }
);

// Call your backend API (see next section)
const aiResponse = await this.validateWithBackend(prompt);

// Parse Claude's response
const parsed = this.subagentValidator.parseSubagentResponse(aiResponse);

// Output:
// {
//   canSubmit: true,
//   errors: [],
//   warnings: [
//     {
//       field: "Reason",
//       message: "Add specific symptoms (chest pain, shortness of breath)"
//     }
//   ],
//   reasoning: "Referral is appropriate. Enhance reason for specialist clarity."
// }
```

---

## Step 5: Backend API Endpoint

Create this endpoint to call Claude:

```python
# In backend/main.py or services/validation/main.py

from anthropic import Anthropic
from fastapi import FastAPI, HTTPException

app = FastAPI()
client = Anthropic()

@app.post("/api/validate/referral")
async def validate_referral(request: dict):
    """Validate referral using Claude AI"""
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": request.get("prompt")
                }
            ]
        )
        
        return {
            "response": message.content[0].text,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Step 6: Use in Component Template

```html
<div class="referral-form">
  <!-- Referral form fields here -->

  <!-- Local Validation Results -->
  @if (localValidation(); let result) {
    @if (!result.isValid) {
      <div class="error-box">
        <h4>Fix These Issues:</h4>
        <ul>
          @for (error of result.errors; track error.field) {
            <li>{{ error.message }}</li>
          }
        </ul>
      </div>
    }
  }

  <!-- AI Validation Results -->
  @if (aiValidation(); let result) {
    <div class="ai-insights">
      <h4>AI Review</h4>
      
      @if (!result.canSubmit) {
        <div class="error">
          <h5>Issues Found:</h5>
          <ul>
            @for (error of result.errors; track error.field) {
              <li>{{ error.message }}</li>
            }
          </ul>
        </div>
      } @else {
        <div class="success">✓ Ready to submit</div>
      }

      @if (result.warnings?.length > 0) {
        <div class="warning">
          <h5>Suggestions:</h5>
          <ul>
            @for (warn of result.warnings; track warn.field) {
              <li>{{ warn.message }}</li>
            }
          </ul>
        </div>
      }

      <p class="reasoning">{{ result.reasoning }}</p>
    </div>
  }

  <button (click)="submit()">Submit Referral</button>
</div>
```

---

## Complete Example: One File

```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReferralValidationService } from '../../core/services/referral-validation.service';
import { SubagentReferralValidator } from '../../core/services/subagent-referral-validator';
import { ReferralCreate } from '../../core/models/referral.model';

@Component({
  selector: 'app-referral-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form">
      <h2>Create Referral</h2>
      
      <label>Reason</label>
      <textarea 
        [(ngModel)]="form.Reason" 
        (ngModelChange)="onReasonChange($event)">
      </textarea>

      <!-- Show local validation errors -->
      @if (localValidation(); let result) {
        @if (!result.isValid) {
          <div class="error">
            ✗ {{ result.summary }}
            <ul>
              @for (e of result.errors; track e.field) {
                <li>{{ e.message }}</li>
              }
            </ul>
          </div>
        }
      }

      <!-- Show AI validation -->
      @if (aiValidating()) {
        <p>🔍 Validating with AI...</p>
      }

      @if (aiValidation(); let result) {
        <div [class]="result.canSubmit ? 'success' : 'error'">
          <p>{{ result.reasoning }}</p>
        </div>
      }

      <button 
        (click)="submit()"
        [disabled]="!canSubmit()">
        Submit
      </button>
    </div>
  `,
})
export class ReferralFormComponent {
  private validationService = inject(ReferralValidationService);
  private subagentValidator = inject(SubagentReferralValidator);

  form = signal<ReferralCreate>({
    PatientId: 0,
    ReferringDoctorId: 0,
    SpecialistId: 0,
    Reason: '',
    Priority: 'Routine',
  });

  localValidation = signal<any>(null);
  aiValidation = signal<any>(null);
  aiValidating = signal(false);

  // Local validation on input
  onReasonChange(reason: string): void {
    this.form.update(f => ({ ...f, Reason: reason }));
    
    const result = this.validationService.validateReferralForm(this.form());
    this.localValidation.set(result);

    // Trigger AI validation if local is valid
    if (result.isValid) {
      this.validateWithAI();
    }
  }

  // Background AI validation
  private async validateWithAI(): Promise<void> {
    this.aiValidating.set(true);
    
    try {
      const prompt = this.subagentValidator.prepareReferralForValidation(
        this.form(),
        {
          patientAge: 45,
          patientName: 'Patient',
          specialistName: 'Specialist',
        }
      );

      // Call backend (implement this)
      const response = await fetch('/api/validate/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      const parsed = this.subagentValidator.parseSubagentResponse(data.response);
      this.aiValidation.set(parsed);
    } finally {
      this.aiValidating.set(false);
    }
  }

  // Check if form is ready to submit
  canSubmit(): boolean {
    const local = this.localValidation();
    const ai = this.aiValidation();
    
    return local?.isValid && (!ai || ai.canSubmit);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    
    console.log('Submitting referral:', this.form());
    // TODO: Call referral service to submit
  }
}
```

---

## Testing

### Test Local Validation

```typescript
it('should validate referral form', () => {
  const validReferral: ReferralCreate = {
    PatientId: 1,
    ReferringDoctorId: 2,
    SpecialistId: 3,
    Reason: 'Cardiac evaluation for hypertension',
    Priority: 'Routine',
  };

  const result = service.validateReferralForm(validReferral);
  expect(result.isValid).toBe(true);
  expect(result.errors.length).toBe(0);
});

it('should detect missing required fields', () => {
  const invalidReferral: ReferralCreate = {
    PatientId: 0,  // ✗ Invalid
    ReferringDoctorId: 2,
    SpecialistId: 3,
    Reason: 'Short',  // ✗ Too short
    Priority: 'Unknown' as any,  // ✗ Invalid priority
  };

  const result = service.validateReferralForm(invalidReferral);
  expect(result.isValid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
});
```

### Test Patient Access Control

```typescript
it('should prevent cross-patient access', () => {
  const screenData: PatientReferralScreenData = {
    referral: { PatientId: 6, ... },  // Belongs to patient 6
    patientId: 5,  // But current user is patient 5
    // ... other fields
  };

  const result = service.validatePatientScreenData(screenData);
  expect(result.isValid).toBe(false);
  expect(result.errors[0].category).toBe('security');
});
```

---

## Troubleshooting

### "Validation result shows `null`"
→ Check if validation service was injected with `inject()`

### "AI validation never completes"
→ Check backend endpoint is running at `/api/validate/referral`

### "Parse error with AI response"
→ Ensure Claude returns valid JSON in response

### "Patient sees other patient's referral"
→ Add `validatePatientAccess()` check in component

---

## Next Steps

1. ✅ **Done**: Services and components created
2. 🔄 **TODO**: Create backend validation endpoint
3. 🔄 **TODO**: Wire up ReferralService to API
4. 🔄 **TODO**: Add routes to app.routes.ts
5. 🔄 **TODO**: Test with demo patients
6. 🔄 **TODO**: Deploy to production

---

## Resources

- **Full Guide**: `REFERRAL_VALIDATION_SUBAGENT_GUIDE.md`
- **Implementation Details**: `REFERRAL_IMPLEMENTATION_SUMMARY.md`
- **API Design**: Check `/services/referral/main.py`
- **Models**: Check `/core/models/referral.model.ts`

---

## Common Patterns

### Pattern 1: Fast + Async Validation
```typescript
// Fast local check first
const local = service.validateReferralForm(referral);
if (!local.isValid) return;

// Then do async AI check in background
validateWithAI().then(result => {
  // Update UI with AI insights
});
```

### Pattern 2: Cached Results
```typescript
private cache = new Map();

validate(id: number) {
  const cached = this.cache.get(id);
  if (cached && isRecent(cached)) {
    return cached.result;
  }
  
  const result = slowValidation(id);
  this.cache.set(id, { result, timestamp: now() });
  return result;
}
```

### Pattern 3: Fallback Validation
```typescript
try {
  return await subagentValidate(referral);
} catch (e) {
  // If AI fails, use local validation
  return localValidate(referral);
}
```

---

## API Quick Reference

### ReferralValidationService

```typescript
validateReferralForm(referral)           // Form field checks
validatePatientScreenData(screenData)    // Security + completeness
validateBusinessRules(referral, age)     // Clinical consistency
validateComplete(referral, age)          // All checks combined
validatePatientAccess(refId, patientId)  // Ownership check
```

### SubagentReferralValidator

```typescript
prepareReferralForValidation(referral, context)    // Generate prompt
preparePatientScreenForValidation(screenData)      // Screen prompt
parseSubagentResponse(response)                     // Parse JSON
```

---

**Ready to go! 🚀 Start with Step 1 above.**
