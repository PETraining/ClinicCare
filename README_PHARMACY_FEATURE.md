# Pharmacy & Prescription Management Feature - Complete Guide

## 🎯 What is the Pharmacy Feature?

The Pharmacy & Prescription Management system allows:
- **Doctors** to prescribe medications when referrals are accepted
- **Pharmacy staff** to view and fulfill prescriptions
- **Inventory management** with automatic stock level tracking
- **Patient records** to be updated with dispensed medications

---

## 📖 How It Works (Simple Workflow)

### 1. Doctor Makes a Referral
```
Doctor creates a referral:
- Patient: John Smith
- Reason: "Cardiac consultation"
- Specialist: Dr. Cardiologist
- Priority: Routine
```

### 2. Referral Gets Accepted
```
When the referral is ACCEPTED:
✨ Behind the scenes: Pharmacy Service automatically creates a prescription
- Prescription linked to: Referral, Patient, Doctor
- Status: "Active"
- Ready for pharmacy to fulfill
```

### 3. Pharmacy Staff Sees the Prescription
```
Pharmacy Dashboard shows:
- Pending Prescriptions: 1 (the new prescription)
- Low Stock Items: 3 (alert pharmacy of stock issues)
```

### 4. Pharmacy Dispenses Medication
```
Pharmacy staff:
1. Clicks on the prescription
2. Selects medication to dispense
3. Enters quantity (e.g., "5 tablets")
4. Clicks "Dispense"

System automatically:
✓ Records the dispensing action
✓ Decreases inventory (50 → 45 tablets)
✓ Updates patient medication list
✓ Creates audit record
```

### 5. Everything is Updated
```
Database reflects:
- Inventory: Stock level decreased
- Patient: New medication added
- Prescription: Dispensing history recorded
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│         Angular 18 Frontend             │
│         http://localhost:4200           │
│                                         │
│  Dashboard | Patients | Referrals |    │
│  Documents | Pharmacy ← NEW!           │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────┐
│      API Gateway (FastAPI)              │
│      http://localhost:8000              │
│                                         │
│  Routes /api/* to appropriate service   │
└────────────────┬────────────────────────┘
                 │ Docker Network
        ┌────────┼────────┐
        ▼        ▼        ▼
    Patient   Referral  Pharmacy ← NEW!
    Service   Service   Service
    (8001)    (8003)    (8006)
```

---

## 🎨 User Interface Overview

### Pharmacy Dashboard
Shows:
- **Pending Prescriptions Count** (e.g., "3 pending")
- **Low Stock Alerts** (medications below minimum)
- **Recent Prescriptions Table** (last 5 prescriptions)
- **Quick Action Buttons**

### Prescription List
Shows:
- Table of all prescriptions
- Filters: Status (Active/Completed), Patient ID, Referral ID
- Search functionality
- "View Details" button for each prescription

### Prescription Detail
Shows:
- Prescription information
- Medications in the prescription
- **Dispensing Form** (select medication, enter quantity, click dispense)
- **Dispensing History** (audit trail of what's been dispensed)

---

## 🔌 API Endpoints Available

When running, you can test all endpoints at: `http://localhost:8006/docs`

### Medications (Inventory Management)
```
GET  /medications              → List all medications
GET  /medications/1            → Get specific medication
POST /medications              → Add new medication
PATCH /medications/1           → Update medication (restock, price)
```

### Prescriptions (Prescription Management)
```
GET  /prescriptions            → List prescriptions
GET  /prescriptions/1          → Get prescription detail
POST /prescriptions            → Create prescription
PATCH /prescriptions/1         → Update prescription status
```

### Dispensing (Fulfill Prescriptions)
```
POST /prescriptions/1/dispense                → Record dispensing
GET  /prescriptions/1/dispensing-history      → View dispensing records
```

### Inventory (Stock Management)
```
GET /inventory/low-stock       → Get items below minimum stock
```

---

## 💾 Database Structure

The Pharmacy Service uses its own SQLite database (`pharmacy.db`) with 3 tables:

### Medications Table
```
MedicationId (Primary Key)
Name (e.g., "Aspirin")
Dosage (e.g., "500mg")
StockLevel (current quantity)
MinStockLevel (reorder threshold)
UnitPrice (cost per unit)
CreatedAt (timestamp)
```

### Prescriptions Table
```
PrescriptionId (Primary Key)
ReferralId (linked to referral)
PatientId (patient who needs medication)
PrescribingDoctorId (doctor who prescribed)
Medications (list of medications in JSON format)
Status (Active, Completed, Voided)
CreatedAt, UpdatedAt (timestamps)
```

### DispensingRecords Table
```
DispensingId (Primary Key)
PrescriptionId (which prescription)
MedicationId (which medication)
QuantityDispensed (how much was dispensed)
DispensedAt (when it was dispensed)
DispensedBy (who dispensed it)
```

---

## 📊 Sample Data

When the system starts, it's pre-populated with:

### 10 Sample Medications
- Aspirin (500mg) - Stock: 50
- Metformin (1000mg) - Stock: 45
- Lisinopril (10mg) - Stock: 5 ⚠️ LOW
- Amoxicillin (500mg) - Stock: 30
- Omeprazole (20mg) - Stock: 2 ⚠️ CRITICAL
- Ibuprofen (200mg) - Stock: 100
- Atorvastatin (20mg) - Stock: 8 ⚠️ LOW
- Sertraline (50mg) - Stock: 40
- Levothyroxine (50mcg) - Stock: 35
- Ciprofloxacin (500mg) - Stock: 20

### 5 Sample Prescriptions
- Prescription #1: Active (Patient #1, Referral #1)
- Prescription #2: Active (Patient #2, Referral #2)
- Prescription #3: Completed (Patient #3, Referral #3)
- Prescription #4: Completed (Patient #4, Referral #4)
- Prescription #5: Active (Patient #5, Referral #5)

### 3 Sample Dispensing Records
- Record #1: Dispensed 30 units of Lisinopril
- Record #2: Dispensed 14 units of Amoxicillin
- Record #3: Dispensed 14 units of Amoxicillin (second dispensing)

---

## 🚀 Getting Started After Docker Installation

### 1. Verify Setup (2 minutes)
```bash
# Open PowerShell
docker --version              # Should show: Docker version 25.x.x
docker compose ps             # Should list services
```

### 2. Start Application (3 minutes)
```bash
cd C:\git\ClinicCare
./start_all.sh
# Wait for: "✓ Compiled successfully"
```

### 3. Access Application (1 minute)
```
Browser: http://localhost:4200
Click: "Pharmacy" in navigation
```

### 4. Test Full Workflow (30 minutes)
Follow the testing guide in `PHARMACY_TEST_REPORT.md`

---

## ✨ Key Features Implemented

✅ **Medication Management**
- Add/update medications
- Track inventory levels
- Low-stock alerts

✅ **Prescription Management**
- Auto-create from referrals
- Track prescription status
- Link to patients and doctors

✅ **Dispensing Workflow**
- Record dispensing actions
- Auto-update inventory
- Update patient medications

✅ **User Interface**
- Professional dashboard
- Filterable prescription list
- Detailed prescription view
- Responsive mobile design

✅ **Integration**
- Referral → Pharmacy (auto-prescription creation)
- Pharmacy → Patient (medication updates)
- Pharmacy → Notification (optional logging)

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `QUICKSTART.md` | 5-minute quick start guide |
| `INSTALLATION_GUIDE.md` | Docker & Python setup |
| `IMPLEMENTATION_SUMMARY.md` | Complete overview |
| `PHARMACY_TEST_REPORT.md` | Testing instructions |
| `INTENT.md` | Feature requirements |
| `CONTEXT.md` | Architecture details |
| `PLAN.md` | Implementation checklist |
| `CLAUDE.md` | Development guide |

---

## 🎓 Next Steps

1. **Download & Install Docker Desktop**
   - https://www.docker.com/products/docker-desktop

2. **Download & Install Python 3.11+**
   - https://www.python.org/downloads/
   - ⚠️ Check "Add Python to PATH"

3. **Start the application**
   ```bash
   ./start_all.sh
   ```

4. **Open in browser**
   ```
   http://localhost:4200/pharmacy/dashboard
   ```

5. **Test the workflow**
   - Create referral
   - Accept referral
   - View pharmacy dashboard
   - Dispense medication

---

## 🎯 Success Indicators

When everything is working:
- ✅ Docker shows all 6 services running
- ✅ Frontend loads at http://localhost:4200
- ✅ "Pharmacy" link appears in navigation
- ✅ Pharmacy dashboard displays data
- ✅ Can view prescriptions and dispense medications

---

## 📞 Need Help?

- **Installation issues?** → See `INSTALLATION_GUIDE.md`
- **How to test?** → See `PHARMACY_TEST_REPORT.md`
- **How to develop?** → See `CLAUDE.md`
- **Architecture questions?** → See `CONTEXT.md`

---

**You're all set to get started! Install Docker and run `./start_all.sh`** 🚀
