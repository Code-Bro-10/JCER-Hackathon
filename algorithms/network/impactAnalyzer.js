/**
 * TrafficAI Algorithms Suite - Graph-Based Road Network Impact Analysis
 * 
 * Analyzes the cascading topological impact of lane blockages, incidents,
 * or full road closures across the urban road network.
 * 
 * Features:
 * - Direct V/C capacity bottleneck evaluation
 * - Lighthill-Whitham-Richards (LWR) kinematic shockwave velocity
 * - Upstream queue spillback risk propagation via breadth-first search
 * - Network connectivity & alternative diversion corridor discovery
 * - System-wide vehicle-hours of delay (VHD) surge calculation
 */

import { buildGraph, DEMO_NODES, DEMO_EDGES } from '../data/demoNetwork.js';
import { dijkstra } from '../routing/dijkstra.js';

/**
 * Perform graph-based road network impact analysis.
 * 
 * @param {object} params
 * @param {object} [params.graph]
 * @param {string} params.edgeId - Affected road segment ID
 * @param {number} [params.lanesBlocked=1] - Number of blocked lanes
 * @param {boolean} [params.isClosed=false] - Whether road is completely closed
 * @param {number} [params.durationMinutes=45] - Estimated incident duration
 * @param {number} [params.maxHops=3] - Propagation search depth
 * @returns {object} Structured JSON impact report
 */
export function analyzeNetworkImpact({
  graph = null,
  edgeId,
  lanesBlocked = 1,
  isClosed = false,
  durationMinutes = 45,
  maxHops = 3,
}) {
  const activeGraph = graph || buildGraph(DEMO_NODES, DEMO_EDGES);

  if (!edgeId || !activeGraph.edges.has(edgeId)) {
    return {
      success: false,
      error: `Edge '${edgeId}' not found in road network graph`,
    };
  }

  const targetEdge = activeGraph.edges.get(edgeId);
  const fromNode = activeGraph.nodes.get(targetEdge.from);
  const toNode = activeGraph.nodes.get(targetEdge.to);

  const totalLanes = Math.max(1, targetEdge.lanes || 3);
  const blockedLanes = isClosed ? totalLanes : Math.min(totalLanes, Math.max(1, lanesBlocked));
  const remainingLanes = Math.max(0, totalLanes - blockedLanes);

  // 1. Direct Capacity & V/C Analysis
  const nominalCapacityVph = targetEdge.capacityVph || totalLanes * 1800;
  // Per-lane bottleneck capacity drops slightly due to turbulence
  const bottleneckCapacityVph = isClosed ? 0 : Math.round(remainingLanes * 1650);
  const currentVolumeVph = targetEdge.currentVolumeVph || Math.round(nominalCapacityVph * 0.7);

  const remainingCapacityPct = Math.round((bottleneckCapacityVph / nominalCapacityVph) * 100);
  const postIncidentVcRatio = bottleneckCapacityVph > 0 ? +(currentVolumeVph / bottleneckCapacityVph).toFixed(2) : Infinity;

  const isOversaturated = currentVolumeVph > bottleneckCapacityVph;

  // 2. LWR Kinematic Shockwave Kinematics
  // w = (q_bottleneck - q_approach) / (k_queue - k_approach)
  // Jam density kj ~ 130 veh/km/lane; Queue density kq ~ 95 veh/km/lane
  const queueDensityVehPerKm = 95 * totalLanes;
  const approachDensityVehPerKm = currentVolumeVph / Math.max(20, targetEdge.currentSpeedKmh || 40);

  let shockwaveSpeedKmh = 0;
  if (isOversaturated) {
    const deltaFlow = bottleneckCapacityVph - currentVolumeVph;
    const deltaDensity = queueDensityVehPerKm - approachDensityVehPerKm;
    shockwaveSpeedKmh = +Math.abs(deltaFlow / Math.max(10, deltaDensity)).toFixed(1);
  }

  // Maximum Queue Length Accumulated over duration
  const queueGrowthMetersPerMinute = (shockwaveSpeedKmh * 1000) / 60;
  const maxQueueLengthMeters = Math.round(
    isOversaturated ? Math.min(6000, queueGrowthMetersPerMinute * durationMinutes) : 75
  );

  // 3. Upstream BFS Traversal for Queue Spillback Propagation
  // Build reverse adjacency list (incoming edges to each node)
  const incomingMap = new Map();
  for (const [eId, edge] of activeGraph.edges.entries()) {
    if (!incomingMap.has(edge.to)) {
      incomingMap.set(edge.to, []);
    }
    incomingMap.get(edge.to).push(edge);
  }

  const upstreamSpillbackRisks = [];
  const visitedUpstream = new Set([targetEdge.from]);
  const queue = [{ nodeId: targetEdge.from, hop: 1, cumulativeDistanceKm: targetEdge.distanceKm }];

  while (queue.length > 0) {
    const { nodeId, hop, cumulativeDistanceKm } = queue.shift();
    const incomingEdges = incomingMap.get(nodeId) || [];

    for (const inEdge of incomingEdges) {
      const upstreamNodeId = inEdge.from;
      if (visitedUpstream.has(upstreamNodeId) || hop > maxHops) continue;
      visitedUpstream.add(upstreamNodeId);

      const totalDistMeters = (cumulativeDistanceKm + inEdge.distanceKm) * 1000;
      let minutesToSpillback = null;
      let spillbackRisk = 'LOW';

      if (shockwaveSpeedKmh > 0) {
        minutesToSpillback = +(totalDistMeters / queueGrowthMetersPerMinute).toFixed(1);
        if (minutesToSpillback <= durationMinutes) {
          if (minutesToSpillback < 10) spillbackRisk = 'IMMINENT';
          else if (minutesToSpillback < 25) spillbackRisk = 'HIGH';
          else spillbackRisk = 'MODERATE';
        }
      }

      const upstreamNodeData = activeGraph.nodes.get(upstreamNodeId);
      upstreamSpillbackRisks.push({
        hop,
        intersectionId: upstreamNodeId,
        intersectionName: upstreamNodeData?.name || upstreamNodeId,
        corridorVia: inEdge.name,
        distanceFromIncidentMeters: Math.round(totalDistMeters),
        estimatedMinutesUntilSpillback: minutesToSpillback,
        spillbackRisk,
      });

      if (hop < maxHops) {
        queue.push({
          nodeId: upstreamNodeId,
          hop: hop + 1,
          cumulativeDistanceKm: cumulativeDistanceKm + inEdge.distanceKm,
        });
      }
    }
  }

  // 4. Alternative Diversion Corridor Discovery
  // Temporarily close targetEdge and search for best bypass path
  const originalClosure = targetEdge.isClosed;
  targetEdge.isClosed = true;

  const bypassResult = dijkstra({
    graph: activeGraph,
    startNodeId: targetEdge.from,
    endNodeId: targetEdge.to,
    options: { avoidClosedRoads: true },
  });

  // Restore original state
  targetEdge.isClosed = originalClosure;

  const diversionViable = bypassResult.found;
  const isNetworkDisconnected = !diversionViable;

  // 5. Total Extra Network Delay Surge (Vehicle-Hours of Delay)
  let additionalDelayMinutesPerVeh = 0;
  if (isOversaturated) {
    additionalDelayMinutesPerVeh = Math.round(
      ((currentVolumeVph - bottleneckCapacityVph) / currentVolumeVph) * durationMinutes * 1.5
    );
  } else if (isClosed) {
    additionalDelayMinutesPerVeh = Math.round((bypassResult.estimatedDurationMinutes || 10) * 1.2);
  } else {
    additionalDelayMinutesPerVeh = Math.round(blockedLanes * 4.5);
  }

  const totalAffectedVehicles = Math.round(currentVolumeVph * (durationMinutes / 60));
  const networkDelayIncreaseVhd = +(
    (totalAffectedVehicles * additionalDelayMinutesPerVeh) /
    60
  ).toFixed(1);

  // 6. Action Directives
  const mitigationRecommendations = [];
  if (isNetworkDisconnected) {
    mitigationRecommendations.push('CRITICAL: Severed bridge segment detected. Reroute regional traffic to perimeter ring roads.');
  }
  if (isOversaturated) {
    mitigationRecommendations.push(`Throttle upstream metering on corridors entering ${fromNode?.name || targetEdge.from} by 40%.`);
    mitigationRecommendations.push(`Extend downstream green splits by +18s to discharge queued shockwaves.`);
  }
  if (blockedLanes >= 2 || remainingCapacityPct <= 60) {
    mitigationRecommendations.push(`Deploy dynamic roadside tow assist and advance merge signage on ${targetEdge.name}.`);
  }
  if (blockedLanes >= 1) {
    mitigationRecommendations.push(`Engage dynamic lane-use signals (LUS) to taper traffic 500m upstream.`);
  }
  if (upstreamSpillbackRisks.some((r) => r.spillbackRisk === 'IMMINENT' || r.spillbackRisk === 'HIGH')) {
    mitigationRecommendations.push(`Activate Variable Message Signs (VMS) 1.5 km upstream warning of queue tail.`);
  }

  return {
    success: true,
    edgeId,
    corridorName: targetEdge.name,
    fromIntersection: fromNode?.name || targetEdge.from,
    toIntersection: toNode?.name || targetEdge.to,
    incidentParameters: {
      lanesBlocked: blockedLanes,
      totalLanes,
      isClosed,
      durationMinutes,
    },
    directImpact: {
      nominalCapacityVph,
      bottleneckCapacityVph,
      remainingCapacityPct,
      currentVolumeVph,
      postIncidentVcRatio,
      flowRegime: isOversaturated ? 'OVERSATURATED_CONGESTED' : 'CAPACITY_REDUCED_FREE_FLOW',
    },
    shockwaveKinematics: {
      shockwaveSpeedKmh,
      maxQueueLengthMeters,
      queueGrowthRateMetersPerMin: +queueGrowthMetersPerMinute.toFixed(1),
    },
    spillbackPropagation: {
      affectedIntersectionsCount: upstreamSpillbackRisks.length,
      upstreamRisks: upstreamSpillbackRisks,
    },
    diversionAnalysis: {
      bypassCorridorAvailable: diversionViable,
      isNetworkDisconnected,
      recommendedBypassPath: diversionViable ? bypassResult.path : [],
      bypassDistanceKm: diversionViable ? bypassResult.totalDistanceKm : null,
      bypassDurationMinutes: diversionViable ? bypassResult.estimatedDurationMinutes : null,
      detourDelayMinutes: diversionViable
        ? +(bypassResult.estimatedDurationMinutes - (targetEdge.distanceKm / targetEdge.freeFlowSpeedKmh) * 60).toFixed(1)
        : null,
    },
    systemDelayImpact: {
      additionalDelayMinutesPerVeh,
      totalAffectedVehicles,
      networkDelayIncreaseVhd,
    },
    mitigationRecommendations,
  };
}
