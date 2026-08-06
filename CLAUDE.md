# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ClinicCare** (ReferralIQ) is a microservices-based healthcare referral platform with a modern Angular frontend and containerized Python backend services.

**Architecture:**
- **Frontend**: Angular 18 (TypeScript) on port 4200
- **API Gateway**: FastAPI reverse proxy (port 8000) that routes `/api/*` requests to backend services
- **Backend Services** (Python/FastAPI + SQLAlchemy, each with own database):
  - Patient Service (8001): Patient records, allergies, conditions, medications
  - Doctors Service (8002): Doctor information and availability
  - Referral Service (8003): Manages referrals between doctors; calls other services via httpx
  - Document Service (8004): Medical documents and records
  - Notification Service (8005): Event logging and notifications

## Quick Start Commands

**Start the full stack** (backend + frontend):
```bash
./start_all.sh
```
Launches docker-compose (backend services) and Angular dev server. Frontend at http://localhost:4200, API at http://localhost:8000.

**Stop everything:**
```bash
./stop.sh
```

**Frontend only** (assumes backend is running separately):
```bash
cd frontend && npm start
# or: npm run start
```

**Run frontend tests:**
```bash
cd frontend && npm test
```
Runs Karma/Jasmine tests. To run a single test file: `npm test -- --browsers=Chrome --watch=true --include='**/specific-file.spec.ts'`

**Backend individually** (for debugging a single service):
```bash
cd services/<service-name>
pip install -r requirements.txt
uvicorn main:app --reload --port 8001  # adjust port per service
```

**View running containers:**
```bash
docker compose logs -f        # tail all service logs
docker compose logs <service> # specific service (e.g., patient-service)
```

## Code Architecture

### Frontend Structure (Angular 18)
```
frontend/
├── src/
│   ├── app/
│   │   ├── app.routes.ts          # Routing config (shell, login, dashboard, patients, referrals, documents)
│   │   ├── core/                  # Singleton services, guards (auth.guard)
│   │   ├── features/              # Feature modules (login, dashboard, patients, referrals, documents)
│   │   └── shell/                 # Main shell layout wrapper
│   ├── assets/
│   └── styles/
└── package.json
```

**Key patterns:**
- Standalone components (Angular 14+) with route-based code splitting
- `authGuard` on protected routes; unauthenticated users redirected to `/login`
- Feature components (PatientsListComponent, PatientDetailsComponent, etc.) consume REST API via HTTP services
- Routing lazy-loads features under the `ShellComponent` wrapper

### Backend Services Structure
Each service (patient, doctors, referral, document, notification) follows this pattern:
```
services/<service-name>/
├── main.py         # FastAPI app with endpoints
├── models.py       # SQLAlchemy ORM models
├── schemas.py      # Pydantic request/response schemas (validation + serialization)
├── db.py           # Database setup, session factory, get_db dependency
├── seed.py         # Seed sample data on startup (if_empty)
├── requirements.txt
└── Dockerfile
```

**Key patterns:**
- FastAPI routes use Pydantic schemas for request validation and response serialization
- SQLAlchemy relationships (e.g., Patient.allergies, Patient.conditions) use joinedload() for efficient queries
- Database session injected via `Depends(get_db)` dependency injection
- Seed data auto-loaded on service startup if DB is empty
- Inter-service calls via httpx (e.g., referral → doctors, referral → notifications)

### API Gateway
Routes all frontend requests `/api/*` to backend services by path prefix:
- `/api/patients/*` → Patient Service (8001)
- `/api/doctors/*` → Doctors Service (8002)
- `/api/referrals/*` → Referral Service (8003)
- `/api/documents/*` → Document Service (8004)
- `/api/notifications/*` → Notification Service (8005)

CORS enabled for `http://localhost:4200` only. Removes hop-by-hop headers before proxying.

## Testing

**Frontend unit tests:**
- Files: `src/**/*.spec.ts` (Jasmine/Karma)
- Run all: `cd frontend && npm test`
- Run single test: `npm test -- --include='**/app.component.spec.ts'`

**Backend services:**
- No automated tests present; manual testing via HTTP or docker compose logs
- To test a single service: start its container and curl endpoints, or use the dev-server command above

**Manual testing the full stack:**
1. Run `./start_all.sh`
2. Open http://localhost:4200 in browser
3. Test login, patient list, referral creation, etc.
4. Check backend logs: `docker compose logs -f`

## Common Development Tasks

**Adding a new endpoint to a service:**
1. Add the route handler to `main.py`
2. Define request schema in `schemas.py` (Pydantic)
3. Update response schema in `schemas.py`
4. Add database model if needed to `models.py`
5. Restart service (uvicorn picks up changes with --reload)

**Calling another service from a service:**
- See `services/referral/clients.py` for pattern: use httpx.AsyncClient with SERVICE_URL env vars
- Wrap exceptions as custom types (e.g., UpstreamUnavailable) to signal failure clearly
- For non-critical calls (like notifications), catch exceptions and log instead of propagating

**Modifying database schema:**
1. Update `models.py` in the service
2. SQLAlchemy will auto-create tables on startup (Base.metadata.create_all(bind=engine))
3. Or restart the container to trigger schema creation

**Adding a new Angular feature:**
1. Create component files in `frontend/src/app/features/<feature>/`
2. Import route in `app.routes.ts`
3. Add navigation link in `shell/` or wherever needed
4. Create HTTP service (in core/ or feature-local) to call `/api/*` endpoints

## Environment & Deployment

**Docker Compose services:**
- All services defined in `docker-compose.yml`
- Environment variables (SERVICE URLs) injected into gateway so it can reach backend services by container name
- Port mappings: frontend 4200, gateway 8000, then individual service ports (8001–8005)
- Built with `docker-compose up -d --build` in start_all.sh

**Key environment variables** (in docker-compose.yml for gateway):
- `PATIENT_SERVICE_URL`, `DOCTORS_SERVICE_URL`, `REFERRAL_SERVICE_URL`, `DOCUMENT_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`
- Default to `http://<service>:port` for inter-service communication within Docker

## Notes for Debugging

- **Frontend not connecting to backend?** Check CORS in gateway/main.py; ensure `http://localhost:4200` is in allow_origins
- **Service startup failing?** Check `docker compose logs <service>` for Python stack traces
- **Database locked or corrupted?** Services use SQLite by default; delete the `.db` file and restart to trigger seed
- **Port already in use?** Stop any existing processes with `./stop.sh` or kill processes on ports 4200, 8000–8005
- **Frontend build issues?** Clear node_modules and reinstall: `cd frontend && rm -rf node_modules && npm install`

## References

- [Angular 18 docs](https://angular.dev)
- [FastAPI docs](https://fastapi.tiangolo.com)
- [SQLAlchemy 2.0 docs](https://docs.sqlalchemy.org)
- [Pydantic 2.0 docs](https://docs.pydantic.dev)
- Project git history: use `git log` for recent changes and context
