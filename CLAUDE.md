# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClinicCare (ReferralIQ) is a microservices-based healthcare referral management platform. It consists of an Angular frontend and 5 FastAPI microservices orchestrated with Docker Compose.

## Architecture

### High-Level System Design

```
Angular Frontend (port 4200)
    ↓ (HTTP)
FastAPI Gateway (port 8000)
    ↓ (HTTP routing by service)
    ├── Patient Service (8001)
    ├── Doctors Service (8002)
    ├── Referral Service (8003) ← calls Doctors & Notification
    ├── Document Service (8004)
    └── Notification Service (8005)
```

**Gateway Pattern:** The API Gateway (`gateway/main.py`) routes all `/api/{service}/*` requests to the appropriate microservice by parsing the first path segment. It uses FastAPI + httpx for async proxying and includes CORS middleware for the frontend.

**Inter-Service Communication:** Services call each other directly via HTTP (not through the gateway). For example, the Referral Service imports a `clients` module to validate doctors exist and record notifications asynchronously.

### Backend Service Structure

All 5 microservices follow the same pattern:
- **main.py** — FastAPI application with endpoints and startup event
- **models.py** — SQLAlchemy ORM models (Patient, Doctor, Referral, etc.)
- **schemas.py** — Pydantic request/response schemas
- **db.py** — SQLAlchemy engine, session factory, and dependency injection
- **seed.py** — Database seeding (called on startup if tables are empty)
- **Dockerfile** — Container build config
- **requirements.txt** — Python dependencies (FastAPI, SQLAlchemy, Pydantic, httpx)

Each service creates its tables on startup and runs seed data. No external database setup is needed.

### Frontend Structure

Angular 18.2 with TypeScript. Standard Angular layout with components, services, and routing. Configured to communicate with the gateway at `http://localhost:8000/api/`.

## Commands

### Running the Full Stack

```bash
# Start all services (backend containers + Angular dev server)
./start_all.sh

# Stop all services
./stop.sh
```

The `start_all.sh` script:
1. Builds and starts backend containers with `docker compose up -d --build`
2. Waits for gateway to be ready (checks `/api/doctors` endpoint)
3. Starts the Angular dev server with `ng serve` if not already running
4. Logs to `$SCRIPT_DIR/.run/frontend.log` and `docker compose logs`

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Development server (port 4200)
npm start

# Build for production
npm run build

# Run unit tests
npm test

# Run a specific test file
npm test -- --include='**/feature.spec.ts'
```

### Backend Services (Docker)

```bash
# Start all services
docker compose up -d --build

# Rebuild a specific service
docker compose up -d --build {doctors|patient|referral|document|notification}

# View logs
docker compose logs -f
docker compose logs -f {service-name}

# Stop all services
docker compose down
```

### Individual Service Development (outside Docker)

Each service can be run locally if you install Python dependencies and configure the database:

```bash
cd services/patient
pip install -r requirements.txt
python main.py  # Runs on port 8001
```

### Testing

```bash
# Frontend unit tests
cd frontend && npm test

# Python services (pytest; no test suite currently committed)
cd services/patient
pytest  # if tests exist
```

## Key Architectural Notes

1. **Stateless Services** — Each microservice is stateless and scales horizontally. The gateway distributes traffic.

2. **Database per Service** — Each service has its own SQLite (or Postgres in Docker) database. Data is not shared; inter-service calls happen over HTTP.

3. **Referral Service Dependencies** — The Referral Service has special logic:
   - Validates doctors exist before creating a referral (calls Doctors Service)
   - Records notifications after status transitions (calls Notification Service)
   - These calls happen asynchronously with `asyncio.gather()`

4. **Startup Seeding** — Every service runs `seed_if_empty()` on startup to populate sample data if tables are empty. This ensures the app is usable immediately without manual DB setup.

5. **Async Gateway** — The gateway uses `httpx.AsyncClient` for async HTTP proxying, so it can handle many concurrent requests efficiently.

6. **CORS** — CORS middleware on the gateway allows requests from `http://localhost:4200` (the frontend).

## Environment Configuration

The gateway and services read environment variables for inter-service URLs (docker-compose.yml sets these automatically):
- `PATIENT_SERVICE_URL` → `http://patient-service:8001` (or `http://localhost:8001` locally)
- `DOCTORS_SERVICE_URL` → `http://doctors-service:8002`
- `REFERRAL_SERVICE_URL` → `http://referral-service:8003`
- `DOCUMENT_SERVICE_URL` → `http://document-service:8004`
- `NOTIFICATION_SERVICE_URL` → `http://notification-service:8005`

When running services locally outside Docker, these default to `http://localhost:{port}`.

## Common Development Flows

### Adding a New Endpoint to a Service

1. Define the Pydantic schema in `services/{service}/schemas.py`
2. Define the SQLAlchemy model in `services/{service}/models.py` (if needed)
3. Add the FastAPI route in `services/{service}/main.py`
4. If other services need to call it, create a client function in `services/{service}/clients.py`

### Calling Another Service

See `services/referral/clients.py` for the pattern:
```python
async def doctor_exists(doctor_id: int) -> bool:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{DOCTORS_SERVICE_URL}/doctors/{doctor_id}")
    return r.status_code == 200
```

Use `asyncio.gather()` for parallel calls.

### Debugging a Service

Check the service logs:
```bash
docker compose logs -f {service-name}
```

Or run the service locally outside Docker and see stdout directly:
```bash
cd services/patient && python main.py
```

## Frontend Integration Points

The Angular frontend calls the gateway at `/api/patients`, `/api/doctors`, `/api/referrals`, etc. The gateway transparently routes these to the appropriate service. No special frontend configuration is needed; just ensure the gateway is running.

## Git Branches

Active development happens on feature branches. The main branch is `master`. When making changes, use meaningful branch names (e.g., `F4-PharmacyPrescription` for the Pharmacy Prescription feature).
