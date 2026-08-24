#!/bin/bash

# ClinicCare - Start All Services (Backend + Frontend)
# Usage: ./start-all.sh [--no-frontend] [--docker] [--verbose]

set -e

CLINIC_CARE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$CLINIC_CARE_PATH/services"
NO_FRONTEND=false
USE_DOCKER=false
VERBOSE=false

# Color helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

write_title() {
  echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
}

write_success() {
  echo -e "${GREEN}$1${NC}"
}

write_warning() {
  echo -e "${YELLOW}$1${NC}"
}

write_error() {
  echo -e "${RED}$1${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-frontend)
      NO_FRONTEND=true
      shift
      ;;
    --docker)
      USE_DOCKER=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

write_title "     ClinicCare - Starting All Services"
echo ""

# Check if Docker flag is set
if [ "$USE_DOCKER" = true ]; then
  write_title "Starting with Docker Compose..."
  echo ""
  docker-compose up --build
  exit 0
fi

# Step 1: Check Python
write_title "STEP 1: Checking Python Environment"
echo ""

if ! command -v python3 &> /dev/null; then
  write_error "❌ Python 3 is not installed"
  echo "Please install Python 3.9+ and add it to your PATH"
  exit 1
fi

PYTHON_VERSION=$(python3 --version)
write_success "✅ $PYTHON_VERSION"

# Setup Python virtual environment
if [ -d "$CLINIC_CARE_PATH/.venv" ]; then
  write_success "✅ Virtual environment found"
  source "$CLINIC_CARE_PATH/.venv/bin/activate"
else
  write_warning "⚠️  Creating virtual environment..."
  python3 -m venv "$CLINIC_CARE_PATH/.venv"
  source "$CLINIC_CARE_PATH/.venv/bin/activate"
  write_success "✅ Virtual environment created"
fi

# Install Python dependencies
if [ -f "$CLINIC_CARE_PATH/requirements.txt" ]; then
  echo "Installing Python dependencies..."
  pip install -q -r "$CLINIC_CARE_PATH/requirements.txt" 2>/dev/null || true
  write_success "✅ Python dependencies ready"
fi

echo ""

# Step 2: Start Backend Services
write_title "STEP 2: Starting Backend Microservices"
echo ""

declare -a PIDS=()

services=("patient:8001" "doctors:8002" "referral:8003" "document:8004" "notification:8005")

for service_config in "${services[@]}"; do
  IFS=':' read -r service port <<< "$service_config"
  service_dir="$SERVICES_DIR/$service"

  if [ ! -d "$service_dir" ]; then
    write_warning "⚠️  Service directory not found: $service_dir"
    continue
  fi

  echo "Starting $service service (port $port)..."

  cd "$service_dir"
  python3 -m uvicorn main:app --reload --port $port > /dev/null 2>&1 &
  PID=$!
  PIDS+=($PID)
  write_success "  ✅ PID: $PID"
  sleep 0.3
done

# Start Gateway
echo "Starting API Gateway (port 8000)..."
cd "$CLINIC_CARE_PATH/gateway"
python3 -m uvicorn main:app --reload --port 8000 > /dev/null 2>&1 &
GATEWAY_PID=$!
PIDS+=($GATEWAY_PID)
write_success "  ✅ PID: $GATEWAY_PID"

echo ""

# Step 3: Setup Frontend
write_title "STEP 3: Preparing Frontend"
echo ""

FRONTEND_DIR="$CLINIC_CARE_PATH/frontend"

if [ "$NO_FRONTEND" = false ]; then
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "Installing npm dependencies (this may take a minute)..."
    cd "$FRONTEND_DIR"
    npm install --silent
    write_success "✅ npm dependencies installed"
  else
    write_success "✅ npm dependencies already installed"
  fi

  echo ""
  echo "Starting Angular frontend (port 4300)..."
  cd "$FRONTEND_DIR"
  npm start > /dev/null 2>&1 &
  FRONTEND_PID=$!
  PIDS+=($FRONTEND_PID)
  write_success "  ✅ PID: $FRONTEND_PID"
else
  write_warning "⚠️  Frontend skipped (remove --no-frontend to start it)"
fi

echo ""

# Step 4: Wait for services and verify
write_title "STEP 4: Waiting for Services to Start"
echo ""

sleep 3

ports=("8000:gateway" "8001:patient" "8002:doctors" "8003:referral" "8004:document" "8005:notification")
if [ "$NO_FRONTEND" = false ]; then
  ports+=("4300:frontend")
fi

for port_config in "${ports[@]}"; do
  IFS=':' read -r port name <<< "$port_config"
  max_retries=5
  retry=0
  running=false

  while [ $retry -lt $max_retries ] && [ "$running" = false ]; do
    if timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null; then
      write_success "✅ $name (port $port) is running"
      running=true
    else
      retry=$((retry + 1))
      if [ $retry -lt $max_retries ]; then
        sleep 0.5
      fi
    fi
  done

  if [ "$running" = false ]; then
    write_warning "⏳ $name (port $port) still starting..."
  fi
done

echo ""

# Step 5: Display Summary
write_title "✨ All Services Started!"
echo ""

write_success "Backend Services (API):"
echo "  📍 Gateway:           http://localhost:8000"
echo "  📍 Patient Service:   http://localhost:8001"
echo "  📍 Doctors Service:   http://localhost:8002"
echo "  📍 Referral Service:  http://localhost:8003"
echo "  📍 Document Service:  http://localhost:8004"
echo "  📍 Notification Svc:  http://localhost:8005"
echo ""

if [ "$NO_FRONTEND" = false ]; then
  write_success "Frontend:"
  echo "  🌐 Patient Portal:    http://localhost:4300"
  echo ""
fi

write_success "Running Processes (PIDs): ${PIDS[@]}"
echo ""

write_warning "ℹ️  To stop all services, run: kill ${PIDS[@]}"
write_warning "    Or press Ctrl+C to stop this script"
echo ""

write_title "Next Steps:"
echo ""
if [ "$NO_FRONTEND" = false ]; then
  echo "1. Open http://localhost:4300 in your browser"
  echo "2. Log in to the Patient Portal"
  echo "3. Start using the application"
else
  echo "1. Frontend was not started. Run without --no-frontend to start it"
  echo "2. Use the API endpoints listed above for testing"
fi

echo ""
echo "Logs will appear as services process requests."
echo ""

# Keep the script running and allow Ctrl+C to stop
wait
