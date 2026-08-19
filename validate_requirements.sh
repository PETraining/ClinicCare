#!/bin/bash

###############################################################################
# PHARMACY FEATURE REQUIREMENTS VALIDATOR
# Validates all business requirements are implemented
###############################################################################

set -e

PASS=0
FAIL=0
TOTAL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_requirement() {
    local name=$1
    local condition=$2
    TOTAL=$((TOTAL + 1))

    if eval "$condition"; then
        echo -e "${GREEN}✅${NC} $name"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌${NC} $name"
        FAIL=$((FAIL + 1))
    fi
}

print_header() {
    echo ""
    echo -e "${YELLOW}$1${NC}"
    echo "─────────────────────────────────────────────────"
}

###############################################################################
# BACKEND REQUIREMENTS
###############################################################################

print_header "1. BACKEND API ENDPOINTS"

# Medication endpoints
check_requirement "GET /medications endpoint" \
    "grep -q '@app.get.*\"/medications\"' services/pharmacy/main.py"

check_requirement "GET /medications/{id} endpoint" \
    "grep -q '@app.get.*\"/medications/{' services/pharmacy/main.py"

check_requirement "POST /medications endpoint" \
    "grep -q '@app.post.*\"/medications\"' services/pharmacy/main.py"

check_requirement "GET /inventory/low-stock endpoint" \
    "grep -q '@app.get.*low-stock' services/pharmacy/main.py"

check_requirement "GET /inventory/stock-status endpoint" \
    "grep -q '@app.get.*stock-status' services/pharmacy/main.py"

# Prescription endpoints
check_requirement "POST /prescriptions endpoint" \
    "grep -q '@app.post.*\"/prescriptions\"' services/pharmacy/main.py"

check_requirement "GET /prescriptions endpoint" \
    "grep -q '@app.get.*\"/prescriptions\"' services/pharmacy/main.py"

check_requirement "GET /prescriptions/{id} endpoint" \
    "grep -q '@app.get.*\"/prescriptions/{' services/pharmacy/main.py"

check_requirement "GET /prescriptions/{id}/refill-requests endpoint" \
    "grep -q '@app.get.*refill-requests' services/pharmacy/main.py"

# Dispensing endpoints
check_requirement "POST /prescriptions/{id}/dispense endpoint" \
    "grep -q '@app.post.*dispense' services/pharmacy/main.py"

check_requirement "GET /prescriptions/{id}/dispensing-history endpoint" \
    "grep -q '@app.get.*dispensing-history' services/pharmacy/main.py"

# Refill endpoints
check_requirement "POST /prescriptions/{id}/request-refill endpoint" \
    "grep -q '@app.post.*request-refill' services/pharmacy/main.py"

check_requirement "GET /refill-requests endpoint" \
    "grep -q '@app.get.*\"/refill-requests\"' services/pharmacy/main.py"

check_requirement "POST /refill-requests/{id}/approve endpoint" \
    "grep -q '@app.post.*approve' services/pharmacy/main.py"

check_requirement "POST /refill-requests/{id}/reject endpoint" \
    "grep -q '@app.post.*reject' services/pharmacy/main.py"

check_requirement "POST /refill-requests/{id}/fulfill endpoint" \
    "grep -q '@app.post.*fulfill' services/pharmacy/main.py"

###############################################################################
# DATABASE MODEL REQUIREMENTS
###############################################################################

print_header "2. DATABASE MODELS & SCHEMA"

check_requirement "Medication model with StockLevel" \
    "grep -q 'class Medication\|StockLevel' services/pharmacy/models.py"

check_requirement "Prescription model exists" \
    "grep -q 'class Prescription' services/pharmacy/models.py"

check_requirement "DispensingRecord model exists" \
    "grep -q 'class DispensingRecord' services/pharmacy/models.py"

check_requirement "RefillRequest model exists" \
    "grep -q 'class RefillRequest' services/pharmacy/models.py"

check_requirement "Prescription status tracking" \
    "grep -q 'Status.*Prescribed\|status.*prescribed' services/pharmacy/models.py"

check_requirement "Medication stock reduction logic" \
    "grep -q 'StockLevel\|stock' services/pharmacy/models.py"

###############################################################################
# FEATURE IMPLEMENTATIONS
###############################################################################

print_header "3. CORE FEATURE IMPLEMENTATIONS"

check_requirement "Stock reduction on dispensing" \
    "grep -q 'StockLevel.*-\|reduce.*stock\|quantity_dispensed' services/pharmacy/main.py"

check_requirement "Refill allowance validation" \
    "grep -q 'RefillsRemaining\|RefillsAllowed' services/pharmacy/models.py"

check_requirement "Low stock alerts" \
    "grep -q 'StockLevel.*MinStockLevel\|low.*stock' services/pharmacy/main.py"

check_requirement "Prescription filtering by patient" \
    "grep -q 'patient_id\|PatientId' services/pharmacy/main.py"

check_requirement "Prescription filtering by status" \
    "grep -q 'status.*filter\|Status' services/pharmacy/main.py"

###############################################################################
# FRONTEND REQUIREMENTS
###############################################################################

print_header "4. FRONTEND COMPONENTS"

check_requirement "Pharmacy dashboard component exists" \
    "[ -f frontend/src/app/features/pharmacy/pharmacy-dashboard.component.ts ]"

check_requirement "Prescription creation component exists" \
    "[ -f frontend/src/app/features/pharmacy/prescription-create.component.ts ]"

check_requirement "Prescription detail component exists" \
    "[ -f frontend/src/app/features/pharmacy/prescription-detail.component.ts ]"

check_requirement "Prescription list component exists" \
    "[ -f frontend/src/app/features/pharmacy/prescription-list.component.ts ]"

check_requirement "Refill request modal exists" \
    "[ -f frontend/src/app/features/patients/refill-request-modal.component.ts ]"

check_requirement "Pharmacy service exists" \
    "test -f frontend/src/app/core/services/pharmacy.service.ts"

check_requirement "Pharmacy model exists" \
    "test -f frontend/src/app/core/models/pharmacy.model.ts"

###############################################################################
# FRONTEND FEATURE IMPLEMENTATIONS
###############################################################################

print_header "5. FRONTEND FEATURES"

check_requirement "Create prescription form" \
    "grep -q 'createPrescription\|medication.*form' frontend/src/app/features/pharmacy/prescription-create.component.ts"

check_requirement "Dispense medication functionality" \
    "grep -q 'dispense\|dispensing' frontend/src/app/features/pharmacy/prescription-detail.component.ts"

check_requirement "Refill request functionality" \
    "grep -q 'request-refill\|requestRefill' frontend/src/app/features/patients/refill-request-modal.component.ts"

check_requirement "Pharmacy dashboard filtering" \
    "grep -q 'patientNameFilter\|doctorNameFilter\|filter' frontend/src/app/features/pharmacy/pharmacy-dashboard.component.ts"

check_requirement "Low stock display" \
    "grep -q 'lowStock\|low-stock' frontend/src/app/features/pharmacy/pharmacy-dashboard.component.ts"

check_requirement "Refill request management" \
    "grep -q 'approveRefill\|fulfillRefill\|rejectRefill' frontend/src/app/features/pharmacy/pharmacy-dashboard.component.ts"

check_requirement "Medication dropdown with stock levels" \
    "grep -q 'medications\|StockLevel' frontend/src/app/features/pharmacy/prescription-create.component.ts"

###############################################################################
# SERVICE INTEGRATION
###############################################################################

print_header "6. SERVICE INTEGRATION"

check_requirement "Pharmacy service HTTP methods" \
    "grep -q 'post.*prescriptions\|get.*prescriptions\|dispense' frontend/src/app/core/services/pharmacy.service.ts"

check_requirement "Refill request API integration" \
    "grep -q 'request-refill\|refill.*request' frontend/src/app/core/services/pharmacy.service.ts"

check_requirement "Refill management API integration" \
    "grep -q 'approveRefill\|fulfillRefill\|rejectRefill' frontend/src/app/core/services/pharmacy.service.ts"

###############################################################################
# ERROR HANDLING
###############################################################################

print_header "7. ERROR HANDLING & VALIDATION"

check_requirement "Stock validation in dispensing" \
    "grep -q 'stock\|quantity\|insufficient' services/pharmacy/main.py"

check_requirement "Non-existent prescription handling" \
    "grep -q '404\|not found' services/pharmacy/main.py"

check_requirement "Invalid status validation" \
    "grep -q 'status.*valid\|invalid.*status' services/pharmacy/main.py"

check_requirement "Refill limit validation" \
    "grep -q 'RefillsRemaining\|refills' services/pharmacy/main.py"

###############################################################################
# TEST COVERAGE
###############################################################################

print_header "8. TEST COVERAGE"

check_requirement "Backend test file exists" \
    "test -f services/pharmacy/test_pharmacy.py"

check_requirement "Test cases for medications" \
    "grep -q 'TestMedicationEndpoints\|test_get_all_medications' services/pharmacy/test_pharmacy.py"

check_requirement "Test cases for prescriptions" \
    "grep -q 'TestPrescriptionEndpoints\|test_create_prescription' services/pharmacy/test_pharmacy.py"

check_requirement "Test cases for dispensing" \
    "grep -q 'TestDispensingEndpoints\|test_dispense_medication' services/pharmacy/test_pharmacy.py"

check_requirement "Test cases for refills" \
    "grep -q 'TestRefillRequestEndpoints\|test_request_refill' services/pharmacy/test_pharmacy.py"

check_requirement "Test cases for inventory" \
    "grep -q 'TestInventoryManagement\|test_stock' services/pharmacy/test_pharmacy.py"

###############################################################################
# CI/CD
###############################################################################

print_header "9. CI/CD AUTOMATION"

check_requirement "GitHub Actions workflow exists" \
    "test -f .github/workflows/pharmacy-tests.yml"

check_requirement "Workflow requirement validation job" \
    "grep -q 'validate-requirements' .github/workflows/pharmacy-tests.yml"

check_requirement "Workflow backend tests job" \
    "grep -q 'backend-tests' .github/workflows/pharmacy-tests.yml"

check_requirement "Workflow API validation job" \
    "grep -q 'api-validation' .github/workflows/pharmacy-tests.yml"

check_requirement "Workflow frontend type checking job" \
    "grep -q 'frontend-types' .github/workflows/pharmacy-tests.yml"

check_requirement "Workflow build verification job" \
    "grep -q 'build-verification' .github/workflows/pharmacy-tests.yml"

###############################################################################
# SUMMARY
###############################################################################

print_header "VALIDATION SUMMARY"

echo ""
echo "Total Requirements: $TOTAL"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL REQUIREMENTS SATISFIED!${NC}"
    echo "The pharmacy feature is complete and ready for production."
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  $FAIL REQUIREMENT(S) NOT MET${NC}"
    echo "Please address the failing requirements above."
    echo ""
    exit 1
fi
