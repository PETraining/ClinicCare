# ClinicCare Architecture Diagrams

**Visual Reference for All Module Integration** | 2026-09-10

---

## 1. Complete System Architecture

```
                      ╔═══════════════════════════════════╗
                      ║   Angular Frontend (4200)         ║
                      ║  Patient Dashboard & Features     ║
                      ║                                   ║
                      ║  • Referrals                 [F1] ║
                      ║  • Appointments              [F1] ║
                      ║  • Insurance Auth            [F2] ║
                      ║  • Lab Orders & Results      [F3] ║
                      ║  • Pharmacy Prescriptions    [F4] ║
                      ║  • Patient Portal            [F5] ║
                      ╚═══════════════════╤════════════════╝
                                          │
                                          │ HTTP/REST
                                          │
                      ┌─────────────────────┴──────────────────┐
                      │                                        │
                 ┌────▼────┐                                   │
                 │ API GW  │ (8000) ← Single entry point       │
                 │ FastAPI │                                   │
                 └────┬────┘                                   │
                      │                                        │
      ┌───────┬───────┼──────────┬────────────┬─────────────┬──────────┐
      │       │       │          │            │             │          │
      ▼       ▼       ▼          ▼            ▼             ▼          ▼
  ┌─────┐ ┌─────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
  │Pats │ │Docs │ │Referral│ │ Pharm  │ │  Lab   │ │  Docs   │ │  Notif   │
  │8001 │ │8002 │ │  8003  │ │ 8006   │ │ 8007   │ │ 8004    │ │  8005    │
  └─────┘ └─────┘ │        │ │        │ │        │ └─────────┘ └──────────┘
                   │ ⭐ HUB │ │ Rx     │ │ Tests  │
                   │        │ │ Mgmt   │ │ Mgmt   │
                   └────────┘ └────────┘ └────────┘
                   
                   [Core]    [F4]✅   [F3]🔄
                   [F1/F2]  [Merged] [Pending]
```

---

## 2. Detailed Request Flow: Appointment Creation

```
SCENARIO: Patient books appointment via referral
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Angular)                                          │
│ referral-tracking.component.ts                              │
│                                                             │
│ User clicks: "Schedule Appointment"                         │
│ Component calls:                                            │
│   POST /api/referrals/{referralId}/appointments             │
│         body: { date, doctorId, notes }                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST with payload
                     │
┌────────────────────▼────────────────────────────────────────┐
│ API GATEWAY (FastAPI) - Port 8000                           │
│                                                             │
│ @app.api_route("/api/{full_path:path}")                     │
│   full_path = "referrals/{referralId}/appointments"         │
│   segment = full_path.split("/", 1)[0] = "referrals"        │
│                                                             │
│ Gateway Logic:                                              │
│   ✓ Check SERVICE_MAP["referrals"]                          │
│     → "http://localhost:8003"                               │
│   ✓ NOT in services_with_prefix                             │
│   ✓ Build URL: http://localhost:8003/referrals/...         │
│   ✓ Forward headers, body, query params                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST to upstream
                     │
┌────────────────────▼────────────────────────────────────────┐
│ REFERRAL SERVICE - Port 8003                                │
│ services/referral/main.py                                   │
│                                                             │
│ @router.post("/appointments")                               │
│   Receives: POST /referrals/{id}/appointments               │
│            body: { date, doctorId, notes }                  │
│                                                             │
│ Steps:                                                      │
│   1. Validate referral exists                               │
│   2. Fetch doctor profile from Doctor Service (8002)        │
│   3. Check doctor availability                              │
│   4. Create Appointment record in DB:                       │
│      INSERT INTO appointments (                             │
│        referral_id, scheduled_date, specialist_id, status   │
│      ) VALUES (...)                                        │
│   5. Call Notification Service (8005):                      │
│      POST /notifications                                    │
│      body: {                                                │
│        event_type: "appointment_scheduled",                 │
│        referral_id, appointment_id, date                    │
│      }                                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌──────────┐           ┌────────────────┐
   │Response  │           │NOTIFICATION SVC│
   │200 OK    │           │ Port 8005       │
   │{id, ...} │           │                │
   └────┬─────┘           │Receives event: │
        │                 │appointment_    │
        │                 │scheduled       │
        │                 │                │
        │                 │Stores in DB    │
        │                 │Publishes via   │
        │                 │WebSocket/Event │
        │                 │Bus to Frontend │
        │                 └────────┬───────┘
        │                          │
        │                          │ Real-time event
        │                          │
        └──────────┬───────────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
        │ FRONTEND receives   │
        │ appointment_        │
        │ scheduled event     │
        │                     │
        │ Updates UI:         │
        │ ✓ Show success      │
        │ ✓ Refresh list      │
        │ ✓ Update calendar   │
        └─────────────────────┘
```

---

## 3. Request Flow: Lab Results Upload (Prefix-Stripping)

```
SCENARIO: Lab technician uploads test results
══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Angular)                                          │
│                                                             │
│ POST /api/labs/orders/lab123/results                        │
│      body: { resultFile, values, notes }                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     │
┌────────────────────▼────────────────────────────────────────┐
│ API GATEWAY (FastAPI) - Port 8000                           │
│                                                             │
│ full_path = "labs/orders/lab123/results"                    │
│ segment = "labs"  ← First path component                    │
│                                                             │
│ Gateway Logic:                                              │
│   ✓ Check SERVICE_MAP["labs"]                               │
│     → "http://localhost:8007"                               │
│   ✓ IS in services_with_prefix = {"pharmacy", "labs"}  ✓    │
│   ✓ Strip prefix:                                           │
│      remaining = full_path.split("/", 1)[1]                │
│      remaining = "orders/lab123/results"                    │
│   ✓ Build URL: http://localhost:8007/orders/lab123/results │
│   ✓ Forward headers, body, query params                     │
│                                                             │
│   ⚠️ CRITICAL: No "/labs/" duplication!                     │
│      ✓ Correct:   http://8007/orders/...                   │
│      ✗ Wrong:     http://8007/labs/orders/...              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST to upstream
                     │
┌────────────────────▼────────────────────────────────────────┐
│ LAB SERVICE - Port 8007                                     │
│ services/lab/main.py                                        │
│                                                             │
│ @router.post("/orders/{order_id}/results")                  │
│   Receives: POST /orders/lab123/results    ← No lab prefix  │
│             body: { resultFile, values }                   │
│                                                             │
│ Steps:                                                      │
│   1. Validate order exists                                  │
│   2. Store result file in Document Service (8004):          │
│      POST /api/documents                                    │
│      body: { file, orderId }                                │
│   3. Update order status in DB:                             │
│      UPDATE orders SET status = 'completed', result_url...  │
│   4. Check for drug interactions:                           │
│      GET /api/pharmacy/prescriptions?patient={patientId}    │
│   5. Publish results event:                                 │
│      POST http://localhost:8005/notifications               │
│      body: {                                                │
│        event_type: "lab_results_ready",                     │
│        order_id, patient_id, result_url                     │
│      }                                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────────┐
        │                              │
        ▼                              ▼
   ┌──────────┐               ┌──────────────────┐
   │Response  │               │ PHARMACY SERVICE │
   │200 OK    │               │ Port 8006         │
   │{id, ...} │               │                  │
   └────┬─────┘               │ Receives:        │
        │                     │ GET /pharmacy/   │
        │                     │  prescriptions   │
        │                     │                  │
        │                     │ Returns Rx list  │
        │                     └────┬─────────────┘
        │                          │
        │                    ┌─────▼──────┐
        │                    │ Check for   │
        │                    │ drug        │
        │                    │ interactions│
        │                    └──────┬──────┘
        │                           │
        │                           │ Results safe ✓
        │                           │
        └───────────┬───────────────┘
                    │
        ┌───────────▼──────────┐
        │ NOTIFICATION SERVICE │
        │  Port 8005           │
        │                      │
        │ Publishes event:     │
        │ lab_results_ready    │
        │                      │
        │ Broadcasts to        │
        │ frontend via WS      │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
        │ FRONTEND receives   │
        │ lab_results_ready   │
        │                     │
        │ Updates UI:         │
        │ ✓ Show results      │
        │ ✓ Alert patient     │
        │ ✓ Refresh panel     │
        └─────────────────────┘
```

---

## 4. Service Communication Network

```
                    ┌─────────────────────────────┐
                    │   REFERRAL SERVICE (8003)   │
                    │      ⭐ CENTRAL HUB ⭐      │
                    │                             │
                    │  • Referrals                │
                    │  • Appointments [F1]        │
                    │  • Authorization [F2]       │
                    └────────┬────────┬──────┬────┘
                             │        │      │
                    ┌────────┘        │      └────────┐
                    │                 │               │
                    ▼                 ▼               ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  DOCTORS     │  │  PHARMACY    │  │     LAB      │
            │  (8002)      │  │   (8006)     │  │   (8007)     │
            │              │  │              │  │              │
            │ Assign spec. │  │ Rx creation  │  │ Test orders  │
            │ Check avail. │  │ Fulfillment  │  │ Results      │
            └──────────────┘  └────┬─────────┘  └────┬─────────┘
                                   │                  │
                                   │                  │
                            ┌──────▼──────┐   ┌──────▼──────┐
                            │ Bi-directional interaction:    │
                            │                               │
                            │ Lab queries Pharmacy for Rx:  │
                            │  GET /pharmacy/prescriptions   │
                            │                               │
                            │ Pharmacy registers with Lab:  │
                            │  Drug interaction checks      │
                            └────────────────┬──────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                    │
                          ▼                                    ▼
                    ┌─────────────┐                      ┌──────────────┐
                    │NOTIFICATION │                      │  DOCUMENT    │
                    │  (8005)      │                      │  (8004)      │
                    │              │                      │              │
                    │ Publishes:   │                      │ Stores:      │
                    │ • apt_schedu │                      │ • Lab reports│
                    │ • auth_upd   │                      │ • Prescr.    │
                    │ • lab_ready  │                      │ • Referrals  │
                    │ • Rx_created │                      │ • Auth docs  │
                    │ • ref_upd    │                      │              │
                    └──────┬───────┘                      └──────────────┘
                           │
                           │ WebSocket/Events to Frontend
                           │
                           └──────────────► FRONTEND (4200)
```

---

## 5. Gateway Routing Decision Tree

```
                      Request arrives
                         GET /api/...
                            │
                            ▼
                    Extract first segment
                    segment = full_path.split("/")[0]
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
        segment =        segment =    segment =      ...
        "referrals"      "pharmacy"    "doctors"
              │                │           │
              │                │           │
       Check SERVICE_MAP   Check SERVICE_MAP  Check SERVICE_MAP
       "referrals" →        "pharmacy" →      "doctors" →
       "http://8003"        "http://8006"     "http://8002"
              │                │           │
              ▼                 ▼           ▼
        NOT in                  IN         NOT in
        prefix_strip?        prefix_strip? prefix_strip?
              │                 │           │
              │ YES            │ YES       │ YES
              ▼                 ▼           ▼
        
      Build standard      Strip prefix   Build standard
      URL:               from path:      URL:
      http://8003/       remaining =     http://8002/
      referrals/...      "prescriptions" doctors/...
      
      Send to Referral    http://8006/   Send to Doctors
      Service            prescriptions   Service
                         
                         Send to Pharmacy
                         Service
```

---

## 6. Integration Timeline

```
TIME ──────────────────────────────────────────────────────► 

PHASE 1 (WEEK 1)
F1-Appointments [████████] CRITICAL BLOCKER
  └─ Rebase → Merge Master
    └─ All downstream depends on this ✓

PHASE 2 (WEEK 2) ─ Parallel execution
F2-Insurance    [████████] F2-Insurance
F5-Portal       [████████] F5-Portal
  ├─ F2: Merge → Notifications integrated
  └─ F5: Merge → Consume F1's endpoints
  
PHASE 3 (WEEK 3)
F3-Lab          [████████] Lab Service
  ├─ Depends on F4 (Pharmacy) ✓
  ├─ Coordinates with F2 (imports)
  └─ Port 8007, Prefix-stripping live

PRODUCTION READY ─────────────► 🎉
  • All services deployed
  • Routing consolidated
  • Notifications coordinated
  • Frontend updated
```

---

## 7. Routing Examples Reference

```
REQUEST ROUTING QUICK REFERENCE
════════════════════════════════════════════════════════════════

STANDARD ROUTING (Most services)
─────────────────────────────────
GET /api/patients/123
  → Gateway: segment="patients"
  → SERVICE_MAP["patients"]="http://8001"
  → NOT in prefix_strip
  → http://8001/patients/123 ✓
  
GET /api/referrals/ref123/appointments
  → Gateway: segment="referrals"
  → SERVICE_MAP["referrals"]="http://8003"
  → NOT in prefix_strip
  → http://8003/referrals/ref123/appointments ✓

PREFIX-STRIPPED ROUTING (Pharmacy & Lab)
────────────────────────────────────────
GET /api/pharmacy/prescriptions
  → Gateway: segment="pharmacy"
  → SERVICE_MAP["pharmacy"]="http://8006"
  → IS in prefix_strip ✓
  → Strip "pharmacy/" from remaining path
  → http://8006/prescriptions ✓
  
POST /api/labs/orders/lab123/results
  → Gateway: segment="labs"
  → SERVICE_MAP["labs"]="http://8007"
  → IS in prefix_strip ✓
  → Strip "labs/" from remaining path
  → http://8007/orders/lab123/results ✓

ALIASED ENDPOINTS
─────────────────
GET /api/appointments
  → Gateway: segment="appointments"
  → SERVICE_MAP["appointments"]="http://8003" (alias to referral)
  → NOT in prefix_strip
  → http://8003/appointments ✓
  
GET /api/referrals/123/appointments
  → Gateway: segment="referrals"
  → SERVICE_MAP["referrals"]="http://8003"
  → NOT in prefix_strip
  → http://8003/referrals/123/appointments ✓
  
  [Both work! Same database, different entry points]
```

---

## 8. Service Dependency Graph

```
        ┌────────────────┐
        │   FRONTEND     │
        │   (4200)       │
        └────────┬───────┘
                 │
                 │ HTTP/REST + WebSocket
                 │
        ┌────────▼───────┐
        │   GATEWAY      │
        │   (8000)       │
        └───┬────────┬───────────────────────────┬──────────┐
            │        │                           │          │
            ▼        ▼                           ▼          ▼
        ┌─────┐  ┌────────┐              ┌──────────┐   ┌──────────┐
        │PATS │  │DOCTORS │              │REFERRALS │   │DOCUMENTS │
        │8001 │  │  8002  │              │ 8003     │   │  8004    │
        └─────┘  └────────┘              │ (HUB)    │   └──────────┘
                                         └──────────┘
                                             △  △  △
                                             │  │  └──────┐
                                    ┌────────┘  │         │
                                    │           │         │
                                    ▼           ▼         ▼
                              ┌──────────┐ ┌──────────┐ ┌───────────┐
                              │PHARMACY  │ │   LAB    │ │NOTIF SRVCS│
                              │  8006    │ │  8007    │ │   8005    │
                              └──────────┘ └────┬─────┘ └───────────┘
                                                │
                                    (Pharmacy ◄─┘
                                     checks
                                     drug inter.)

DEPENDENCY MATRIX:
               Depends On:
REFERRALS   →  DOCTORS, NOTIFICATION
PHARMACY    →  REFERRALS, NOTIFICATION
LAB         →  REFERRALS, PHARMACY, NOTIFICATION
NOTIFICATION→  (None - central hub)
DOCUMENTS   →  (None - independent)
DOCTORS     →  (None - reference data)
PATIENTS    →  (None - reference data)
```

---

## 9. Data Model: Unified Appointments Table

```
┌──────────────────────────────────────────────────────┐
│              APPOINTMENTS TABLE                      │
│          (Single source of truth in Referral DB)     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  id                 (PK)                             │
│  referral_id        (FK → referrals)                │
│  specialist_id      (FK → doctors)                  │
│  scheduled_date     (DateTime)                      │
│  status             (enum: pending, confirmed,     │
│                      in_progress, completed,       │
│                      cancelled)                    │
│  check_in_time      (DateTime, optional)            │
│  notes              (Text)                          │
│  created_at         (Timestamp)                     │
│  updated_at         (Timestamp)                     │
│                                                      │
├─ Access via Referral Service (8003)                │
│  ✓ POST   /referrals/{id}/appointments              │
│  ✓ GET    /referrals/{id}/appointments              │
│  ✓ GET    /referrals/appointments/{id}              │
│  ✓ PATCH  /referrals/appointments/{id}              │
│  ✓ PATCH  /referrals/appointments/{id}/checkin      │
│                                                      │
├─ Also accessible via alias                         │
│  ✓ POST   /appointments                             │
│  ✓ GET    /appointments                             │
│  ✓ GET    /appointments/{id}                        │
│  ✓ PATCH  /appointments/{id}                        │
│                                                      │
├─ Consumed by                                        │
│  • Patient Portal (F5): Read-only view              │
│  • Referral UI (F1): Full management                │
│  • Lab Service (F3): Check appointment for order    │
│  • Notification Service (8005): Event publishing    │
│                                                      │
│  ✗ NOT duplicated anywhere else                     │
│    (F5 must remove its competing model)             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 10. Event Publishing & Subscription Flow

```
                    SERVICE ACTIONS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Appointment        Authorization    Lab Results
   Scheduled          Requested        Ready
        │                │                │
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │                                 │
        │  Call Notification Service      │
        │  POST http://8005/notifications │
        │                                 │
        │  body: {                        │
        │    event_type: "apt_scheduled"  │
        │    referral_id: "ref123"        │
        │    payload: { ... }             │
        │  }                              │
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   NOTIFICATION SERVICE (8005)    │
        │                                  │
        │   Stores event in database       │
        │   Publishes via WebSocket/Event  │
        │   Bus to all subscribed clients  │
        └────────────────┬─────────────────┘
                         │
                         │ Real-time broadcast
                         │
        ┌────────────────▼─────────────────┐
        │                                  │
        │   FRONTEND receives event        │
        │   Updates UI components:         │
        │   • Refresh appointment list     │
        │   • Update status indicators     │
        │   • Show notifications           │
        │   • Alert patient               │
        │                                  │
        └──────────────────────────────────┘
```

---

**All diagrams reference the consolidated routing and module integration. See CONSOLIDATED_ROUTING_GUIDE.md for complete implementation details.** 📚

