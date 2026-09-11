# ReferralIQ Phase 2 - Commands Reference

Complete command examples for running tests, starting services, testing APIs, and running validators.

---

## 🚀 Starting the Stack

### Start Everything (Frontend + All Backends)
```bash
./start_all.sh
```
Starts:
- API Gateway (port 8000)
- Patient Service (port 8001)
- Doctor Service (port 8002)
- Referral Service (port 8003)
- Document Service (port 8004)
- Notification Service (port 8005)
- Angular Frontend (port 4200)

### Stop Everything
```bash
./stop.sh
```

### Start Specific Services with Docker Compose
```bash
# Start only Referral Service + Gateway
docker compose up patient-service gateway

# Start all services and rebuild
docker compose up --build

# View logs for specific service
docker compose logs -f referral-service

# Enter service container shell
docker compose exec referral-service bash
```

---

## 🧪 Backend Tests (Python/Pytest)

### Run All Appointment Tests
```bash
cd services/referral
pytest test_appointments.py -v
```

### Run Specific Test
```bash
pytest test_appointments.py::test_create_appointment_success -v
```

### Run Tests with Coverage Report
```bash
pytest test_appointments.py -v --cov=. --cov-report=term-missing
```

### Generate HTML Coverage Report
```bash
pytest test_appointments.py --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

### Run Tests in Watch Mode (Auto-rerun on changes)
```bash
pytest-watch test_appointments.py -- -v
```

### Run Tests by Category
```bash
# Create appointments only
pytest test_appointments.py -k "test_create" -v

# Reschedule only
pytest test_appointments.py -k "test_reschedule" -v

# Complete/Cancel only
pytest test_appointments.py -k "test_complete or test_cancel" -v
```

---

## 🎯 Frontend Tests (Angular/Karma)

### Run All Frontend Tests
```bash
cd frontend
npm test
```

### Run Tests Once (No Watch)
```bash
npm test -- --watch=false
```

### Generate Coverage Report
```bash
npm test -- --code-coverage
# Coverage report in: coverage/frontend/index.html
```

### Run Tests with Headless Chrome (CI/CD)
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Run Specific Test File
```bash
npm test -- --include='**/appointment.service.spec.ts'
```

### Run Tests with Custom Karma Config
```bash
npm test -- --karma-config=karma.conf.js
```

---

## 🔍 API Testing (cURL)

### Create Appointment
```bash
curl -X POST http://localhost:8000/api/referrals/1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "ScheduledDate": "2026-08-20T14:00:00",
    "Location": "Dr. Smith Office, Room 201",
    "SpecialistId": 2
  }'
```

### List Appointments for Referral
```bash
curl http://localhost:8000/api/referrals/1/appointments
```

### Reschedule Appointment
```bash
curl -X PATCH http://localhost:8000/api/referrals/appointments/1/reschedule \
  -H "Content-Type: application/json" \
  -d '{
    "ScheduledDate": "2026-08-25T15:00:00",
    "Location": "New Location",
    "SpecialistId": 3
  }'
```

### Mark Appointment Complete
```bash
curl -X PATCH http://localhost:8000/api/referrals/appointments/1/complete \
  -H "Content-Type: application/json"
```

### Cancel Appointment
```bash
curl -X PATCH http://localhost:8000/api/referrals/appointments/1/cancel \
  -H "Content-Type: application/json"
```

### Test Error Cases

#### Create for Non-Accepted Referral (400)
```bash
curl -X POST http://localhost:8000/api/referrals/2/appointments \
  -H "Content-Type: application/json" \
  -d '{"ScheduledDate": "2026-08-20T14:00:00", "Location": "Office", "SpecialistId": 1}'
# Response: 400 "Appointment can only be created for Accepted referrals"
```

#### Create for Missing Referral (404)
```bash
curl -X POST http://localhost:8000/api/referrals/999/appointments \
  -H "Content-Type: application/json" \
  -d '{"ScheduledDate": "2026-08-20T14:00:00", "Location": "Office", "SpecialistId": 1}'
# Response: 404 "Referral 999 not found"
```

#### Reschedule Non-Scheduled Appointment (400)
```bash
# First complete the appointment
curl -X PATCH http://localhost:8000/api/referrals/appointments/1/complete

# Then try to reschedule
curl -X PATCH http://localhost:8000/api/referrals/appointments/1/reschedule \
  -H "Content-Type: application/json" \
  -d '{"ScheduledDate": "2026-08-25T15:00:00", "Location": "Office", "SpecialistId": 1}'
# Response: 400 "Cannot reschedule completed appointment"
```

---

## 🔧 Development Commands

### Run Frontend Dev Server Only
```bash
cd frontend
ng serve
# Visit: http://localhost:4200
```

### Build Frontend for Production
```bash
cd frontend
npm run build
# Output: frontend/dist/frontend/
```

### Lint Frontend Code
```bash
cd frontend
ng lint
```

### Format Code (Prettier)
```bash
cd frontend
npx prettier --write src/
```

### Run Backend Service Locally (Without Docker)
```bash
cd services/referral
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8003
```

---

## 📊 Validation & Agent Commands

### Run Appointment Validation Agent
```bash
# Via Claude Code CLI
claude agent validate-appointments

# Via prompt
"Run appointment-validation agent"
```

### Run Requirement Validator Agent
```bash
# Via Claude Code CLI
claude agent validate-requirements

# Via prompt
"Run requirement-validator agent"
```

### Check TypeScript Compilation
```bash
cd frontend
npx tsc --noEmit
```

### Check Linting Issues
```bash
cd frontend
ng lint
```

---

## 🗄️ Database Commands

### Reset Database (Delete All Data)
```bash
# Remove SQLite database files
rm services/referral/referral.db
rm services/patient/patient.db
# Restart services - they'll recreate and seed

docker compose restart
```

### View Database Contents (SQLite)
```bash
cd services/referral
sqlite3 referral.db

# In SQLite shell:
sqlite> SELECT * FROM referrals;
sqlite> SELECT * FROM appointments;
sqlite> .quit
```

### Seed Database Manually
```bash
cd services/referral
python -c "from seed import seed_if_empty; from db import SessionLocal; seed_if_empty(SessionLocal())"
```

---

## 🐛 Debugging Commands

### Enable Verbose Logging
```bash
# Backend
LOG_LEVEL=DEBUG python services/referral/main.py

# Frontend
ng serve --verbose

# Tests
pytest test_appointments.py -vv --log-cli-level=DEBUG
```

### Check Port Usage
```bash
# Windows
netstat -ano | findstr :<port>

# Linux/Mac
lsof -i :<port>
```

### Kill Process on Port
```bash
# Windows (PowerShell)
Stop-Process -Id <PID> -Force

# Linux/Mac
kill -9 <PID>
```

### Check Service Health
```bash
# API Gateway health
curl http://localhost:8000/docs

# Referral Service health
curl http://localhost:8003/docs

# Frontend check
curl http://localhost:4200
```

---

## 📋 Git Commands

### Check Status
```bash
git status
```

### Stage Changes
```bash
git add services/referral/
git add frontend/src/app/features/appointments/
git add frontend/src/app/core/
```

### Commit Changes
```bash
git commit -m "Implement Phase 2 Appointments Feature

- Add Appointment model with 9 fields
- Implement 6 API endpoints (create, list, reschedule, complete, cancel)
- Create appointment service with signal state
- Build appointment list and schedule form components
- Integrate into referral tracking screen
- Add 15 backend tests (82% coverage)
- Add 25 frontend test cases"
```

### View Recent Commits
```bash
git log --oneline -10
```

---

## 📦 Package Commands

### Update Frontend Dependencies
```bash
cd frontend
npm update
npm install
```

### Update Backend Dependencies
```bash
cd services/referral
pip install --upgrade -r requirements.txt
```

### Check for Vulnerabilities
```bash
# Frontend
npm audit

# Backend
pip-audit
```

---

## 🚢 Deployment Commands

### Build Docker Image
```bash
# Referral Service
docker build -t cliniccare/referral-service:1.0 services/referral/

# Frontend
docker build -t cliniccare/frontend:1.0 frontend/
```

### Push to Registry
```bash
docker push cliniccare/referral-service:1.0
docker push cliniccare/frontend:1.0
```

### Deploy with Docker Compose (Production)
```bash
docker compose -f docker-compose.yml up -d
```

---

## 📈 Performance Testing

### Load Test API
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/referrals/1/appointments

# Using hey
go get -u github.com/rakyll/hey
hey -n 1000 -c 10 http://localhost:8000/api/referrals/1/appointments
```

### Measure Response Time
```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/referrals/1/appointments
```

---

## ✅ Full Workflow Example

```bash
# 1. Start services
./start_all.sh

# 2. Wait for services to be ready
sleep 5

# 3. Run backend tests
cd services/referral
pytest test_appointments.py -v --cov=.

# 4. Run frontend tests
cd ../../frontend
npm test -- --watch=false

# 5. Test API manually
curl http://localhost:8000/api/referrals/1/appointments

# 6. Open UI in browser
# Navigate to http://localhost:4200

# 7. Run validators (via Claude Code)
# "Run appointment-validation agent"
# "Run requirement-validator agent"

# 8. Commit changes
git add .
git commit -m "Phase 2 Appointments Feature - Complete"

# 9. Stop services
cd ../..
./stop.sh
```

---

## 🔗 Useful Links

- Frontend: http://localhost:4200
- API Gateway Docs: http://localhost:8000/docs
- Referral Service Docs: http://localhost:8003/docs
- Coverage Report: `services/referral/htmlcov/index.html`

