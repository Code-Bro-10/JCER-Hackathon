import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import http from 'http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seedDatabase.js';
import { initSocketServer } from '../src/services/socketService.js';

let server;
let socketClient;
let adminToken;
let operatorToken;
let userToken;
let testIncidentId;

before(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await seedDatabase(true);

  server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      socketClient = Client(`http://localhost:${port}`);
      socketClient.on('connect', resolve);
    });
  });
});

after(async () => {
  if (socketClient) {
    socketClient.disconnect();
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

describe('1. Server & Health Probe', () => {
  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  test('GET /api/v1/health returns API gateway health', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.version, '1.0.0');
  });
});

describe('2. User & Admin Authentication', () => {
  test('POST /api/v1/auth/register creates a new user and issues JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Traffic Engineer Sarah',
        email: 'sarah.engineer@trafficai.gov',
        password: 'Password123!',
        role: 'operator',
        department: 'Signal Operations',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, 'sarah.engineer@trafficai.gov');
    assert.strictEqual(res.body.user.role, 'operator');
    operatorToken = res.body.token;
  });

  test('POST /api/v1/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Engineer',
        email: 'sarah.engineer@trafficai.gov',
        password: 'Password123!',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/auth/login logs in seeded admin and issues JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@trafficai.gov',
        password: 'AdminPassword123!',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'admin');
    adminToken = res.body.token;
  });

  test('POST /api/v1/auth/login rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@trafficai.gov',
        password: 'WrongPassword!',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('GET /api/v1/auth/me returns authenticated user with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.email, 'admin@trafficai.gov');
    assert.strictEqual(res.body.user.role, 'admin');
  });

  test('GET /api/v1/auth/me rejects request without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/auth/logout succeeds', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});

describe('3. Incident CRUD APIs & Socket.IO Broadcasting', () => {
  test('GET /api/v1/traffic/incidents returns list and total matching contract', async () => {
    const res = await request(app).get('/api/v1/traffic/incidents');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.total === 'number');
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  test('GET /api/v1/traffic/incidents filters by severity and sector', async () => {
    const res = await request(app)
      .get('/api/v1/traffic/incidents?severity=CRITICAL&sector=Downtown Grid');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    res.body.data.forEach((inc) => {
      assert.strictEqual(inc.severity, 'CRITICAL');
      assert.strictEqual(inc.sector, 'Downtown Grid');
    });
  });

  test('POST /api/v1/traffic/incidents creates incident and broadcasts via socket', async () => {
    let socketEventReceived = null;
    socketClient.once('incident:created', (data) => {
      socketEventReceived = data;
    });

    const newIncidentData = {
      title: 'Stalled Bus on Expressway Ramp',
      type: 'breakdown',
      typeName: 'Transit Breakdown',
      severity: 'HIGH',
      sector: 'East Port Expressway',
      location: 'East Port Expressway Ramp 4A',
      coordinates: { x: 70, y: 52 },
      lanesBlocked: 1,
      totalLanes: 3,
      estimatedDelay: '14 mins',
      impactRadius: '1.8 km',
      assignedUnits: ['TOW-88'],
      description: 'Transit bus with overheated coolant blocking right merge ramp.',
    };

    const res = await request(app)
      .post('/api/v1/traffic/incidents')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(newIncidentData);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id.startsWith('INC-2026-'));
    assert.strictEqual(res.body.data.title, newIncidentData.title);
    assert.strictEqual(res.body.data.status, 'Dispatched');

    testIncidentId = res.body.data.id;

    // Small delay to allow socket event to propagate
    await new Promise((r) => setTimeout(r, 100));
    assert.ok(socketEventReceived);
    assert.strictEqual(socketEventReceived.id, testIncidentId);
  });

  test('GET /api/v1/traffic/incidents/:id fetches single incident', async () => {
    const res = await request(app).get(`/api/v1/traffic/incidents/${testIncidentId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.id, testIncidentId);
  });

  test('PATCH /api/v1/traffic/incidents/:id/status updates status and history', async () => {
    let socketUpdatedEvent = null;
    socketClient.once('incident:updated', (data) => {
      socketUpdatedEvent = data;
    });

    const res = await request(app)
      .patch(`/api/v1/traffic/incidents/${testIncidentId}/status`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        status: 'Resolving',
        note: 'Tow unit TOW-88 hooked up bus and clearing lane.',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'Resolving');
    assert.ok(res.body.data.history.length >= 2);

    await new Promise((r) => setTimeout(r, 100));
    assert.ok(socketUpdatedEvent);
    assert.strictEqual(socketUpdatedEvent.id, testIncidentId);
  });

  test('DELETE /api/v1/traffic/incidents/:id removes incident', async () => {
    const res = await request(app)
      .delete(`/api/v1/traffic/incidents/${testIncidentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const checkRes = await request(app).get(`/api/v1/traffic/incidents/${testIncidentId}`);
    assert.strictEqual(checkRes.status, 404);
  });
});

describe('4. Traffic Prediction & Bottlenecks APIs', () => {
  test('GET /api/v1/traffic/predictions returns hourly curves and model metadata', async () => {
    const res = await request(app).get('/api/v1/traffic/predictions?horizon=24h');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.hourlyCurves));
    assert.ok(Array.isArray(res.body.data.bottlenecks));
    assert.ok(res.body.data.modelMetadata);
    assert.strictEqual(res.body.data.modelMetadata.confidence, 96.4);
  });

  test('POST /api/v1/traffic/predictions/simulate returns what-if scenario impacts', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/predictions/simulate')
      .send({
        weather: 'storm',
        event: 'concert',
        roadClosure: true,
        aiInterventionActive: true,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.impactFactor > 0);
    assert.ok(res.body.data.estimatedCityDelayMin > 0);
    assert.ok(Array.isArray(res.body.data.recommendations));
    assert.ok(Array.isArray(res.body.data.simulatedCurves));
  });

  test('GET /api/v1/traffic/bottlenecks returns ranked bottleneck choke points', async () => {
    const res = await request(app).get('/api/v1/traffic/bottlenecks');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].currentVCRatio);
  });
});

describe('5. Route Optimization API', () => {
  test('POST /api/v1/traffic/routes/plan returns multi-modal alternatives matching contract', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/routes/plan')
      .send({
        origin: 'Grand Central Plaza',
        destination: 'Innovation Tech Hub',
        vehicleType: 'passenger',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.origin, 'Grand Central Plaza');
    assert.strictEqual(res.body.destination, 'Innovation Tech Hub');
    assert.ok(Array.isArray(res.body.options));
    assert.strictEqual(res.body.options.length, 3);

    const aiRoute = res.body.options.find((o) => o.id === 'route-ai-smart');
    const shortestRoute = res.body.options.find((o) => o.id === 'route-shortest');
    const ecoRoute = res.body.options.find((o) => o.id === 'route-eco-green');

    assert.ok(aiRoute);
    assert.ok(shortestRoute);
    assert.ok(ecoRoute);
    assert.ok(aiRoute.steps.length > 0);
  });

  test('POST /api/v1/traffic/routes/plan factors EV vehicle profile with reduced emissions', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/routes/plan')
      .send({
        origin: 'Harbor Gate',
        destination: 'South Ring Connector',
        vehicleType: 'ev',
      });

    assert.strictEqual(res.status, 200);
    const aiRoute = res.body.options.find((o) => o.id === 'route-ai-smart');
    assert.ok(aiRoute.co2Kg < 1.0); // EV emission discount
  });
});

describe('6. Accident Simulation API', () => {
  test('POST /api/v1/traffic/simulate/accident computes LWR shockwave and spillback', async () => {
    let socketShockEvent = null;
    socketClient.once('simulation:accident_occurred', (data) => {
      socketShockEvent = data;
    });

    const res = await request(app)
      .post('/api/v1/traffic/simulate/accident')
      .send({
        sector: 'Downtown Grid',
        intersectionId: 'INT-101',
        lanesBlocked: 2,
        totalLanes: 4,
        initialFlowVph: 3400,
        durationMinutes: 45,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.simulationId);
    assert.ok(res.body.data.results.shockwaveSpeedKmh >= 0);
    assert.ok(res.body.data.results.maxQueueLengthMeters > 0);
    assert.ok(Array.isArray(res.body.data.results.aiMitigationDirectives));

    await new Promise((r) => setTimeout(r, 100));
    assert.ok(socketShockEvent);
  });
});

describe('7. Signal Optimization API', () => {
  test('GET /api/v1/traffic/intersections returns smart intersection nodes', async () => {
    const res = await request(app).get('/api/v1/traffic/intersections');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  test('POST /api/v1/traffic/intersections/:id/signal-override applies operator phase', async () => {
    let socketSignalEvent = null;
    socketClient.once('signal:updated', (data) => {
      socketSignalEvent = data;
    });

    const res = await request(app)
      .post('/api/v1/traffic/intersections/INT-101/signal-override')
      .send({
        phase: 'North-South Green',
        durationSeconds: 50,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.id, 'INT-101');
    assert.strictEqual(res.body.data.mode, 'Manual Override');
    assert.strictEqual(res.body.data.secondsRemaining, 50);

    await new Promise((r) => setTimeout(r, 100));
    assert.ok(socketSignalEvent);
    assert.strictEqual(socketSignalEvent.id, 'INT-101');
  });

  test('POST /api/v1/traffic/intersections/:id/optimize runs Webster split calculation', async () => {
    const res = await request(app).post('/api/v1/traffic/intersections/INT-101/optimize');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.optimization.calculatedMetrics.optimalCycleSeconds > 0);
    assert.strictEqual(res.body.data.intersection.mode, 'AI Adaptive');
  });

  test('POST /api/v1/traffic/signals/optimize-corridor syncs arterial green wave', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/signals/optimize-corridor')
      .send({ sector: 'Downtown Grid', offsetSeconds: 15 });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.nodesOptimized >= 1);
  });
});

describe('8. Emergency Routing & Green Wave Preemption API', () => {
  let createdDispatchId;

  test('GET /api/v1/traffic/emergency returns dispatches and intersections', async () => {
    const res = await request(app).get('/api/v1/traffic/emergency');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.dispatches));
    assert.ok(Array.isArray(res.body.intersections));
  });

  test('POST /api/v1/traffic/emergency/trigger-greenwave activates priority preemption', async () => {
    let socketEmergencyEvent = null;
    socketClient.once('emergency:greenwave_activated', (data) => {
      socketEmergencyEvent = data;
    });

    const res = await request(app)
      .post('/api/v1/traffic/emergency/trigger-greenwave')
      .send({
        unitCode: 'ALS-99',
        unitType: 'Pediatric Critical Care Ambulance',
        origin: 'Harbor Station #3',
        destination: 'Childrens Medical Center',
        corridorName: 'Express Green Corridor Bravo',
        priorityLevel: 'CODE RED',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.unitCode, 'ALS-99');
    assert.strictEqual(res.body.data.priorityLevel, 'CODE RED');
    createdDispatchId = res.body.data.id;

    await new Promise((r) => setTimeout(r, 100));
    assert.ok(socketEmergencyEvent);
    assert.strictEqual(socketEmergencyEvent.unitCode, 'ALS-99');

    // Verify all intersections are preempted to EMERGENCY PREEMPT GREEN
    const intRes = await request(app).get('/api/v1/traffic/intersections');
    intRes.body.data.forEach((node) => {
      assert.strictEqual(node.currentPhase, 'EMERGENCY PREEMPT GREEN');
      assert.strictEqual(node.mode, 'Emergency Priority Locked');
    });
  });

  test('POST /api/v1/traffic/emergency/cancel-greenwave restores normal adaptive signals', async () => {
    let socketCancelEvent = null;
    socketClient.once('emergency:greenwave_cancelled', (data) => {
      socketCancelEvent = data;
    });

    const res = await request(app)
      .post('/api/v1/traffic/emergency/cancel-greenwave')
      .send({ dispatchId: createdDispatchId });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    await new Promise((r) => setTimeout(r, 100));
    assert.ok(socketCancelEvent);

    // Verify signals are restored to AI Adaptive
    const intRes = await request(app).get('/api/v1/traffic/intersections');
    intRes.body.data.forEach((node) => {
      assert.strictEqual(node.mode, 'AI Adaptive');
    });
  });
});

describe('9. Admin Analytics, KPIs & CCTV APIs', () => {
  test('GET /api/v1/traffic/kpis returns KPIs with real-time database counts', async () => {
    const res = await request(app).get('/api/v1/traffic/kpis');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data.averageSpeed === 'number');
    assert.ok(typeof res.body.data.congestionIndex === 'number');
    assert.ok(typeof res.body.data.totalIncidents === 'number');
    assert.ok(typeof res.body.data.resolvedIncidents === 'number');
  });

  test('GET /api/v1/traffic/sectors returns sector statistics matching contract', async () => {
    const res = await request(app).get('/api/v1/traffic/sectors');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(res.body.data.length, 6);
  });

  test('GET /api/v1/traffic/cameras returns CCTV feeds telemetry', async () => {
    const res = await request(app).get('/api/v1/traffic/cameras');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data[0].detectedObjects);
  });

  test('GET /api/v1/traffic/analytics?range=7d returns 7d volume and infrastructure data', async () => {
    const res = await request(app).get('/api/v1/traffic/analytics?range=7d');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.timeRange, '7d');
    assert.ok(Array.isArray(res.body.data.dailyVolume));
    assert.ok(res.body.data.infrastructureHealth.smartSignals);
  });

  test('GET /api/v1/admin/audit-logs returns audit logs to authenticated admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  test('GET /api/v1/admin/audit-logs denies access to non-admin users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${operatorToken}`);

    assert.strictEqual(res.status, 403);
  });

  test('GET /api/v1/admin/users lists all registered users for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 3);
  });
});

