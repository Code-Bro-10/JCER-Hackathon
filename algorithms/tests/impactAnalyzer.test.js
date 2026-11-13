import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNetworkImpact } from '../network/impactAnalyzer.js';
import { buildGraph, DEMO_NODES, DEMO_EDGES } from '../data/demoNetwork.js';

describe('Graph-Based Road Network Impact Analysis', () => {
  const graph = buildGraph(DEMO_NODES, DEMO_EDGES);

  test('should analyze network impact of arterial lane blockage on EDGE-106-103', () => {
    const report = analyzeNetworkImpact({
      graph,
      edgeId: 'EDGE-106-103',
      lanesBlocked: 2,
      durationMinutes: 45,
      maxHops: 2,
    });

    assert.equal(report.success, true);
    assert.equal(report.edgeId, 'EDGE-106-103');
    assert.equal(report.corridorName, '7th Street Corridor');
    assert.ok(report.directImpact.remainingCapacityPct < 100);
    assert.ok(report.directImpact.postIncidentVcRatio > 0);

    // Shockwave kinematics
    assert.ok(report.shockwaveKinematics.maxQueueLengthMeters > 0);
    assert.ok(report.shockwaveKinematics.queueGrowthRateMetersPerMin >= 0);

    // Upstream spillback
    assert.ok(Array.isArray(report.spillbackPropagation.upstreamRisks));
    assert.ok(report.spillbackPropagation.affectedIntersectionsCount >= 1);

    // Diversion analysis
    assert.ok(report.diversionAnalysis.bypassCorridorAvailable);
    assert.ok(report.diversionAnalysis.recommendedBypassPath.length >= 2);
    assert.equal(report.diversionAnalysis.isNetworkDisconnected, false);

    // System delay
    assert.ok(report.systemDelayImpact.networkDelayIncreaseVhd > 0);
    assert.ok(report.mitigationRecommendations.length > 0);
  });

  test('should analyze complete road closure', () => {
    const closureReport = analyzeNetworkImpact({
      graph,
      edgeId: 'EDGE-101-106',
      isClosed: true,
      durationMinutes: 30,
    });

    assert.equal(closureReport.success, true);
    assert.equal(closureReport.directImpact.remainingCapacityPct, 0);
    assert.equal(closureReport.directImpact.bottleneckCapacityVph, 0);
    assert.equal(closureReport.directImpact.postIncidentVcRatio, Infinity);
  });

  test('should return error for invalid edgeId', () => {
    const errorReport = analyzeNetworkImpact({
      graph,
      edgeId: 'EDGE-NON-EXISTENT',
    });

    assert.equal(errorReport.success, false);
    assert.match(errorReport.error, /not found/);
  });
});

