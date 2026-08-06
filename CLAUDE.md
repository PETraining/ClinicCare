# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ClinicCare (internal codename "ReferralIQ") is a demo microservices app for managing patient referrals between doctors. It has an Angular frontend, a FastAPI API gateway, and four independent FastAPI + SQLite backend services.

```
frontend/           Angular 18 SPA (standalone components, signals)
gateway/            FastAPI reverse proxy — routes /api/{service}/* to the right backend service
services/
  patient/          Patients, allergies, chronic conditions, medications
  doctors/          Doctors and specialties
  referral/         Referral lifecycle (Draft -> Submitted -> Accepted/Rejected -> Completed)
  document/         Documents attached to patients/referrals
  notification/      Notification log (written by the referral service on status changes)
```

## Running the stack

```bash
./start_all.sh   # builds+starts all 5 backend containers via docker compose, then `ng serve` on :4200
./stop.sh        # stops the frontend dev server and tears down the containers
```

Backend containers are also runnable directly:

```bash
docker compose up -d --build   # all 5 services + gateway
docker compose logs -f         # tail logs
docker compose down
```

- Gateway: http://localhost:8000 (proxies `/api/{patients,doctors,referrals,documents,notifications}/...`)
- Frontend dev server: http://localhost:4200
- Each service also runs standalone on its own port (see `docker-compose.yml`: patient 8001, doctors 8002, referral 8003, document 8004, notification 8005) via `uvicorn main:app --host 0.0.0.0 --port <port>`.

## Frontend commands (run from `frontend/`)

```bash
npm install
ng serve            # dev server on :4200, proxies to gateway at localhost:8000
ng build             # production build to dist/
ng test              # unit tests via Karma/Jasmine
```

There is no e2e test setup. Only `app.component.spec.ts` exists today — no other frontend or backend tests currently exist in this repo.

## Backend service structure

Every service under `services/<name>/` follows the identical layout — read one to understand all of them:

- `db.py` — SQLAlchemy engine/session for a local SQLite file (e.g. `patients.db`), created at the service's working directory inside the container.
- `models.py` — SQLAlchemy ORM models.
- `schemas.py` — Pydantic request/response models (Enums for constrained string fields like `Priority`/`Status`).
- `seed.py` — `seed_if_empty(db)`, called on FastAPI startup; seeds fixed demo data only if the table is empty. Deterministic seed order (e.g. patient seeding comments document exactly which `PatientId` maps to which seeded person).
- `main.py` — FastAPI routes. Runs `Base.metadata.create_all(bind=engine)` then seeds on the `startup` event.
- `Dockerfile` — `python:3.11-slim`, installs `requirements.txt`, runs uvicorn on the service's fixed port.

Field naming in models/schemas is PascalCase (e.g. `PatientId`, `DOB`, `ReferringDoctorId`) to mirror the original SQL schema — match this convention when adding fields, not the more Pythonic snake_case.

There is no shared package between services — each has its own copy of the FastAPI/SQLAlchemy/Pydantic stack in `requirements.txt`. Cross-service communication is synchronous HTTP via `httpx`, not a message bus (see `services/referral/clients.py`).

### Referral lifecycle

`services/referral/main.py` enforces a fixed state machine via the `TRANSITIONS` dict: `submit` (Draft->Submitted), `accept`/`reject` (Submitted->Accepted/Rejected), `complete` (Accepted->Completed). Each transition is a dedicated `PATCH /referrals/{id}/{action}` endpoint that rejects invalid current-state transitions with a 400.

On `create_referral`, the referral service calls the doctors service (`GET /doctors/{id}/exists`) concurrently for both the referring and specialist doctor IDs before creating the record. On every status transition, it calls the notification service (`POST /notifications`) — that call is fire-and-forget: failures are logged, not raised, since a notification-logging failure must not roll back an already-committed status change (see the comment in `clients.py`).

## Gateway routing

`gateway/main.py` is a thin reverse proxy: it maps the first path segment after `/api/` to an upstream service via `SERVICE_MAP` (e.g. `/api/patients/5` -> `PATIENT_SERVICE_URL/patients/5`) and forwards method, query params, body, and headers (minus hop-by-hop headers). Service URLs come from environment variables (set in `docker-compose.yml`), defaulting to `localhost:<port>` for local, non-Dockerized runs.

## Frontend structure

- `core/services/*.service.ts` — one HTTP client service per backend resource, all pointed at `API_BASE_URL` (`core/config.ts`, hardcoded to `http://localhost:8000/api`).
- `core/models/*.model.ts` — TypeScript interfaces mirroring each service's Pydantic schemas (including PascalCase field names).
- `core/guards/auth.guard.ts` + `core/services/auth.service.ts` — auth is a local-storage-only demo stub (no real backend auth exists); `authGuard` blocks all routes except `/login` when unauthenticated.
- `features/*` — one folder per route/screen (dashboard, patients, referrals, documents, login), each a standalone component with its own `.ts`/`.html`/`.css`.
- `shell/` — the authenticated app chrome (nav) wrapping the routed `features/*` pages; see `app.routes.ts` for the route tree.
