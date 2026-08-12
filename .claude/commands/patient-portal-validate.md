---
description: Validate a Patient Portal sub-feature implementation against its context-map spec, checking frontend, backend, and API integration.
argument-hint: "<sub-feature-name> [phase] [doc-path ...]"
---

Use the patient-portal-validator agent to audit the following sub-feature's implementation:
- Sub-feature: $ARGUMENTS (e.g., referral-appointment-view, document-form-management, referral-tracking)
- Validates against teamupdates/features/patient-portal/<sub-feature>/context-map.md
- Checks backend services, API gateway, and Angular frontend for compliance
- Produces a detailed report with PASS/FAIL/PARTIAL/UNKNOWN findings and recommendations

Run this after implementation is complete to confirm the sub-feature meets its spec.
