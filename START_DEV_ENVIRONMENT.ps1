# ClinicCare Patient Portal Development Environment Startup Script
# Run this in PowerShell to start all services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ClinicCare Patient Portal Dev Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$basePath = "C:\Users\Administrator\Documents\GitHub\ClinicCare"

# Kill any existing processes on these ports
Write-Host "Clearing ports..." -ForegroundColor Yellow
@(8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 4200, 4201, 4300) | ForEach-Object {
    Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue |
    ForEach-Object { Get-Process | Where-Object { $_.Id -eq $_.OwningProcess } | Stop-Process -Force -ErrorAction SilentlyContinue }
}

Start-Sleep -Seconds 2

# Array of services to start
$services = @(
    @{Name = "appointment-service"; Port = "8007"; Path = "$basePath\services\appointments"},
    @{Name = "questionnaire-service"; Port = "8008"; Path = "$basePath\services\questionnaire"},
    @{Name = "gateway"; Port = "8000"; Path = "$basePath\gateway"}
)

Write-Host "Starting Backend Services..." -ForegroundColor Cyan
Write-Host ""

# Start each service
foreach ($service in $services) {
    $job = Start-Job -Name $service.Name -ScriptBlock {
        param($path, $port, $name)
        Set-Location $path
        Write-Host "[$name] Starting on port $port..." -ForegroundColor Green
        python -m uvicorn main:app --reload --port $port
    } -ArgumentList $service.Path, $service.Port, $service.Name

    Write-Host "  OK $($service.Name) started" -ForegroundColor Green
}

Start-Sleep -Seconds 5

# Start Frontend
Write-Host ""
Write-Host "Starting Frontend Dev Server..." -ForegroundColor Cyan
$frontendJob = Start-Job -Name "frontend" -ScriptBlock {
    Set-Location "$using:basePath\frontend"
    Write-Host "[frontend] Starting on port 4300..." -ForegroundColor Green
    & npm start -- --port 4300
}

Write-Host "  ✓ Frontend starting (Job ID: $($frontendJob.Id))" -ForegroundColor Green

Start-Sleep -Seconds 20

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test each service
$services += @{Name = "frontend"; Port = "4300"}

foreach ($service in $services) {
    try {
        $port = $service.Port
        $response = Invoke-WebRequest -Uri "http://localhost:$port/" -TimeoutSec 1 -ErrorAction Stop
        Write-Host "  ✅ $($service.Name) - http://localhost:$port/" -ForegroundColor Green
    } catch {
        Write-Host "  ⏳ $($service.Name) - Starting (http://localhost:$($service.Port)/)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PATIENT PORTAL READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:4300/patient-portal/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Direct Testing Links:" -ForegroundColor Cyan
Write-Host "  1. View Referrals:           http://localhost:4300/patient-portal/referrals" -ForegroundColor White
Write-Host "  2. View Appointments:        http://localhost:4300/patient-portal/referrals/5" -ForegroundColor White
Write-Host "  3. Download Documents:      http://localhost:4300/patient-portal/referrals/5 (scroll)" -ForegroundColor White
Write-Host "  4. Upload Forms:             http://localhost:4300/patient-portal/documents/upload" -ForegroundColor White
Write-Host "  5. Complete Questionnaires: http://localhost:4300/patient-portal/referrals/5 (scroll)" -ForegroundColor White
Write-Host "  6. Track Referrals:          http://localhost:4300/patient-portal/referrals/5 (scroll)" -ForegroundColor White
Write-Host ""
Write-Host "Running jobs:" -ForegroundColor Cyan
Get-Job | Select-Object Name, State | Format-Table -AutoSize
Write-Host ""
Write-Host "To stop all services, run:" -ForegroundColor Yellow
Write-Host "  Get-Job | Stop-Job" -ForegroundColor Gray
Write-Host ""
