import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareSignalPerformance,
  calculateWebsterDelay,
  getLevelOfService,
} from '../signals/waitingTimeComparator.js';

describe('Before-and-After Waiting Time & Delay Comparator', () => {
  test('should compute delay using Webster delay formula', () => {
    // Cycle 90s, green 40s, volume 1200 vph, capacity 1600 vph
    const delay = calculateWebsterDelay(90, 40, 1200, 1600);
    assert.ok(delay > 0);
    assert.ok(delay < 150);
  });

  test('should classify Level of Service (LOS) grades according to HCM standards', () => {
    assert.equal(getLevelOfService(8).los, 'LOS A');
    assert.equal(getLevelOfService(18).los, 'LOS B');
    assert.equal(getLevelOfService(28).los, 'LOS C');
    assert.equal(getLevelOfService(45).los, 'LOS D');
    assert.equal(getLevelOfService(65).los, 'LOS E');
    assert.equal(getLevelOfService(95).los, 'LOS F');
  });

  test('should compare fixed-time baseline with adaptive optimized signal', () => {
    const baseline = {
      cycleSeconds: 90,
      greenNS: 40,
      greenEW: 42,
      volumeNS: 1300,
      volumeEW: 750,
      averageQueueVehicles: 28,
    };

    const optimized = {
      cycleSeconds: 65,
      greenNS: 37,
      greenEW: 20,
      volumeNS: 1300,
      volumeEW: 750,
      averageQueueVehicles: 17,
    };

    const report = compareSignalPerformance({
      baseline,
      optimized,
      context: { intersectionId: 'INT-101', name: 'Grand Central Ave & 5th St' },
    });

    assert.equal(report.success, true);
    assert.ok(report.comparison.baseline.averageDelaySecondsPerVeh > report.comparison.optimized.averageDelaySecondsPerVeh);
    assert.ok(report.improvements.delayReductionPct > 0);
    assert.ok(report.improvements.queueReductionVehicles > 0);
    assert.ok(report.improvements.environmentalSavings.dailyDelayHoursSaved > 0);
    assert.ok(report.improvements.environmentalSavings.fuelSavedLitersPerDay > 0);
    assert.ok(report.improvements.environmentalSavings.co2ReductionKgPerDay > 0);
    assert.match(report.improvements.losTransition, /->/);
  });
});

