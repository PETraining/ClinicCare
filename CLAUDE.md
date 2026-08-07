# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ReferralIQ** is a healthcare referral management microservices platform. It enables patients to receive referrals and clinicians to manage the referral workflow.

## Architecture

The system is organized as a **microservices stack** with an Angular frontend:

```
Frontend (Angular)                     Gateway (FastAPI)                Services (FastAPI + SQLAlchemy)
localhost:4200                         localhost:8000                   One SQLite per service
    ↓                                        ↓
Angular SPA (dist/app)             HTTP reverse-proxy                • Patient Service (8001)
• Components in src/app             routing /api/* to:              • Doctors Service (8002)
• Services in src/app/services                                       • Referral Service (8003)
• Models/interfaces                  - /patients → patient-service   • Document Service (8004)
                                     - /doctors → doctors-service    • Notification Service (8005)
                                     - /referrals → referral-service • Prescription Service (8007)
                                     - /documents → document-service
                                     - /notifications → notification-service
                                     - /prescriptions → prescription-service
```

**Key architectural decisions:**
- Gateway uses FastAPI with httpx for async reverse-proxying; routes based on path prefix.
- Each service is independent with its own SQLAlchemy database session and SQLite file.
- Services auto-seed data on startup if the database is empty (see each service's `seed.py`).
- Frontend makes all API calls through the gateway; direct service calls are blocked by CORS.
- Services communicate via HTTP when needed (e.g., referral service calls doctor and notification services—see `clients.py`).

## Stack

- **Frontend:** Angular 18.2, TypeScript 5.5, RxJS, Jasmine/Karma
- **Backend:** FastAPI 0.115, Uvicorn 0.30.6, SQLAlchemy 2.0, Pydantic 2.9
- **Infrastructure:** Docker Compose, SQLite

## Quick Start

### Start Everything

```bash
./start_all.sh
```

This script:
1. Builds and starts all 6 backend containers and the gateway with Docker Compose.
2. Waits for the gateway to become ready (polls `/api/doctors`).
3. Starts the Angular dev server if not already running on :4200.
4. Logs frontend output to `.run/frontend.log`.

Access the app at http://localhost:4200.

### Stop Everything

```bash
./stop.sh
```

Kills the Angular dev server and stops all Docker containers.

### View Logs

```bash
# Backend logs (all services + gateway)
docker compose logs -f

# Specific service
docker compose logs -f patient-service

# Frontend (if started via start_all.sh)
tail -f .run/frontend.log
```

### Restart Individual Services

```bash
docker compose restart <service-name>
# e.g., docker compose restart patient-service
```

## Frontend Development

### Setup

```bash
cd frontend
npm install
```

### Development Server

```bash
cd frontend
npm start
```

Runs `ng serve` on http://localhost:4200 (auto-reload on file changes).

### Build Production

```bash
cd frontend
npm run build
```

Output goes to `frontend/dist/`.

### Run Tests

```bash
cd frontend
npm test
```

Runs Jasmine tests via Karma; watch mode enabled by default.

### Generate Angular Scaffolds

```bash
cd frontend
ng generate component component-name
ng generate service service-name
ng generate directive directive-name
# etc.
```

## Backend (Services) Development

Each service (patient, doctors, referral, document, notification) is a standalone FastAPI app. The gateway is a separate service that routes traffic.

### Understanding a Service

All services follow this structure:
- **main.py** — FastAPI app definition and endpoints
- **models.py** — SQLAlchemy ORM models
- **schemas.py** — Pydantic request/response schemas
- **db.py** — SQLAlchemy session factory and engine setup
- **seed.py** — Initial data seeding (runs on app startup if DB empty)
- **requirements.txt** — Python dependencies
- **Dockerfile** — Docker image definition

### Local Service Development (Without Docker)

To run a service locally (e.g., patient service):

```bash
cd services/patient
python -m pip install -r requirements.txt
python main.py
```

The service will listen on its default port (see `main.py` or Dockerfile for `uvicorn` port). When running without Docker, set env vars to reach other services:

```bash
export GATEWAY_URL=http://localhost:8000
python services/referral/main.py
```

### Docker Workflow

To rebuild a single service and restart it:

```bash
docker compose build patient-service
docker compose up -d patient-service
```

### Adding Dependencies

To add a Python dependency to a service:

1. Edit `services/<service>/requirements.txt`
2. Rebuild the container: `docker compose build <service-name>`
3. Restart: `docker compose restart <service-name>` (or rebuild+up again)

## Common Tasks

### Test a Service Endpoint

```bash
# Gateway proxies to patient service
curl http://localhost:8000/api/patients

# Or direct to service (if running locally without Docker)
curl http://localhost:8001/patients
```

### Seed Fresh Data

Database files are auto-seeded on first startup. To reset:

```bash
# Remove database files (they're in .gitignore)
docker compose down -v  # -v removes named volumes (may not apply here)
docker compose up -d    # Re-seed on startup
```

Or, remove individual `.db` files and restart the container.

### Debug a Service

Add print statements or use a debugger:

```python
# In main.py or any handler
print(f"Debug: {variable}")

# Or, if running locally:
import pdb; pdb.set_trace()
```

For Docker, view logs: `docker compose logs -f <service-name>`

### Check API Gateway Status

```bash
curl http://localhost:8000/api/doctors
# Should return a non-error; gateway is up.
```

## File Structure

```
.
├── frontend/                    # Angular SPA
│   ├── src/app                  # Components, services, guards
│   ├── src/assets               # Static files
│   ├── angular.json             # Angular CLI config
│   ├── package.json             # Node dependencies
│   └── README.md                # Angular setup details
├── services/                    # FastAPI microservices
│   ├── patient/                 # Patient Service (8001)
│   ├── doctors/                 # Doctors Service (8002)
│   ├── referral/                # Referral Service (8003)
│   ├── document/                # Document Service (8004)
│   └── notification/            # Notification Service (8005)
├── gateway/                     # API Gateway (8000)
│   ├── main.py                  # FastAPI reverse-proxy router
│   └── requirements.txt
├── docker-compose.yml           # Orchestration config
├── start_all.sh                 # One-command startup
├── stop.sh                      # One-command shutdown
└── .gitignore                   # Python, Node, DB, OS artifacts
```

## Key Implementation Details

### Gateway Routing

The gateway in `gateway/main.py`:
- Routes `/api/{service}/{endpoint}` → `{SERVICE_URL}/{service}/{endpoint}`
- Strips hop-by-hop headers
- Async proxying with 10s timeout
- CORS configured for localhost:4200 frontend

### Service-to-Service Communication

The referral service (`services/referral/clients.py`) demonstrates inter-service calls:
- Makes HTTP calls to doctors and notification services
- Passes service URLs via environment variables (set in docker-compose.yml)
- Error handling for unreachable services

### Database Pattern

Each service:
- Creates tables on startup: `Base.metadata.create_all(bind=engine)`
- Uses dependency injection for DB session: `Depends(get_db)`
- Handles relationships via SQLAlchemy joinedload (eager loading)

## Debugging Tips

- **Port conflicts:** `lsof -i :<port>` to find what's using a port
- **Container won't start:** Check `docker compose logs <service>`
- **Gateway 502 error:** A service is down; check its logs
- **CORS errors in browser:** Check the frontend URL in gateway middleware (`allow_origins`)
- **Seed data not appearing:** Services only seed on first run; check if `.db` file exists
- **Frontend not connecting:** Ensure gateway is running and frontend CORS origin matches

## Environment Variables

Services and gateway read env vars from `docker-compose.yml` (service URLs). For local development without Docker, set them manually:

```bash
export PATIENT_SERVICE_URL=http://localhost:8001
export DOCTORS_SERVICE_URL=http://localhost:8002
export REFERRAL_SERVICE_URL=http://localhost:8003
export DOCUMENT_SERVICE_URL=http://localhost:8004
export NOTIFICATION_SERVICE_URL=http://localhost:8005
```

Defaults in code fall back to localhost URLs.
