import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { optimizeSignalTiming, WEBSTER_CONSTRAINTS } from '../signals/signalOptimizer.js';

describe('Adaptive Traffic Signal Timing Optimizer (Webster Formula)', () => {
  const sampleIntersection = {
    id: 'INT-101',
    name: 'Grand Central Ave & 5th St',
    queues: { north: 14, south: 12, east: 8, west: 7 },
  };

  test('should compute optimal cycle and green splits within Webster boundaries', () => {
    const plan = optimizeSignalTiming(sampleIntersection);

    assert.equal(plan.success, true);
    assert.equal(plan.intersectionId, 'INT-101');
    assert.ok(
      plan.optimalCycleSeconds >= WEBSTER_CONSTRAINTS.MIN_CYCLE_SECONDS &&
        plan.optimalCycleSeconds <= WEBSTER_CONSTRAINTS.MAX_CYCLE_SECONDS
    );
    assert.equal(plan.phases.length, 2);

    const nsPhase = plan.phases.find((p) => p.phaseId === 'PHASE-NS');
    const ewPhase = plan.phases.find((p) => p.phaseId === 'PHASE-EW');

    // North-South has higher queue (14+12 = 26 vs 8+7 = 15), so NS green should be longer than EW green
    assert.ok(nsPhase.greenSeconds > ewPhase.greenSeconds);
    assert.ok(nsPhase.greenSeconds >= WEBSTER_CONSTRAINTS.MIN_PEDESTRIAN_GREEN_SECONDS);
    assert.ok(ewPhase.greenSeconds >= WEBSTER_CONSTRAINTS.MIN_PEDESTRIAN_GREEN_SECONDS);

    // Sum of green + lost times should equal optimalCycleSeconds
    const totalAllocated = nsPhase.greenSeconds + ewPhase.greenSeconds + plan.totalLostTimeSeconds;
    assert.equal(totalAllocated, plan.optimalCycleSeconds);
  });

  test('should enforce minimum pedestrian green even under low traffic demand', () => {
    const lowDemandIntersection = {
      id: 'INT-107',
      name: 'Quiet Crossing',
      queues: { north: 1, south: 1, east: 1, west: 1 },
    };

    const plan = optimizeSignalTiming(lowDemandIntersection);
    for (const phase of plan.phases) {
      assert.ok(phase.greenSeconds >= WEBSTER_CONSTRAINTS.MIN_PEDESTRIAN_GREEN_SECONDS);
    }
  });

  test('should handle emergency vehicle preemption priority', () => {
    const plan = optimizeSignalTiming(sampleIntersection, {
      emergencyPreemptionPhase: 'North-South Corridor',
    });

    assert.equal(plan.success, true);
    assert.equal(plan.isPreemptionActive, true);
    assert.match(plan.preemptionReason, /Emergency Vehicle Priority/);

    const nsPhase = plan.phases.find((p) => p.phaseId === 'PHASE-NS');
    const ewPhase = plan.phases.find((p) => p.phaseId === 'PHASE-EW');

    assert.equal(nsPhase.isPreempted, true);
    assert.ok(nsPhase.greenSeconds > ewPhase.greenSeconds);
  });

  test('should detect high saturation and clamp to max cycle length', () => {
    const gridlockedIntersection = {
      id: 'INT-JAM',
      queues: { north: 80, south: 75, east: 70, west: 65 },
    };

    const plan = optimizeSignalTiming(gridlockedIntersection);
    assert.equal(plan.optimalCycleSeconds, WEBSTER_CONSTRAINTS.MAX_CYCLE_SECONDS);
    assert.equal(plan.saturationStatus, 'OVERSATURATED');
  });
});

