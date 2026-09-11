# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

**ClinicCare** is a microservices-based healthcare platform called ReferralIQ. It follows a classic microservices pattern with a separate API Gateway that routes requests to independent backend services.

### Tech Stack

- **Frontend**: Angular 18 (TypeScript), runs on port 4200
- **API Gateway**: FastAPI (Python), runs on port 8000, routes requests to backend services
- **Backend Services**: 5 independent FastAPI (Python) services with SQLAlchemy ORM:
  - Patient Service (8001) — manages patient records, allergies, conditions, medications
  - Doctors Service (8002) — manages doctor information
  - Referral Service (8003) — manages patient referrals between doctors
  - Document Service (8004) — manages healthcare documents
  - Notification Service (8005) — handles notifications
- **Orchestration**: Docker Compose with individual Dockerfiles for each service
- **Database**: SQLAlchemy with seed scripts for initialization

### Microservices Interaction

```
Frontend (Angular, :4200)
    ↓ (HTTP via localhost:4200 CORS)
API Gateway (FastAPI, :8000)
    ↓ (Internal routing via SERVICE_MAP)
Five Backend Services (FastAPI, :8001-8005)
    ↓ (SQLAlchemy ORM)
Databases (one per service)
```

The **API Gateway** (`gateway/main.py`) is the single entry point. It:
- Proxies HTTP requests to backend services based on path segments (`/api/{service}/...`)
- Forwards all HTTP methods (GET, POST, PATCH, PUT, DELETE)
- Handles CORS for the Angular frontend
- Uses asyncio with httpx for non-blocking upstream calls
- Filters hop-by-hop headers before forwarding

### Backend Service Pattern

Each backend service (`services/{service}/main.py`) follows the same pattern:
- **Startup event** — seeds database with initial data if empty
- **CRUD endpoints** — RESTful endpoints for resource management
- **ORM models** (`models.py`) — SQLAlchemy table definitions
- **Schemas** (`schemas.py`) — Pydantic request/response validation
- **Database** (`db.py`) — SQLAlchemy engine and session factory
- **Seed data** (`seed.py`) — initial data population

## Development Commands

### Full Stack (Frontend + All Backend Services)

```bash
# Start everything (backends via docker-compose, frontend via ng serve)
./start_all.sh

# Stop everything (backends + frontend)
./stop.sh

# View backend logs
docker compose logs -f

# View frontend logs
tail -f .run/frontend.log
```

### Frontend Only

```bash
cd frontend

# Start dev server (auto-reload on file changes)
npm start
# or
ng serve

# Build for production
npm run build
ng build

# Run unit tests
npm test
```

### Individual Backend Service (for debugging/manual testing)

```bash
# Start just the gateway and all dependencies
docker compose up

# Start only specific services (e.g., patient + gateway)
docker compose up patient-service gateway

# Rebuild after code changes
docker compose up --build

# View logs for a specific service
docker compose logs -f patient-service

# Enter a service container shell
docker compose exec patient-service bash
```

### Testing Backend Services Locally (Without Docker)

Backend services can run without Docker if dependencies are installed, but Docker is the standard flow. If needed:

```bash
cd services/patient
pip install -r requirements.txt
python main.py  # Runs on :8001
```

## Key Files and Patterns

### Frontend
- `frontend/src/app/` — Angular components, services, guards, pipes
- `frontend/angular.json` — Angular CLI configuration
- Test configuration: `frontend/tsconfig.spec.json`, Karma runner in package.json

### Gateway
- `gateway/main.py` — Reverse proxy with request routing
- `gateway/requirements.txt` — Dependencies (FastAPI, uvicorn, httpx)
- Service URLs configured via environment variables (see `docker-compose.yml`)

### Backend Services
- `services/{service}/main.py` — API endpoints (GET, POST, PATCH, PUT, DELETE)
- `services/{service}/models.py` — SQLAlchemy ORM models
- `services/{service}/schemas.py` — Pydantic schemas for request/response validation
- `services/{service}/db.py` — Database session setup
- `services/{service}/seed.py` — Initialization logic

### Docker & Orchestration
- `docker-compose.yml` — Service definitions, port mappings, environment variables, dependencies
- Each service has its own `Dockerfile` (Alpine Python base, standard FastAPI setup)

## Important Notes

- **Environment Variables**: Service URLs are configured in `docker-compose.yml`. When running locally without Docker, update `gateway/main.py` to point to `http://localhost:{port}` instead of service names.
- **Database Seeding**: Each service seeds its database on startup (`on_event("startup")`). Seed logic is in `seed.py` for each service.
- **CORS**: Frontend CORS is hardcoded to `http://localhost:4200` in the gateway. Update for production deployments.
- **Frontend Port Conflict**: `start_all.sh` checks if port 4200 is already in use before starting ng serve; it skips if already running.
- **Database**: Each backend service manages its own SQLAlchemy database (likely SQLite in development).
