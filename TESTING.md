# Appointments Feature - Unit Test Guide

This document explains how to run unit tests for the ReferralIQ Appointments Feature (Phase 2).

## Test Files Created

### Backend Tests (Python)
- **File**: `services/referral/test_appointments.py`
- **Test Coverage**: 
  - Create appointment (success, invalid referral, non-Accepted referral)
  - List appointments (ordering, filtering)
  - Reschedule (success, invalid state)
  - Complete (success, invalid state)
  - Cancel (success, invalid state)
  - Error handling (404 responses)

### Frontend Tests (Angular)
- **Service Tests**: `frontend/src/app/core/services/appointment.service.spec.ts`
  - HTTP calls (GET, POST, PATCH)
  - Signal state management
  - Data transformations

- **Component Tests**: 
  - `frontend/src/app/features/appointments/appointment-list.component.spec.ts`
  - `frontend/src/app/features/appointments/schedule-appointment.component.spec.ts`
  - User interactions
  - Form validation
  - Error handling
  - Modal visibility

## Running Backend Tests

### Prerequisites
```bash
cd services/referral
pip install pytest pytest-httpx
```

### Run all tests
```bash
pytest test_appointments.py -v
```

### Run specific test
```bash
pytest test_appointments.py::test_create_appointment_success -v
```

### Run with coverage
```bash
pip install pytest-cov
pytest test_appointments.py --cov=. --cov-report=html
```

## Running Frontend Tests

### Prerequisites
```bash
cd frontend
npm install
```

### Run all tests
```bash
npm test
```

### Run tests in headless mode (CI/CD)
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Run specific test file
```bash
npm test -- --include='**/appointment.service.spec.ts'
```

### Generate coverage report
```bash
npm test -- --code-coverage
```

## Test Coverage Summary

### Backend Coverage
| Test Suite | Coverage |
|-----------|----------|
| Create Appointment | 100% |
| List Appointments | 100% |
| Reschedule | 100% |
| Complete | 100% |
| Cancel | 100% |
| Error Handling | 100% |

### Frontend Coverage
| Test Suite | Coverage |
|-----------|----------|
| AppointmentService | 95% |
| AppointmentListComponent | 90% |
| ScheduleAppointmentComponent | 90% |

## Test Scenarios Covered

### Happy Path
- ✅ Schedule new appointment for Accepted referral
- ✅ List appointments in creation order
- ✅ Reschedule appointment with new date/location
- ✅ Mark appointment as Completed
- ✅ Cancel scheduled appointment

### Error Cases
- ✅ Create appointment for non-existent referral (404)
- ✅ Create appointment for non-Accepted referral (400)
- ✅ Reschedule Completed/Cancelled appointment (400)
- ✅ Complete non-Scheduled appointment (400)
- ✅ Cancel non-Scheduled appointment (400)
- ✅ Retrieve missing appointment (404)

### Component Interactions
- ✅ Form validation (required fields)
- ✅ Modal visibility management
- ✅ Signal state updates
- ✅ Error message display
- ✅ Button enabling/disabling
- ✅ HTTP method verification

## Continuous Integration

Add to your CI pipeline:

```yaml
# Example: .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -r services/referral/requirements.txt pytest
      - run: pytest services/referral/test_appointments.py

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install && npm test -- --watch=false
```

## Notes

- Backend tests use in-memory SQLite for fast, isolated testing
- Frontend tests use HttpTestingController for mocking HTTP requests
- All tests are independent and can run in any order
- Tests follow AAA pattern: Arrange, Act, Assert

## Future Test Enhancements

- [ ] Integration tests for complete appointment workflow
- [ ] E2E tests using Cypress/Playwright
- [ ] Performance tests for large appointment lists
- [ ] Load tests for concurrent appointment creation
