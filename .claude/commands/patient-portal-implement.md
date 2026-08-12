---
description: Implement a Patient Portal sub-feature end-to-end from its context-map spec, including backend services, API gateway, and Angular frontend.
argument-hint: "<sub-feature-name> [phase]"
---

Use the patient-portal-implementor agent to build the following sub-feature:
- Sub-feature: $ARGUMENTS (e.g., referral-appointment-view, document-form-management, referral-tracking)
- Follows the context-map at teamupdates/features/patient-portal/<sub-feature>/context-map.md
- Implements all phases or a specific phase if provided
- Works in parallel with other sub-features (coordinates via INTEGRATION_PLAN.md)

The agent will implement backend microservices, API gateway routing, and Angular frontend components following ClinicCare conventions.
