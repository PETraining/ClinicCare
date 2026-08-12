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
[5 Independent Microservices - Ports 8001-8005]
├─ Patient Service (port 8001) - Patient data, allergies, conditions, medications
├─ Doctors Service (port 8002) - Doctor profiles and availability
├─ Referral Service (port 8003) - Medical referral workflows (state machine based)
├─ Document Service (port 8004) - Medical document storage and retrieval
└─ Notification Service (port 8005) - Notification recording and management
```

### Key Architectural Principles

1. **Service Independence**: Each microservice has its own SQLite database file (e.g., `patient.db`, `doctors.db`). Services are completely decoupled at the data layer.

2. **API Gateway Pattern**: The gateway (`gateway/main.py`) proxies all requests from `http://localhost:8000/api/*` to the appropriate microservice. CORS is configured to accept requests only from the frontend (`localhost:4200`).

3. **HTTP-based Inter-service Communication**: When a service needs data from another (e.g., Referral service calling Doctors or Notification service), it makes direct HTTP calls using the service's Docker container hostname.

4. **Docker Compose Orchestration**: All services (gateway + 5 microservices) are defined in `docker-compose.yml`. Services discover each other via Docker networking using container names as hostnames.

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

# Stop all services
docker compose down

# Rebuild and restart a specific service
docker compose up -d --build doctors
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

1. **Async HTTP calls** using `httpx` or similar library
2. **Service discovery** via Docker Compose networking (use service name as hostname, e.g., `http://patient:8001`)
3. **Example**: Referral service calls Doctors service to validate a doctor exists before creating a referral

Be careful with:
- Circular dependencies between services
- Cascading failures (use timeouts and error handling)
- Async context in FastAPI endpoints (use `async def` and `await` for inter-service calls)

## Debugging & Development Tips

### Frontend
- Use Angular DevTools browser extension for debugging components and services
- Check `localhost:4200` for the running app
- Frontend logs appear in browser console

### Backend
- View service logs: `docker compose logs -f <service-name>`
- Use FastAPI's automatic Swagger docs: `http://localhost:8000/docs` (for gateway)
- Each service has its own Swagger docs on its port (e.g., `http://localhost:8001/docs` for Patient)
- Database queries can be tested directly by accessing the service's Swagger UI

### Common Issues
- **Services not communicating**: Check that Docker Compose is running (`docker compose ps`)
- **Frontend can't reach API**: Ensure gateway is healthy and CORS is properly configured
- **Port conflicts**: If ports 4200, 8000-8005 are in use, either stop those services or modify `docker-compose.yml`
- **Database locked**: SQLite can have locking issues; if stuck, restart the affected service

## Testing Strategy

- **Frontend**: Karma/Jasmine test suite (`npm test`)
- **Backend**: Each service can have tests, but currently focus is on integration via Swagger UI testing
- Always verify inter-service communication when modifying service endpoints or contracts

## Current Development State

The codebase is on the `F4-Pharmacy-Ann` feature branch, implementing pharmacy-related functionality. The `master` branch contains the stable core ReferralIQ platform.
