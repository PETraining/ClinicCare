# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClinicCare** (internally named ReferralIQ) is a full-stack healthcare management platform with a microservices architecture. It handles patient profiles, doctor information, medical referrals with workflow state machines, document management, and notifications.

## Architecture

### System Design

The application uses a **microservices architecture** with an API gateway pattern:

```
Frontend (Angular 18)
    ↓
API Gateway (FastAPI) - Port 8000
    ↓
[6 Independent Microservices - Ports 8001-8006]
├─ Patient Service (port 8001) - Patient data, allergies, conditions, medications
├─ Doctors Service (port 8002) - Doctor profiles and availability
├─ Referral Service (port 8003) - Medical referral workflows (state machine based)
├─ Document Service (port 8004) - Medical document storage and retrieval
├─ Notification Service (port 8005) - Notification recording and management
└─ Pharmacy Service (port 8006) - Prescriptions, medication inventory, dispensing
```

### Key Architectural Principles

1. **Service Independence**: Each microservice has its own SQLite database file (e.g., `patient.db`, `doctors.db`). Services are completely decoupled at the data layer.

2. **API Gateway Pattern**: The gateway (`gateway/main.py`) proxies all requests from `http://localhost:8000/api/*` to the appropriate microservice. CORS is configured to accept requests only from the frontend (`localhost:4200`).

3. **HTTP-based Inter-service Communication**: When a service needs data from another (e.g., Referral service calling Doctors or Notification service), it makes direct HTTP calls using the service's Docker container hostname.

4. **Docker Compose Orchestration**: All services (gateway + 6 microservices) are defined in `docker-compose.yml`. Services discover each other via Docker networking using container names as hostnames.

## Directory Structure

- **`frontend/`** - Angular 18 SPA
  - `src/app/core/` - Reusable services, models, guards, configuration
  - `src/app/features/` - Feature-based components (dashboard, documents, login, referrals, etc.)
  - `package.json` - npm scripts and dependencies
  - Tests run via Karma/Jasmine

- **`gateway/`** - FastAPI proxy gateway
  - `main.py` - Routes all incoming `/api/*` requests to microservices

- **`services/`** - Backend microservices directory
  - Each service follows the same pattern:
    - `main.py` - FastAPI app with endpoints
    - `models.py` - SQLAlchemy ORM models
    - `schemas.py` - Pydantic request/response schemas
    - `db.py` - SQLAlchemy session management
    - `seed.py` - Sample data seeding
    - `Dockerfile` & `requirements.txt` - Container setup

## Pharmacy Service Details

The **Pharmacy Service** (port 8006) manages prescriptions and medication inventory. It integrates with:
- **Referral Service**: When a referral is accepted, a prescription is automatically created
- **Patient Service**: Patient medication records are updated when medications are dispensed

### Database Tables

```
medications:
  MedicationId (Primary Key)
  Name (e.g., "Aspirin")
  Dosage (e.g., "500mg")
  StockLevel (current quantity)
  MinStockLevel (reorder threshold)
  UnitPrice (cost per unit)

prescriptions:
  PrescriptionId (Primary Key)
  ReferralId (linked referral)
  PatientId (patient who receives)
  PrescribingDoctorId (doctor who prescribed)
  Medications (JSON list of medications)
  Status (Active, Completed, Voided)

dispensing_records:
  DispensingId (Primary Key)
  PrescriptionId (which prescription)
  MedicationId (which medication)
  QuantityDispensed (amount dispensed)
  DispensedAt (timestamp)
  DispensedBy (who dispensed)
```

### Key Endpoints

```
GET  /medications              → List all medications
GET  /medications/{id}         → Get specific medication
POST /prescriptions            → Create prescription
GET  /prescriptions            → List prescriptions
POST /prescriptions/{id}/dispense    → Record dispensing
GET  /prescriptions/{id}/dispensing-history → Audit trail
GET  /inventory/low-stock      → Low stock alerts
```

### Testing the Pharmacy Service

```
# Access Swagger UI
http://localhost:8006/docs

# Example: Get all medications
curl http://localhost:8006/medications

# Example: Get low-stock items
curl "http://localhost:8006/medications?low_stock=true"
```

## Common Development Commands

### Start/Stop Full Stack

```bash
# Start backend services (Docker) + frontend dev server
./start_all.sh

# Gracefully stop all services
./stop.sh
```

The `start_all.sh` script:
1. Builds and starts Docker containers for all backend services
2. Waits for the API gateway to be healthy
3. Starts the Angular development server

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
ng test --include='**/path-to-file.spec.ts'

# Generate new component
ng generate component feature-name/component-name
```

### Backend Development

```bash
# Start all services with Docker Compose
docker compose up -d --build

# View logs from a specific service
docker compose logs -f patient

# View Pharmacy Service logs
docker compose logs -f pharmacy-service

# Stop all services
docker compose down

# Rebuild and restart a specific service
docker compose up -d --build doctors

# Restart Pharmacy Service
docker compose up -d --build pharmacy-service
```

### Database Seeding

Each microservice has sample data that's automatically seeded when the service starts (via `seed.py`). To reset a service's database:
1. Delete the `.db` file (e.g., `services/patient/patient.db`)
2. Restart the service; it will re-seed automatically

## Frontend Architecture Notes

### Feature-based Structure

The frontend uses a feature-based modular structure, not a layer-based structure. This means:
- All files related to "Documents" feature are together
- Services in `core/` are shared across features
- Feature components import from `core/services` to call the API

### HTTP Clients

Core services (`core/services/`) act as HTTP clients for each backend service:
- `PatientService` → calls Patient microservice
- `DoctorsService` → calls Doctors microservice
- `ReferralService` → calls Referral microservice
- etc.

All services use a centralized API base URL from `core/config.ts` pointing to the gateway.

### Reactive State

The frontend uses Angular signals for reactive state management. Components subscribe to service observables and update automatically when data changes.

## Backend Service Pattern

All microservices follow this structure:

```python
# models.py - ORM layer (SQLAlchemy)
class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True)
    # ... columns

# schemas.py - API layer (Pydantic)
class PatientSchema(BaseModel):
    id: int
    name: str
    # ... fields

# main.py - Endpoints
@app.get("/patients/{patient_id}", response_model=PatientSchema)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    return db.query(Patient).filter(Patient.id == patient_id).first()
```

This pattern ensures clean separation between database models, API contracts, and business logic.

## Inter-service Communication

When a microservice needs to call another:

1. **Async HTTP calls** using `httpx` library with proper error handling
2. **Service discovery** via Docker Compose networking (use service name as hostname, e.g., `http://patient:8001`)
3. **Environment variables** for service URLs (e.g., `PHARMACY_SERVICE_URL=http://pharmacy-service:8006`)

### Key Integration Patterns

#### Example 1: Referral → Pharmacy (Fire-and-Forget)

When a referral transitions to **Accepted** status, the referral service automatically creates a prescription in the pharmacy service:

```python
# In referral/main.py: accept_referral endpoint
if referral.Status == "Accepted":
    asyncio.create_task(
        clients.create_prescription_from_referral(
            referral_id=referral.ReferralId,
            patient_id=referral.PatientId,
            prescribing_doctor_id=referral.SpecialistId,
            medications=[]
        )
    )
```

**Key characteristics:**
- **Fire-and-forget**: Uses `asyncio.create_task()` — the referral is committed before pharmacy response
- **Error handling**: Failures are logged but don't rollback the referral acceptance
- **Resilience**: If pharmacy service is temporarily down, referral still succeeds

#### Example 2: Referral → Doctors (Blocking Validation)

When creating a referral, the doctors must exist:

```python
# In referral/main.py: create_referral endpoint
try:
    referring_exists, specialist_exists = await asyncio.gather(
        clients.doctor_exists(payload.ReferringDoctorId),
        clients.doctor_exists(payload.SpecialistId),
    )
except UpstreamUnavailable as exc:
    raise HTTPException(status_code=502, detail=str(exc))
```

**Key characteristics:**
- **Blocking**: Referral creation fails if doctors service is unavailable (raises 502)
- **Parallel validation**: Uses `asyncio.gather()` to validate both doctors concurrently
- **Exception handling**: `UpstreamUnavailable` exception for service failure scenarios

### Exception Handling Pattern

```python
# clients.py
class UpstreamUnavailable(Exception):
    """Raised when an upstream service is unavailable."""
    pass

async def doctor_exists(doctor_id: int) -> bool:
    try:
        resp = await _client.get(f"{DOCTORS_SERVICE_URL}/doctors/{doctor_id}/exists")
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise UpstreamUnavailable(f"Doctors Service unavailable: {exc}") from exc
    return resp.json()["exists"]
```

### Best Practices

Be careful with:
- **Circular dependencies** between services (A → B → A creates deadlock risk)
- **Cascading failures** (use timeouts: `httpx.AsyncClient(timeout=5.0)`)
- **Async context** in FastAPI endpoints (use `async def` and `await` consistently)
- **Fire-and-forget reliability** (log failures, don't propagate to client)

## Debugging & Development Tips

### Frontend
- Use Angular DevTools browser extension for debugging components and services
- Check `localhost:4200` for the running app
- Frontend logs appear in browser console

### Backend
- View service logs: `docker compose logs -f <service-name>`
- Use FastAPI's automatic Swagger docs:
  - **Gateway**: `http://localhost:8000/docs` (proxies all services)
  - **Patient**: `http://localhost:8001/docs`
  - **Doctors**: `http://localhost:8002/docs`
  - **Referral**: `http://localhost:8003/docs`
  - **Document**: `http://localhost:8004/docs`
  - **Notification**: `http://localhost:8005/docs`
  - **Pharmacy**: `http://localhost:8006/docs` (newest service)
- Database queries can be tested directly by accessing the service's Swagger UI
- **Pharmacy testing**: Test the workflow at `/docs` — create prescriptions, list medications, test dispensing

### Common Issues
- **Services not communicating**: Check that Docker Compose is running (`docker compose ps`)
- **Frontend can't reach API**: Ensure gateway is healthy and CORS is properly configured
- **Port conflicts**: If ports 4200, 8000-8006 are in use, either stop those services or modify `docker-compose.yml`
- **Database locked**: SQLite can have locking issues; if stuck, restart the affected service
- **Pharmacy prescription not created**: When referral is accepted, check pharmacy-service logs for errors:
  ```bash
  docker compose logs -f pharmacy-service | grep -i prescription
  docker compose logs -f referral-service | grep -i pharmacy
  ```
- **Low stock alerts not showing**: Verify pharmacy database has medications with `StockLevel < MinStockLevel`

## Testing Strategy

- **Frontend**: Karma/Jasmine test suite (`npm test`)
- **Backend**: Each service can have tests, but currently focus is on integration via Swagger UI testing
- Always verify inter-service communication when modifying service endpoints or contracts

## Current Development State

The codebase includes the **Pharmacy & Prescription Management** feature. Key aspects:

- **Pharmacy Service** (port 8006) is now a core microservice alongside Patient, Doctors, Referral, Document, and Notification services
- **Referral → Pharmacy Integration**: When referrals are accepted, prescriptions are auto-created in the pharmacy service
- **Database**: Each service has its own SQLite database (e.g., `pharmacy.db` for pharmacy service)
- **Feature-complete**: Pharmacy includes medication inventory, prescription management, and dispensing workflows

For detailed pharmacy documentation, see:
- `README_PHARMACY_FEATURE.md` — Feature overview and user guide
- `PHARMACY_TEST_REPORT.md` — Testing scenarios and verification steps
- `QUICKSTART.md` — 5-minute setup guide
