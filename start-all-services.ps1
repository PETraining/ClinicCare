# Start all ClinicCare microservices
$servicesDir = "C:\Users\Administrator\Documents\GitHub\ClinicCare\services"

$services = @(
  @{ name = "patient"; port = 8001 },
  @{ name = "doctors"; port = 8002 },
  @{ name = "referral"; port = 8003 },
  @{ name = "appointment"; port = 8007 },
  @{ name = "questionnaire"; port = 8008 }
)

# Start gateway last
Write-Host "Starting microservices..." -ForegroundColor Cyan

foreach ($service in $services) {
  $servicePath = "$servicesDir\$($service.name)"
  Write-Host "Starting $($service.name) service on port $($service.port)..." -ForegroundColor Yellow

  Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn main:app --reload --port $($service.port)" -WorkingDirectory $servicePath
  Start-Sleep -Milliseconds 500
}

# Start gateway
$gatewayPath = "C:\Users\Administrator\Documents\GitHub\ClinicCare\gateway"
Write-Host "Starting API Gateway on port 8000..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn main:app --reload --port 8000" -WorkingDirectory $gatewayPath

Write-Host "All services starting... waiting for startup..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Verify services are running
Write-Host "Verifying services..." -ForegroundColor Cyan
$services += @{ name = "gateway"; port = 8000 }
$services += @{ name = "frontend"; port = 4300 }

foreach ($service in $services) {
  try {
    $url = "http://localhost:$($service.port)"
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 1 -ErrorAction SilentlyContinue
    Write-Host "✅ $($service.name) is running on port $($service.port)" -ForegroundColor Green
  } catch {
    Write-Host "⏳ $($service.name) still starting..." -ForegroundColor Yellow
  }
}
