# ⚡ Quick Start (5 Minutes to Running)

## 🎯 TL;DR

```bash
# 1. Install Docker & Python (one-time, 15-20 mins)
# 2. Run this command:
./start_all.sh

# 3. Open browser:
http://localhost:4200

# 4. Click "Pharmacy" link
# 5. See the dashboard!
```

---

## 📋 Checklist

### ✅ Prerequisites (Do Once)

- [ ] **Install Docker Desktop**
  - Download: https://www.docker.com/products/docker-desktop
  - Run installer
  - Restart computer
  - Verify: `docker --version` in PowerShell

- [ ] **Install Python 3.11+**
  - Download: https://www.python.org/downloads/
  - Run installer
  - ⚠️ **CHECK:** "Add Python to PATH"
  - Verify: `python --version` in PowerShell

### ✅ Start Application (Every Session)

- [ ] Open PowerShell
- [ ] Navigate: `cd C:\git\ClinicCare`
- [ ] Run: `./start_all.sh`
- [ ] Wait for: "✓ Compiled successfully" (~2-3 mins)
- [ ] Open: http://localhost:4200 in browser
- [ ] Click: "Pharmacy" in navigation

### ✅ Test Workflow (30 minutes)

1. [ ] **Create Referral** (Referrals → New)
2. [ ] **Submit Referral** (Status: Draft → Submitted)
3. [ ] **Accept Referral** (Status: Submitted → Accepted)
   - 🎉 Prescription auto-created behind scenes
4. [ ] **View Pharmacy Dashboard** (Click "Pharmacy")
5. [ ] **View Prescriptions** (Click "View All Prescriptions")
6. [ ] **View Prescription Detail** (Click prescription ID)
7. [ ] **Dispense Medication** (Fill form, click "Dispense")
8. [ ] **Verify Updates** (Check inventory & patient medications)

---

## 📞 Troubleshooting

### "docker: command not found"
```
→ Docker not installed or not in PATH
→ Restart PowerShell/Computer after installing Docker
→ Verify: docker --version
```

### "python: command not found"
```
→ Python not installed or not in PATH
→ Restart PowerShell/Computer after installing Python
→ Verify: python --version
→ Check Windows PATH: Settings → Environment Variables
```

### "Address already in use"
```
→ Another process using port 4200, 8000, or 8006
→ Kill process: taskkill /PID <PID> /F
→ OR: Stop all Docker containers: docker compose down
```

### Services won't start
```
→ Check Docker Desktop is running
→ Check Docker daemon: Right-click Docker icon → Settings
→ Clear cache: docker system prune -a
→ Try again: ./start_all.sh
```

### Application won't load
```
→ Wait 1-2 more minutes (first run is slower)
→ Check logs: docker compose logs
→ Check services: docker compose ps
→ Verify frontend: curl http://localhost:4200
```

---

## 🌐 Access Points

Once running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:4200 | Main app UI |
| **Pharmacy API** | http://localhost:8006/docs | Test pharmacy endpoints |
| **Gateway** | http://localhost:8000/docs | Test all services |
| **Patient API** | http://localhost:8001/docs | Patient service |
| **Referral API** | http://localhost:8003/docs | Referral service |

---

## 📊 What You'll See

### Pharmacy Dashboard
```
Pending Prescriptions: 3
Low Stock Items: 3
Recent Prescriptions: (table of last 5)
Low Stock Alerts: (visual warnings)
```

### After Accepting a Referral
```
Pending Prescriptions: 4 (new one appears!)
New prescription shows in "Recent Prescriptions" table
```

### After Dispensing Medication
```
Success message: "Medication dispensed successfully!"
Inventory stock decreased
Dispensing history shows new record
Patient medications updated (if checking Patient profile)
```

---

## 🛑 Stop Everything

```bash
# Press Ctrl+C in the PowerShell window
# Then run:
./stop.sh

# Or:
docker compose down
```

---

## 📚 More Information

- **Full Setup Guide:** `INSTALLATION_GUIDE.md`
- **Testing Guide:** `PHARMACY_TEST_REPORT.md`
- **Architecture:** `CONTEXT.md`
- **Implementation Details:** `PLAN.md`

---

## ✨ That's It!

You're ready to see the Pharmacy dashboard in action! 🎉

```bash
./start_all.sh
```

Then open: http://localhost:4200/pharmacy/dashboard
