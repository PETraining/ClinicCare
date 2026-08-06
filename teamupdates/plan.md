# Implementation Plan: Insurance Eligibility & Prior Authorization

## Overview
Implement a system to track prior authorization status and display it at critical decision points to prevent denied claims.

## Phase 1: Backend Foundation (Week 1)

### 1.1 Patient Service - Insurance Data Model
- **File**: `services/patient/models.py`
- Add `Insurance` ORM model with fields:
  - insurer_name, policy_number, group_number, member_id
  - effective_date, termination_date
  - patient_id (FK to Patient)
- Create relationship: `Patient.insurance` (one-to-many)

### 1.2 Patient Service - Insurance Endpoints
- **File**: `services/patient/main.py`
- POST `/patients/{patient_id}/insurance` - Add insurance record
- GET `/patients/{patient_id}/insurance` - Retrieve insurance info
- PUT `/patients/{patient_id}/insurance/{insurance_id}` - Update insurance
- DELETE `/patients/{patient_id}/insurance/{insurance_id}` - Remove insurance
- Update seed.py with sample insurance data

### 1.3 Referral Service - Authorization Model & Tracking
- **File**: `services/referral/models.py`
- Add `Authorization` ORM model with fields:
  - referral_id (FK)
  - status (enum: Not Required, Pending, Approved, Denied)
  - requested_date, decision_date, decision_notes
  - created_at, updated_at
- Add relationship: `Referral.authorization` (one-to-one)

### 1.4 Referral Service - Authorization Endpoints
- **File**: `services/referral/main.py`
- POST `/referrals/{referral_id}/authorization` - Create authorization request
- GET `/referrals/{referral_id}/authorization` - Get authorization status
- PUT `/referrals/{referral_id}/authorization` - Update authorization status (manual entry for now)

### 1.5 API Gateway Routes
- **File**: `services/api-gateway/main.py`
- Add routes for insurance endpoints (proxy to Patient Service)
- Add routes for authorization endpoints (proxy to Referral Service)

## Phase 2: Frontend & Integration (Week 2)

### 2.1 Frontend - Insurance Information Display
- **File**: `frontend/src/app/features/patients/patient-details.component.ts`
- Display insurance info on patient details page
- Show policy number, insurer, effective dates

### 2.2 Frontend - Authorization Status Badges
- **File**: `frontend/src/app/features/referrals/referral-creation.component.ts`
- Add authorization status check workflow before referral submission
- Display badge: Approved ✓ | Pending ⏳ | Denied ✗ | Not Required -
- Block referral creation if status is Denied

### 2.3 Frontend - Referral Tracking Integration
- **File**: `frontend/src/app/features/referrals/referral-list.component.ts`
- Show authorization status in referral list view
- Add filter by authorization status

### 2.4 Notification Service Integration
- **File**: `services/notification/main.py`
- Emit event when authorization status changes
- Frontend subscribes to authorization updates

## Success Criteria
- ✓ Insurance data persists with patient records
- ✓ Authorization status tracked with 4 states
- ✓ Authorization visible at referral creation (Week 2)
- ✓ Referral creation blocked if authorization denied
- ✓ Staff notified of authorization changes

## Dependencies & Blockers
- None identified; can start Week 1 immediately
- Week 2 depends on Week 1 completion
