# Pharmacy & Prescription Management - Intent

## Core Requirement

**What is this feature for?**

Enable doctors to create and document prescriptions when referrals are accepted, allow pharmacy staff to view and fulfill prescriptions, and maintain accurate medication inventory with automatic stock level updates.

## Who Needs It and Why?

### Doctors
- **Need:** A way to document what medications they're prescribing during the referral workflow
- **Why:** Currently referrals end without any record of prescribed medications, creating a gap in the clinical workflow

### Pharmacy Staff
- **Need:** Visibility into which prescriptions need fulfilling and what medications need to be dispensed
- **Why:** Without this, pharmacy operations are disconnected from the referral workflow and can't track what's been prescribed

### Patients
- **Need:** Their medication list updated when prescriptions are dispensed
- **Why:** Maintaining an accurate, up-to-date medication list is critical for patient safety and continuity of care

### Inventory Manager
- **Need:** Real-time visibility into medication stock levels with alerts when items run low
- **Why:** Stock-outs can delay patient care; low-stock warnings enable proactive restocking

## The Problem Being Solved

Currently, ClinicCare has a gap in the medication workflow:

1. **Referral System** exists but ends without documenting prescribed medications
2. **Patient Medication Records** exist but are disconnected from the referral/prescription workflow
3. **No Pharmacy Module** to manage inventory or track prescription fulfillment
4. **No Dispensing Records** to audit what was given to which patient

This means:
- Doctors can't record what they're prescribing
- Pharmacy has no formal notification of pending prescriptions
- Inventory levels aren't tracked or updated
- There's no audit trail of medication dispensing

## Intended Outcome

After implementing this feature:

1. **Doctors** can add prescription details when accepting a referral for a specialist
2. **Pharmacy staff** see a dashboard showing:
   - Pending prescriptions waiting for fulfillment
   - Medications running low on stock
3. **When a prescription is dispensed:**
   - Inventory stock level automatically decreases
   - Patient's medication list is updated
   - A dispensing record is created for audit purposes
4. **Pharmacy inventory is managed** with real-time stock visibility and low-stock alerts

## Success Criteria (MVP - This Week)

- ✅ Pharmacy service created and running on port 8006
- ✅ When a referral transitions to "Accepted", a prescription is automatically created in pharmacy
- ✅ Pharmacy staff can list pending prescriptions
- ✅ Pharmacy staff can mark a prescription as dispensed
- ✅ Inventory stock level decreases when medication is dispensed
- ✅ Patient's medication list is updated when prescription is dispensed
- ✅ Frontend shows pharmacy dashboard with pending count and low-stock alerts
- ✅ End-to-end workflow: accept referral → prescription appears in pharmacy → dispense → inventory and patient data updated

## Deferred Features (Next Week)

The following advanced features are deliberately deferred to next week:
- Refill management and refill requests
- Multiple medication tracking per prescription with individual dispensing
- Partial dispensing (dispense less than prescribed quantity)
- Prescription voiding/cancellation workflows
- Pharmacy staff role-based access control
- Prescription PDF generation and document linking
- Barcode scanning for inventory management
- Medication expiration date tracking
- Insurance and pricing integration
- Complete audit trail for all dispensing activities

This keeps this week's scope focused on the core prescription-to-dispensing workflow.
