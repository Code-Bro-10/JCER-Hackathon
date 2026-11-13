/**
 * TrafficAI Algorithms Suite - Dijkstra Shortest-Path Algorithm
 * 
 * Computes exact lowest-cost paths on weighted directed road graphs using
 * a binary min-heap priority queue.
 * 
 * Complexity: O((V + E) * log V)
 */

import { PriorityQueue } from '../utils/priorityQueue.js';
import { buildGraph, DEMO_NODES, DEMO_EDGES } from '../data/demoNetwork.js';

/**
 * Execute Dijkstra shortest-path search.
 * 
 * @param {object} params
 * @param {object} [params.graph] - Pre-built graph or defaults to DEMO_NETWORK
 * @param {string} params.startNodeId - Identifier of starting intersection
 * @param {string} params.endNodeId - Identifier of destination intersection
 * @param {object} [params.options] - Search options
 * @param {'currentTravelTime'|'distanceKm'|'freeFlowMinutes'} [params.options.weightProperty='currentTravelTime']
 * @param {boolean} [params.options.avoidClosedRoads=true] - Exclude edges marked as closed
 * @param {number} [params.options.turnPenaltySeconds=0] - Additional penalty per turn/intersection in seconds
 * @returns {object} Structured JSON result
 */
export function dijkstra({
  graph = null,
  startNodeId,
  endNodeId,
  options = {},
}) {
  const activeGraph = graph || buildGraph(DEMO_NODES, DEMO_EDGES);
  const {
    weightProperty = 'currentTravelTime',
    avoidClosedRoads = true,
    turnPenaltySeconds = 0,
  } = options;

  // Input Validation
  if (!startNodeId || typeof startNodeId !== 'string') {
    return {
      success: false,
      algorithm: 'Dijkstra',
      found: false,
      error: 'Invalid or missing startNodeId parameter',
    };
  }

  if (!endNodeId || typeof endNodeId !== 'string') {
    return {
      success: false,
      algorithm: 'Dijkstra',
      found: false,
      error: 'Invalid or missing endNodeId parameter',
    };
  }

  if (!activeGraph.nodes.has(startNodeId)) {
    return {
      success: false,
      algorithm: 'Dijkstra',
      found: false,
      error: `Start node '${startNodeId}' does not exist in graph network`,
    };
  }

  if (!activeGraph.nodes.has(endNodeId)) {
    return {
      success: false,
      algorithm: 'Dijkstra',
      found: false,
      error: `Destination node '${endNodeId}' does not exist in graph network`,
    };
  }

  // Trivial identity case
  if (startNodeId === endNodeId) {
    const startNode = activeGraph.nodes.get(startNodeId);
    return {
      success: true,
      algorithm: 'Dijkstra',
      startNode: startNodeId,
      endNode: endNodeId,
      found: true,
      totalCost: 0,
      costUnit: weightProperty === 'distanceKm' ? 'km' : 'minutes',
      totalDistanceKm: 0,
      estimatedDurationMinutes: 0,
      path: [startNodeId],
      edgeCount: 0,
      visitedNodesCount: 1,
      edges: [],
      directions: [
        {
          step: 1,
          instruction: `Already at destination: ${startNode.name || startNodeId}`,
          distanceKm: 0,
          durationMinutes: 0,
        },
      ],
      summary: 'Origin and destination are identical.',
    };
  }

  const distances = new Map();
  const previous = new Map(); // nodeId -> { fromNodeId, edge }
  const visited = new Set();
  const pq = new PriorityQueue((a, b) => a.priority - b.priority);

  // Initialize source distance
  distances.set(startNodeId, 0);
  pq.push(startNodeId, 0);

  let targetReached = false;
  let visitedCount = 0;

  while (!pq.isEmpty()) {
    const { element: currentId, priority: currentDist } = pq.pop();

    if (visited.has(currentId)) continue;
    visited.add(currentId);
    visitedCount++;

    // Early termination upon reaching destination
    if (currentId === endNodeId) {
      targetReached = true;
      break;
    }

    const outgoingEdges = activeGraph.adjacency.get(currentId) || [];

    for (const edge of outgoingEdges) {
      // Discard road closures if configured
      if (avoidClosedRoads && edge.isClosed) {
        continue;
      }

      // Determine edge weight
      let edgeWeight;
      if (weightProperty === 'distanceKm') {
        edgeWeight = edge.distanceKm;
      } else if (weightProperty === 'freeFlowMinutes') {
        edgeWeight = (edge.distanceKm / Math.max(1, edge.freeFlowSpeedKmh)) * 60;
      } else {
        // Default: currentTravelTime under active congestion
        edgeWeight = (edge.distanceKm / Math.max(1, edge.currentSpeedKmh)) * 60;
      }

      if (edgeWeight < 0) {
        throw new Error(`Dijkstra requires non-negative edge weights; got ${edgeWeight} on edge ${edge.id}`);
      }

      // Add turn penalty if applicable (converted to minutes if cost unit is minutes)
      const turnPenaltyCost = weightProperty === 'distanceKm' ? 0 : turnPenaltySeconds / 60;
      const totalEdgeCost = edgeWeight + turnPenaltyCost;

      const neighborId = edge.to;
      const newDist = currentDist + totalEdgeCost;
      const existingDist = distances.has(neighborId) ? distances.get(neighborId) : Infinity;

      if (newDist < existingDist) {
        distances.set(neighborId, newDist);
        previous.set(neighborId, { fromNodeId: currentId, edge });
        pq.push(neighborId, newDist);
      }
    }
  }

  // If destination could not be reached
  if (!targetReached || !previous.has(endNodeId)) {
    return {
      success: true,
      algorithm: 'Dijkstra',
      startNode: startNodeId,
      endNode: endNodeId,
      found: false,
      totalCost: null,
      path: [],
      visitedNodesCount: visitedCount,
      message: `No viable path connects '${startNodeId}' to '${endNodeId}' given current network closures.`,
    };
  }

  // Reconstruct path
  const path = [];
  const traversedEdges = [];
  let curr = endNodeId;

  while (curr !== startNodeId) {
    path.unshift(curr);
    const step = previous.get(curr);
    traversedEdges.unshift(step.edge);
    curr = step.fromNodeId;
  }
  path.unshift(startNodeId);

  // Compute aggregated real-world metrics
  let totalDistanceKm = 0;
  let estimatedDurationMinutes = 0;

  const directions = traversedEdges.map((edge, index) => {
    totalDistanceKm += edge.distanceKm;
    const legDuration = (edge.distanceKm / Math.max(1, edge.currentSpeedKmh)) * 60;
    estimatedDurationMinutes += legDuration;

    return {
      step: index + 1,
      fromNode: edge.from,
      toNode: edge.to,
      roadName: edge.name,
      distanceKm: +edge.distanceKm.toFixed(3),
      durationMinutes: +legDuration.toFixed(2),
      currentSpeedKmh: edge.currentSpeedKmh,
      roadClass: edge.roadClass,
    };
  });

  totalDistanceKm = +totalDistanceKm.toFixed(3);
  estimatedDurationMinutes = +estimatedDurationMinutes.toFixed(2);
  const totalCost = +distances.get(endNodeId).toFixed(3);

  return {
    success: true,
    algorithm: 'Dijkstra',
    startNode: startNodeId,
    endNode: endNodeId,
    found: true,
    totalCost,
    costUnit: weightProperty === 'distanceKm' ? 'km' : 'minutes',
    totalDistanceKm,
    estimatedDurationMinutes,
    path,
    edgeCount: traversedEdges.length,
    visitedNodesCount: visitedCount,
    edges: traversedEdges,
    directions,
    summary: `Optimal path traverses ${traversedEdges.length} road segments across ${totalDistanceKm} km in ~${estimatedDurationMinutes} mins.`,
  };
}

/**
 * Single-Source Shortest Path to all reachable nodes from a start point
 */
export function dijkstraAllPairs(graph, startNodeId, options = {}) {
  const activeGraph = graph || buildGraph(DEMO_NODES, DEMO_EDGES);
  const results = {};

  for (const nodeId of activeGraph.nodes.keys()) {
    if (nodeId !== startNodeId) {
      results[nodeId] = dijkstra({
        graph: activeGraph,
        startNodeId,
        endNodeId: nodeId,
        options,
      });
    }
  }

  return {
    startNodeId,
    destinationsCount: Object.keys(results).length,
    routes: results,
  };
}

