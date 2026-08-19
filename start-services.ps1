Write-Host "Starting ClinicCare Services..." -ForegroundColor Cyan

$basePath = "C:\Users\Administrator\Documents\GitHub\ClinicCare"

# Kill existing processes
@(8000, 8007, 8008, 4300) | ForEach-Object {
    Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue | ForEach-Object {
        Get-Process | Where-Object { $_.Id -eq $_.OwningProcess } | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

# Start services
Write-Host "Starting Appointment Service (8007)..." -ForegroundColor Green
Start-Job -Name "appointments" -ScriptBlock {
    cd "C:\Users\Administrator\Documents\GitHub\ClinicCare\services\appointments"
    python -m uvicorn main:app --reload --port 8007
} | Out-Null

Write-Host "Starting Questionnaire Service (8008)..." -ForegroundColor Green
Start-Job -Name "questionnaire" -ScriptBlock {
    cd "C:\Users\Administrator\Documents\GitHub\ClinicCare\services\questionnaire"
    python -m uvicorn main:app --reload --port 8008
} | Out-Null

Write-Host "Starting Gateway (8000)..." -ForegroundColor Green
Start-Job -Name "gateway" -ScriptBlock {
    cd "C:\Users\Administrator\Documents\GitHub\ClinicCare\gateway"
    python -m uvicorn main:app --reload --port 8000
} | Out-Null

Write-Host "Starting Frontend (4300)..." -ForegroundColor Green
Start-Job -Name "frontend" -ScriptBlock {
    cd "C:\Users\Administrator\Documents\GitHub\ClinicCare\frontend"
    npm start -- --port 4300
} | Out-Null

Start-Sleep -Seconds 10

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Services Starting" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Get-Job | Select-Object Name, State | Format-Table -AutoSize

Write-Host ""
Write-Host "Open in browser:" -ForegroundColor Yellow
Write-Host "  http://localhost:4300/patient-portal/login" -ForegroundColor Cyan
