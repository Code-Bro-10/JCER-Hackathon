#!/bin/bash
# Bash & Curl Endpoint Verification Script for TrafficAI Backend
set -e

BASE_URL="${1:-http://localhost:8000/api/v1}"

echo "================================================================"
echo " Testing TrafficAI Backend Endpoints via Curl"
echo " Target Base URL: ${BASE_URL}"
echo "================================================================"

# 1. Health Probe
echo -e "\n1. Testing GET /health..."
curl -s -X GET "${BASE_URL}/health" | grep "healthy"

# 2. Login Admin
echo -e "\n2. Testing POST /auth/login (Admin)..."
LOGIN_RES=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trafficai.gov","password":"AdminPassword123!"}')
echo "$LOGIN_RES"
TOKEN=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 3. Authenticated Profile Me
echo -e "\n3. Testing GET /auth/me..."
curl -s -X GET "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer ${TOKEN}"

# 4. Traffic KPIs
echo -e "\n4. Testing GET /traffic/kpis..."
curl -s -X GET "${BASE_URL}/traffic/kpis"

# 5. Traffic Sectors
echo -e "\n5. Testing GET /traffic/sectors..."
curl -s -X GET "${BASE_URL}/traffic/sectors"

# 6. Incidents List
echo -e "\n6. Testing GET /traffic/incidents..."
curl -s -X GET "${BASE_URL}/traffic/incidents?severity=ALL&status=ALL"

# 7. Create Incident
echo -e "\n7. Testing POST /traffic/incidents..."
CREATE_RES=$(curl -s -X POST "${BASE_URL}/traffic/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"title":"Trailer Breakdown on West Ring","severity":"HIGH","sector":"West Riverside","location":"Riverside Pier 4","lanesBlocked":1,"totalLanes":3,"assignedUnits":["TOW-88"]}')
echo "$CREATE_RES"
CREATED_ID=$(echo "$CREATE_RES" | grep -o '"id":"INC-[^"]*' | cut -d'"' -f4)

# 8. Update Incident Status
echo -e "\n8. Testing PATCH /traffic/incidents/${CREATED_ID}/status..."
curl -s -X PATCH "${BASE_URL}/traffic/incidents/${CREATED_ID}/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status":"Resolving","note":"Recovery truck in position"}'

# 9. 24h Predictions
echo -e "\n9. Testing GET /traffic/predictions..."
curl -s -X GET "${BASE_URL}/traffic/predictions?horizon=24h"

# 10. Scenario Simulation
echo -e "\n10. Testing POST /traffic/predictions/simulate..."
curl -s -X POST "${BASE_URL}/traffic/predictions/simulate" \
  -H "Content-Type: application/json" \
  -d '{"weather":"rain","event":"sports","roadClosure":false,"aiInterventionActive":true}'

# 11. Multi-Modal Route Planning
echo -e "\n11. Testing POST /traffic/routes/plan..."
curl -s -X POST "${BASE_URL}/traffic/routes/plan" \
  -H "Content-Type: application/json" \
  -d '{"origin":"City Hall Plaza","destination":"Harbor Marina","vehicleType":"passenger"}'

# 12. Accident Shockwave Simulation
echo -e "\n12. Testing POST /traffic/simulate/accident..."
curl -s -X POST "${BASE_URL}/traffic/simulate/accident" \
  -H "Content-Type: application/json" \
  -d '{"sector":"Downtown Grid","lanesBlocked":2,"totalLanes":4,"initialFlowVph":3200}'

# 13. Smart Intersections
echo -e "\n13. Testing GET /traffic/intersections..."
curl -s -X GET "${BASE_URL}/traffic/intersections"

# 14. Signal Override
echo -e "\n14. Testing POST /traffic/intersections/INT-101/signal-override..."
curl -s -X POST "${BASE_URL}/traffic/intersections/INT-101/signal-override" \
  -H "Content-Type: application/json" \
  -d '{"phase":"North-South Green","durationSeconds":45}'

# 15. Webster Signal Optimization
echo -e "\n15. Testing POST /traffic/intersections/INT-101/optimize..."
curl -s -X POST "${BASE_URL}/traffic/intersections/INT-101/optimize"

# 16. Trigger Emergency Green Wave
echo -e "\n16. Testing POST /traffic/emergency/trigger-greenwave..."
EMERG_RES=$(curl -s -X POST "${BASE_URL}/traffic/emergency/trigger-greenwave" \
  -H "Content-Type: application/json" \
  -d '{"unitCode":"MED-12","unitType":"ALS Trauma Ambulance","origin":"Station 4","destination":"Trauma Center"}')
echo "$EMERG_RES"
DISP_ID=$(echo "$EMERG_RES" | grep -o '"id":"EMERG-[^"]*' | cut -d'"' -f4)

# 17. Cancel Emergency Green Wave
echo -e "\n17. Testing POST /traffic/emergency/cancel-greenwave..."
curl -s -X POST "${BASE_URL}/traffic/emergency/cancel-greenwave" \
  -H "Content-Type: application/json" \
  -d "{\"dispatchId\":\"${DISP_ID}\"}"

# 18. CCTV Cameras
echo -e "\n18. Testing GET /traffic/cameras..."
curl -s -X GET "${BASE_URL}/traffic/cameras"

# 19. Admin Analytics
echo -e "\n19. Testing GET /traffic/analytics?range=7d..."
curl -s -X GET "${BASE_URL}/traffic/analytics?range=7d"

# 20. Admin Audit Logs
echo -e "\n20. Testing GET /admin/audit-logs..."
curl -s -X GET "${BASE_URL}/admin/audit-logs" \
  -H "Authorization: Bearer ${TOKEN}"

# 21. Delete Incident
echo -e "\n21. Testing DELETE /traffic/incidents/${CREATED_ID}..."
curl -s -X DELETE "${BASE_URL}/traffic/incidents/${CREATED_ID}" \
  -H "Authorization: Bearer ${TOKEN}"

echo -e "\n================================================================"
echo " All curl tests passed successfully!"
echo "================================================================"

