# ClinicCare - Start All Services (Backend + Frontend)
# This script starts all microservices and the Angular frontend in one command

param(
  [switch]$NoFrontend,
  [switch]$Docker,
  [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ClinicCarePath = "C:\Users\Administrator\Documents\GitHub\ClinicCare"
$servicesDir = "$ClinicCarePath\services"

# Color helpers
function Write-Title { Write-Host $args[0] -ForegroundColor Cyan -BackgroundColor Black }
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args[0] -ForegroundColor Red }

Write-Title "════════════════════════════════════════════════════════"
Write-Title "     ClinicCare - Starting All Services"
Write-Title "════════════════════════════════════════════════════════"
Write-Host ""

# Check if Docker flag is set
if ($Docker) {
  Write-Title "Starting with Docker Compose..."
  Write-Host ""
  docker-compose up --build
  exit
}

# Define all services
$services = @(
  @{ name = "patient"; port = 8001; dir = "$servicesDir\patient" },
  @{ name = "doctors"; port = 8002; dir = "$servicesDir\doctors" },
  @{ name = "referral"; port = 8003; dir = "$servicesDir\referral" },
  @{ name = "document"; port = 8004; dir = "$servicesDir\document" },
  @{ name = "notification"; port = 8005; dir = "$servicesDir\notification" }
)

$gateway = @{ name = "gateway"; port = 8000; dir = "$ClinicCarePath\gateway" }

# Step 1: Setup Python Environment
Write-Title "STEP 1: Checking Python Environment"
Write-Host ""

$pythonCheck = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error-Custom "❌ Python is not installed or not in PATH"
  Write-Host "Please install Python 3.9+ and add it to your PATH"
  exit 1
}
Write-Success "✅ $pythonCheck"

# Activate virtual environment if it exists
if (Test-Path "$ClinicCarePath\.venv\Scripts\Activate.ps1") {
  Write-Host "Activating virtual environment..."
  & "$ClinicCarePath\.venv\Scripts\Activate.ps1"
  Write-Success "✅ Virtual environment activated"
} else {
  Write-Warning "⚠️  Virtual environment not found. Creating one..."
  Push-Location $ClinicCarePath
  python -m venv .venv
  & "$ClinicCarePath\.venv\Scripts\Activate.ps1"
  Write-Success "✅ Virtual environment created and activated"
  Pop-Location
}

# Install Python dependencies if needed
Write-Host "Checking Python dependencies..."
$requirementsFile = "$ClinicCarePath\requirements.txt"
if (Test-Path $requirementsFile) {
  pip install -q -r $requirementsFile 2>$null
  Write-Success "✅ Python dependencies ready"
}

Write-Host ""

# Step 2: Start Backend Services
Write-Title "STEP 2: Starting Backend Microservices"
Write-Host ""

$processIds = @()

# Start each service
foreach ($service in $services) {
  if (-not (Test-Path $service.dir)) {
    Write-Warning "⚠️  Service directory not found: $($service.dir)"
    continue
  }

  Write-Host "Starting $($service.name) service (port $($service.port))..."

  try {
    $process = Start-Process `
      -FilePath "python" `
      -ArgumentList "-m uvicorn main:app --reload --port $($service.port)" `
      -WorkingDirectory $service.dir `
      -NoNewWindow `
      -PassThru `
      -ErrorAction Stop

    $processIds += @{ name = $service.name; id = $process.Id; port = $service.port }
    Write-Success "  ✅ PID: $($process.Id)"
  } catch {
    Write-Error-Custom "  ❌ Failed to start $($service.name): $_"
  }

  Start-Sleep -Milliseconds 300
}

# Start Gateway
Write-Host "Starting API Gateway (port $($gateway.port))..."
try {
  $gatewayProcess = Start-Process `
    -FilePath "python" `
    -ArgumentList "-m uvicorn main:app --reload --port $($gateway.port)" `
    -WorkingDirectory $gateway.dir `
    -NoNewWindow `
    -PassThru `
    -ErrorAction Stop

  $processIds += @{ name = "gateway"; id = $gatewayProcess.Id; port = $gateway.port }
  Write-Success "  ✅ PID: $($gatewayProcess.Id)"
} catch {
  Write-Error-Custom "  ❌ Failed to start gateway: $_"
}

Write-Host ""

# Step 3: Setup Frontend
Write-Title "STEP 3: Preparing Frontend"
Write-Host ""

$frontendDir = "$ClinicCarePath\frontend"

if (-not $NoFrontend) {
  if (-not (Test-Path "$frontendDir\node_modules")) {
    Write-Host "Installing npm dependencies (this may take a minute)..."
    Push-Location $frontendDir
    npm install --silent
    Pop-Location
    Write-Success "✅ npm dependencies installed"
  } else {
    Write-Success "✅ npm dependencies already installed"
  }

  Write-Host ""
  Write-Host "Starting Angular frontend (port 4300)..."

  try {
    $frontendProcess = Start-Process `
      -FilePath "npm" `
      -ArgumentList "start" `
      -WorkingDirectory $frontendDir `
      -NoNewWindow `
      -PassThru `
      -ErrorAction Stop

    Write-Success "  ✅ PID: $($frontendProcess.Id)"
    $processIds += @{ name = "frontend"; id = $frontendProcess.Id; port = 4300 }
  } catch {
    Write-Error-Custom "  ❌ Failed to start frontend: $_"
  }
} else {
  Write-Warning "⚠️  Frontend skipped (use without -NoFrontend to start it)"
}

Write-Host ""

# Step 4: Wait for services to start and verify
Write-Title "STEP 4: Waiting for Services to Start"
Write-Host ""

Start-Sleep -Seconds 3

$allRunning = $true
foreach ($service in $processIds) {
  $maxRetries = 5
  $retry = 0
  $running = $false

  while ($retry -lt $maxRetries -and -not $running) {
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$($service.port)" `
        -TimeoutSec 1 `
        -ErrorAction SilentlyContinue

      if ($response.StatusCode -eq 200 -or $null -ne $response) {
        Write-Success "✅ $($service.name.PadRight(15)) running on port $($service.port)"
        $running = $true
      }
    } catch {
      $retry++
      if ($retry -lt $maxRetries) {
        Start-Sleep -Milliseconds 500
      }
    }
  }

  if (-not $running) {
    Write-Warning "⏳ $($service.name.PadRight(15)) still starting... (check logs if it doesn't start)"
    $allRunning = $false
  }
}

Write-Host ""

# Step 5: Display Summary
Write-Title "════════════════════════════════════════════════════════"
Write-Title "✨ All Services Started!"
Write-Title "════════════════════════════════════════════════════════"
Write-Host ""

Write-Success "Backend Services (API):"
Write-Host "  [*] Gateway:           http://localhost:8000"
Write-Host "  [*] Patient Service:   http://localhost:8001"
Write-Host "  [*] Doctors Service:   http://localhost:8002"
Write-Host "  [*] Referral Service:  http://localhost:8003"
Write-Host "  [*] Document Service:  http://localhost:8004"
Write-Host "  [*] Notification Svc:  http://localhost:8005"
Write-Host ""

if (-not $NoFrontend) {
  Write-Success "Frontend:"
  Write-Host "  [WEB] Patient Portal:    http://localhost:4300"
  Write-Host ""
}

Write-Host "Running Processes:"
foreach ($proc in $processIds) {
  Write-Host "  - $($proc.name.PadRight(15)) (PID: $($proc.id))"
}

Write-Host ""
Write-Warning "INFO: To stop all services, run: Get-Process python, ng | Stop-Process"
Write-Warning "      Or manually close the terminal windows"
Write-Host ""

# Display next steps
Write-Title "Next Steps:"
Write-Host ""
if (-not $NoFrontend) {
  Write-Host "1. Open http://localhost:4300 in your browser"
  Write-Host "2. Log in to the Patient Portal"
  Write-Host "3. Start using the application"
} else {
  Write-Host "1. Frontend was not started. Run without -NoFrontend to start it"
  Write-Host "2. Use the API endpoints listed above for testing"
}

Write-Host ""
Write-Host "Logs will appear in the service windows as they process requests."
Write-Host ""
