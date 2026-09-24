# Complete Prescription & Dispensing Workflow Guide

**Status:** Ready for Testing  
**Last Updated:** 2026-08-19

---

## 🎯 Complete End-to-End Workflow

```
1. VIEW PATIENT PRESCRIPTIONS
   ↓
2. CREATE NEW PRESCRIPTION
   ↓
3. ADD MEDICATIONS TO PRESCRIPTION
   ↓
4. DISPENSE MEDICATIONS
   ↓
5. TRACK FULFILLMENT STATUS
   ↓
6. REQUEST REFILL (if applicable)
   ↓
7. APPROVE & FULFILL REFILL
```

---

## Step 1: View Prescription History

### Where to Find It
- Go to **Patients** page
- Click on any **patient name**
- Scroll down to **"Prescription History"** section

### What You See
Two sections:
- **Active Prescriptions** - Status: `Prescribed`, `PartiallyFulfilled`
- **Completed Prescriptions** - Status: `Fulfilled`, `Completed`

### Prescription Card Shows
```
Rx #1
[Status Badge: Prescribed]
Created: 8/19/2026

Medications: 2 items
Refills: 3/5 remaining

Actions:
- Click to expand details
- "Request Refill" button (if eligible)
```

### Expand Prescription to See
- Doctor ID
- Referral ID (if applicable)
- **Medications with real names:**
  - Aspirin (500mg) - Qty: 30, Once daily
  - Ibuprofen (200mg) - Qty: 20, Twice daily
- Last Refilled date
- Refill details

---

## Step 2: Create a New Prescription

### From Patient Details Page
1. Click **"+ Create Prescription"** button (top right of Prescription History)
2. You'll see the prescription creation form with:
   - Patient name (auto-filled)
   - Referral info (if coming from referral)
   - Doctor dropdown (shows real doctor names + specialty)
   - Refills allowed (default: 0)

### Fill in the Form

#### Select Doctor
- Dropdown shows: **"Dr. Name - Specialty"**
- Example: "Dr. Smith - Cardiology"
- **Fix:** Referral dropdown now shows from referral details

#### Add Medications
1. Search field with real **medication names**
   - Type "Asp" → Shows "Aspirin 500mg"
   - Shows stock status: ✅ In Stock, ⚠️ Low Stock, ❌ Out of Stock
2. Click medication to add it
3. Form appears with:
   - **Medication name** (e.g., "Aspirin")
   - **Dosage** (e.g., "500mg")
   - **Quantity** (how many units to prescribe)
   - **Frequency** (e.g., "Once daily")
   - **Instructions** (optional special notes)

#### Set Refills
- **0** = No refills allowed (one-time only)
- **1-9** = Limited refills
- **-1** = Unlimited refills

### Example Prescription
```
Patient: John Smith
Doctor: Dr. Johnson - General Medicine
Referral: None

Medications:
  1. Aspirin 500mg - Qty: 30 - Once daily
  2. Ibuprofen 200mg - Qty: 20 - Twice daily

Refills Allowed: 3
Status: Prescribed (default)
```

---

## Step 3: What Happens After Creating Prescription

### Automatic Actions
1. ✅ Prescription created with status **"Prescribed"**
2. ✅ **Stock automatically deducted** for each medication
   - Aspirin: 100 → 70 (30 units prescribed)
   - Ibuprofen: 50 → 30 (20 units prescribed)
3. ✅ Success message shown
4. ✅ Redirected back to **Patient Details** page
5. ✅ **Prescription appears in "Active Prescriptions"** section with status "Prescribed"

### If Not Showing in History
**Check:**
- [ ] Is prescription status "Prescribed"? ✓ (It should be now)
- [ ] Did you scroll down to Prescription History section?
- [ ] Try refreshing the page (F5)
- [ ] Check browser console for errors (F12)

---

## Step 4: Dispense Medications

### Access Dispensing Interface

#### Option A: From Patient Details Page
1. Go to **Patient Details**
2. Find active prescription in "Active Prescriptions"
3. **Expand** the prescription card
4. See medications listed
5. Click on **prescription ID** or go to **Pharmacy → Prescriptions → Details**

#### Option B: From Pharmacy Dashboard
1. Go to **Dashboard** (main page)
2. See **"Recent Prescriptions"** or click **"View All Prescriptions"**
3. Click on **prescription ID**
4. Goes to prescription detail page

### Dispensing Form

#### Location
On prescription detail page, you'll see:
```
DISPENSE MEDICATION FORM
├─ Medication Selection: [dropdown with medications]
├─ Quantity: [number input]
├─ Dispensed By: [name field] - e.g., "John Pharmacist"
├─ Dispense Button [Submit]
└─ Dispensing History: [Shows all previous dispensing]
```

#### How to Dispense

**Scenario:** Prescription has Aspirin 30 units, Ibuprofen 20 units

**Option 1: Dispense Full Prescription at Once**
```
1. Click Dispense Medication form
2. Select medication: "Aspirin 500mg"
3. Enter quantity: 30 (full amount)
4. Enter dispensed by: "John Smith"
5. Click "Dispense"
6. Success! Stock updated, record created
7. Status might change to "Fulfilled" or "PartiallyFulfilled"
```

**Option 2: Partial Dispensing**
```
1. Dispense Aspirin: 15 units (partial)
   - Quantity: 15
   - Stock: 70 → 55
   - Status: PartiallyFulfilled
   
2. Later, dispense remaining Aspirin: 15 units
   - Quantity: 15
   - Stock: 55 → 40
   - Status: Still PartiallyFulfilled (need Ibuprofen)

3. Dispense Ibuprofen: 20 units
   - Quantity: 20
   - Stock: 30 → 10
   - Status: Fulfilled (all medications dispensed)
```

### Key Points
- ✅ You can dispense **partial quantities**
- ✅ You can dispense **multiple times** for same medication
- ✅ **Pharmacist name captured** in each dispensing record
- ✅ **Stock automatically deducted** for each dispensing
- ✅ **Fulfillment status auto-updated** based on total dispensed vs prescribed
- ✅ **Dispensing history shown** in table below form

### Validation Rules
- Can only dispense medications **on the prescription**
- Cannot dispense **more than prescribed** total
- Cannot dispense **more than available stock**
- Shows clear error messages if validation fails

---

## Step 5: Track Fulfillment Status

### Prescription Statuses

| Status | Meaning | Action Possible |
|--------|---------|-----------------|
| **Prescribed** | Created, no dispensing yet | Dispense, Request Refill |
| **PartiallyFulfilled** | Some medications dispensed | Dispense more, Request Refill |
| **Fulfilled** | All medications dispensed | Request Refill only |
| **Voided** | Cancelled | None |

### See Status Updates
- **Patient Details Page**: Prescription card shows status badge
- **Pharmacy Dashboard**: "Recent Prescriptions" shows status
- **Pharmacy Prescriptions List**: Filter by status
- **Prescription Detail Page**: Shows current fulfillment percentage

### Example Fulfillment Tracking
```
Prescription: Rx#1
Prescribed:
  - Aspirin: 30 units
  - Ibuprofen: 20 units

Dispensing History:
  1. Aspirin 15 units (50%) - "John Pharmacist"
  2. Ibuprofen 10 units (50%) - "Jane Pharmacist"
  3. Aspirin 15 units (100%) - "John Pharmacist"
  4. Ibuprofen 10 units (100%) - "Jane Pharmacist"

Status: Fulfilled ✅
Fulfillment: 100% (50 of 50 units dispensed)
```

---

## Step 6: Request Refill

### When Can You Request Refill?
- Status is **Prescribed**, **PartiallyFulfilled**, or **Fulfilled**
- AND has refills remaining (RefillsRemaining > 0 OR RefillsAllowed = -1)

### How to Request Refill

#### From Patient Details Page
1. Find prescription in **"Active Prescriptions"**
2. See **"Request Refill"** button (only if eligible)
3. Click button
4. **Modal appears** showing:
   - Prescription details
   - Medications to be refilled
   - Optional notes field
5. Click **"Submit Refill Request"**
6. Success message appears
7. Modal closes

#### From Pharmacy Dashboard
1. Go to **"Pharmacy" → "Refills"**
2. See all refill requests by status:
   - Pending (waiting approval)
   - Approved
   - Fulfilled
   - Rejected

### Refill Request Status Workflow
```
Patient submits refill request
  ↓ (Status: Pending)
Pharmacist/Doctor approves
  ↓ (Status: Approved)
Pharmacist fulfills refill
  ↓ (Status: Fulfilled)
Medications dispensed, stock updated
```

---

## Step 7: Approve & Fulfill Refill

### Access Refill Requests

#### From Pharmacy Dashboard
1. Navigate to **Pharmacy** → **Refills**
2. See all refill requests
3. Filter by status: Pending, Approved, Fulfilled, Rejected

### Approve Refill
```
1. Find refill request with status "Pending"
2. Click "Approve" button
3. Confirmation
4. Status changes to "Approved"
```

### Fulfill Refill
```
1. Find refill request with status "Approved"
2. Click "Fulfill" button
3. Automatic:
   - Dispensing records created for all medications
   - Stock decremented for each medication
   - RefillsRemaining decremented
   - LastRefillDate updated
4. Status changes to "Fulfilled"
```

---

## 📊 Medication Names Display

### Where Medication Names Appear

#### ✅ Create Prescription
- Medication search shows **real names**: "Aspirin 500mg", "Ibuprofen 200mg"
- Each added medication shows **name and dosage**
- Stock status indicator shows availability

#### ✅ Prescription List
- Recent prescriptions show medication **count** ("2 items")
- Expand to see **full medication names and dosages**

#### ✅ Prescription Detail
- Shows all **medication names with dosage**
- Shows quantity, frequency, instructions
- Dispensing form shows **medication names** in dropdown

#### ✅ Pharmacy Dashboard
- Medications listed with **real names**
- Low stock alerts show **medication names**
- Stock status shows **medication names**

#### ✅ Inventory Management
- All medications listed with **real names and dosage**
- Search works with **medication names**
- Stock levels per **medication name**

---

## 📋 Referral Integration

### Referral Information Display

#### When Creating Prescription from Referral
- Referral details shown:
  - **Referral ID**: Ref #1
  - **Reason**: (from referral)
  - **Status**: (from referral)
  - **Doctor**: (from referral)

#### Referral Linking
- Prescription auto-links to referral
- See in prescription details: **"Referral: Ref #1"** (clickable)
- Can navigate between referral ↔ prescription

---

## 🔍 Troubleshooting

### Prescription Not Showing in History
**Symptom:** Created prescription but not in "Active Prescriptions" section

**Solutions:**
1. [ ] Check status - should be "Prescribed" or "PartiallyFulfilled"
2. [ ] Refresh page (F5) - data might not have loaded
3. [ ] Check browser console (F12) for errors
4. [ ] Verify prescription was created (look for success message)
5. [ ] Check "Completed Prescriptions" section (scroll down)

### Can't Dispense Medication
**Symptom:** "Cannot dispense medication" error

**Check:**
- [ ] Medication is on this prescription
- [ ] Quantity doesn't exceed prescribed amount
- [ ] Enough stock available
- [ ] Prescription is not Voided

### Medication Names Showing as IDs
**Symptom:** See "Medication #1" instead of "Aspirin"

**Causes:**
- Backend didn't return medication name
- Frontend didn't populate name field

**Fix:**
- Refresh page
- Check that medication was added with Name field
- Look at console for API errors

### Stock Not Updating
**Symptom:** Dispensed medication but stock stayed same

**Possible Issues:**
- Stock update failed silently
- Browser cached old data
- Backend error occurred

**Solution:**
- Refresh page
- Check browser console logs
- Try dispensing again

---

## 📱 Mobile/Responsive Design

All screens are **mobile-friendly**:
- Prescription cards stack vertically
- Dropdown menus work on mobile
- Modal works with touch
- Text size is readable

---

## 🎓 Quick Reference

### Keyboard Shortcuts
- Tab: Navigate form fields
- Enter: Submit forms
- Escape: Close modals
- Ctrl+F: Search page

### Common Tasks
```
View prescriptions:     Patients → Click patient name → Scroll to "Prescription History"
Create prescription:     Patients → Click patient name → Click "+ Create Prescription"
Dispense medication:     Pharmacy → Prescriptions → Click Rx → Fill "Dispense Medication"
Request refill:          Patient page → Click "Request Refill" button
Approve refill:          Pharmacy → Refills → Click "Approve"
Fulfill refill:          Pharmacy → Refills → Click "Fulfill"
View inventory:          Pharmacy → Inventory
View low stock:          Dashboard → Low Stock Alerts OR Inventory → Filter: Low Stock
```

---

## Summary

✅ **Prescriptions** are created with status "Prescribed"  
✅ **Medications** are stored with real names and dosages  
✅ **Dispensing** tracks who dispensed what and when  
✅ **Fulfillment** auto-updates based on dispensing  
✅ **Refills** have full workflow from request to fulfillment  
✅ **Stock** auto-decrements on dispensing  

**Ready to test!** Follow this guide for end-to-end workflow. 🚀
