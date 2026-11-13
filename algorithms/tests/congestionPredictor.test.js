import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { predictCongestion, predictCorridors, WEATHER_MULTIPLIERS } from '../prediction/congestionPredictor.js';

describe('Traffic Congestion Predictor (15-30 min horizons)', () => {
  const deterministicTime = '2026-11-13T08:00:00.000Z'; // 8:00 AM morning rush

  test('should predict congestion for default 15 and 30 minute horizons', () => {
    const result = predictCongestion({
      corridorId: 'Downtown Grid',
      currentTime: deterministicTime,
      currentCongestion: 72,
      options: {
        horizonsMinutes: [15, 30],
        weather: 'clear',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.corridorId, 'Downtown Grid');
    assert.equal(result.currentCongestionIndex, 72);
    assert.equal(result.predictions.length, 2);

    const p15 = result.predictions[0];
    assert.equal(p15.horizonMinutes, 15);
    assert.ok(p15.predictedCongestionIndex >= 0 && p15.predictedCongestionIndex <= 100);
    assert.ok(p15.predictedSpeedKmh > 0);
    assert.ok(p15.confidenceInterval.lower <= p15.predictedCongestionIndex);
    assert.ok(p15.confidenceInterval.upper >= p15.predictedCongestionIndex);

    const p30 = result.predictions[1];
    assert.equal(p30.horizonMinutes, 30);
    assert.ok(p30.confidenceInterval.marginOfError >= p15.confidenceInterval.marginOfError, 'Uncertainty grows with horizon');
  });

  test('should increase predicted congestion when weather is adverse (rain)', () => {
    const clearResult = predictCongestion({
      corridorId: 'Downtown Grid',
      currentTime: deterministicTime,
      currentCongestion: 50,
      options: { weather: 'clear' },
    });

    const rainResult = predictCongestion({
      corridorId: 'Downtown Grid',
      currentTime: deterministicTime,
      currentCongestion: 50,
      options: { weather: 'rain' },
    });

    assert.ok(
      rainResult.predictions[0].predictedCongestionIndex >=
        clearResult.predictions[0].predictedCongestionIndex,
      'Rain should yield higher predicted congestion'
    );
  });

  test('should calculate momentum slope from recent time-series trend', () => {
    // Sharp upward trend: was 40 30m ago, 55 15m ago, now 70
    const trendingUp = predictCongestion({
      corridorId: 'Downtown Grid',
      currentTime: deterministicTime,
      currentCongestion: 70,
      recentTrend: [
        { timeMinutesAgo: 30, congestion: 40 },
        { timeMinutesAgo: 15, congestion: 55 },
        { timeMinutesAgo: 0, congestion: 70 },
      ],
    });

    assert.ok(trendingUp.momentumRatePerMinute > 0);
    assert.equal(trendingUp.predictions[0].trendDirection, 'INCREASING');
  });

  test('should strictly include simulated methodology and disclaimer metadata', () => {
    const result = predictCongestion({
      currentCongestion: 45,
    });

    assert.equal(result.methodology.isSimulated, true);
    assert.match(result.methodology.modelType, /Autoregressive Historical Reversion/);
    assert.match(result.methodology.disclaimer, /simulated mathematical projections/i);
    assert.match(result.methodology.disclaimer, /Not live physical sensor telemetry/i);
  });

  test('should batch predict across multiple corridors with predictCorridors', () => {
    const corridors = [
      { id: 'Downtown Grid', currentCongestion: 65 },
      { id: 'East Port Expressway', currentCongestion: 30 },
    ];

    const results = predictCorridors(corridors);
    assert.equal(results.length, 2);
    assert.equal(results[0].corridorId, 'Downtown Grid');
    assert.equal(results[1].corridorId, 'East Port Expressway');
  });
});
