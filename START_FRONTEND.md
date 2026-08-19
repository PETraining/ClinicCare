# 🚀 STARTING THE PHARMACY SYSTEM FRONTEND

**Status:** Backend is ✅ running | Frontend is ⏸️ not started yet

---

## Quick Start (Copy & Paste)

### For Windows PowerShell:

```powershell
cd C:\git\ClinicCare\frontend
npm start
```

### For Git Bash:

```bash
cd /c/git/ClinicCare/frontend
npm start
```

---

## Step-by-Step Instructions

### Step 1: Open a NEW Terminal
- Keep your current terminal showing backend logs
- Open a **NEW** terminal window (PowerShell or Git Bash)

### Step 2: Navigate to Frontend Directory
```bash
cd /c/git/ClinicCare/frontend
```
or
```powershell
cd C:\git\ClinicCare\frontend
```

### Step 3: Start Angular Dev Server
```bash
npm start
```

### Step 4: Wait for Compilation
You should see:
```
✔ Compiled successfully
Application bundle generated successfully

Local:            http://localhost:4200/
External:         http://192.168.x.x:4200/
```

### Step 5: Access the Application
The browser should automatically open to:
```
http://localhost:4200
```

If not, manually navigate to: `http://localhost:4200`

---

## 🎯 What You Should See

### Dashboard Screen
```
CLINICCARE - Pharmacy Dashboard

Pending Prescriptions: 3
Low Stock Items: 3

Recent Prescriptions
├─ Rx #1 - Patient 1 - Active
├─ Rx #2 - Patient 2 - Active
└─ Rx #5 - Patient 5 - Active

Low Stock Alerts
├─ 🔴 Omeprazole: 2 units
├─ 🔴 Lisinopril: 5 units
└─ 🔴 Atorvastatin: 8 units
```

### Navigation Menu
```
Dashboard
Prescriptions
Inventory Management
```

---

## ✅ Testing the UI

Once the UI is running:

1. **View Medications**
   - Click "Inventory Management"
   - Should see 10 medications with stock levels

2. **View Prescriptions**
   - Click "Prescriptions"
   - Should see 5 prescriptions (3 Active, 2 Completed)

3. **View Prescription Detail**
   - Click on a prescription
   - Should see medications and dispensing form

4. **Dispense Medication** (Optional)
   - Select a medication from the dropdown
   - Enter quantity
   - Click "Dispense" button
   - Stock should decrease

---

## 🛠️ Troubleshooting

### Problem: npm start hangs or takes very long
**Solution:**
```bash
# Stop with Ctrl+C
# Clear cache
npm cache clean --force

# Try again
npm start
```

### Problem: "Cannot find module" errors
**Solution:**
```bash
# Remove node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm start
```

### Problem: Port 4200 already in use
**Solution:**
```bash
# Use different port
ng serve --port 4201

# Then access: http://localhost:4201
```

### Problem: Browser doesn't open automatically
**Solution:**
```bash
# Manually open browser and navigate to:
http://localhost:4200
```

### Problem: Cannot connect to backend API
**Check:**
1. Are backend services running? Run in another terminal:
   ```bash
   docker-compose ps
   ```
   Should show all 7 services as "Up"

2. Can you reach backend API?
   ```bash
   curl http://localhost:8006/medications
   ```
   Should return JSON data

3. Check browser console for errors (F12)

---

## 📊 System Architecture

### Your Three Terminals Should Look Like:

**Terminal 1** (Backend - Already Running)
```
$ docker-compose logs -f
cliniccare-pharmacy-service-1  | Uvicorn running on http://0.0.0.0:8006
cliniccare-gateway-1           | Uvicorn running on http://0.0.0.0:8000
cliniccare-patient-service-1   | Uvicorn running on http://0.0.0.0:8001
...
```

**Terminal 2** (Frontend - You're Starting Now)
```
$ npm start
✔ Compiled successfully
Local:            http://localhost:4200/
```

**Terminal 3** (Optional - for commands)
```
$ curl http://localhost:8006/medications
[{"MedicationId": 1, "Name": "Aspirin", ...}]
```

---

## 🎉 Success Indicators

✅ **Frontend is working when you see:**
- Browser opens to http://localhost:4200
- Pharmacy dashboard loads with data
- Navigation menu items are clickable
- Medications list shows data
- Prescriptions list shows data
- No red errors in browser console

✅ **Backend is working when:**
- All services show "Up" in `docker-compose ps`
- API endpoints respond (test with curl)
- Dashboard shows real data from database
- No errors in docker logs

---

## 📝 Full System Status Check

Run this command to verify everything:

```bash
# Check backend services
docker-compose ps

# Check API is responding
curl http://localhost:8006/health

# Check frontend is accessible
# (Open browser to http://localhost:4200)

# All good if:
# ✅ All docker services are "Up"
# ✅ Curl returns {"status":"healthy","service":"pharmacy"}
# ✅ Browser loads pharmacy dashboard with data
```

---

## 🚨 Need Help?

If something doesn't work:

1. **Check the logs:**
   ```bash
   # Backend logs
   docker-compose logs pharmacy-service
   
   # Frontend console
   # Press F12 in browser, click "Console" tab
   ```

2. **Verify services:**
   ```bash
   docker-compose ps
   curl http://localhost:8006/medications
   ```

3. **Reset everything (if all else fails):**
   ```bash
   # Stop all services
   docker-compose down
   
   # Stop npm dev server (Ctrl+C in terminal 2)
   
   # Start backend again
   docker-compose up -d
   
   # Start frontend again
   npm start
   ```

---

**Next Step:** Run `npm start` in the frontend directory and access http://localhost:4200

Good luck! 🎉
