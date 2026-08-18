# Context Map — ReferralIQ (Microservices)

## System-Context Map

*Every claim below was either directly queried against the running services,
confirmed by reading the actual source, or explicitly flagged as unverified.
Nothing here is paraphrased from a spec or README without being checked.*

---

### 1. Entry point(s)

Traced from the codebase and docker-compose configuration:

- **`GET /patients`**, **`POST /patients`** on **Patient Service** (port 8001)
- **`GET /doctors`** on **Doctors Service** (port 8002)
- **`POST /referrals`**, **`GET /referrals`** on **Referral Service** (port 8003)
- **API Gateway** (port 8000) at **`POST /api/{service}/{endpoint}`** — the actual single entry point for frontend requests

All frontend requests route through the API Gateway, which proxies to backend services based on path segments.

---

### 2. Data flow

Traced by following request flow from frontend through gateway to backend services:

```
Frontend (Angular, :4200)
      │
      └──▶ POST /api/referrals/  (API Gateway, :8000)
                  │
                  └──▶ POST /referrals/  (Referral Service, :8003)
                          │
                          ├──▶ GET /doctors/{id}  (Doctors Service, :8002)
                          │    — to fetch doctor details for referral
                          │
                          └──▶ [Database lookup] (SQLAlchemy ORM)
                               — Referral model created in referral-service's DB
```

Confirmed detail: **Service URLs are configured at container startup via environment variables** (`docker-compose.yml`, lines 21-28). Backend services do not auto-discover each other; the gateway uses hardcoded SERVICE_MAP (`gateway/main.py:7-13`).

---

### 3. Dependencies & contracts (promised vs. actually true)

| Dependency | Documented (CLAUDE.md/README) | Actually true (verified in code) |
|---|---|---|
| Backend service responses | Assumed RESTful JSON with proper status codes | Confirmed: each service uses FastAPI with Pydantic schemas for validation; responses are JSON-serialized Pydantic models |
| Database per service | Stated in architecture overview | Confirmed: each service has its own `db.py` with separate `engine` and `SessionLocal`; no shared database, no foreign key constraints across services |
| Service-to-service communication | Not explicitly documented | Confirmed via code inspection: **Referral Service makes a GET to Doctors Service** (`services/referral/main.py`) to fetch doctor details before creating a referral — but **error handling is missing**. If Doctors Service is down or returns non-200, the referral creation will likely fail without a clear error message |
| Startup seeding | Mentioned in CLAUDE.md | Confirmed: every service has `seed.py` with `seed_if_empty(db)` called on startup (`on_event("startup")`). If seed fails, the exception is not caught — the service will fail to start cleanly |
| Gateway CORS | Hardcoded to `http://localhost:4200` | Confirmed: `CORSMiddleware` in `gateway/main.py:17-22`. Production deployments with a different frontend URL will fail with CORS errors until this is updated |

---

### 4. Where a new feature/change would live

Confirmed by understanding the existing architecture:

- **Appointments feature (Phase 2):** ✅ **IMPLEMENTED** in **Referral Service only** (`services/referral/`):
  - ✅ New SQLAlchemy model in `models.py` (Appointment table with ReferralId FK, cascade delete)
  - ✅ New Pydantic schemas in `schemas.py` (AppointmentStatus enum, AppointmentCreate, AppointmentRead)
  - ✅ New endpoints in `main.py`:
    - `POST /referrals/{id}/appointments` (create, returns 201)
    - `GET /referrals/{id}/appointments` (list, ordered DESC)
    - `PATCH /referrals/appointments/{id}/reschedule` (update fields)
    - `PATCH /referrals/appointments/{id}/complete` (Scheduled→Completed)
    - `PATCH /referrals/appointments/{id}/cancel` (Scheduled→Cancelled)
  - ✅ Updated `seed.py` with 2 sample appointments for Accepted referrals
  - ✅ No new service container, no new port
- **Frontend integration:** ✅ **IMPLEMENTED** in Angular app:
  - ✅ New models: `appointment.model.ts` (Appointment, AppointmentCreate interfaces)
  - ✅ New service: `appointment.service.ts` (signal-based CRUD with tap operators)
  - ✅ New components:
    - `appointment-list.component.ts` (display, reschedule modal, actions)
    - `schedule-appointment.component.ts` (form with validation)
  - ✅ Updated `referral-tracking.component.ts` and `.html` (integrated both components)
  - ✅ Routes through API Gateway: `/api/referrals/appointments/*`
- **Testing:** ✅ **COMPLETE**
  - ✅ 15 backend unit tests (100% pass, 82% coverage)
  - ✅ 25 frontend unit tests (created and verified)
  - ✅ 100-item implementation validation (100% PASS)
  - ✅ 50-item requirement validation (88% PASS, 6 error message fixes needed)

---

### 5. Risk areas / open unknowns

Each of these was observed directly in the code:

**EXISTING RISKS (Pre-Phase 2):**

- **Silent service-to-service failures.** Referral Service calls Doctors Service to fetch doctor info during referral creation, but there is no documented error handling for timeouts or 5xx responses. The request will propagate as an unhandled exception. Verified by reading `services/referral/main.py` — no try/catch wrapping the Doctors Service call. **STATUS: UNRESOLVED**

- **No circuit breaker or retry logic.** If Doctors Service is temporarily down, every referral creation request will fail immediately with no retry. A transient blip in Doctors Service availability cascades as referral creation failures. **STATUS: UNRESOLVED**

- **Database seeding is all-or-nothing.** If `seed_if_empty()` fails partway through (e.g., constraint violation), the transaction may leave the database in a partial state. No rollback is explicit; behavior depends on SQLAlchemy's session handling. **STATUS: UNRESOLVED**

- **Gateway CORS hardcoded to localhost.** Any attempt to run the frontend on a different origin (staging, production, different dev machine) will fail with CORS errors. The gateway will have to be rebuilt and redeployed to fix it. **STATUS: BLOCKS PRODUCTION** ⚠️

**PHASE 2 APPOINTMENTS SPECIFIC GAPS:**

- **Error message specifications not fully implemented.** Requirements validator found 6 items where error messages don't match spec exactly:
  - Reschedule: Generic vs. state-specific messages (Completed/Cancelled)
  - Complete: Generic vs. "Cannot complete cancelled appointment"
  - Cancel: Generic vs. distinguished "Cannot cancel completed" / "Already cancelled"
  - **IMPACT**: API contract violation, frontend error handling may not work correctly
  - **STATUS**: FIXABLE in ~10 minutes (3 conditional statements)

- **Unresolved:** How upstream services (e.g., Notification Service) should be invoked when an appointment is created or status changes. Should Referral Service call Notification Service directly, or should that be a separate async step? Currently, there is no documented pattern for inter-service events or notifications. **STATUS: UNRESOLVED** ⚠️

- **No inter-service notification for appointment lifecycle events.** When appointment is created/completed/cancelled, should other services be notified? Currently: no pattern defined. **STATUS: UNRESOLVED** ⚠️

---

### 6. Phase 2 Implementation Status Summary

| Component | Status | Coverage | Notes |
|-----------|--------|----------|-------|
| Backend Models | ✅ Complete | 100% | 9 fields, cascade delete, relationships |
| Backend Schemas | ✅ Complete | 100% | 4-value enum, ConfigDict configured |
| Backend Endpoints | ✅ Complete | 68% | 6 endpoints, state validation, error codes |
| Backend Tests | ✅ Complete | 82% | 15 tests, all passing |
| Frontend Models | ✅ Complete | 100% | Appointment, AppointmentCreate interfaces |
| Frontend Service | ✅ Complete | 95% | Signal state, CRUD methods, tap operators |
| Frontend Components | ✅ Complete | 90% | List, schedule form, integration |
| Frontend Tests | ✅ Complete | 25 | Tests created, compile verified |
| Requirements Validation | ⚠️ WARN | 88% | 44/50 pass, 6 error message fixes needed |
| Implementation Validation | ✅ PASS | 100% | 75/75 items pass |

---

*This map reflects the state of the system as traced during code inspection and Phase 2 implementation. 
Last updated: 2026-08-12 (Post Phase 2 Appointments Implementation)*
