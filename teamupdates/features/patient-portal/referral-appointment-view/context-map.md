# Patient Portal: Referral & Appointment View

**Feature Name**: Referral & Appointment View  
**Sub-Feature of**: Patient Portal  
**Assigned Team**: Team Member 1  
**Timeline**: 1 week  
**Status**: Pending Implementation

## Overview

Patients can view all their active referrals and upcoming appointments in a unified dashboard. This is the foundational sub-feature that provides visibility into their care journey. Each referral shows:
- Referral ID and specialty
- Referring provider
- Status (pending, approved, scheduled, completed)
- Associated appointment date (if scheduled)
- Next action or status message

Each appointment shows:
- Date and time
- Provider name
- Location/clinic
- Associated referral (if any)
- Check-in instructions

The dashboard displays only data for the logged-in patient, enforced by the API authentication layer.

## Scope

### Phase 1: Backend Services & Data Model
Establish the backend data structures and APIs that expose patient referral and appointment data.

**Deliverables**:
- Referral Service (8003): Add patient-facing endpoints to expose referrals (read-only)
- Patient Service (8001): Add appointment data model if not present; expose patient's appointments
- API Gateway: Proxy `/api/patient-portal/referrals` and `/api/patient-portal/appointments` to correct upstream services
- Seed data: Populate test referrals and appointments for demo patient

**Files to Change**:
- `services/referral/models.py`: No changes (referral model already exists)
- `services/referral/schemas.py`: Add `ReferralViewSchema` (read-only view for patients)
- `services/referral/main.py`: Add `GET /referrals/{patient_id}` endpoint with auth guard
- `services/patient/models.py`: Ensure `Appointment` model exists with FK to patient and referral
- `services/patient/schemas.py`: Add `AppointmentViewSchema` for patient-facing views
- `services/patient/main.py`: Add `GET /appointments/{patient_id}` endpoint with auth guard
- `services/patient/seed.py`: Add test appointments linked to referrals
- `services/api-gateway/main.py`: Add proxy routes for `/api/patient-portal/referrals` and `/api/patient-portal/appointments`

### Phase 2: Frontend UI Components
Build the patient-facing dashboard UI to display referrals and appointments.

**Deliverables**:
- Patient Portal shell/layout component (reusable for all 3 sub-features)
- Referral card component (displays one referral with status badge)
- Appointment card component (displays one appointment with date/time)
- Dashboard component that fetches and displays both lists
- Status badge component (shows referral status visually)
- Auth guard protecting all patient-portal routes

**Files to Change**:
- `frontend/src/app/features/patient-portal/patient-portal.component.ts`: Main shell component
- `frontend/src/app/features/patient-portal/patient-portal.component.html`: Layout and routing outlet
- `frontend/src/app/features/patient-portal/dashboard/dashboard.component.ts`: Fetch and display referrals/appointments
- `frontend/src/app/features/patient-portal/dashboard/dashboard.component.html`: List layout (referrals, appointments)
- `frontend/src/app/features/patient-portal/referral-card/referral-card.component.ts`: Display one referral
- `frontend/src/app/features/patient-portal/referral-card/referral-card.component.html`: Referral card template
- `frontend/src/app/features/patient-portal/appointment-card/appointment-card.component.ts`: Display one appointment
- `frontend/src/app/features/patient-portal/appointment-card/appointment-card.component.html`: Appointment card template
- `frontend/src/app/features/patient-portal/status-badge/status-badge.component.ts`: Status visualization
- `frontend/src/app/features/patient-portal/services/patient-portal.service.ts`: HTTP service for backend calls
- `frontend/src/app/app.routes.ts`: Add patient-portal route with auth guard
- `frontend/src/app/core/auth/auth.guard.ts`: Ensure patient-only access

## Service Architecture

| Component | Service | Responsibility |
| --- | --- | --- |
| Referral data (read) | Referral 8003 | Expose patient's referrals with status |
| Appointment data | Patient 8001 | Manage appointments; expose per patient |
| API Routing | API Gateway | Proxy `/api/patient-portal/*` to correct service |
| Auth & Patient Context | API Gateway + Auth Guard | Ensure only logged-in patient sees their data |
| UI Rendering | Angular Frontend | Display referrals, appointments, status |
| Seed Data | Patient & Referral Services | Populate test data for demo |

## Success Criteria

- [ ] Patient can visit `/patient-portal` and see their referrals and upcoming appointments
- [ ] Referral card shows: ID, specialty, referring provider, status, appointment date (if any)
- [ ] Appointment card shows: date, time, provider, clinic, check-in instructions
- [ ] Status badge displays referral status with clear visual indicators (color-coded or icons)
- [ ] API enforces that a patient can only see their own data (patient_id matches logged-in user)
- [ ] Seed data includes at least 2 referrals and 2 appointments for demo patient
- [ ] Frontend components are standalone and use the patient-portal layout shell
- [ ] Responsive design: works on mobile and desktop

## Files to Change Summary

**Backend**:
- services/referral/main.py (1 endpoint)
- services/referral/schemas.py (1 new schema)
- services/patient/models.py (possibly 0 changes if Appointment exists)
- services/patient/main.py (1 endpoint)
- services/patient/schemas.py (1 new schema)
- services/patient/seed.py (seed appointments)
- services/api-gateway/main.py (2 new proxy routes)

**Frontend**:
- frontend/src/app/features/patient-portal/patient-portal.component.ts
- frontend/src/app/features/patient-portal/patient-portal.component.html
- frontend/src/app/features/patient-portal/dashboard/dashboard.component.ts
- frontend/src/app/features/patient-portal/dashboard/dashboard.component.html
- frontend/src/app/features/patient-portal/referral-card/referral-card.component.ts
- frontend/src/app/features/patient-portal/referral-card/referral-card.component.html
- frontend/src/app/features/patient-portal/appointment-card/appointment-card.component.ts
- frontend/src/app/features/patient-portal/appointment-card/appointment-card.component.html
- frontend/src/app/features/patient-portal/status-badge/status-badge.component.ts
- frontend/src/app/features/patient-portal/services/patient-portal.service.ts
- frontend/src/app/app.routes.ts (1 route addition)
- frontend/src/app/core/auth/auth.guard.ts (may need updates)

## Open Questions

1. **Referral Status Values**: What are the exact status enum values for referrals (pending, approved, scheduled, completed, canceled)? Assumed based on typical referral workflow; implementor should verify against existing Referral model.

2. **Appointment FK Relationship**: Does the Appointment model already have a FK to Referral? If not, should it? Assumed yes for this feature; if no, implementor should add it.

3. **Time Zone Handling**: Should appointment times be displayed in patient's local time or clinic time? Assumed clinic time for MVP; can be enhanced later.

4. **Check-in Instructions**: Where are check-in instructions stored (on Appointment model or pulled from another service)? Assumed on Appointment model; if elsewhere, implementor should call the correct service.

5. **Sorting/Filtering**: Should the dashboard let patients filter by status, sort by date, or search by provider? Assumed no filters for MVP; UI should be simple list view, newest/soonest first.

## Integration Notes

This sub-feature is **foundational** — the other two sub-features (document management, referral tracking) will depend on seeing the referral list. Coordinate with:

- **Sub-Feature 2 (Document Management)**: The document upload form will allow attaching documents to referrals. Use the referral ID from this sub-feature to link documents.
- **Sub-Feature 3 (Referral Tracking)**: The tracking view will show status history and notifications for referrals. Use the referral ID and status from this sub-feature.

**Shared Data Contract**:
- Referral ID (UUID or int)
- Referral status (enum: pending, approved, scheduled, completed, canceled)
- Appointment date/time (ISO 8601)
- Patient ID (matched from logged-in user)

## Manual Verification Steps

1. **Start services**: Run `./start_all.sh` to bring up all backend and frontend
2. **Log in as patient**: Navigate to `http://localhost:4200` and log in with a patient account (e.g., demo patient ID 1)
3. **Visit patient portal**: Click "My Referrals & Appointments" or navigate to `/patient-portal`
4. **Check referral display**: Verify at least 2 referrals appear with ID, specialty, status, date
5. **Check appointment display**: Verify at least 2 appointments appear with date, provider, clinic
6. **Test auth boundary**: Log in as a different patient or as a clinician; verify the patient portal shows no data or is not accessible
7. **Check responsive design**: Resize browser window; verify layout adapts for mobile
8. **Verify API calls**: Open browser DevTools Network tab; confirm `/api/patient-portal/referrals` and `/api/patient-portal/appointments` return correct data

---
_Implementation status: Pending_
