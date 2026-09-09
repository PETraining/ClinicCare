# ClinicCare: Insurance Eligibility & Prior Authorization - Context Map

## Problem & Business Context

**Core Problem:**
- Denied claims happen because prior authorization is not confirmed *before* appointments
- Staff discover authorization issues *after* the appointment (too late to prevent denial)
- No visibility gap: no clear way to check authorization status during referral/appointment planning

**Business Impact:**
- Revenue loss from denied claims
- Operational friction when claims are rejected post-visit
- Staff need real-time authorization status during scheduling workflow

## Solution Overview

Build a system to:
1. **Store** insurance information with patient records
2. **Track** authorization status (Not Required → Pending → Approved/Denied)
3. **Display** authorization status at critical decision points (referral creation, appointment scheduling, patient details)

## Scope: This Week vs Next

### This Week (Week 1): Backend Foundation
**Goal:** Build data models and API endpoints to store and track insurance/authorization

**Deliverables:**
- Patient Service: Insurance data model + CRUD endpoints
- Referral Service: Authorization model + status tracking endpoints
- API Gateway: Route insurance and authorization requests
- Seed data with sample insurance records and authorization statuses

**Files to Change:**
- `services/patient/models.py`, `main.py`, `schemas.py`
- `services/referral/models.py`, `main.py`, `schemas.py`
- `services/api-gateway/main.py`

**Success:** Backend APIs work; can create insurance records and authorization requests via HTTP.

---

### Next Week (Week 2): Frontend & User Workflows
**Goal:** Display authorization status in UI and enforce it during referral creation

**Deliverables:**
- Frontend: Show insurance info on patient details page
- Frontend: Authorization status badge on referral creation form
- Referral creation blocked if authorization is Denied
- Authorization status visible in referral list/tracking view
- Notification service emits events on authorization status change

**Files to Change:**
- `frontend/src/app/features/patients/patient-details.component.ts`
- `frontend/src/app/features/referrals/referral-creation.component.ts`
- `frontend/src/app/features/referrals/referral-list.component.ts`
- `services/notification/main.py`

**Success:** Staff can see authorization status before creating referrals; system blocks risky referrals.

---

## Service Architecture Alignment

| Service | Week 1 | Week 2 |
|---------|--------|--------|
| **Patient Service (8001)** | Insurance CRUD endpoints | Insurance display on frontend |
| **Referral Service (8003)** | Authorization model + endpoints | Authorization status badges |
| **Document Service (8004)** | — | (Future: store auth docs) |
| **Notification Service (8005)** | — | Auth status change events |
| **Frontend (Angular)** | — | Insurance & auth status UI |
| **API Gateway (8000)** | Route insurance + auth endpoints | — |

## Open Questions (To Clarify)
- Is prior authorization checked against an external insurance API, or manually entered by staff?
- Should the system auto-request authorization, or only track staff-initiated requests?
- Which appointment types require prior authorization?
- Should authorization status updates trigger notifications? (→ Week 2)
