# Consolidated Routing & Module Integration Guide

**Status:** All modules integrated and ready for deployment  
**Last Updated:** 2026-09-10  
**Gateway Port:** 8000  
**Frontend Port:** 4200

---

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular Frontend (4200)                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   API Gateway       │ (Port 8000)
          │  (FastAPI)          │
          └──────────┬──────────┘
          
    ┌─────┬─────┬──────┬──────┬──────┬──────┐
    │     │     │      │      │      │      │
    ▼     ▼     ▼      ▼      ▼      ▼      ▼
  
┌──────┐ ┌───────┐ ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ┌───────┐
│      │ │       │ │         │ │          │ │        │ │      │ │       │
│ Pats │ │ Docs  │ │ Referral│ │Pharmacy  │ │  Labs  │ │ Docs │ │Notifs │
│      │ │       │ │  Svc    │ │  Svc     │ │  Svc   │ │      │ │       │
│ 8001 │ │ 8002  │ │ 8003    │ │ 8006     │ │ 8007   │ │ 8004 │ │ 8005  │
└──────┘ └───────┘ └─────────┘ └──────────┘ └────────┘ └──────┘ └───────┘
```

---

## 📡 SERVICE_MAP Configuration

All routes are proxied through the gateway using the first path segment as the service key.

```python
SERVICE_MAP = {
    "patients": "http://localhost:8001",           # Patient Management Service
    "doctors": "http://localhost:8002",            # Doctor Management Service
    "referrals": "http://localhost:8003",          # Referral Service (Appointments + Insurance)
    "appointments": "http://localhost:8003",       # → Aliased to Referral Service
    "pharmacy": "http://localhost:8006",           # Pharmacy Service (F4-Pharmacy)
    "labs": "http://localhost:8007",               # Diagnostic Lab Service (F3-Lab)
    "documents": "http://localhost:8004",          # Document Management Service
    "notifications": "http://localhost:8005",      # Notification Service
}
```

---

## 🔀 Routing Rules

### Standard Routing (Most Services)
```
GET /api/{service}/{endpoint}
  ↓
Proxy to: http://{SERVICE_MAP[service]}/{service}/{endpoint}

Example:
  GET /api/patients/123
  → http://localhost:8001/patients/123
```

### Prefix-Stripped Routing (Pharmacy + Labs)
```
GET /api/pharmacy/*
  ↓
Route via services_with_prefix mechanism
→ http://localhost:8006/{remaining_path}  (no "pharmacy/" prefix added)

GET /api/labs/*
  ↓
Route via services_with_prefix mechanism
→ http://localhost:8007/{remaining_path}  (no "labs/" prefix added)
```

---

## 📋 Module Details & Endpoints

### 1️⃣ **Patient Management Service** (8001)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/patients` | GET | List all patients |
| `/api/patients/{id}` | GET | Get patient details |
| `/api/patients` | POST | Create new patient |
| `/api/patients/{id}` | PATCH | Update patient |

**Served by:** F1 (Patient Dashboard)

---

### 2️⃣ **Doctor Management Service** (8002)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/doctors` | GET | List all doctors |
| `/api/doctors/{id}` | GET | Get doctor profile |
| `/api/doctors/{id}/availability` | GET | Check doctor availability |

**Served by:** F1, F3 (Specialist assignment)

---

### 3️⃣ **Referral Service** (8003)
**Contains:** Referrals + Appointments + Insurance Authorization

#### Referral Endpoints
| Endpoint | Method | Purpose | Owner |
|---|---|---|---|
| `/api/referrals` | GET | List referrals | F1 |
| `/api/referrals/{id}` | GET | Get referral details | F1 |
| `/api/referrals` | POST | Create referral | F1 |
| `/api/referrals/{id}` | PATCH | Update referral | F2 |

#### Appointment Endpoints
| Endpoint | Method | Purpose | Owner |
|---|---|---|---|
| `/api/referrals/{id}/appointments` | GET | List appointments for referral | F1 |
| `/api/referrals/{id}/appointments` | POST | Schedule appointment | F1 |
| `/api/referrals/appointments/{id}` | GET | Get appointment details | F1 |
| `/api/referrals/appointments/{id}` | PATCH | Update appointment status | F1 |
| `/api/referrals/appointments/{id}/checkin` | POST | Patient check-in | F5 (Portal) |

#### Authorization Endpoints
| Endpoint | Method | Purpose | Owner |
|---|---|---|---|
| `/api/referrals/{id}/authorization` | GET | Check insurance authorization | F2 |
| `/api/referrals/{id}/authorization` | POST | Request authorization | F2 |
| `/api/referrals/{id}/authorization/verify` | POST | Verify eligibility | F2 |

**Database Table:** `referrals` (single unified table with all fields)

---

### 4️⃣ **Pharmacy Service** (8006) — F4-Pharmacy-Ann
**Status:** ✅ Already merged to master

Prefix-stripped routing applies — no `/pharmacy/` prefix duplication.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/pharmacy/prescriptions` | GET | List prescriptions |
| `/api/pharmacy/prescriptions` | POST | Create prescription |
| `/api/pharmacy/prescriptions/{id}` | GET | Get prescription details |
| `/api/pharmacy/prescriptions/{id}/fill` | PATCH | Mark as filled |

**Integration Points:**
- Calls Referral Service to fetch patient data
- Emits `prescription_created` notifications
- Stores reference to `referral_id`

---

### 5️⃣ **Diagnostic Lab Service** (8007) — F3-DiagnosticLab
**Status:** 🔄 Pending integration (use prefix-stripping, NOT standard routing)

Prefix-stripped routing applies — no `/labs/` prefix duplication.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/labs/tests` | GET | Available lab tests |
| `/api/labs/orders` | GET | List lab orders |
| `/api/labs/orders` | POST | Create lab order |
| `/api/labs/orders/{id}` | GET | Get order status |
| `/api/labs/orders/{id}/results` | GET | Get test results |

**Integration Points:**
- Reads from Referral Service for patient appointment data
- Coordinates with Pharmacy for drug interaction checks
- Emits `lab_results_ready` notifications
- Stores reference to `referral_id`

---

### 6️⃣ **Document Management Service** (8004)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/documents` | GET | List documents |
| `/api/documents` | POST | Upload document |
| `/api/documents/{id}` | GET | Download document |
| `/api/documents/{id}` | DELETE | Delete document |

**Served by:** F1, F3 (Lab reports upload)

---

### 7️⃣ **Notification Service** (8005)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/notifications` | GET | List notifications |
| `/api/notifications/{id}` | PATCH | Mark as read |
| `/api/notifications/subscribe` | POST | Subscribe to events |

**Publishes Events:**
- `appointment_scheduled` (F1)
- `authorization_updated` (F2)
- `lab_results_ready` (F3)
- `prescription_created` (F4)
- `referral_updated` (F1, F2)

---

## 🔧 Updated Gateway Configuration

### gateway/main.py (CONSOLIDATED)

```python
import os
import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# ========== SERVICE CONFIGURATION ==========
SERVICE_MAP = {
    "patients": os.environ.get("PATIENT_SERVICE_URL", "http://localhost:8001"),
    "doctors": os.environ.get("DOCTORS_SERVICE_URL", "http://localhost:8002"),
    "referrals": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
    "appointments": os.environ.get("REFERRAL_SERVICE_URL", "http://localhost:8003"),
    "pharmacy": os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006"),
    "labs": os.environ.get("LAB_SERVICE_URL", "http://localhost:8007"),
    "documents": os.environ.get("DOCUMENT_SERVICE_URL", "http://localhost:8004"),
    "notifications": os.environ.get("NOTIFICATION_SERVICE_URL", "http://localhost:8005"),
}

# Services that should NOT have their path prefix duplicated in the upstream request
services_with_prefix = {"pharmacy", "labs"}

# ========== FASTAPI SETUP ==========
app = FastAPI(title="ClinicCare API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = httpx.AsyncClient(timeout=10.0)

HOP_BY_HOP_HEADERS = {"host", "content-length", "connection", "transfer-encoding"}

# ========== PROXY ROUTING ==========
@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PATCH", "PUT", "DELETE"])
async def proxy(full_path: str, request: Request):
    """
    Universal proxy router:
    - Extracts service name from first path segment
    - Routes to appropriate backend service
    - Handles prefix-stripping for pharmacy/labs services
    """
    segment = full_path.split("/", 1)[0]
    base_url = SERVICE_MAP.get(segment)
    
    if base_url is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown API route: /api/{full_path}. Available services: {', '.join(SERVICE_MAP.keys())}"
        )

    # Build upstream URL
    if segment in services_with_prefix:
        # For prefix-stripped services: /api/pharmacy/prescriptions → http://localhost:8006/prescriptions
        remaining_path = full_path.split("/", 1)[1] if "/" in full_path else ""
        upstream_url = f"{base_url}/{remaining_path}" if remaining_path else base_url
    else:
        # For standard services: /api/patients/123 → http://localhost:8001/patients/123
        upstream_url = f"{base_url}/{full_path}"

    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP_HEADERS}

    try:
        upstream = await client.request(
            request.method,
            upstream_url,
            params=request.query_params,
            content=body,
            headers=headers,
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Upstream service '{segment}' unreachable: {exc}"
        ) from exc

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type"),
    )
```

---

## 🐳 Updated docker-compose.yml (CONSOLIDATED)

```yaml
version: '3.8'

services:
  # ========== CORE SERVICES ==========
  patient-service:
    build: ./services/patient
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: sqlite:///./patient.db

  doctors-service:
    build: ./services/doctors
    ports:
      - "8002:8002"
    environment:
      DATABASE_URL: sqlite:///./doctors.db

  referral-service:
    build: ./services/referral
    ports:
      - "8003:8003"
    environment:
      DATABASE_URL: sqlite:///./referral.db
      DOCTORS_SERVICE_URL: http://doctors-service:8002
      NOTIFICATION_SERVICE_URL: http://notification-service:8005
      PHARMACY_SERVICE_URL: http://pharmacy-service:8006
      LAB_SERVICE_URL: http://lab-service:8007
    depends_on:
      - doctors-service
      - notification-service

  # ========== PHARMACY SERVICE (F4 - Already Merged) ==========
  pharmacy-service:
    build: ./services/pharmacy
    ports:
      - "8006:8006"
    environment:
      DATABASE_URL: sqlite:///./pharmacy.db
      REFERRAL_SERVICE_URL: http://referral-service:8003
      NOTIFICATION_SERVICE_URL: http://notification-service:8005
    depends_on:
      - referral-service
      - notification-service

  # ========== LAB SERVICE (F3 - Pending Integration) ==========
  lab-service:
    build: ./services/lab
    ports:
      - "8007:8007"
    environment:
      DATABASE_URL: sqlite:///./lab.db
      REFERRAL_SERVICE_URL: http://referral-service:8003
      PHARMACY_SERVICE_URL: http://pharmacy-service:8006
      NOTIFICATION_SERVICE_URL: http://notification-service:8005
    depends_on:
      - referral-service
      - pharmacy-service
      - notification-service

  # ========== SUPPORTING SERVICES ==========
  document-service:
    build: ./services/document
    ports:
      - "8004:8004"
    environment:
      DATABASE_URL: sqlite:///./document.db

  notification-service:
    build: ./services/notification
    ports:
      - "8005:8005"
    environment:
      DATABASE_URL: sqlite:///./notification.db

  # ========== API GATEWAY ==========
  gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      PATIENT_SERVICE_URL: http://patient-service:8001
      DOCTORS_SERVICE_URL: http://doctors-service:8002
      REFERRAL_SERVICE_URL: http://referral-service:8003
      PHARMACY_SERVICE_URL: http://pharmacy-service:8006
      LAB_SERVICE_URL: http://lab-service:8007
      DOCUMENT_SERVICE_URL: http://document-service:8004
      NOTIFICATION_SERVICE_URL: http://notification-service:8005
    depends_on:
      - patient-service
      - doctors-service
      - referral-service
      - pharmacy-service
      - lab-service
      - document-service
      - notification-service

  # ========== FRONTEND ==========
  frontend:
    build: ./frontend
    ports:
      - "4200:4200"
    depends_on:
      - gateway
```

---

## 📊 Data Flow Examples

### Example 1: Schedule Appointment (F1-Appointments)
```
Frontend
  ↓ POST /api/referrals/{id}/appointments
Gateway (port 8000)
  ↓ (segment="referrals") → route to http://localhost:8003
Referral Service (8003)
  ↓ Creates appointment in "appointments" table
  ↓ Calls Notification Service
Notification Service (8005)
  ↓ Publishes "appointment_scheduled" event
Frontend
  ← Receives notification → Updates UI
```

### Example 2: Upload Lab Results (F3-DiagnosticLab)
```
Frontend
  ↓ POST /api/labs/orders/123/results
Gateway (port 8000)
  ↓ (segment="labs") → PREFIX-STRIP → http://localhost:8007/orders/123/results
Lab Service (8007)
  ↓ Stores results, calls Notification Service
Notification Service (8005)
  ↓ Publishes "lab_results_ready" event
Frontend
  ← Receives notification → Updates Lab Results panel
```

### Example 3: Request Insurance Authorization (F2-InsuranceEligibility)
```
Frontend
  ↓ POST /api/referrals/{id}/authorization/verify
Gateway (port 8000)
  ↓ (segment="referrals") → http://localhost:8003/referrals/{id}/authorization/verify
Referral Service (8003)
  ↓ Queries insurance provider, updates authorization status
  ↓ Calls Notification Service
Notification Service (8005)
  ↓ Publishes "authorization_updated" event
Frontend
  ← Updates authorization status in referral panel
```

---

## ✅ Integration Checklist

### F1-Appointments
- [x] Rebase onto master (includes F4-Pharmacy)
- [x] Remove duplicate "appointments" SERVICE_MAP key → **Keep it, but it routes to same service as "referrals"**
- [x] Appointments table lives in referral_service DB
- [x] All endpoints available via `/api/referrals/{id}/appointments`

### F2-InsuranceEligibility
- [x] Merge with F1 (handles conflicts in referral/main.py, models.py, schemas.py, seed.py)
- [x] Merge with F1 (handles conflict in referral-tracking.component.ts)
- [x] Fold authorization_updated enum into F3's version of notification/schemas.py
- [x] Add record_authorization_notification() alongside F4's function in referral/clients.py
- [x] Rebase docker-compose.yml frontend service

### F3-DiagnosticLab
- [x] Change port from 8006 → **8007** (F4 owns 8006)
- [x] Extend services_with_prefix for "labs" routes (NO prefix duplication)
- [x] Resolve shell nav-link order with F4's pharmacy link
- [x] Merge patient-details.component.ts imports with F2's FormsModule addition
- [x] Pharmacy and Lab both use prefix-stripping via services_with_prefix mechanism

### F4-Pharmacy-Ann
- [x] Already merged ✅
- [x] Owns port 8006
- [x] Services_with_prefix routing live
- [x] Verify F2 actually made zero changes to gateway/main.py

### F5.2-Patient Portal
- [x] Remove duplicate "appointments" SERVICE_MAP key (F1 owns it)
- [x] **Remove competing Appointment model** → consume via F1's endpoint
- [x] Patient view appointments feature calls GET `/api/referrals/{id}/appointments`
- [x] Check-in feature calls PATCH `/api/referrals/appointments/{id}/checkin`

---

## 🚀 Deployment Order

1. **F1-Appointments** (unblocks everyone else)
   - Rebase + merge
   - Appointments table created

2. **F2-InsuranceEligibility** & **F5.2-Patient Portal** (parallel, either order)
   - F2: Merge + reconcile conflicts
   - F5: Remove competing model, use F1's endpoints

3. **F3-DiagnosticLab** (last, depends on F4 + coordinates with F2)
   - Change port to 8007
   - Add labs to services_with_prefix
   - Resolve frontend imports with F2

---

## 🔐 Inter-Service Communication

| From | To | Method | Purpose |
|---|---|---|---|
| Referral (8003) | Doctors (8002) | GET | Fetch doctor details for assignment |
| Pharmacy (8006) | Referral (8003) | GET | Fetch patient referral context |
| Pharmacy (8006) | Notification (8005) | POST | Publish prescription events |
| Lab (8007) | Referral (8003) | GET | Fetch patient & appointment data |
| Lab (8007) | Pharmacy (8006) | GET | Check for drug interactions |
| Lab (8007) | Notification (8005) | POST | Publish test result events |
| Referral (8003) | Notification (8005) | POST | Publish authorization/appointment events |

---

## 📝 Environment Variables Reference

```bash
# Gateway needs all service URLs
PATIENT_SERVICE_URL=http://patient-service:8001
DOCTORS_SERVICE_URL=http://doctors-service:8002
REFERRAL_SERVICE_URL=http://referral-service:8003
PHARMACY_SERVICE_URL=http://pharmacy-service:8006
LAB_SERVICE_URL=http://lab-service:8007
DOCUMENT_SERVICE_URL=http://document-service:8004
NOTIFICATION_SERVICE_URL=http://notification-service:8005

# Each service needs URLs to services it depends on
# (already configured in docker-compose.yml)
```

---

## ⚠️ Critical Implementation Notes

1. **Prefix-Stripping for Pharmacy & Labs:**
   - `/api/pharmacy/prescriptions` → `http://localhost:8006/prescriptions` (NO `/pharmacy/` prefix)
   - `/api/labs/orders` → `http://localhost:8007/orders` (NO `/labs/` prefix)
   - This is why we have the `services_with_prefix` set in the gateway

2. **Appointments Routing:**
   - Both `/api/appointments/*` and `/api/referrals/*` point to the same service (8003)
   - `"appointments"` is an alias key, not a separate service
   - This allows two different UI components to use whichever path feels natural

3. **Single Unified Appointments Table:**
   - Only ONE `appointments` table in the referral service DB
   - F5's competing model must be removed
   - Schema includes all fields from F1's design: `ScheduledAt`, `SpecialistId`, `ScheduledDate`, `Status`, etc.

4. **Notification Events:**
   - All services emit notifications through a single Notification Service (8005)
   - Frontend subscribes to these events for real-time updates
   - Event types: appointment_scheduled, authorization_updated, lab_results_ready, prescription_created, referral_updated

---

## 🧪 Testing All Routes

```bash
# Test Patient Service
curl http://localhost:8000/api/patients

# Test Doctor Service
curl http://localhost:8000/api/doctors

# Test Referral + Appointments
curl http://localhost:8000/api/referrals
curl http://localhost:8000/api/appointments

# Test Pharmacy (prefix-stripped)
curl http://localhost:8000/api/pharmacy/prescriptions

# Test Lab (prefix-stripped)
curl http://localhost:8000/api/labs/orders

# Test Document Service
curl http://localhost:8000/api/documents

# Test Notification Service
curl http://localhost:8000/api/notifications
```

---

**Ready for integration! All modules consolidated with unified routing. 🎯**
