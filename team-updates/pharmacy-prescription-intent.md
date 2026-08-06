# Pharmacy & Prescription Management System — Intent & Design

**Owner**: Ann Mary Charly (UST, IN)
**Start Date**: 2026-08-05
**Stack**: Java (Spring Boot) + Angular + MySQL
**Architecture**: Monolithic

---

## Problem Statement

The current system has no integrated record of what doctors have prescribed, no pharmacy visibility into pending prescriptions, no inventory tracking, and no automated alerts for low-stock situations. Patients cannot easily track their prescriptions or refills.

**Business Impact**:
- Prescription errors go undetected
- Pharmacy inefficiency from manual processes
- Stock-outs cause service disruptions
- Poor patient experience and compliance

---

## Core Intent

Build a unified Pharmacy & Prescription Management system that enables:
- Doctors to create electronic prescriptions linked to patient records
- Pharmacies to see a real-time queue of prescriptions needing fulfillment
- Patients to view their prescription history and status
- Inventory to be tracked and auto-updated on dispensing
- Low-stock items to be clearly identified for reordering

---

## User Roles

| Role | Primary Need |
|------|-------------|
| **Doctor** | Create prescriptions, view prescription history |
| **Patient** | View own prescriptions and medication history |
| **Pharmacist** | Fulfill prescriptions, manage inventory |

---

## System Architecture

```
Angular Frontend (Browser)
         ↓
   REST API Layer (Java/Spring Boot)
         ↓
   Business Logic & Services (Java)
         ↓
   MySQL Database
```

### Core Modules

```
Doctor Portal → Prescription Creation
                    ↓
           Prescription Management
                    ↓
Pharmacy Portal → Prescription Fulfillment
                    ↓
           Inventory Updates
                    ↓
Patient Portal → View Prescriptions & History
```

---

## Key Entities & Data Design

### USER
- `user_id`, `email`, `password_hash`, `role` (DOCTOR/PATIENT/PHARMACIST), `created_at`
- Purpose: Authentication & authorization

### PATIENT
- `patient_id`, `name`, `dob`, `contact`, `address`, `user_id`
- Relationships: has many prescriptions, has many referrals

### REFERRAL
- `referral_id`, `patient_id`, `doctor_id`, `reason`, `referral_date`
- Purpose: Link prescriptions to medical referrals

### PRESCRIPTION
- `prescription_id`, `patient_id`, `doctor_id`, `referral_id`, `prescription_date`, `status`
- Status values: `PENDING` → `FILLED` | `CANCELLED`
- Relationships: has many prescription_medications

### PRESCRIPTION_MEDICATIONS (Junction)
- `id`, `prescription_id`, `medication_id`, `quantity`, `dosage`, `frequency`
- Purpose: Support multiple medications per prescription

### MEDICATION (Master Data)
- `medication_id`, `name`, `dosage`, `form`, `manufacturer`
- Unique constraint: `(name, dosage)`

### INVENTORY
- `inventory_id`, `medication_id`, `quantity_on_hand`, `reorder_level`
- Purpose: Track stock levels per medication

### INVENTORY_ALERTS
- `alert_id`, `medication_id`, `alert_type` (LOW_STOCK/OUT_OF_STOCK), `created_at`, `resolved_at`
- Purpose: Track low-stock notifications

### DISPENSING
- `dispensing_id`, `prescription_id`, `pharmacy_user_id`, `dispensed_date`, `qty_dispensed`, `notes`
- Purpose: Audit record of prescription fulfillment

---

## End-to-End Integration Flow

```
Doctor creates Prescription
         ↓
Prescription stored with PENDING status
         ↓
Pharmacy sees in Queue (pending prescriptions)
         ↓
Pharmacist marks as FILLED/DISPENSED
         ↓
Inventory is auto-decremented
         ↓
Low-stock alerts generated if below threshold
         ↓
Patient can view completed prescription
```

---

## Team Integration Dependencies

```
┌─────────────────────────────────────────────────────────┐
│               Team 1: Auth                              │
│          (Provides user context for all)                │
└─────────────────┬─────────────────────────────────────┬─┘
                  │                                     │
                  ↓                                     ↓
         ┌─────────────────┐            ┌──────────────────┐
         │ Team 2: Rx      │            │ Team 3: Inventory│
         │ (Creates Rx)    │────────────│ (Stock mgmt)     │
         └────────┬────────┘            └────────┬─────────┘
                  │                              │
                  └──────────────┬───────────────┘
                                 ↓
                  ┌──────────────────────────────┐
                  │ Team 4: Dispensing            │
                  │ - Marks Rx as filled          │
                  │ - Decrements inventory        │
                  │ - Generates receipt           │
                  └──────────────────────────────┘
```

### Integration Rules
- **Team 1 → All**: Every endpoint requires a valid JWT with role validation
- **Team 2 ↔ Team 3**: Medications in prescriptions must exist in the medication master
- **Team 2 ↔ Team 4**: Prescriptions saved as PENDING flow into the pharmacy queue
- **Team 4 ↔ Team 3**: Dispensing triggers `decrementStock()` on inventory

---

## MVP Scope (This Week)

| # | Feature | Owner |
|---|---------|-------|
| 1 | User registration & login (3 roles) | Team 1 |
| 2 | JWT-based authentication & RBAC | Team 1 |
| 3 | Patient profile management | Team 1 |
| 4 | Doctor creates prescription with multiple medications | Team 2 |
| 5 | Prescription linked to patient & referral | Team 2 |
| 6 | Patient views their prescriptions | Team 2 |
| 7 | Medication master catalog management | Team 3 |
| 8 | Inventory stock tracking & thresholds | Team 3 |
| 9 | Low-stock alert generation | Team 3 |
| 10 | Pharmacy prescription fulfillment queue | Team 4 |
| 11 | Dispensing record & inventory auto-decrement | Team 4 |
| 12 | Dispensing receipt generation | Team 4 |

---

## Deferred to Next Week

- Advanced refill management
- Detailed prescription status workflows
- Inventory movement history & analytics
- Email/SMS notifications
- Audit logging for compliance
- Advanced reporting & dashboards
- Pharmacist KPI dashboard

---

## Success Definition

The MVP is done when a user can complete this full flow:

> **Register as Doctor → Create Prescription → Patient Views It → Pharmacist Dispenses It → Inventory Decrements → Low-stock Alert Triggers (if applicable)**

---

*Document Version: 1.0 | Last Updated: 2026-08-05 | Contact: annmary.charly@ust.com*
