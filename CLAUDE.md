# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<<<<<<< HEAD
## What this is

ReferralIQ: a microservices-based clinical referral tracking platform. An Angular SPA talks to an API
gateway, which proxies to five independent FastAPI services, each with its own SQLite database.
=======
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
>>>>>>> 8447e43dc1948545184388e4a30799aac047cb76

## Running the stack

```bash
<<<<<<< HEAD
./start_all.sh   # docker compose up -d --build (all 5 services + gateway), then ng serve on :4200
./stop.sh        # tears down the frontend dev server and docker compose
```

- Frontend: http://localhost:4200
- API Gateway: http://localhost:8000 (routes `/api/*` to backend services)
- Backend logs: `docker compose logs -f` (or `docker compose logs -f <service-name>`)
- Frontend logs: `.run/frontend.log`

To run a single backend service outside Docker (useful for iterating quickly):

```bash
cd services/<name>
pip install -r requirements.txt
uvicorn main:app --reload --port <its-port>   # doctors=8002, patient=8001, referral=8003, document=8004, notification=8005
```

Each service creates/uses its own SQLite file (`*.db`) in its own directory on startup and seeds it via
`seed_if_empty()` in `seed.py` if empty — delete the `.db` file to reset a service's data.
=======
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
>>>>>>> 8447e43dc1948545184388e4a30799aac047cb76

## Frontend commands (run from `frontend/`)

```bash
<<<<<<< HEAD
npm start           # ng serve, http://localhost:4200
npm run build       # ng build -> dist/frontend
npm test            # ng test (Karma/Jasmine)
```

There is essentially no test coverage yet beyond the generated `app.component.spec.ts` — don't assume
existing specs when adding features.

## Architecture

### Services and ports

| Service | Port | Responsibility |
|---|---|---|
| `gateway` | 8000 | Reverse proxy only — no business logic |
| `services/patient` | 8001 | Patients + nested allergies/conditions/medications |
| `services/doctors` | 8002 | Doctor directory |
| `services/referral` | 8003 | Referral lifecycle (calls doctors + notification services) |
| `services/document` | 8004 | Documents linked to patients/referrals |
| `services/notification` | 8005 | Append-only notification log |

### Gateway routing (`gateway/main.py`)

A single catch-all route (`/api/{full_path}`) forwards requests based on the first path segment
(`patients`, `doctors`, `referrals`, `documents`, `notifications` — see `SERVICE_MAP`) to the
corresponding service, stripping hop-by-hop headers. Adding a new backend route requires no gateway
change unless it's a new top-level segment — then add an entry to `SERVICE_MAP` and a
`*_SERVICE_URL` env var in `docker-compose.yml`.

### Backend service structure

Every service under `services/<name>/` follows the same layout — when adding one, mirror the existing
services rather than inventing a new pattern:

- `db.py` — SQLAlchemy engine/session pointing at a local `sqlite:///./<name>.db` file, plus `get_db()` dependency
- `models.py` — SQLAlchemy ORM models. Column names are PascalCase (e.g. `PatientId`, `CreatedAt`) to
  match the frontend's TypeScript models directly — keep this consistent when adding fields
- `schemas.py` — Pydantic request/response schemas, using `ConfigDict(from_attributes=True)` for reads
- `main.py` — FastAPI app; calls `Base.metadata.create_all()` and `seed_if_empty()` on startup
- `seed.py` — seeds demo data only if the table is empty
- `Dockerfile` — `python:3.11-slim`, installs `requirements.txt`, runs uvicorn on the service's fixed port

Cross-service calls happen over plain HTTP via `httpx.AsyncClient`, configured through env vars (see
`services/referral/clients.py` for the pattern: a `*_SERVICE_URL` env var defaulting to `localhost` for
local dev, `UpstreamUnavailable` exception mapped to a 502).

### Referral state machine

`services/referral/main.py` encodes valid transitions in a single `TRANSITIONS` dict:

```
submit:   Draft -> Submitted
accept:   Submitted -> Accepted
reject:   Submitted -> Rejected
complete: Accepted -> Completed
```

Each transition is a `PATCH /referrals/{id}/{action}` endpoint that validates the current status,
updates it, then fires a best-effort notification via `clients.record_notification()` — a notification
failure is logged, not raised, so it never rolls back an already-committed status change. Follow this
same "commit first, notify best-effort" pattern for any new side effects on referral transitions.

On referral creation, the referral service calls the doctors service (`GET /doctors/{id}/exists`) to
validate both `ReferringDoctorId` and `SpecialistId` concurrently via `asyncio.gather` before writing.

### Frontend structure (`frontend/src/app/`)

- `core/config.ts` — single `API_BASE_URL` constant (`http://localhost:8000/api`); all services build
  off this
- `core/models/` — TypeScript interfaces mirroring backend Pydantic schemas (PascalCase fields)
- `core/services/` — one Angular service per backend resource, each holding an Angular `signal` as its
  local cache and exposing `load*()`/`create()`/mutation methods (see `referral.service.ts` for the
  standard shape: load into a signal, mutate via HTTP, then patch the signal in a `tap`)
- `core/guards/auth.guard.ts` — gates the `ShellComponent` route tree; auth is a **demo-only** fake
  (`auth.service.ts` just stores a hardcoded name in `localStorage`, no real backend auth exists)
- `features/<domain>/` — one folder per route (dashboard, patients, referrals, documents, login), each
  a standalone component with its own `.ts`/`.html`/`.css`
- `shell/` — the authenticated app chrome (nav) wrapping the routed `features/*` pages
- Routing (`app.routes.ts`) is flat, no lazy loading — all feature components are eagerly imported

There is no real authentication/authorization anywhere in this system (frontend or backend) — every
backend service trusts all requests. Do not treat `AuthService`/`authGuard` as a security boundary.
=======
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
>>>>>>> 8447e43dc1948545184388e4a30799aac047cb76
