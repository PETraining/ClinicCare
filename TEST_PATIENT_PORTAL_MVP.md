# Patient Portal MVP Testing Plan

## 6 MVP Requirements

1. ✅ **View Referrals** - List patient's referrals with status
2. ✅ **View Appointments** - List appointments scheduled for the patient  
3. 📋 **Download Documents** - Retrieve documents from document service
4. 📋 **Upload Pre-visit Forms** - Submit form documents before appointment
5. 📋 **Complete Questionnaires** - Answer health history questionnaires
6. 📋 **Track Referrals** - View referral status and validation recommendations

## Test Data

- **Patient 3 (Divya Menon)**: 1 Accepted referral, 1 Appointment
  - Referral ID 5: Dermatology (Nair), Accepted, skin lesion evaluation
  - Appointment: Aug 20, 10 AM, Downtown Clinic - Dermatology Suite
  
- **Patient 2 (Rajesh Kumar)**: 1 Accepted referral, 1 Appointment
  - Referral ID 6: Orthopedics (Reddy), Accepted, chronic knee pain
  - Appointment: Aug 25, 2:30 PM, Westside Orthopedic Center

- **Patient 4 (Suresh Iyengar)**: 1 Completed referral
  - Referral ID 7: Cardiology (Krishnan), Completed, Post-MI follow up
  - Appointment: Jun 25, 9 AM (past), City Heart Institute

## Testing URLs

- **Frontend**: http://localhost:4300/patient-portal/login
- **Referrals API**: http://localhost:8000/api/referrals
- **Appointments API**: http://localhost:8000/api/appointments
- **Doctors API**: http://localhost:8000/api/doctors
- **Documents API**: http://localhost:8000/api/documents
- **Questionnaires API**: http://localhost:8000/api/questionnaires

## Test Results

### Requirement 1: View Referrals
- [ ] List referrals for patient 3
- [ ] List referrals for patient 2
- [ ] Verify status is shown correctly

### Requirement 2: View Appointments
- [ ] List appointments for patient 3
- [ ] List appointments for patient 2
- [ ] Verify scheduled date/time displays correctly
- [ ] Verify location displays correctly

### Requirement 3: Download Documents
- [ ] Check if documents exist for patient
- [ ] Verify download works

### Requirement 4: Upload Pre-visit Forms
- [ ] Check if upload form is accessible
- [ ] Verify upload functionality

### Requirement 5: Complete Questionnaires
- [ ] Check if questionnaire form loads
- [ ] Verify submission works

### Requirement 6: Track Referrals
- [ ] Check if validation status shows recommendations
- [ ] Verify status indicators display

## Backend Service Health

- Gateway (8000): Testing
- Referral Service (8003): Testing
- Patient Service (8001): Testing
- Doctor Service (8002): Testing
- Document Service (8004): Testing
- Appointment Service: Handled by Referral Service
- Questionnaire Service: Pending
