import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import http from 'http';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seedDatabase.js';
import { initSocketServer } from '../src/services/socketService.js';

let server;

before(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await seedDatabase(true);

  server = http.createServer(app);
  initSocketServer(server);
  await new Promise((resolve) => server.listen(0, resolve));
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

describe('11. Live Camera Intelligence & Computer Vision', () => {
  test('GET /api/v1/traffic/vision/status reports vision engine readiness', async () => {
    const res = await request(app).get('/api/v1/traffic/vision/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(Array.isArray(res.body.data.supported_classes));
    assert.ok(res.body.data.supported_classes.includes('car'));
  });

  test('GET /api/v1/traffic/cameras redacts credentials and omits internal RTSP URLs', async () => {
    const res = await request(app).get('/api/v1/traffic/cameras');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 6);

    for (const cam of res.body.data) {
      assert.strictEqual(cam.rtspInternalUrl, undefined, 'rtspInternalUrl must never be exposed');
      if (cam.streamUrl && cam.streamUrl.includes('rtsp:')) {
        assert.ok(!cam.streamUrl.includes('admin:trafficSafePass'), 'Plaintext password must be redacted');
      }
    }
  });

  let createdCameraId;

  test('POST /api/v1/traffic/cameras registers authorized camera and shields credentials', async () => {
    const payload = {
      id: 'CAM-TEST-RTSP',
      name: 'Tilakwadi 4th Cross Security Feed',
      location: 'Tilakwadi 4th Cross, Belagavi',
      latitude: 15.8450,
      longitude: 74.5020,
      sector: 'South Belagavi',
      sourceType: 'AUTHORIZED_IP_RTSP',
      streamUrl: 'rtsp://secops:SuperSecretKey99@10.0.1.55:554/stream1',
      rtspInternalUrl: 'rtsp://secops:SuperSecretKey99@10.0.1.55:554/stream1',
      attribution: 'Belagavi City Police Department',
      usagePermissions: 'Official Hackathon Test Feed',
      isEnabled: true,
    };

    const res = await request(app)
      .post('/api/v1/traffic/cameras')
      .send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.id, 'CAM-TEST-RTSP');
    createdCameraId = res.body.data.id;

    // Verify credential security
    assert.strictEqual(res.body.data.rtspInternalUrl, undefined, 'rtspInternalUrl must be stripped');
    assert.ok(!res.body.data.streamUrl.includes('SuperSecretKey99'), 'Plaintext password must be obscured');
    assert.ok(res.body.data.streamUrl.includes('//***:***@'), 'Should contain redacted credentials mask');
  });

  test('GET /api/v1/traffic/cameras/:id retrieves specific camera securely', async () => {
    const res = await request(app).get(`/api/v1/traffic/cameras/${createdCameraId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, createdCameraId);
    assert.strictEqual(res.body.data.rtspInternalUrl, undefined);
  });

  test('POST /api/v1/traffic/cameras/:id/analyze executes computer vision scan', async () => {
    const res = await request(app)
      .post(`/api/v1/traffic/cameras/${createdCameraId}/analyze`)
      .send({
        simulateRoadblock: false,
        numVehicles: 8,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.analysis);
    assert.ok(res.body.analysis.detection_counts);
    assert.ok(res.body.analysis.traffic_metrics);
    assert.strictEqual(typeof res.body.analysis.detection_counts.total_vehicles, 'number');
    assert.strictEqual(typeof res.body.analysis.traffic_metrics.queue_length_meters, 'number');
  });

  test('POST /api/v1/traffic/cameras/:id/analyze detects roadblock and triggers duplicate suppression', async () => {
    // First scan with roadblock simulation on a dedicated test node
    const res1 = await request(app)
      .post('/api/v1/traffic/cameras/CAM-ALERT-TEST/analyze')
      .send({
        simulateRoadblock: true,
        numVehicles: 15,
      });

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.analysis.incident_classification.detected, true);
    assert.strictEqual(res1.body.alertBroadcasted, true);
    assert.strictEqual(res1.body.alertSuppressed, false);

    // Immediate second scan should have alert suppressed to prevent spam
    const res2 = await request(app)
      .post('/api/v1/traffic/cameras/CAM-ALERT-TEST/analyze')
      .send({
        simulateRoadblock: true,
        numVehicles: 15,
      });

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.alertBroadcasted, false);
    assert.strictEqual(res2.body.alertSuppressed, true, 'Immediate duplicate alert must be suppressed');
  });

  test('PATCH /api/v1/traffic/cameras/:id updates camera state', async () => {
    const res = await request(app)
      .patch(`/api/v1/traffic/cameras/${createdCameraId}`)
      .send({
        status: 'OFFLINE',
        isEnabled: false,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'OFFLINE');
    assert.strictEqual(res.body.data.isEnabled, false);
  });

  test('DELETE /api/v1/traffic/cameras/:id removes the camera node', async () => {
    const res = await request(app).delete(`/api/v1/traffic/cameras/${createdCameraId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});
