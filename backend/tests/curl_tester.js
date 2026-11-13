/**
 * Curl & HTTP Endpoint Validator
 * Runs full integration verification against live TrafficAI server.
 */

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:8000/api/v1';

async function logStep(num, name, method, path, status, ok) {
  const symbol = ok ? '✓' : '✗';
  console.log(`[${symbol}] ${num}. [${method}] ${path} -> HTTP ${status} (${name})`);
}

export async function runCurlVerification() {
  console.log(`\n================================================================`);
  console.log(` TrafficAI API Endpoint Live Verification`);
  console.log(` Target Gateway: ${BASE_URL}`);
  console.log(`================================================================\n`);

  let passed = 0;
  let failed = 0;

  // 1. Health Probe
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    const ok = res.status === 200 && data.status === 'healthy';
    logStep(1, 'Health Probe', 'GET', '/health', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 1. GET /health failed:', err.message);
    failed++;
  }

  // 2. Auth Login
  let adminToken = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@trafficai.gov', password: 'AdminPassword123!' }),
    });
    const data = await res.json();
    adminToken = data.token;
    const ok = res.status === 200 && !!adminToken;
    logStep(2, 'Admin Login', 'POST', '/auth/login', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 2. POST /auth/login failed:', err.message);
    failed++;
  }

  // 3. Auth Me
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const ok = res.status === 200 && data.user?.role === 'admin';
    logStep(3, 'Auth Me Profile', 'GET', '/auth/me', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 3. GET /auth/me failed:', err.message);
    failed++;
  }

  // 4. Traffic KPIs
  try {
    const res = await fetch(`${BASE_URL}/traffic/kpis`);
    const data = await res.json();
    const ok = res.status === 200 && data.success && typeof data.data.averageSpeed === 'number';
    logStep(4, 'Traffic KPIs', 'GET', '/traffic/kpis', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 4. GET /traffic/kpis failed:', err.message);
    failed++;
  }

  // 5. Traffic Sectors
  try {
    const res = await fetch(`${BASE_URL}/traffic/sectors`);
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data) && data.data.length > 0;
    logStep(5, 'Traffic Sectors', 'GET', '/traffic/sectors', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 5. GET /traffic/sectors failed:', err.message);
    failed++;
  }

  // 6. Incidents List
  try {
    const res = await fetch(`${BASE_URL}/traffic/incidents?severity=ALL&status=ALL`);
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data) && data.total > 0;
    logStep(6, 'Incidents List', 'GET', '/traffic/incidents', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 6. GET /traffic/incidents failed:', err.message);
    failed++;
  }

  // 7. Create Incident
  let createdId = '';
  try {
    const res = await fetch(`${BASE_URL}/traffic/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Overturned Cargo Trailer on Exit 12',
        severity: 'CRITICAL',
        sector: 'East Port Expressway',
        location: 'East Port Expressway (Mile 12)',
        lanesBlocked: 2,
        totalLanes: 4,
        assignedUnits: ['MP-204', 'TOW-88'],
      }),
    });
    const data = await res.json();
    createdId = data.data?.id;
    const ok = res.status === 201 && !!createdId;
    logStep(7, 'Create Incident', 'POST', '/traffic/incidents', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 7. POST /traffic/incidents failed:', err.message);
    failed++;
  }

  // 8. Update Incident Status
  try {
    const res = await fetch(`${BASE_URL}/traffic/incidents/${createdId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Resolving',
        note: 'Cranes lifted trailer; right lane reopening.',
      }),
    });
    const data = await res.json();
    const ok = res.status === 200 && data.data?.status === 'Resolving';
    logStep(8, 'Update Incident Status', 'PATCH', `/traffic/incidents/${createdId}/status`, res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 8. PATCH /traffic/incidents/:id/status failed:', err.message);
    failed++;
  }

  // 9. Predictions
  try {
    const res = await fetch(`${BASE_URL}/traffic/predictions?horizon=24h`);
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data?.hourlyCurves);
    logStep(9, '24h Predictions', 'GET', '/traffic/predictions', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 9. GET /traffic/predictions failed:', err.message);
    failed++;
  }

  // 10. Scenario Simulation
  try {
    const res = await fetch(`${BASE_URL}/traffic/predictions/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weather: 'storm', event: 'concert', roadClosure: true, aiInterventionActive: true }),
    });
    const data = await res.json();
    const ok = res.status === 200 && typeof data.data?.impactFactor === 'number';
    logStep(10, 'Scenario Simulator', 'POST', '/traffic/predictions/simulate', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 10. POST /traffic/predictions/simulate failed:', err.message);
    failed++;
  }

  // 11. Multi-Modal Route Planning
  try {
    const res = await fetch(`${BASE_URL}/traffic/routes/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: 'Grand Central Plaza', destination: 'Innovation Park', vehicleType: 'passenger' }),
    });
    const data = await res.json();
    const ok = res.status === 200 && data.options?.length === 3;
    logStep(11, 'Plan Multi-Modal Routes', 'POST', '/traffic/routes/plan', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 11. POST /traffic/routes/plan failed:', err.message);
    failed++;
  }

  // 12. Accident Shockwave Simulation
  try {
    const res = await fetch(`${BASE_URL}/traffic/simulate/accident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector: 'Downtown Grid', lanesBlocked: 2, totalLanes: 4, initialFlowVph: 3200 }),
    });
    const data = await res.json();
    const ok = res.status === 200 && typeof data.data?.results?.maxQueueLengthMeters === 'number';
    logStep(12, 'Accident Shockwave Simulation', 'POST', '/traffic/simulate/accident', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 12. POST /traffic/simulate/accident failed:', err.message);
    failed++;
  }

  // 13. Smart Intersections
  try {
    const res = await fetch(`${BASE_URL}/traffic/intersections`);
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data);
    logStep(13, 'Smart Intersections', 'GET', '/traffic/intersections', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 13. GET /traffic/intersections failed:', err.message);
    failed++;
  }

  // 14. Signal Override
  try {
    const res = await fetch(`${BASE_URL}/traffic/intersections/INT-101/signal-override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase: 'North-South Green', durationSeconds: 45 }),
    });
    const data = await res.json();
    const ok = res.status === 200 && data.data?.secondsRemaining === 45;
    logStep(14, 'Signal Override', 'POST', '/traffic/intersections/INT-101/signal-override', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 14. POST /traffic/intersections/:id/signal-override failed:', err.message);
    failed++;
  }

  // 15. Webster Signal Optimization
  try {
    const res = await fetch(`${BASE_URL}/traffic/intersections/INT-101/optimize`, {
      method: 'POST',
    });
    const data = await res.json();
    const ok = res.status === 200 && data.data?.optimization?.calculatedMetrics?.optimalCycleSeconds > 0;
    logStep(15, 'Signal AI Optimization', 'POST', '/traffic/intersections/INT-101/optimize', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 15. POST /traffic/intersections/:id/optimize failed:', err.message);
    failed++;
  }

  // 16. Emergency Green Wave Trigger
  let emergDispatchId = '';
  try {
    const res = await fetch(`${BASE_URL}/traffic/emergency/trigger-greenwave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitCode: 'MED-12',
        unitType: 'ALS Trauma Ambulance',
        origin: 'Station 4 West',
        destination: 'Trauma Center',
      }),
    });
    const data = await res.json();
    emergDispatchId = data.data?.id;
    const ok = res.status === 200 && !!emergDispatchId;
    logStep(16, 'Trigger Green Wave', 'POST', '/traffic/emergency/trigger-greenwave', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 16. POST /traffic/emergency/trigger-greenwave failed:', err.message);
    failed++;
  }

  // 17. Cancel Green Wave
  try {
    const res = await fetch(`${BASE_URL}/traffic/emergency/cancel-greenwave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatchId: emergDispatchId }),
    });
    const data = await res.json();
    const ok = res.status === 200 && data.success;
    logStep(17, 'Cancel Green Wave', 'POST', '/traffic/emergency/cancel-greenwave', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 17. POST /traffic/emergency/cancel-greenwave failed:', err.message);
    failed++;
  }

  // 18. CCTV Feeds
  try {
    const res = await fetch(`${BASE_URL}/traffic/cameras`);
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data);
    logStep(18, 'CCTV Cameras Telemetry', 'GET', '/traffic/cameras', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 18. GET /traffic/cameras failed:', err.message);
    failed++;
  }

  // 19. Admin Analytics
  try {
    const res = await fetch(`${BASE_URL}/traffic/analytics?range=7d`);
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data?.dailyVolume);
    logStep(19, 'Admin Analytics', 'GET', '/traffic/analytics?range=7d', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 19. GET /traffic/analytics failed:', err.message);
    failed++;
  }

  // 20. Admin Audit Logs
  try {
    const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const ok = res.status === 200 && Array.isArray(data.data);
    logStep(20, 'Admin Audit Logs', 'GET', '/admin/audit-logs', res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 20. GET /admin/audit-logs failed:', err.message);
    failed++;
  }

  // 21. Delete Incident
  try {
    const res = await fetch(`${BASE_URL}/traffic/incidents/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const ok = res.status === 200 && data.success;
    logStep(21, 'Delete Incident', 'DELETE', `/traffic/incidents/${createdId}`, res.status, ok);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.error('[✗] 21. DELETE /traffic/incidents/:id failed:', err.message);
    failed++;
  }

  console.log(`\n================================================================`);
  console.log(` Verification Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);

  return failed === 0;
}

if (process.argv[1] && process.argv[1].endsWith('curl_tester.js')) {
  runCurlVerification().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

