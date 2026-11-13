/**
 * TrafficAI Algorithms Suite - A* Pathfinding Algorithm
 * 
 * Computes optimal routes using heuristic-guided best-first search:
 * f(n) = g(n) + h(n)
 * 
 * Supports admissible heuristics:
 * - Haversine (Great-circle geographic distance via latitude/longitude)
 * - Euclidean (Planar L2 norm via Cartesian coordinates)
 * - Manhattan (Grid L1 norm)
 * 
 * Ensures admissibility: For travel-time costs, heuristic scales straight-line
 * distance by maximum possible network velocity, guaranteeing h(n) <= h*(n).
 */

import { PriorityQueue } from '../utils/priorityQueue.js';
import { haversineDistanceKm, euclideanDistance2D, manhattanDistance2D } from '../utils/geoUtils.js';
import { buildGraph, DEMO_NODES, DEMO_EDGES } from '../data/demoNetwork.js';

export const HEURISTICS = {
  HAVERSINE: 'haversine',
  EUCLIDEAN: 'euclidean',
  MANHATTAN: 'manhattan',
};

/**
 * Execute A* search between two intersections.
 * 
 * @param {object} params
 * @param {object} [params.graph]
 * @param {string} params.startNodeId
 * @param {string} params.endNodeId
 * @param {object} [params.options]
 * @param {'haversine'|'euclidean'|'manhattan'} [params.options.heuristic='haversine']
 * @param {'currentTravelTime'|'distanceKm'|'freeFlowMinutes'} [params.options.weightProperty='currentTravelTime']
 * @param {number} [params.options.heuristicWeight=1.0] - Epsilon weight: 1.0 = admissible/optimal
 * @param {boolean} [params.options.avoidClosedRoads=true]
 * @returns {object} Structured JSON result
 */
export function aStar({
  graph = null,
  startNodeId,
  endNodeId,
  options = {},
}) {
  const activeGraph = graph || buildGraph(DEMO_NODES, DEMO_EDGES);
  const {
    heuristic = HEURISTICS.HAVERSINE,
    weightProperty = 'currentTravelTime',
    heuristicWeight = 1.0,
    avoidClosedRoads = true,
  } = options;

  // Validation
  if (!startNodeId || typeof startNodeId !== 'string') {
    return { success: false, algorithm: 'A*', found: false, error: 'Invalid startNodeId' };
  }
  if (!endNodeId || typeof endNodeId !== 'string') {
    return { success: false, algorithm: 'A*', found: false, error: 'Invalid endNodeId' };
  }
  if (!activeGraph.nodes.has(startNodeId)) {
    return { success: false, algorithm: 'A*', found: false, error: `Start node '${startNodeId}' not found` };
  }
  if (!activeGraph.nodes.has(endNodeId)) {
    return { success: false, algorithm: 'A*', found: false, error: `Destination node '${endNodeId}' not found` };
  }

  const startNode = activeGraph.nodes.get(startNodeId);
  const goalNode = activeGraph.nodes.get(endNodeId);

  // Identity check
  if (startNodeId === endNodeId) {
    return {
      success: true,
      algorithm: 'A*',
      heuristicUsed: heuristic,
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
      directions: [],
      summary: 'Origin and destination are identical.',
    };
  }

  // Pre-calculate maximum network speed across all open edges for admissible time heuristic
  let maxNetworkSpeedKmh = 1.0;
  for (const edge of activeGraph.edges.values()) {
    const s = Math.max(edge.freeFlowSpeedKmh || 0, edge.currentSpeedKmh || 0);
    if (s > maxNetworkSpeedKmh) maxNetworkSpeedKmh = s;
  }

  /**
   * Calculate admissible heuristic h(node, goal)
   */
  function computeHeuristic(nodeId) {
    const currNode = activeGraph.nodes.get(nodeId);
    if (!currNode || !goalNode) return 0;

    let straightLineDistanceKm = 0;

    if (heuristic === HEURISTICS.HAVERSINE) {
      straightLineDistanceKm = haversineDistanceKm(
        currNode.coordinates.lat,
        currNode.coordinates.lon,
        goalNode.coordinates.lat,
        goalNode.coordinates.lon
      );
    } else if (heuristic === HEURISTICS.EUCLIDEAN) {
      const distMeters = euclideanDistance2D(
        currNode.coordinates.x,
        currNode.coordinates.y,
        goalNode.coordinates.x,
        goalNode.coordinates.y
      );
      straightLineDistanceKm = distMeters / 1000.0;
    } else if (heuristic === HEURISTICS.MANHATTAN) {
      const distMeters = manhattanDistance2D(
        currNode.coordinates.x,
        currNode.coordinates.y,
        goalNode.coordinates.x,
        goalNode.coordinates.y
      );
      straightLineDistanceKm = distMeters / 1000.0;
    } else {
      // Fallback: Haversine
      straightLineDistanceKm = haversineDistanceKm(
        currNode.coordinates.lat,
        currNode.coordinates.lon,
        goalNode.coordinates.lat,
        goalNode.coordinates.lon
      );
    }

    if (weightProperty === 'distanceKm') {
      return straightLineDistanceKm * heuristicWeight;
    }

    // Admissible time estimate: Distance / MaxSpeed (minutes)
    const minTravelTimeMinutes = (straightLineDistanceKm / maxNetworkSpeedKmh) * 60;
    return minTravelTimeMinutes * heuristicWeight;
  }

  const gScore = new Map(); // Exact cost from start to node
  const fScore = new Map(); // Estimated total cost f = g + h
  const cameFrom = new Map(); // node -> { fromNodeId, edge }
  const closedSet = new Set();
  const pq = new PriorityQueue((a, b) => a.priority - b.priority);

  gScore.set(startNodeId, 0);
  const initialH = computeHeuristic(startNodeId);
  fScore.set(startNodeId, initialH);
  pq.push(startNodeId, initialH);

  let targetReached = false;
  let visitedCount = 0;

  while (!pq.isEmpty()) {
    const { element: currentId } = pq.pop();

    if (closedSet.has(currentId)) continue;
    closedSet.add(currentId);
    visitedCount++;

    if (currentId === endNodeId) {
      targetReached = true;
      break;
    }

    const currentG = gScore.get(currentId);
    const outgoingEdges = activeGraph.adjacency.get(currentId) || [];

    for (const edge of outgoingEdges) {
      if (avoidClosedRoads && edge.isClosed) continue;

      let edgeWeight;
      if (weightProperty === 'distanceKm') {
        edgeWeight = edge.distanceKm;
      } else if (weightProperty === 'freeFlowMinutes') {
        edgeWeight = (edge.distanceKm / Math.max(1, edge.freeFlowSpeedKmh)) * 60;
      } else {
        edgeWeight = (edge.distanceKm / Math.max(1, edge.currentSpeedKmh)) * 60;
      }

      const neighborId = edge.to;
      if (closedSet.has(neighborId)) continue;

      const tentativeG = currentG + edgeWeight;
      const neighborG = gScore.has(neighborId) ? gScore.get(neighborId) : Infinity;

      if (tentativeG < neighborG) {
        cameFrom.set(neighborId, { fromNodeId: currentId, edge });
        gScore.set(neighborId, tentativeG);

        const h = computeHeuristic(neighborId);
        const f = tentativeG + h;
        fScore.set(neighborId, f);
        pq.push(neighborId, f);
      }
    }
  }

  if (!targetReached || !cameFrom.has(endNodeId)) {
    return {
      success: true,
      algorithm: 'A*',
      heuristicUsed: heuristic,
      startNode: startNodeId,
      endNode: endNodeId,
      found: false,
      totalCost: null,
      path: [],
      visitedNodesCount: visitedCount,
      message: `No viable path found between '${startNodeId}' and '${endNodeId}'.`,
    };
  }

  // Reconstruct path
  const path = [];
  const traversedEdges = [];
  let curr = endNodeId;

  while (curr !== startNodeId) {
    path.unshift(curr);
    const step = cameFrom.get(curr);
    traversedEdges.unshift(step.edge);
    curr = step.fromNodeId;
  }
  path.unshift(startNodeId);

  // Compute metrics
  let totalDistanceKm = 0;
  let estimatedDurationMinutes = 0;

  const directions = traversedEdges.map((edge, idx) => {
    totalDistanceKm += edge.distanceKm;
    const legMin = (edge.distanceKm / Math.max(1, edge.currentSpeedKmh)) * 60;
    estimatedDurationMinutes += legMin;

    return {
      step: idx + 1,
      fromNode: edge.from,
      toNode: edge.to,
      roadName: edge.name,
      distanceKm: +edge.distanceKm.toFixed(3),
      durationMinutes: +legMin.toFixed(2),
      currentSpeedKmh: edge.currentSpeedKmh,
      roadClass: edge.roadClass,
    };
  });

  totalDistanceKm = +totalDistanceKm.toFixed(3);
  estimatedDurationMinutes = +estimatedDurationMinutes.toFixed(2);
  const totalCost = +gScore.get(endNodeId).toFixed(3);

  return {
    success: true,
    algorithm: 'A*',
    heuristicUsed: heuristic,
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
    summary: `A* identified optimal route with ${visitedCount} nodes expanded, covering ${totalDistanceKm} km in ~${estimatedDurationMinutes} mins.`,
  };
}

