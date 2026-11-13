/**
 * TrafficAI Algorithms Suite - Comprehensive Test Runner & Benchmark
 * 
 * Executes end-to-end automated sanity verification across all 9 algorithm modules
 * and outputs structured execution metrics.
 */

import { dijkstra } from '../routing/dijkstra.js';
import { aStar, HEURISTICS } from '../routing/aStar.js';
import { scoreRoute, rankRoutes } from '../routing/routeScorer.js';
import { predictCongestion } from '../prediction/congestionPredictor.js';
import { detectDuplicateIncident } from '../incidents/duplicateDetector.js';
import { estimateIncidentSeverity } from '../incidents/severityEstimator.js';
import { analyzeNetworkImpact } from '../network/impactAnalyzer.js';
import { optimizeSignalTiming } from '../signals/signalOptimizer.js';
import { compareSignalPerformance } from '../signals/waitingTimeComparator.js';
import { buildGraph, DEMO_NODES, DEMO_EDGES, DEMO_INCIDENTS } from '../data/demoNetwork.js';

console.log('='.repeat(70));
console.log(' TrafficAI Core Algorithms Suite - Automated Verification & Benchmark');
console.log('='.repeat(70));

const results = [];
const graph = buildGraph(DEMO_NODES, DEMO_EDGES);

function benchmark(name, fn) {
  const t0 = performance.now();
  try {
    const output = fn();
    const t1 = performance.now();
    results.push({
      module: name,
      status: 'PASS',
      latencyMs: +(t1 - t0).toFixed(3),
      summary: typeof output === 'string' ? output : 'Execution successful',
    });
  } catch (err) {
    const t1 = performance.now();
    results.push({
      module: name,
      status: 'FAIL',
      latencyMs: +(t1 - t0).toFixed(3),
      summary: err.message,
    });
  }
}

// 1. Dijkstra
benchmark('1. Dijkstra Shortest-Path', () => {
  const res = dijkstra({
    graph,
    startNodeId: 'INT-101',
    endNodeId: 'INT-104',
  });
  if (!res.found || res.path.length < 2) throw new Error('Dijkstra failed to find path');
  return `Path found: ${res.path.join(' -> ')} (${res.totalDistanceKm} km, ~${res.estimatedDurationMinutes}m)`;
});

// 2. A* Pathfinding
benchmark('2. A* Pathfinding', () => {
  const res = aStar({
    graph,
    startNodeId: 'INT-101',
    endNodeId: 'INT-104',
    options: { heuristic: HEURISTICS.HAVERSINE },
  });
  if (!res.found || res.path.length < 2) throw new Error('A* failed to find path');
  return `Path found: ${res.path.join(' -> ')} (Visited ${res.visitedNodesCount} nodes)`;
});

// 3. Multi-Factor Route Scoring
benchmark('3. Multi-Factor Route Scoring', () => {
  const r1 = { id: 'r1', totalDistanceKm: 6.2, estimatedDurationMinutes: 14.5, congestionIndex: 20, reliabilityScore: 0.9 };
  const r2 = { id: 'r2', totalDistanceKm: 5.0, estimatedDurationMinutes: 28.0, congestionIndex: 75, reliabilityScore: 0.5 };
  const ranking = rankRoutes([r1, r2], { profile: 'balanced' });
  if (!ranking.success || ranking.rankedRoutes.length !== 2) throw new Error('Scoring failed');
  return `Best route: ${ranking.bestRouteId} (Score: ${ranking.rankedRoutes[0].qualityScore}/100)`;
});

// 4. Congestion Predictor (15-30m)
benchmark('4. Congestion Prediction (15-30m)', () => {
  const res = predictCongestion({
    corridorId: 'Downtown Grid',
    currentCongestion: 68,
    currentTime: '2026-11-13T08:15:00.000Z',
  });
  if (!res.success || res.predictions.length !== 2) throw new Error('Prediction failed');
  return `+15m: ${res.predictions[0].predictedCongestionIndex}% | +30m: ${res.predictions[1].predictedCongestionIndex}%`;
});

// 5. Duplicate Incident Detection
benchmark('5. Duplicate Incident Detection', () => {
  const cand = {
    type: 'accident',
    coordinates: { lat: 37.7766, lon: -122.4174 },
    reportedAt: DEMO_INCIDENTS[0].reportedAt + 4 * 60000,
  };
  const res = detectDuplicateIncident(cand, DEMO_INCIDENTS);
  if (!res.isDuplicate) throw new Error('Failed to flag close duplicate report');
  return `Decision: ${res.decision} (Match score: ${res.matchScore}, Target: ${res.matchedIncident.id})`;
});

// 6. Incident Severity Estimation
benchmark('6. Severity Estimation', () => {
  const res = estimateIncidentSeverity({
    type: 'multi_vehicle',
    lanesBlocked: 2,
    totalLanes: 4,
    injuriesReported: 1,
    isPeakHour: true,
  });
  if (!res.success || !res.severity) throw new Error('Severity estimation failed');
  return `Severity: ${res.severity} (${res.severityScore}/100, Tier: ${res.tier}, Clear: ~${res.operationalImpact.estimatedClearanceTimeMinutes}m)`;
});

// 7. Graph Network Impact Analysis
benchmark('7. Network Impact Analysis', () => {
  const res = analyzeNetworkImpact({
    graph,
    edgeId: 'EDGE-106-103',
    lanesBlocked: 2,
    durationMinutes: 45,
  });
  if (!res.success) throw new Error('Impact analysis failed');
  return `Shockwave: ${res.shockwaveKinematics.shockwaveSpeedKmh} km/h | Queue: ${res.shockwaveKinematics.maxQueueLengthMeters}m | Delay surge: +${res.systemDelayImpact.networkDelayIncreaseVhd} VHD`;
});

// 8. Adaptive Signal Timing Optimization
benchmark('8. Signal Timing Optimization', () => {
  const res = optimizeSignalTiming({
    id: 'INT-101',
    queues: { north: 18, south: 16, east: 8, west: 7 },
  });
  if (!res.success) throw new Error('Signal optimization failed');
  return `Optimal cycle: ${res.optimalCycleSeconds}s (NS Green: ${res.phases[0].greenSeconds}s, EW Green: ${res.phases[1].greenSeconds}s)`;
});

// 9. Before-and-After Waiting Time Comparison
benchmark('9. Waiting Time & LOS Comparison', () => {
  const res = compareSignalPerformance({
    baseline: { cycleSeconds: 90, greenNS: 40, greenEW: 42, volumeNS: 1300, volumeEW: 750 },
    optimized: { cycleSeconds: 65, greenNS: 37, greenEW: 20, volumeNS: 1300, volumeEW: 750 },
  });
  if (!res.success) throw new Error('Comparison failed');
  return `${res.improvements.losTransition} | Delay saved: -${res.improvements.delayReductionPct}% | Daily CO2: -${res.improvements.environmentalSavings.co2ReductionKgPerDay} kg`;
});

console.log('');
console.table(results);

const allPassed = results.every((r) => r.status === 'PASS');
if (allPassed) {
  console.log('\n SUCCESS: All 9 TrafficAI algorithm modules executed with 100% verification!\n');
} else {
  console.error('\n FAILURE: One or more algorithm modules failed verification.\n');
  process.exit(1);
}

