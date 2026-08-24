# ClinicCare - Startup Guide

This guide explains how to start all ClinicCare services (backend microservices + frontend) with a single command.

---

## Quick Start (TL;DR)

### Windows (PowerShell)
```powershell
.\start-all.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x start-all.sh
./start-all.sh
```

### Using Docker
```powershell
.\start-all.ps1 -Docker
# or
./start-all.sh --docker
```

Then open **http://localhost:4300** in your browser.

---

## Prerequisites

### Required
- **Python 3.9+** - [Install here](https://www.python.org/downloads/)
- **Node.js 18+** & **npm** - [Install here](https://nodejs.org/)
- **Git** (already installed)

### Optional
- **Docker & Docker Compose** - For container-based startup

### Verify Installation
```bash
python --version        # Should be 3.9+
npm --version          # Should be 8+
docker --version       # Optional
docker-compose --version  # Optional
```

---

## What The Scripts Do

Both `start-all.ps1` and `start-all.sh` perform these steps:

1. **Check Python environment** - Verify Python 3.9+ is installed
2. **Setup virtual environment** - Create/activate Python venv if needed
3. **Start 5 backend microservices**:
   - Patient Service (port 8001)
   - Doctors Service (port 8002)
   - Referral Service (port 8003)
   - Document Service (port 8004)
   - Notification Service (port 8005)
4. **Start API Gateway** (port 8000) - Routes requests to microservices
5. **Setup frontend dependencies** - Run `npm install` if needed
6. **Start Angular frontend** (port 4300) - Patient Portal web app
7. **Verify all services** - Check that everything is running
8. **Display summary** - Show all URLs and running processes

---

## Usage

### Windows PowerShell

#### Basic startup (all services + frontend)
```powershell
.\start-all.ps1
```

#### Start without frontend (backend only)
```powershell
.\start-all.ps1 -NoFrontend
```

#### Start with Docker Compose
```powershell
.\start-all.ps1 -Docker
```

#### Verbose output
```powershell
.\start-all.ps1 -Verbose
```

#### Combine options
```powershell
.\start-all.ps1 -NoFrontend -Verbose
```

### Linux/Mac Bash

#### Basic startup (all services + frontend)
```bash
./start-all.sh
```

#### Start without frontend (backend only)
```bash
./start-all.sh --no-frontend
```

#### Start with Docker Compose
```bash
./start-all.sh --docker
```

#### Combine options
```bash
./start-all.sh --no-frontend --docker
```

---

## Services & Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **API Gateway** | 8000 | http://localhost:8000 | Routes requests to microservices |
| **Patient Service** | 8001 | http://localhost:8001 | Patient authentication & profiles |
| **Doctors Service** | 8002 | http://localhost:8002 | Doctor information |
| **Referral Service** | 8003 | http://localhost:8003 | Referral & appointment management |
| **Document Service** | 8004 | http://localhost:8004 | Document upload/download |
| **Notification Service** | 8005 | http://localhost:8005 | Notifications & alerts |
| **Frontend (Angular)** | 4300 | http://localhost:4300 | Patient Portal web app |

---

## Verification

Once the script completes, all services should be running. You'll see output like:

```
════════════════════════════════════════════════════════
✨ All Services Started!
════════════════════════════════════════════════════════

Backend Services (API):
  📍 Gateway:           http://localhost:8000
  📍 Patient Service:   http://localhost:8001
  📍 Doctors Service:   http://localhost:8002
  📍 Referral Service:  http://localhost:8003
  📍 Document Service:  http://localhost:8004
  📍 Notification Svc:  http://localhost:8005

Frontend:
  🌐 Patient Portal:    http://localhost:4300

Running Processes (PIDs): 1234 5678 9012 ...
```

### Manual Verification

Test if services are running:
```bash
# Test each service
curl http://localhost:8000    # Gateway
curl http://localhost:8001    # Patient Service
curl http://localhost:8002    # Doctors Service
curl http://localhost:8003    # Referral Service
curl http://localhost:8004    # Document Service
curl http://localhost:8005    # Notification Service
```

Or visit in browser:
- Backend: http://localhost:8000/docs (Swagger documentation)
- Frontend: http://localhost:4300

---

## Accessing the Application

1. **Open your browser** and go to: **http://localhost:4300**
2. **Log in** with credentials (see test data)
3. **Explore** the Patient Portal

### Test Credentials
Check [TEST_DATA.md](./TEST_DATA.md) or look in the backend seed files for test patient/doctor data.

---

## Stopping Services

### Windows PowerShell
```powershell
# Kill all Python and Node processes
Get-Process python | Stop-Process -Force
Get-Process node | Stop-Process -Force
Get-Process ng | Stop-Process -Force

# Or manually close each terminal window
```

### Linux/Mac Bash
```bash
# Get list of running processes
ps aux | grep -E "(python|node|ng)"

# Kill specific processes
kill <PID>

# Or press Ctrl+C in the terminal running the script
```

### Using Docker
```powershell
docker-compose down
# or
docker-compose down -v  # Remove volumes too
```

---

## Troubleshooting

### "Port already in use" Error

If you get an error like "Address already in use: port 8000":

1. Find the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   
   # Linux/Mac
   lsof -i :8000
   ```

2. Kill the process:
   ```bash
   # Windows
   taskkill /PID <PID> /F
   
   # Linux/Mac
   kill -9 <PID>
   ```

3. Run the script again

### Python Not Found

If you see `python: command not found`:

1. Install Python 3.9+ from [python.org](https://www.python.org/downloads/)
2. Add Python to PATH (Windows installer has checkbox for this)
3. Restart terminal and try again

### npm Packages Not Installing

If frontend setup fails:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
cd ..
```

Then run the startup script again.

### Services Keep Crashing

Check the service logs:

1. **Windows**: Open the service window to see error messages
2. **Linux/Mac**: Run with `--verbose` flag
3. Check if Python dependencies are installed:
   ```bash
   pip list
   pip install -r requirements.txt
   ```

### Frontend Not Loading

If http://localhost:4300 shows an error:

1. Check that npm install completed successfully
2. Check for errors in the frontend terminal
3. Try clearing browser cache (Ctrl+Shift+Delete)
4. Restart the frontend: Stop script and run `npm start` in `frontend/` directory

---

## Advanced Usage

### Start Services Individually (Manual)

If you prefer to start services manually:

```bash
# Terminal 1: Patient Service
cd services/patient
python -m uvicorn main:app --reload --port 8001

# Terminal 2: Doctors Service
cd services/doctors
python -m uvicorn main:app --reload --port 8002

# Terminal 3: Referral Service
cd services/referral
python -m uvicorn main:app --reload --port 8003

# Terminal 4: Document Service
cd services/document
python -m uvicorn main:app --reload --port 8004

# Terminal 5: Notification Service
cd services/notification
python -m uvicorn main:app --reload --port 8005

# Terminal 6: Gateway
cd gateway
python -m uvicorn main:app --reload --port 8000

# Terminal 7: Frontend
cd frontend
npm start
```

### View Live Logs

Each service window shows real-time logs of requests and errors.

### Modify Environment Variables

Edit the startup script to add environment variables:

**Windows (start-all.ps1)**:
```powershell
$env:DEBUG = "true"
$env:LOG_LEVEL = "INFO"
```

**Linux/Mac (start-all.sh)**:
```bash
export DEBUG=true
export LOG_LEVEL=INFO
```

---

## Docker Compose

For a fully containerized setup without installing Python/Node locally:

```bash
./start-all.ps1 -Docker
# or
./start-all.sh --docker
```

This uses `docker-compose.yml` to start all services in containers.

---

## Next Steps

1. ✅ Run the startup script
2. ✅ Wait for all services to start (~10-15 seconds)
3. ✅ Open http://localhost:4300 in browser
4. ✅ Log in with test credentials
5. ✅ Explore the Patient Portal
6. ✅ Check API endpoints at http://localhost:8000/docs

---

## Getting Help

If you encounter issues:

1. Check **Troubleshooting** section above
2. Review logs in service terminal windows
3. Verify all prerequisites are installed
4. Check [STATUS.md](./STATUS.md) for known issues
5. Contact the ClinicCare team

---

## Project Structure

```
ClinicCare/
├── start-all.ps1          ← Windows startup script
├── start-all.sh           ← Linux/Mac startup script
├── docker-compose.yml     ← Docker Compose config
├── gateway/               ← API Gateway (port 8000)
├── services/
│   ├── patient/           ← Patient Service (port 8001)
│   ├── doctors/           ← Doctors Service (port 8002)
│   ├── referral/          ← Referral Service (port 8003)
│   ├── document/          ← Document Service (port 8004)
│   └── notification/      ← Notification Service (port 8005)
└── frontend/              ← Angular Patient Portal (port 4300)
```

---

**Last Updated**: 2026-08-20  
**Status**: Ready for use
