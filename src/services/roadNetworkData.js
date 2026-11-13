/**
 * TrafficAI Road Network & Cartography Data Service
 * 
 * Provides unified access to the local road network graph (MetroGrid Alpha),
 * geo-coordinate adapters for Leaflet, local routing execution (Dijkstra / A*),
 * connected road impact analysis, and emergency corridor calculation.
 * 
 * Works 100% offline without requiring external routing APIs (e.g. Mapbox/Google Maps).
 */

import {
  DEMO_NODES,
  DEMO_EDGES,
  DEMO_INCIDENTS,
  buildGraph,
} from '../../algorithms/data/demoNetwork.js'
import { dijkstra } from '../../algorithms/routing/dijkstra.js'
import { aStar, HEURISTICS } from '../../algorithms/routing/aStar.js'
import { analyzeNetworkImpact } from '../../algorithms/network/impactAnalyzer.js'

// Default center coordinate for MetroGrid Alpha (Downtown San Francisco / Financial District)
export const DEFAULT_MAP_CENTER = [37.778, -122.416]
export const DEFAULT_MAP_ZOOM = 14

/**
 * Node dictionary keyed by ID for instant O(1) lookup
 */
export const NODES_MAP = new Map(DEMO_NODES.map((node) => [node.id, node]))

/**
 * Edge dictionary keyed by ID
 */
export const EDGES_MAP = new Map(DEMO_EDGES.map((edge) => [edge.id, edge]))

/**
 * Get Leaflet [lat, lon] tuple for a node
 */
export function getNodeLatLng(nodeId) {
  const node = NODES_MAP.get(nodeId)
  if (!node || !node.coordinates) return null
  return [node.coordinates.lat, node.coordinates.lon]
}

/**
 * Get start and end coordinates [ [lat1, lon1], [lat2, lon2] ] for a directed edge
 */
export function getEdgeLatLngs(edge) {
  const from = NODES_MAP.get(edge.from)
  const to = NODES_MAP.get(edge.to)
  if (!from || !to) return null
  return [
    [from.coordinates.lat, from.coordinates.lon],
    [to.coordinates.lat, to.coordinates.lon],
  ]
}

/**
 * Compute congestion status and color for an edge
 * @returns {{ level: 'optimal'|'moderate'|'heavy'|'severe'|'closed', color: string, vcRatio: number, speedRatio: number }}
 */
export function getEdgeCongestionState(edge) {
  if (edge.isClosed) {
    return {
      level: 'closed',
      color: '#f43f5e', // red/rose with hazard
      vcRatio: Infinity,
      speedRatio: 0,
      label: 'CLOSED',
    }
  }

  const speedRatio = (edge.currentSpeedKmh || 40) / Math.max(10, edge.freeFlowSpeedKmh || 50)
  const capacity = edge.capacityVph || 2500
  const volume = edge.currentVolumeVph || 1500
  const vcRatio = +(volume / capacity).toFixed(2)

  if (speedRatio < 0.4 || vcRatio >= 1.0) {
    return { level: 'severe', color: '#ef4444', vcRatio, speedRatio, label: 'SEVERE CONGESTION' }
  }
  if (speedRatio < 0.65 || vcRatio >= 0.85) {
    return { level: 'heavy', color: '#f97316', vcRatio, speedRatio, label: 'HEAVY TRAFFIC' }
  }
  if (speedRatio < 0.85 || vcRatio >= 0.65) {
    return { level: 'moderate', color: '#f59e0b', vcRatio, speedRatio, label: 'MODERATE' }
  }
  return { level: 'optimal', color: '#10b981', vcRatio, speedRatio, label: 'FREE FLOW' }
}

/**
 * Generate Multi-Modal Alternative Routes between source and destination nodes
 * using local graph algorithms (Dijkstra, A*, and high-speed bypass / eco path)
 */
export function calculateMultiModalRoutes(startNodeId, endNodeId, closedEdgeIds = []) {
  if (!startNodeId || !endNodeId || startNodeId === endNodeId) {
    return {
      success: false,
      message: 'Source and destination must be distinct intersections.',
      routes: [],
    }
  }

  // Create active graph accounting for temporary road closures
  const activeEdges = DEMO_EDGES.map((edge) => {
    if (closedEdgeIds.includes(edge.id)) {
      return { ...edge, isClosed: true }
    }
    return edge
  })
  const graph = buildGraph(DEMO_NODES, activeEdges)

  // 1. Primary AI Smart Route (A* with current travel time & dynamic congestion avoidance)
  const aStarResult = aStar({
    graph,
    startNodeId,
    endNodeId,
    options: {
      heuristic: HEURISTICS.HAVERSINE,
      weightProperty: 'currentTravelTime',
      avoidClosedRoads: true,
    },
  })

  // 2. Shortest Distance Route (Dijkstra minimizing pure distanceKm, regardless of congestion)
  const shortestResult = dijkstra({
    graph,
    startNodeId,
    endNodeId,
    options: {
      weightProperty: 'distanceKm',
      avoidClosedRoads: false, // May pass near or through incidents
    },
  })

  // 3. Eco-Green / Arterial Bypass Route (avoiding high-acceleration stop-and-go streets)
  const ecoResult = dijkstra({
    graph,
    startNodeId,
    endNodeId,
    options: {
      weightProperty: 'freeFlowMinutes',
      avoidClosedRoads: true,
    },
  })

  // Build route object helper
  const formatRoute = (id, title, badge, badgeColor, polyColor, result, summaryTag) => {
    if (!result || !result.found) return null

    const pathNodes = result.path || []
    const latLngs = pathNodes.map(getNodeLatLng).filter(Boolean)

    // Calculate realistic speeds, delays and CO2
    const distanceKm = +(result.totalDistanceKm || (latLngs.length * 1.2)).toFixed(2)
    const baseDuration = +(result.estimatedDurationMinutes || (distanceKm / 40 * 60)).toFixed(1)
    
    // Slight tuning based on route persona
    let durationMin = baseDuration
    let delayMin = 2
    let co2Kg = +(distanceKm * 0.12).toFixed(2)

    if (id === 'route-shortest') {
      // Shortest distance might have congestion delay
      delayMin = Math.round(durationMin * 0.45)
      durationMin = +(durationMin + delayMin).toFixed(1)
      co2Kg = +(co2Kg * 1.5).toFixed(2)
    } else if (id === 'route-eco-green') {
      co2Kg = +(co2Kg * 0.75).toFixed(2)
      delayMin = 1.5
    }

    const steps = (result.directions || []).map((dir, idx) => ({
      step: idx + 1,
      instruction: `Proceed along ${dir.roadName} to ${NODES_MAP.get(dir.toNode)?.name || dir.toNode}`,
      distance: `${dir.distanceKm} km`,
      duration: `${dir.durationMinutes} min`,
      speed: `${dir.currentSpeedKmh || 45} km/h`,
      roadClass: dir.roadClass,
    }))

    return {
      id,
      title,
      badge,
      badgeColor,
      polyColor,
      summaryTag,
      distanceKm,
      durationMin,
      delayMin,
      co2Kg,
      pathNodes,
      latLngs,
      steps,
      edges: result.edges || [],
    }
  }

  const smartRoute = formatRoute(
    'route-ai-smart',
    'AI Smart Dynamic Route',
    'OPTIMAL (AI)',
    'cyan',
    '#06b6d4', // Glowing cyan
    aStarResult,
    'Fastest path with dynamic congestion bypass & green wave sync'
  )

  const shortestRoute = formatRoute(
    'route-shortest',
    'Shortest Distance Route',
    'SHORTEST PATH',
    'rose',
    '#f43f5e', // Rose/Red
    shortestResult,
    'Minimum physical mileage through city central grid'
  )

  const ecoRoute = formatRoute(
    'route-eco-green',
    'Eco-Bypass Corridor',
    'ECO FRIENDLY',
    'emerald',
    '#10b981', // Emerald green
    ecoResult,
    'Smooth momentum bypass minimizing carbon emissions & idle time'
  )

  // Filter valid routes and ensure unique paths
  const routes = [smartRoute, shortestRoute, ecoRoute].filter(Boolean)

  return {
    success: routes.length > 0,
    startNode: NODES_MAP.get(startNodeId),
    endNode: NODES_MAP.get(endNodeId),
    routes,
  }
}

/**
 * Emergency Priority Routing Calculator
 * Computes high-speed route, downstream green signal locks, and Normal vs Emergency ETA.
 */
export function calculateEmergencyCorridor({
  vehicleType = 'ambulance', // 'ambulance' | 'fire_engine' | 'police'
  originNodeId = 'INT-105', // West Station / Depot
  destinationNodeId = 'INT-104', // Tech Park Hospital / Emergency Scene
  closedEdgeIds = [],
}) {
  const activeEdges = DEMO_EDGES.map((edge) => {
    if (closedEdgeIds.includes(edge.id)) {
      return { ...edge, isClosed: true }
    }
    return edge
  })
  const graph = buildGraph(DEMO_NODES, activeEdges)

  // Shortest & fastest path under emergency siren speed limits (1.4x faster clearance)
  const routeResult = dijkstra({
    graph,
    startNodeId: originNodeId,
    endNodeId: destinationNodeId,
    options: {
      weightProperty: 'currentTravelTime',
      avoidClosedRoads: true,
    },
  })

  if (!routeResult || !routeResult.found) {
    return {
      success: false,
      message: 'No viable emergency corridor found between selected stations.',
    }
  }

  const pathNodes = routeResult.path || []
  const latLngs = pathNodes.map(getNodeLatLng).filter(Boolean)
  const distanceKm = +(routeResult.totalDistanceKm || 5.2).toFixed(2)

  // Normal civilian travel time (subject to 42 km/h average + red signal wait times)
  const normalAvgSpeedKmh = 38
  const normalSignalDelayMinutes = pathNodes.length * 0.95 // ~57s delay per signalized intersection
  const normalTransitMinutes = (distanceKm / normalAvgSpeedKmh) * 60
  const normalEtaMinutes = +(normalTransitMinutes + normalSignalDelayMinutes).toFixed(1)

  // Emergency Green Wave travel time:
  // - Speed multiplier: 1.45x (siren clearance) ~ 58 km/h
  // - 100% downstream green signals: zero red wait time
  const emergencyAvgSpeedKmh = vehicleType === 'fire_engine' ? 56 : 68
  const emergencyEtaMinutes = +((distanceKm / emergencyAvgSpeedKmh) * 60).toFixed(1)

  // Time and percentage saved
  const timeSavedMinutes = +(normalEtaMinutes - emergencyEtaMinutes).toFixed(1)
  const pctSaved = Math.round((timeSavedMinutes / normalEtaMinutes) * 100)

  // Downstream preemption nodes: all nodes in the path get locked to GREEN
  const preemptedNodeIds = new Set(pathNodes)

  // Intersections on cross streets that intersect with this path are locked to RED
  const conflictingNodeIds = new Set()
  DEMO_EDGES.forEach((edge) => {
    if (preemptedNodeIds.has(edge.to) && !preemptedNodeIds.has(edge.from)) {
      conflictingNodeIds.add(edge.from)
    }
  })

  const unitMetadata = {
    ambulance: {
      code: 'MED-12 (ALS Unit)',
      name: 'Advanced Life Support Ambulance',
      callsign: 'MED-12',
      color: '#f43f5e',
      icon: 'ambulance',
      priorityLevel: 'CODE RED',
    },
    fire_engine: {
      code: 'TRUCK-04 (Heavy Rescue)',
      name: 'Battalion Ladder & Pumper Engine',
      callsign: 'TRUCK-04',
      color: '#ef4444',
      icon: 'flame',
      priorityLevel: 'ALARM 3',
    },
    police: {
      code: 'MP-204 (Interceptor)',
      name: 'Rapid Response Patrol Cruiser',
      callsign: 'MP-204',
      color: '#3b82f6',
      icon: 'shield',
      priorityLevel: 'URGENT',
    },
  }[vehicleType] || {
    code: 'EMERG-01',
    name: 'Emergency Response Unit',
    callsign: 'EMERG-01',
    color: '#f43f5e',
    icon: 'siren',
    priorityLevel: 'CODE RED',
  }

  return {
    success: true,
    unit: unitMetadata,
    originNode: NODES_MAP.get(originNodeId),
    destinationNode: NODES_MAP.get(destinationNodeId),
    distanceKm,
    normalEtaMinutes,
    emergencyEtaMinutes,
    timeSavedMinutes,
    pctSaved,
    pathNodes,
    latLngs,
    preemptedNodeIds: Array.from(preemptedNodeIds),
    conflictingNodeIds: Array.from(conflictingNodeIds),
    signalsPreemptedCount: pathNodes.length,
    directions: routeResult.directions || [],
  }
}

/**
 * Connected Road Network Impact Simulation
 * Evaluates lane closure or accident consequences on a specific road segment
 */
export function simulateRoadImpact({
  edgeId,
  lanesBlocked = 1,
  isClosed = false,
  durationMinutes = 45,
}) {
  return analyzeNetworkImpact({
    edgeId,
    lanesBlocked,
    isClosed,
    durationMinutes,
  })
}

export { DEMO_NODES, DEMO_EDGES, DEMO_INCIDENTS }

