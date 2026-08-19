# ClinicCare - Docker & Python Installation Guide for Windows

## 🚀 Quick Start (2-Step Installation)

### Step 1: Install Docker Desktop for Windows

#### Download
1. Visit: https://www.docker.com/products/docker-desktop
2. Click "Download for Windows"
3. Choose: **"Docker Desktop Installer.exe"**

#### Install
```bash
# Run the installer
# You'll see this in your Downloads folder
Docker Desktop Installer.exe

# During installation:
1. Accept license agreement
2. Check "Install required Windows components for WSL 2"
3. Click "Install"
4. System will prompt to restart - click "Close and restart"
5. After restart, Docker starts automatically
```

#### Verify Installation
```powershell
# Open PowerShell and run:
docker --version
docker run hello-world

# You should see:
# Docker version 20.x.x, build xxxx
# Hello from Docker!
```

#### Enable Docker Daemon
```powershell
# Docker Desktop should auto-start, but if not:
# 1. Search for "Docker Desktop" in Windows Start Menu
# 2. Click to launch
# 3. Wait for Docker icon to appear in system tray
# 4. Right-click Docker icon → Verify "Docker is running"
```

---

### Step 2: Install Python 3.11+

#### Option A: Direct Download (Recommended)
1. Visit: https://www.python.org/downloads/
2. Click "Download Python 3.11.x" (or latest 3.x)
3. Run the installer:
   ```
   python-3.11.x-amd64.exe
   ```

#### During Installation:
```
⚠️ IMPORTANT: Check this box:
☑ Add Python to PATH

Then click:
- [Install Now]  (for quick install)
OR
- [Customize Installation] (for more control)
```

#### Verify Python Installation
```powershell
# Open PowerShell and run:
python --version
pip --version

# You should see:
# Python 3.11.x
# pip x.x.x from C:\Python311\lib\site-packages\pip (python 3.11)
```

#### Verify pip Works
```powershell
pip list

# Should show installed packages
```

---

## ✅ Complete Environment Setup

Once Docker and Python are installed, verify everything is ready:

```powershell
# Change to ClinicCare directory
cd C:\git\ClinicCare

# Check all services are configured
docker compose config

# You should see all 6 services:
# - patient-service
# - doctors-service
# - referral-service
# - document-service
# - notification-service
# - pharmacy-service  ← NEW!
# - gateway
```

---

## 🎯 Running the Application

### Start Everything
```powershell
# From C:\git\ClinicCare
./start_all.sh

# This script will:
# 1. Build Docker images for all services
# 2. Start containers (may take 30-60 seconds)
# 3. Wait for gateway to be healthy
# 4. Start Angular dev server
# 5. Keep running in foreground

# Output will show:
# ==> Building and starting backend containers...
# Creating network "cliniccare_default"
# Creating cliniccare-patient-service...
# Creating cliniccare-doctors-service...
# Creating cliniccare-pharmacy-service...  ← NEW!
# ...
# ==> Frontend dev server starting...
# ✓ Compiled successfully.
# ✓ Application bundle generated successfully.
```

### Wait for Services to Start
```
The services will report when ready:
- Patient Service ready on port 8001
- Doctors Service ready on port 8002
- Referral Service ready on port 8003
- Document Service ready on port 8004
- Notification Service ready on port 8005
- Pharmacy Service ready on port 8006  ← NEW!
- API Gateway healthy on port 8000
- Frontend ready on port 4200
```

---

## 🌐 Access the Application

Once `./start_all.sh` completes:

### Frontend
- **URL:** http://localhost:4200
- **Login:** (Demo user auto-logged in)
- **Navigation:** Top bar shows: Dashboard | Patients | Referrals | Documents | **Pharmacy** ← NEW!

### Backend APIs (for testing)

#### API Gateway (Swagger UI)
- **URL:** http://localhost:8000/docs
- **Test:** Try GET /api/patients
- **Note:** All requests route through this gateway

#### Pharmacy Service (Swagger UI)
- **URL:** http://localhost:8006/docs
- **Endpoints:** All pharmacy endpoints with test interface
- **Test Database:** Uses seeded data (10 medications, 5 prescriptions)

#### Other Services
- Patient: http://localhost:8001/docs
- Doctors: http://localhost:8002/docs
- Referrals: http://localhost:8003/docs
- Documents: http://localhost:8004/docs
- Notifications: http://localhost:8005/docs

---

## 🧪 Testing the Pharmacy Feature

### Full Workflow Test

1. **Open Frontend**
   ```
   http://localhost:4200
   ```

2. **Navigate to Referrals**
   ```
   Click "Referrals" in navigation
   ```

3. **Create a Referral**
   ```
   Click "New Referral" button
   - Patient: Patient #1
   - Referring Doctor: Doctor #1
   - Specialist: Doctor #2
   - Reason: "Consultation"
   - Priority: Routine
   Click "Create"
   ```

4. **Submit Referral**
   ```
   Find the referral you just created
   Click "Submit" button
   Status changes: Draft → Submitted
   ```

5. **Accept Referral**
   ```
   Click "Accept" button
   Status changes: Submitted → Accepted
   
   🎉 Behind the scenes:
   - Pharmacy service receives webhook
   - Automatically creates Prescription #1
   ```

6. **View Pharmacy Dashboard**
   ```
   Click "Pharmacy" in navigation
   http://localhost:4200/pharmacy/dashboard
   
   You should see:
   - Pending Prescriptions: 3+ (includes new one)
   - Low Stock Items: 3
   - Recent Prescriptions Table
   - Low Stock Alerts
   ```

7. **View Prescriptions**
   ```
   Click "View All Prescriptions"
   http://localhost:4200/pharmacy/prescriptions
   
   Filter and search prescriptions
   ```

8. **Dispense Medication**
   ```
   Click on a prescription ID
   http://localhost:4200/pharmacy/prescriptions/1
   
   - See prescription details
   - See Medications list
   - Fill Dispense Form:
     * Select Medication #1
     * Enter Quantity: 5
     * Click "Dispense Medication"
   
   ✓ Success! You should see:
   - "Medication dispensed successfully"
   - Inventory decreases
   - Dispensing record created
   - Patient medication list updated
   ```

---

## 🛑 Stop the Application

```powershell
# From C:\git\ClinicCare
./stop.sh

# Or if on foreground:
# Press Ctrl+C to stop the dev server
# Then run:
docker compose down
```

---

## 🐛 Troubleshooting

### Docker Desktop Won't Start
```powershell
# Check if WSL 2 is properly installed
wsl --version

# If error, install WSL 2:
# 1. Open PowerShell as Administrator
# 2. Run: wsl --install
# 3. Restart your computer
# 4. Try Docker again
```

### Python Not Found
```powershell
# If "python not found" after installation:
# 1. Restart PowerShell
# 2. Restart computer
# 3. Verify PATH: 
#    Settings → System → Environment Variables
#    Check PYTHON_PATH exists and points to Python folder
```

### Ports Already in Use
```powershell
# If error "Address already in use":
# Find what's using port (e.g., 8006):
netstat -ano | findstr :8006

# Kill the process:
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

### Services Won't Build
```powershell
# Clear Docker cache and rebuild:
docker system prune -a

# Then restart:
./start_all.sh
```

### Can't Connect to API
```powershell
# Check services are running:
docker compose ps

# Check logs:
docker compose logs pharmacy-service
docker compose logs gateway

# Wait longer (first start can take 2-3 minutes)
```

---

## 📋 System Requirements

- **CPU:** 4 cores minimum (8+ recommended)
- **RAM:** 8GB minimum (16GB recommended)
- **Disk:** 10GB free (for Docker images)
- **Windows:** Windows 10 Pro/Enterprise or Windows 11 (Home edition requires Pro for WSL 2)
- **Internet:** For downloading Docker images (~2GB total)

---

## 🎓 What Gets Installed

### Docker Desktop Includes:
- Docker Engine (containerization)
- Docker Compose (multi-container orchestration)
- Docker CLI (command-line interface)
- WSL 2 Integration (Windows Subsystem for Linux 2)

### Size: ~1.5 GB

### Python Installs:
- Python interpreter (3.11.x)
- pip (package manager)
- Standard library
- Virtual environment support

### Size: ~150 MB

---

## ✨ After Installation

Once everything is installed:

```powershell
# Change to project directory
cd C:\git\ClinicCare

# Start the entire stack
./start_all.sh

# Wait for "✓ Compiled successfully" message
# Then open: http://localhost:4200
# Navigate to: Pharmacy dashboard
# Test the workflow
```

---

## 🎉 Success Indicators

When everything is working:

1. ✅ Docker Desktop running (icon in system tray)
2. ✅ `docker --version` works in PowerShell
3. ✅ `python --version` works in PowerShell
4. ✅ `./start_all.sh` completes without errors
5. ✅ http://localhost:4200 loads in browser
6. ✅ "Pharmacy" link appears in top navigation
7. ✅ http://localhost:4200/pharmacy/dashboard loads
8. ✅ Pharmacy dashboard shows data

---

**Estimated Installation Time:** 15-20 minutes (including downloads)

Once installed, the application is ready to test! 🚀
