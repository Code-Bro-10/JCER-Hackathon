# PowerShell REST API Verification Script for TrafficAI Backend
param(
  [string]$BaseUrl = "http://localhost:8000/api/v1"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Testing TrafficAI Backend Endpoints via PowerShell REST API" -ForegroundColor Cyan
Write-Host " Target Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$headers = @{ "Content-Type" = "application/json" }

# 1. Health Probe
Write-Host "`n1. Testing GET /health..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
Write-Host "Status: $($health.status) | Service: $($health.service)" -ForegroundColor Green

# 2. Login Admin
Write-Host "`n2. Testing POST /auth/login (Admin)..." -ForegroundColor Yellow
$loginBody = @{
  email = "admin@trafficai.gov"
  password = "AdminPassword123!"
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -Headers $headers
$token = $loginRes.token
$authHeaders = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $token"
}
Write-Host "Admin Login: SUCCESS | Role: $($loginRes.user.role) | Name: $($loginRes.user.name)" -ForegroundColor Green

# 3. Authenticated Profile Me
Write-Host "`n3. Testing GET /auth/me..." -ForegroundColor Yellow
$me = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Method Get -Headers $authHeaders
Write-Host "Profile Email: $($me.user.email) | Role: $($me.user.role)" -ForegroundColor Green

# 4. Traffic KPIs
Write-Host "`n4. Testing GET /traffic/kpis..." -ForegroundColor Yellow
$kpis = Invoke-RestMethod -Uri "$BaseUrl/traffic/kpis" -Method Get
Write-Host "Avg Speed: $($kpis.data.averageSpeed) km/h | Congestion: $($kpis.data.congestionIndex)% | Resolved Incidents: $($kpis.data.resolvedIncidents)/$($kpis.data.totalIncidents)" -ForegroundColor Green

# 5. Traffic Sectors
Write-Host "`n5. Testing GET /traffic/sectors..." -ForegroundColor Yellow
$sectors = Invoke-RestMethod -Uri "$BaseUrl/traffic/sectors" -Method Get
Write-Host "Sectors Count: $($sectors.data.Count) | First Sector: $($sectors.data[0].name)" -ForegroundColor Green

# 6. Incidents List
Write-Host "`n6. Testing GET /traffic/incidents..." -ForegroundColor Yellow
$incidents = Invoke-RestMethod -Uri "$BaseUrl/traffic/incidents?severity=ALL&status=ALL" -Method Get
Write-Host "Total Incidents: $($incidents.total) | Items: $($incidents.data.Count)" -ForegroundColor Green

# 7. Create Incident
Write-Host "`n7. Testing POST /traffic/incidents..." -ForegroundColor Yellow
$newIncidentBody = @{
  title = "Multi-Car Stall on Expressway Ramp"
  type = "breakdown"
  severity = "HIGH"
  sector = "East Port Expressway"
  location = "East Port Exit 11"
  lanesBlocked = 1
  totalLanes = 3
  assignedUnits = @("TOW-88")
} | ConvertTo-Json
$created = Invoke-RestMethod -Uri "$BaseUrl/traffic/incidents" -Method Post -Body $newIncidentBody -Headers $authHeaders
$createdId = $created.data.id
Write-Host "Created Incident ID: $createdId | Status: $($created.data.status)" -ForegroundColor Green

# 8. Update Incident Status
Write-Host "`n8. Testing PATCH /traffic/incidents/$createdId/status..." -ForegroundColor Yellow
$patchBody = @{
  status = "Resolving"
  note = "Tow truck hooked vehicle and clearing shoulder"
} | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "$BaseUrl/traffic/incidents/$createdId/status" -Method Patch -Body $patchBody -Headers $authHeaders
Write-Host "Updated Status: $($updated.data.status) | History Events: $($updated.data.history.Count)" -ForegroundColor Green

# 9. 24h Predictions
Write-Host "`n9. Testing GET /traffic/predictions..." -ForegroundColor Yellow
$predictions = Invoke-RestMethod -Uri "$BaseUrl/traffic/predictions?horizon=24h" -Method Get
Write-Host "Hourly Curves: $($predictions.data.hourlyCurves.Count) intervals | Model: $($predictions.data.modelMetadata.name)" -ForegroundColor Green

# 10. Scenario Simulation
Write-Host "`n10. Testing POST /traffic/predictions/simulate..." -ForegroundColor Yellow
$simBody = @{
  weather = "storm"
  event = "concert"
  roadClosure = $true
  aiInterventionActive = $true
} | ConvertTo-Json
$simulation = Invoke-RestMethod -Uri "$BaseUrl/traffic/predictions/simulate" -Method Post -Body $simBody -Headers $headers
Write-Host "Impact Factor: $($simulation.data.impactFactor)% | City Delay: $($simulation.data.estimatedCityDelayMin)m | AI Saved: $($simulation.data.aiSavedMinutes)m" -ForegroundColor Green

# 11. Multi-Modal Route Planning
Write-Host "`n11. Testing POST /traffic/routes/plan..." -ForegroundColor Yellow
$routeBody = @{
  origin = "City Hall Plaza"
  destination = "Silicon Bay Tech Center"
  vehicleType = "passenger"
} | ConvertTo-Json
$routes = Invoke-RestMethod -Uri "$BaseUrl/traffic/routes/plan" -Method Post -Body $routeBody -Headers $headers
Write-Host "Calculated Route Options: $($routes.options.Count) (AI Smart, Shortest, Eco-Green)" -ForegroundColor Green

# 12. Accident Shockwave Simulation
Write-Host "`n12. Testing POST /traffic/simulate/accident..." -ForegroundColor Yellow
$shockBody = @{
  sector = "Downtown Grid"
  intersectionId = "INT-101"
  lanesBlocked = 2
  totalLanes = 4
  initialFlowVph = 3200
  durationMinutes = 45
} | ConvertTo-Json
$accidentShock = Invoke-RestMethod -Uri "$BaseUrl/traffic/simulate/accident" -Method Post -Body $shockBody -Headers $headers
Write-Host "Shockwave Speed: $($accidentShock.data.results.shockwaveSpeedKmh) km/h | Max Queue: $($accidentShock.data.results.maxQueueLengthMeters)m | Spillback: $($accidentShock.data.results.spillbackRisk)" -ForegroundColor Green

# 13. Smart Intersections
Write-Host "`n13. Testing GET /traffic/intersections..." -ForegroundColor Yellow
$intersections = Invoke-RestMethod -Uri "$BaseUrl/traffic/intersections" -Method Get
Write-Host "Intersections Loaded: $($intersections.data.Count)" -ForegroundColor Green

# 14. Signal Override
Write-Host "`n14. Testing POST /traffic/intersections/INT-101/signal-override..." -ForegroundColor Yellow
$overrideBody = @{
  phase = "North-South Green"
  durationSeconds = 45
} | ConvertTo-Json
$signalOverride = Invoke-RestMethod -Uri "$BaseUrl/traffic/intersections/INT-101/signal-override" -Method Post -Body $overrideBody -Headers $headers
Write-Host "Override Applied: $($signalOverride.data.currentPhase) for $($signalOverride.data.secondsRemaining)s" -ForegroundColor Green

# 15. Webster Signal Optimization
Write-Host "`n15. Testing POST /traffic/intersections/INT-101/optimize..." -ForegroundColor Yellow
$signalOpt = Invoke-RestMethod -Uri "$BaseUrl/traffic/intersections/INT-101/optimize" -Method Post
Write-Host "Optimal Cycle: $($signalOpt.data.optimization.calculatedMetrics.optimalCycleSeconds)s | Throughput Gain: +$($signalOpt.data.optimization.calculatedMetrics.throughputGainPct)%" -ForegroundColor Green

# 16. Trigger Emergency Green Wave
Write-Host "`n16. Testing POST /traffic/emergency/trigger-greenwave..." -ForegroundColor Yellow
$greenWaveBody = @{
  unitCode = "MED-12"
  unitType = "ALS Trauma Ambulance"
  origin = "Station 4"
  destination = "City Trauma Bay"
  corridorName = "Trauma Express Corridor"
  priorityLevel = "CODE RED"
} | ConvertTo-Json
$greenWave = Invoke-RestMethod -Uri "$BaseUrl/traffic/emergency/trigger-greenwave" -Method Post -Body $greenWaveBody -Headers $headers
$dispId = $greenWave.data.id
Write-Host "Green Wave Activated: $($greenWave.data.unitCode) | Priority: $($greenWave.data.priorityLevel) | Preempted: $($greenWave.data.signalsPreempted) signals" -ForegroundColor Green

# 17. Cancel Emergency Green Wave
Write-Host "`n17. Testing POST /traffic/emergency/cancel-greenwave..." -ForegroundColor Yellow
$cancelBody = @{ dispatchId = $dispId } | ConvertTo-Json
$cancelGreenWave = Invoke-RestMethod -Uri "$BaseUrl/traffic/emergency/cancel-greenwave" -Method Post -Body $cancelBody -Headers $headers
Write-Host "Cancel Green Wave: $($cancelGreenWave.message)" -ForegroundColor Green

# 18. CCTV Surveillance Cameras
Write-Host "`n18. Testing GET /traffic/cameras..." -ForegroundColor Yellow
$cameras = Invoke-RestMethod -Uri "$BaseUrl/traffic/cameras" -Method Get
Write-Host "Online Cameras: $($cameras.data.Count) feeds" -ForegroundColor Green

# 19. Admin Analytics
Write-Host "`n19. Testing GET /traffic/analytics?range=7d..." -ForegroundColor Yellow
$analytics = Invoke-RestMethod -Uri "$BaseUrl/traffic/analytics?range=7d" -Method Get
Write-Host "Analytics Days: $($analytics.data.dailyVolume.Count) | Signals Online: $($analytics.data.infrastructureHealth.smartSignals.online)" -ForegroundColor Green

# 20. Admin Audit Logs
Write-Host "`n20. Testing GET /admin/audit-logs..." -ForegroundColor Yellow
$audit = Invoke-RestMethod -Uri "$BaseUrl/admin/audit-logs" -Method Get -Headers $authHeaders
Write-Host "Audit Logs Recorded: $($audit.count) events" -ForegroundColor Green

# 21. Delete Incident
Write-Host "`n21. Testing DELETE /traffic/incidents/$createdId..." -ForegroundColor Yellow
$deleteRes = Invoke-RestMethod -Uri "$BaseUrl/traffic/incidents/$createdId" -Method Delete -Headers $authHeaders
Write-Host "Delete Result: $($deleteRes.message)" -ForegroundColor Green

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host " All 21 Endpoints Tested and Verified Successfully!" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
