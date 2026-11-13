/**
 * TrafficAI Algorithms Suite - Central Module Entrypoint
 * 
 * Provides unified access to all 9 independent, testable JavaScript algorithm modules:
 * 
 * 1. Dijkstra Shortest-Path Algorithm (dijkstra, dijkstraAllPairs)
 * 2. A* Pathfinding Algorithm (aStar, HEURISTICS)
 * 3. Multi-Factor Route Scoring (scoreRoute, rankRoutes, SCORING_PROFILES)
 * 4. Traffic Congestion Prediction (predictCongestion, predictCorridors)
 * 5. Duplicate Incident Detection (detectDuplicateIncident, findDuplicatesInList)
 * 6. Incident Severity Estimation (estimateIncidentSeverity, SEVERITY_LEVELS)
 * 7. Graph-Based Road Network Impact Analysis (analyzeNetworkImpact)
 * 8. Adaptive Traffic Signal Timing Optimization (optimizeSignalTiming, WEBSTER_CONSTRAINTS)
 * 9. Before-and-After Waiting Time Comparison (compareSignalPerformance, calculateWebsterDelay, getLevelOfService)
 */

// 1. Data and Graph Utilities
export {
  DEMO_NETWORK,
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_HISTORICAL_PATTERNS,
  DEMO_INCIDENTS,
  buildGraph,
} from './data/demoNetwork.js';

export { PriorityQueue } from './utils/priorityQueue.js';
export {
  haversineDistanceKm,
  haversineDistanceMeters,
  euclideanDistance2D,
  manhattanDistance2D,
  travelTimeMinutes,
} from './utils/geoUtils.js';

// 2. Routing Engines (Dijkstra, A*, Multi-Factor Scoring)
export { dijkstra, dijkstraAllPairs } from './routing/dijkstra.js';
export { aStar, HEURISTICS } from './routing/aStar.js';
export { scoreRoute, rankRoutes, SCORING_PROFILES } from './routing/routeScorer.js';

// 3. Traffic Congestion Prediction
export { predictCongestion, predictCorridors, WEATHER_MULTIPLIERS } from './prediction/congestionPredictor.js';

// 4. Incident Intelligence (Duplicate Detection & Severity Estimation)
export {
  detectDuplicateIncident,
  findDuplicatesInList,
  computeTypeSimilarity,
  computeLocationSimilarity,
  computeTimeSimilarity,
  INCIDENT_SEMANTIC_GROUPS,
} from './incidents/duplicateDetector.js';

export {
  estimateIncidentSeverity,
  SEVERITY_LEVELS,
} from './incidents/severityEstimator.js';

// 5. Network Impact & Kinematic Shockwaves
export { analyzeNetworkImpact } from './network/impactAnalyzer.js';

// 6. Signal Optimization & Waiting Time Comparisons
export {
  optimizeSignalTiming,
  WEBSTER_CONSTRAINTS,
} from './signals/signalOptimizer.js';

export {
  compareSignalPerformance,
  calculateWebsterDelay,
  getLevelOfService,
  LEVEL_OF_SERVICE_THRESHOLDS,
} from './signals/waitingTimeComparator.js';

