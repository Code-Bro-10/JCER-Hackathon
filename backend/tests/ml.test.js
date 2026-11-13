import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

describe('10. Machine Learning Endpoints & Fallback Resiliency', () => {
  test('GET /api/v1/traffic/ml/status returns service status and model inventory', async () => {
    const res = await request(app).get('/api/v1/traffic/ml/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.service);
    assert.ok(typeof res.body.online === 'boolean');
    assert.ok(res.body.modelInfo);
  });

  test('GET /api/v1/traffic/ml/metrics returns model training & test evaluation metrics', async () => {
    const res = await request(app).get('/api/v1/traffic/ml/metrics');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(res.body.data.models);
    assert.ok(res.body.data.models.speed_forecaster_15m);
  });

  test('POST /api/v1/traffic/ml/predict-speed forecasts 15m and 30m speeds', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/ml/predict-speed')
      .send({
        corridorId: 'Metropolis Expressway',
        currentSpeedKmh: 45.0,
        freeFlowSpeedKmh: 65.0,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.forecast_15m);
    assert.ok(typeof res.body.data.forecast_15m.predicted_speed_kmh === 'number');
    assert.ok(res.body.data.forecast_30m);
    assert.ok(typeof res.body.data.forecast_30m.predicted_speed_kmh === 'number');
  });

  test('POST /api/v1/traffic/ml/predict-speed rejects invalid numerical speed', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/ml/predict-speed')
      .send({ corridorId: 'Test' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/traffic/ml/detect-anomalies identifies flow disruptions', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/ml/detect-anomalies')
      .send({
        corridors: [
          {
            id: 'COR-BLOCKED',
            current_speed_kmh: 8.5,
            speed_delta_kmh: -22.0,
            free_flow_speed_kmh: 60.0,
          },
          {
            id: 'COR-FREEFLOW',
            current_speed_kmh: 58.0,
            speed_delta_kmh: 0.5,
            free_flow_speed_kmh: 60.0,
          },
        ],
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.total_evaluated, 2);
    assert.ok(res.body.data.results.length === 2);
    assert.strictEqual(res.body.data.results[0].is_anomaly, true);
  });

  test('POST /api/v1/traffic/ml/classify-severity categorizes multi-vehicle incident', async () => {
    const res = await request(app)
      .post('/api/v1/traffic/ml/classify-severity')
      .send({
        type: 'multi_vehicle',
        roadType: 'expressway',
        totalLanes: 4,
        lanesBlocked: 3,
        injuriesReported: 2,
        speedDropKmh: 40.0,
        isPeakHour: true,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(['HIGH', 'CRITICAL'].includes(res.body.data.predicted_severity));
    assert.ok(res.body.data.confidence > 0.5);
    assert.ok(Array.isArray(res.body.data.contributing_factors));
  });
});

