# ReferralIQ System Context Map

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  USER BROWSER                                    │
│                              (localhost:4200)                                    │
└────────────────────────────────┬──────────────────────────────────────────────────┘
                                 │
                     HTTP REST API Calls
                     (JSON over HTTP)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Angular 18.2)                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  src/app/                                                                 │  │
│  │  • Components (patient list, doctor profiles, referral forms)           │  │
│  │  • Services (API client services for each domain)                       │  │
│  │  • Guards (route protection)                                           │  │
│  │  • Models/Interfaces (TypeScript types)                                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  Built by: npm build → dist/                                                    │
│  Dev Server: ng serve (port 4200)                                               │
│  Testing: Karma + Jasmine                                                       │
└────────────────────────────────┬──────────────────────────────────────────────────┘
                                 │
              All requests routed to http://localhost:8000
                     /api/patients, /api/doctors, etc.
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY (FastAPI, port 8000)                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  gateway/main.py                                                         │  │
│  │  • HTTP reverse proxy router                                            │  │
│  │  • Request forwarding: /api/{service}/* → SERVICE_URL/...             │  │
│  │  • Header normalization (strips hop-by-hop headers)                   │  │
│  │  • Error handling (502 Bad Gateway if service unreachable)            │  │
│  │  • CORS middleware (allows requests from localhost:4200)             │  │
│  │  • Async client (httpx, 10s timeout)                                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  Routes:                                                                         │
│    /api/patients/*        → Patient Service (8001)                              │
│    /api/doctors/*         → Doctors Service (8002)                              │
│    /api/referrals/*       → Referral Service (8003)                             │
│    /api/documents/*       → Document Service (8004)                             │
│    /api/notifications/*   → Notification Service (8005)                         │
└─┬──────────┬──────────────┬────────────────┬──────────────────┬─────────────────┘
  │          │              │                │                  │
  │HTTP GET/POST/PATCH/PUT/DELETE requests (proxied)           │
  │          │              │                │                  │
  ▼          ▼              ▼                ▼                  ▼
 ┌──────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐
 │      │ │          │ │          │ │            │ │                  │
 │8001  │ │  8002    │ │  8003    │ │  8004      │ │  8005            │
 │      │ │          │ │          │ │            │ │                  │
 └──────┘ └──────────┘ └──────────┘ └────────────┘ └──────────────────┘
    │         │            │            │                 │
    │         │            │            │                 │
    ▼         ▼            ▼            ▼                 ▼
 ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
 │Patient │ │Doctors │ │Referral│ │Document│ │Notif.  │
 │Service │ │Service │ │Service │ │Service │ │Service │
 └────────┘ └────────┘ └────────┘ └────────┘ └────────┘


MICROSERVICES (FastAPI, SQLAlchemy, SQLite)
Each service implements the same pattern:

┌─────────────────────────────────────────┐
│ Service (e.g., Patient on 8001)         │
├─────────────────────────────────────────┤
│ main.py                                 │
│  • @app.get(), @app.post() endpoints   │
│  • DB session dependency injection      │
│  • Business logic                       │
│  • Swagger docs auto-generated          │
├─────────────────────────────────────────┤
│ models.py                               │
│  • SQLAlchemy ORM classes               │
│  • Table definitions                    │
│  • Relationships (e.g., Patient→Meds)  │
├─────────────────────────────────────────┤
│ schemas.py                              │
│  • Pydantic request/response models     │
│  • Validation, serialization            │
├─────────────────────────────────────────┤
│ db.py                                   │
│  • SQLAlchemy engine setup              │
│  • Session factory                      │
│  • get_db() dependency                  │
├─────────────────────────────────────────┤
│ seed.py                                 │
│  • Initial data (runs on startup)       │
│  • Populate tables if empty             │
├─────────────────────────────────────────┤
│ SQLite Database (patient.db, etc.)      │
│  • Local file in service container      │
│  • Auto-created on startup              │
│  • Seeded with test data                │
└─────────────────────────────────────────┘
```

## Service Details

### Patient Service (8001)
- **Endpoints:** `GET /patients`, `POST /patients`, `GET /patients/{id}`
- **Database:** `patient.db`
- **Models:** Patient, Allergy, ChronicCondition, Medication
- **Seed Data:** Sample patients with allergies, conditions, medications
- **Relationships:** One patient → many allergies, conditions, medications

### Doctors Service (8002)
- **Endpoints:** `GET /doctors`, `POST /doctors`, `GET /doctors/{id}`
- **Database:** `doctor.db`
- **Models:** Doctor, Specialization
- **Seed Data:** Sample doctors with specialties
- **No external dependencies**

### Referral Service (8003)
- **Endpoints:** `GET /referrals`, `POST /referrals`, `GET /referrals/{id}`
- **Database:** `referral.db`
- **Models:** Referral, ReferralStatus
- **Seed Data:** Sample referrals
- **Inter-service calls:** Calls Doctor Service (8002) and Notification Service (8005) via HTTP
- **Files:** `clients.py` contains HTTP clients for external services

### Document Service (8004)
- **Endpoints:** `GET /documents`, `POST /documents`
- **Database:** `document.db`
- **Models:** Document
- **Seed Data:** Sample documents
- **No external dependencies**

### Notification Service (8005)
- **Endpoints:** `POST /send-notification`, `GET /notifications`
- **Database:** `notification.db`
- **Models:** Notification
- **Seed Data:** Sample notifications
- **No external dependencies**

## Data Flow Examples

### Example 1: Frontend Fetches Patient List
```
User Browser
    ↓ (GET http://localhost:4200/patients)
Angular Frontend
    ↓ (HTTP GET http://localhost:8000/api/patients)
API Gateway
    ↓ (HTTP GET http://localhost:8001/patients)
Patient Service
    ↓ (SQL query on patient.db)
SQLite Database
    ↓ (Returns list of patients)
Patient Service
    ↓ (Pydantic schema serialization → JSON)
API Gateway
    ↓ (Forwards response)
Angular Frontend
    ↓ (RxJS Observable resolution)
User Browser (Renders patient list)
```

### Example 2: Create a Referral
```
User fills out form in browser
    ↓ (POST http://localhost:8000/api/referrals with JSON body)
API Gateway
    ↓ (forwards to http://localhost:8003/referrals)
Referral Service
    ↓ (Validates with Pydantic schema)
    ├→ Makes HTTP call to Doctor Service (8002) to verify doctor exists
    ├→ Creates referral record in referral.db
    └→ Makes HTTP call to Notification Service (8005) to send notification
Referral Service returns 201 + referral object
    ↓
API Gateway
    ↓
Angular Frontend
    ↓
User Browser (Shows confirmation)
```

### Example 3: Service-to-Service Communication
```
Referral Service receives POST /referrals request
    ↓
clients.py: DoctorClient.get_doctor(doctor_id)
    ↓ (HTTP GET http://doctor-service:8002/doctors/{id})
Doctor Service (via Docker internal network)
    ↓
Returns doctor details
    ↓
Referral Service validates and proceeds
```

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | Angular | 18.2 | SPA, TypeScript, RxJS |
| Frontend Build | ng CLI | 18.2.21 | Webpack-based bundling |
| Frontend Testing | Karma + Jasmine | 6.4, 5.2 | DOM-based unit tests |
| Backend | FastAPI | 0.115 | Python ASGI framework |
| Backend Server | Uvicorn | 0.30.6 | ASGI server (async) |
| ORM | SQLAlchemy | 2.0.35 | Python SQL toolkit |
| Validation | Pydantic | 2.9.2 | Schema & validation |
| HTTP Client | httpx | (in FastAPI deps) | Async HTTP client |
| Database | SQLite | (bundled) | File-based, no setup needed |
| Container | Docker | (host) | Dockerfile per service |
| Orchestration | Docker Compose | (host) | docker-compose.yml |

## Deployment Architecture (Docker Compose)

```
┌─────────────────────────────────────────────────────────────┐
│ Docker Compose Network (internal DNS: service-name:port)   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ gateway:8000 │  │ patient:8001 │  │ doctors:8002 │ ...  │
│  │              │  │ (in container)│  │ (container)  │      │
│  │ Depends on   │  │              │  │              │      │
│  │ all services │  │ patient.db   │  │ doctor.db    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  Services reach each other via:                              │
│  http://service-name:port/endpoint                          │
│                                                               │
│  From host machine:                                          │
│  http://localhost:PORT/endpoint                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Deployment & Startup Sequence

```
Host Machine
    ↓
./start_all.sh
    ├─ docker compose up -d --build
    │  ├─ Build patient-service Dockerfile
    │  ├─ Build doctors-service Dockerfile
    │  ├─ Build referral-service Dockerfile
    │  ├─ Build document-service Dockerfile
    │  ├─ Build notification-service Dockerfile
    │  ├─ Build gateway Dockerfile
    │  └─ Start all containers, wait for startup
    │
    ├─ Wait for gateway health check (polls /api/doctors)
    │
    ├─ Check if frontend already running on :4200
    │  └─ If not, start ng serve (nohup in .run/frontend.log)
    │
    └─ Wait for frontend health check (polls /)

All services running and reachable
    ↓
Frontend at http://localhost:4200
Gateway at http://localhost:8000
Services at http://localhost:8001-8005
```

## Critical Dependencies & Failure Modes

| Failure | Impact | Recovery |
|---------|--------|----------|
| Gateway down | No frontend-to-service communication | `docker compose restart gateway` |
| Patient Service down | Cannot fetch/create patients | `docker compose restart patient-service` |
| Referral Service down | Cannot manage referrals; depends on Doctors + Notification | Restart referral service + verify Doctors and Notification are up |
| Frontend not running | Users cannot access UI | `cd frontend && npm install && npm start` |
| Port conflict (4200) | Cannot start frontend | Kill process on :4200: `lsof -ti:4200 \| xargs kill -9` |
| SQLite `.db` file missing | Service won't start or has no schema | Service will auto-create; seed data populates on first run |

## CORS & Security (Development)

- **Frontend origin:** `http://localhost:4200`
- **Gateway CORS policy:** Allows all methods/headers from localhost:4200
- **Production note:** Would need IP allowlist or token-based auth; currently open for local dev

## Development Workflow Integration

```
developer
    ├─ ./start_all.sh
    │
    ├─ Frontend changes
    │  └─ Auto-reload via ng serve (file watch)
    │
    ├─ Backend service changes
    │  └─ Manual: docker compose restart <service>
    │     or: Edit Dockerfile, docker compose build, docker compose up -d
    │
    ├─ Add dependency (Node)
    │  └─ Edit frontend/package.json, run npm install
    │
    ├─ Add dependency (Python)
    │  └─ Edit services/<service>/requirements.txt
    │     docker compose build <service>
    │     docker compose restart <service>
    │
    └─ ./stop.sh (cleanup)
```

