/**
 * TrafficAI Algorithms Suite - Documented Deterministic Demo Dataset
 * 
 * Represents "MetroGrid Alpha": A high-fidelity urban road network model
 * calibrated with realistic geometric coordinates, capacities, road classifications,
 * deterministic historical time-series baselines, and active operational states.
 */

export const DEMO_NODES = [
  {
    id: 'INT-101',
    name: 'Grand Central Ave & 5th St',
    sector: 'Downtown Grid',
    coordinates: { lat: 37.7749, lon: -122.4194, x: 1000, y: 1000 },
    elevationMeters: 16,
    signalized: true,
    queues: { north: 14, south: 12, east: 18, west: 15 },
  },
  {
    id: 'INT-102',
    name: 'Port Blvd & Marina Bridge',
    sector: 'East Port Expressway',
    coordinates: { lat: 37.7833, lon: -122.4167, x: 2200, y: 1800 },
    elevationMeters: 4,
    signalized: true,
    queues: { north: 22, south: 19, east: 8, west: 7 },
  },
  {
    id: 'INT-103',
    name: 'Financial Way & Metro Square',
    sector: 'Metropolis Central',
    coordinates: { lat: 37.779, lon: -122.412, x: 1800, y: 1300 },
    elevationMeters: 22,
    signalized: true,
    queues: { north: 16, south: 17, east: 11, west: 13 },
  },
  {
    id: 'INT-104',
    name: 'Tech Parkway & Innovation Blvd',
    sector: 'North Tech Corridor',
    coordinates: { lat: 37.788, lon: -122.408, x: 3000, y: 2400 },
    elevationMeters: 30,
    signalized: true,
    queues: { north: 5, south: 4, east: 9, west: 6 },
  },
  {
    id: 'INT-105',
    name: 'Riverside Dr & 12th Ave',
    sector: 'West Riverside',
    coordinates: { lat: 37.768, lon: -122.425, x: 400, y: 500 },
    elevationMeters: 10,
    signalized: true,
    queues: { north: 8, south: 9, east: 14, west: 12 },
  },
  {
    id: 'INT-106',
    name: 'Civic Center & Market St',
    sector: 'Downtown Grid',
    coordinates: { lat: 37.7765, lon: -122.4175, x: 1300, y: 1150 },
    elevationMeters: 18,
    signalized: true,
    queues: { north: 19, south: 15, east: 24, west: 21 },
  },
  {
    id: 'INT-107',
    name: 'South Industrial Park & Cargo Way',
    sector: 'South Ring Road',
    coordinates: { lat: 37.7615, lon: -122.411, x: 1600, y: 200 },
    elevationMeters: 8,
    signalized: false,
    queues: { north: 6, south: 7, east: 4, west: 5 },
  },
  {
    id: 'INT-108',
    name: 'University Heights & 9th Ave',
    sector: 'West Riverside',
    coordinates: { lat: 37.7865, lon: -122.431, x: 700, y: 2300 },
    elevationMeters: 45,
    signalized: true,
    queues: { north: 7, south: 8, east: 10, west: 9 },
  },
  {
    id: 'INT-109',
    name: 'East Beltway Interchange',
    sector: 'East Port Expressway',
    coordinates: { lat: 37.772, lon: -122.401, x: 2800, y: 800 },
    elevationMeters: 12,
    signalized: true,
    queues: { north: 11, south: 10, east: 16, west: 14 },
  },
  {
    id: 'INT-110',
    name: 'North Ring Connector',
    sector: 'North Tech Corridor',
    coordinates: { lat: 37.794, lon: -122.419, x: 2100, y: 3000 },
    elevationMeters: 28,
    signalized: true,
    queues: { north: 8, south: 6, east: 7, west: 9 },
  },
];

/**
 * Directed Road Network Edges
 * Each edge models a single directed travel corridor between two intersections.
 */
export const DEMO_EDGES = [
  // Downtown arterial corridor: INT-101 <-> INT-106
  {
    id: 'EDGE-101-106',
    from: 'INT-101',
    to: 'INT-106',
    name: 'Market St (Inbound)',
    distanceKm: 0.52,
    freeFlowSpeedKmh: 45.0,
    currentSpeedKmh: 18.0, // Slow due to downtown collision
    lanes: 3,
    capacityVph: 2700,
    currentVolumeVph: 2450,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.65, // Volatile travel times
  },
  {
    id: 'EDGE-106-101',
    from: 'INT-106',
    to: 'INT-101',
    name: 'Market St (Outbound)',
    distanceKm: 0.52,
    freeFlowSpeedKmh: 45.0,
    currentSpeedKmh: 38.0,
    lanes: 3,
    capacityVph: 2700,
    currentVolumeVph: 1600,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.88,
  },

  // Downtown to Financial: INT-106 <-> INT-103
  {
    id: 'EDGE-106-103',
    from: 'INT-106',
    to: 'INT-103',
    name: '7th Street Corridor',
    distanceKm: 0.68,
    freeFlowSpeedKmh: 40.0,
    currentSpeedKmh: 12.0, // Major incident corridor (INC-2026-081)
    lanes: 4,
    capacityVph: 3600,
    currentVolumeVph: 3200,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.42,
  },
  {
    id: 'EDGE-103-106',
    from: 'INT-103',
    to: 'INT-106',
    name: '7th Street Corridor (Southbound)',
    distanceKm: 0.68,
    freeFlowSpeedKmh: 40.0,
    currentSpeedKmh: 32.0,
    lanes: 4,
    capacityVph: 3600,
    currentVolumeVph: 2100,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.82,
  },

  // Financial to Port: INT-103 <-> INT-102
  {
    id: 'EDGE-103-102',
    from: 'INT-103',
    to: 'INT-102',
    name: 'Marina Expressway Connector',
    distanceKm: 0.75,
    freeFlowSpeedKmh: 60.0,
    currentSpeedKmh: 52.0,
    lanes: 3,
    capacityVph: 3000,
    currentVolumeVph: 1950,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.91,
  },
  {
    id: 'EDGE-102-103',
    from: 'INT-102',
    to: 'INT-103',
    name: 'Marina Expressway Inbound',
    distanceKm: 0.75,
    freeFlowSpeedKmh: 60.0,
    currentSpeedKmh: 48.0,
    lanes: 3,
    capacityVph: 3000,
    currentVolumeVph: 2050,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.89,
  },

  // Port to Tech Corridor: INT-102 <-> INT-104
  {
    id: 'EDGE-102-104',
    from: 'INT-102',
    to: 'INT-104',
    name: 'Silicon Parkway',
    distanceKm: 1.05,
    freeFlowSpeedKmh: 65.0,
    currentSpeedKmh: 60.0,
    lanes: 4,
    capacityVph: 4200,
    currentVolumeVph: 2100,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.95,
  },
  {
    id: 'EDGE-104-102',
    from: 'INT-104',
    to: 'INT-102',
    name: 'Silicon Parkway (Southbound)',
    distanceKm: 1.05,
    freeFlowSpeedKmh: 65.0,
    currentSpeedKmh: 58.0,
    lanes: 4,
    capacityVph: 4200,
    currentVolumeVph: 2300,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.94,
  },

  // Riverside to Grand Central: INT-105 <-> INT-101
  {
    id: 'EDGE-105-101',
    from: 'INT-105',
    to: 'INT-101',
    name: 'West Grand Boulevard',
    distanceKm: 1.15,
    freeFlowSpeedKmh: 50.0,
    currentSpeedKmh: 46.0,
    lanes: 2,
    capacityVph: 1800,
    currentVolumeVph: 950,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.93,
  },
  {
    id: 'EDGE-101-105',
    from: 'INT-101',
    to: 'INT-105',
    name: 'West Grand Boulevard (Westbound)',
    distanceKm: 1.15,
    freeFlowSpeedKmh: 50.0,
    currentSpeedKmh: 47.0,
    lanes: 2,
    capacityVph: 1800,
    currentVolumeVph: 880,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.94,
  },

  // Riverside to University Heights: INT-105 <-> INT-108
  {
    id: 'EDGE-105-108',
    from: 'INT-105',
    to: 'INT-108',
    name: '12th Avenue Parkway',
    distanceKm: 2.12,
    freeFlowSpeedKmh: 50.0,
    currentSpeedKmh: 45.0,
    lanes: 2,
    capacityVph: 1800,
    currentVolumeVph: 820,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.92,
  },
  {
    id: 'EDGE-108-105',
    from: 'INT-108',
    to: 'INT-105',
    name: '12th Avenue Parkway (Southbound)',
    distanceKm: 2.12,
    freeFlowSpeedKmh: 50.0,
    currentSpeedKmh: 44.0,
    lanes: 2,
    capacityVph: 1800,
    currentVolumeVph: 890,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.91,
  },

  // University Heights to North Ring: INT-108 <-> INT-110
  {
    id: 'EDGE-108-110',
    from: 'INT-108',
    to: 'INT-110',
    name: 'North Ring Ridge Way',
    distanceKm: 1.72,
    freeFlowSpeedKmh: 55.0,
    currentSpeedKmh: 52.0,
    lanes: 2,
    capacityVph: 2000,
    currentVolumeVph: 900,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.93,
  },
  {
    id: 'EDGE-110-108',
    from: 'INT-110',
    to: 'INT-108',
    name: 'North Ring Ridge Way (Westbound)',
    distanceKm: 1.72,
    freeFlowSpeedKmh: 55.0,
    currentSpeedKmh: 50.0,
    lanes: 2,
    capacityVph: 2000,
    currentVolumeVph: 960,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.92,
  },

  // North Ring to Tech Parkway: INT-110 <-> INT-104
  {
    id: 'EDGE-110-104',
    from: 'INT-110',
    to: 'INT-104',
    name: 'Tech Campus Connector',
    distanceKm: 1.25,
    freeFlowSpeedKmh: 60.0,
    currentSpeedKmh: 56.0,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 1100,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.95,
  },
  {
    id: 'EDGE-104-110',
    from: 'INT-104',
    to: 'INT-110',
    name: 'Tech Campus Connector (Northbound)',
    distanceKm: 1.25,
    freeFlowSpeedKmh: 60.0,
    currentSpeedKmh: 55.0,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 1250,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.94,
  },

  // Port to East Beltway: INT-102 <-> INT-109
  {
    id: 'EDGE-102-109',
    from: 'INT-102',
    to: 'INT-109',
    name: 'East Beltway Ramp',
    distanceKm: 1.84,
    freeFlowSpeedKmh: 80.0,
    currentSpeedKmh: 74.0,
    lanes: 3,
    capacityVph: 3600,
    currentVolumeVph: 2150,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.96,
  },
  {
    id: 'EDGE-109-102',
    from: 'INT-109',
    to: 'INT-102',
    name: 'East Beltway Inbound',
    distanceKm: 1.84,
    freeFlowSpeedKmh: 80.0,
    currentSpeedKmh: 72.0,
    lanes: 3,
    capacityVph: 3600,
    currentVolumeVph: 2280,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.95,
  },

  // East Beltway to South Industrial: INT-109 <-> INT-107
  {
    id: 'EDGE-109-107',
    from: 'INT-109',
    to: 'INT-107',
    name: 'Freight Corridor South',
    distanceKm: 1.76,
    freeFlowSpeedKmh: 70.0,
    currentSpeedKmh: 65.0,
    lanes: 3,
    capacityVph: 3300,
    currentVolumeVph: 1400,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.90,
  },
  {
    id: 'EDGE-107-109',
    from: 'INT-107',
    to: 'INT-109',
    name: 'Freight Corridor North',
    distanceKm: 1.76,
    freeFlowSpeedKmh: 70.0,
    currentSpeedKmh: 64.0,
    lanes: 3,
    capacityVph: 3300,
    currentVolumeVph: 1480,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.90,
  },

  // South Industrial to Riverside: INT-107 <-> INT-105
  {
    id: 'EDGE-107-105',
    from: 'INT-107',
    to: 'INT-105',
    name: 'South Ring Express Link',
    distanceKm: 1.62,
    freeFlowSpeedKmh: 65.0,
    currentSpeedKmh: 62.0,
    lanes: 2,
    capacityVph: 2200,
    currentVolumeVph: 1100,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.94,
  },
  {
    id: 'EDGE-105-107',
    from: 'INT-105',
    to: 'INT-107',
    name: 'South Ring Express Link (Eastbound)',
    distanceKm: 1.62,
    freeFlowSpeedKmh: 65.0,
    currentSpeedKmh: 61.0,
    lanes: 2,
    capacityVph: 2200,
    currentVolumeVph: 1150,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.93,
  },

  // Direct bypass expressway: INT-101 -> INT-109
  {
    id: 'EDGE-101-109',
    from: 'INT-101',
    to: 'INT-109',
    name: 'Metro Ring Bypass South',
    distanceKm: 2.18,
    freeFlowSpeedKmh: 75.0,
    currentSpeedKmh: 71.0,
    lanes: 3,
    capacityVph: 3600,
    currentVolumeVph: 1800,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.96,
  },
  {
    id: 'EDGE-109-101',
    from: 'INT-109',
    to: 'INT-101',
    name: 'Metro Ring Bypass Northbound',
    distanceKm: 2.18,
    freeFlowSpeedKmh: 75.0,
    currentSpeedKmh: 69.0,
    lanes: 3,
    capacityVph: 3600,
    currentVolumeVph: 1950,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.95,
  },

  // Closed construction detour segment: INT-106 -> INT-108
  {
    id: 'EDGE-106-108',
    from: 'INT-106',
    to: 'INT-108',
    name: 'Tunnel Hill Connector',
    distanceKm: 1.85,
    freeFlowSpeedKmh: 50.0,
    currentSpeedKmh: 0.0,
    lanes: 2,
    capacityVph: 2000,
    currentVolumeVph: 0,
    roadClass: 'arterial',
    isClosed: true, // Emergency road closure
    reliabilityScore: 0.0,
  },
  {
    id: 'EDGE-108-106',
    from: 'INT-108',
    to: 'INT-106',
    name: 'Tunnel Hill Connector (Inbound)',
    distanceKm: 1.85,
    freeFlowSpeedKmh: 50.0,
    currentSpeedKmh: 0.0,
    lanes: 2,
    capacityVph: 2000,
    currentVolumeVph: 0,
    roadClass: 'arterial',
    isClosed: true, // Emergency road closure
    reliabilityScore: 0.0,
  },
];

/**
 * 24-Hour Simulated Historical Congestion & Velocity Baselines
 * Deterministic benchmark data representing typical diurnal commute waves.
 */
export const DEMO_HISTORICAL_PATTERNS = {
  // Sector: Downtown Grid
  'Downtown Grid': [
    { hour: 0, meanCongestion: 12, stdDev: 3.2, meanSpeedKmh: 42.0, volumeVph: 450 },
    { hour: 1, meanCongestion: 8, stdDev: 2.5, meanSpeedKmh: 44.0, volumeVph: 310 },
    { hour: 2, meanCongestion: 6, stdDev: 2.1, meanSpeedKmh: 44.5, volumeVph: 220 },
    { hour: 3, meanCongestion: 6, stdDev: 2.0, meanSpeedKmh: 44.8, volumeVph: 210 },
    { hour: 4, meanCongestion: 9, stdDev: 2.8, meanSpeedKmh: 43.5, volumeVph: 390 },
    { hour: 5, meanCongestion: 18, stdDev: 4.1, meanSpeedKmh: 40.0, volumeVph: 850 },
    { hour: 6, meanCongestion: 38, stdDev: 6.2, meanSpeedKmh: 34.0, volumeVph: 1850 },
    { hour: 7, meanCongestion: 65, stdDev: 7.8, meanSpeedKmh: 24.5, volumeVph: 2890 }, // Morning rush peak
    { hour: 8, meanCongestion: 78, stdDev: 8.5, meanSpeedKmh: 19.8, volumeVph: 3340 }, // Morning rush peak
    { hour: 9, meanCongestion: 70, stdDev: 7.2, meanSpeedKmh: 22.0, volumeVph: 3010 },
    { hour: 10, meanCongestion: 52, stdDev: 5.6, meanSpeedKmh: 28.5, volumeVph: 2320 },
    { hour: 11, meanCongestion: 48, stdDev: 5.1, meanSpeedKmh: 30.2, volumeVph: 2190 },
    { hour: 12, meanCongestion: 58, stdDev: 6.0, meanSpeedKmh: 26.8, volumeVph: 2580 }, // Lunch wave
    { hour: 13, meanCongestion: 54, stdDev: 5.8, meanSpeedKmh: 28.0, volumeVph: 2410 },
    { hour: 14, meanCongestion: 50, stdDev: 5.4, meanSpeedKmh: 29.5, volumeVph: 2280 },
    { hour: 15, meanCongestion: 62, stdDev: 6.8, meanSpeedKmh: 25.1, volumeVph: 2790 },
    { hour: 16, meanCongestion: 74, stdDev: 8.1, meanSpeedKmh: 20.8, volumeVph: 3260 },
    { hour: 17, meanCongestion: 84, stdDev: 9.0, meanSpeedKmh: 16.5, volumeVph: 3580 }, // Evening rush peak
    { hour: 18, meanCongestion: 81, stdDev: 8.7, meanSpeedKmh: 17.6, volumeVph: 3420 },
    { hour: 19, meanCongestion: 64, stdDev: 7.1, meanSpeedKmh: 24.8, volumeVph: 2750 },
    { hour: 20, meanCongestion: 45, stdDev: 5.5, meanSpeedKmh: 31.0, volumeVph: 1980 },
    { hour: 21, meanCongestion: 32, stdDev: 4.8, meanSpeedKmh: 35.5, volumeVph: 1450 },
    { hour: 22, meanCongestion: 22, stdDev: 3.9, meanSpeedKmh: 39.0, volumeVph: 980 },
    { hour: 23, meanCongestion: 16, stdDev: 3.5, meanSpeedKmh: 41.0, volumeVph: 680 },
  ],
  // Sector: Highway / East Port Expressway
  'East Port Expressway': [
    { hour: 0, meanCongestion: 8, stdDev: 2.2, meanSpeedKmh: 78.0, volumeVph: 650 },
    { hour: 7, meanCongestion: 55, stdDev: 6.5, meanSpeedKmh: 54.0, volumeVph: 3100 },
    { hour: 8, meanCongestion: 68, stdDev: 7.5, meanSpeedKmh: 45.0, volumeVph: 3550 },
    { hour: 12, meanCongestion: 40, stdDev: 4.8, meanSpeedKmh: 64.0, volumeVph: 2400 },
    { hour: 17, meanCongestion: 72, stdDev: 8.2, meanSpeedKmh: 42.0, volumeVph: 3780 },
    { hour: 18, meanCongestion: 75, stdDev: 8.4, meanSpeedKmh: 40.5, volumeVph: 3820 },
  ],
};

/**
 * Deterministic Sample Incidents for Testing & Demonstrations
 */
export const DEMO_INCIDENTS = [
  {
    id: 'INC-2026-081',
    title: 'Multi-Vehicle Collision on 7th Street Corridor',
    type: 'accident',
    location: 'Downtown Grid, 7th Ave & Market St',
    coordinates: { lat: 37.7765, lon: -122.4175, x: 1300, y: 1150 },
    reportedAt: 1773561600000, // Deterministic epoch
    lanesBlocked: 2,
    totalLanes: 4,
    roadClass: 'arterial',
    injuriesReported: 2,
    hazardousMaterials: false,
    severity: 'CRITICAL',
    sector: 'Downtown Grid',
    edgeId: 'EDGE-106-103',
  },
  {
    id: 'INC-2026-082',
    title: 'Heavy Commercial Truck Stalled in Middle Lane',
    type: 'breakdown',
    location: 'East Port Expressway, Port Blvd Ramp',
    coordinates: { lat: 37.7833, lon: -122.4167, x: 2200, y: 1800 },
    reportedAt: 1773562200000,
    lanesBlocked: 1,
    totalLanes: 3,
    roadClass: 'highway',
    injuriesReported: 0,
    hazardousMaterials: false,
    severity: 'HIGH',
    sector: 'East Port Expressway',
    edgeId: 'EDGE-102-109',
  },
  {
    id: 'INC-2026-083',
    title: 'Debris Reported on North Ring Ridge Way',
    type: 'hazard',
    location: 'North Ring Ridge Way near 9th Ave',
    coordinates: { lat: 37.7865, lon: -122.431, x: 700, y: 2300 },
    reportedAt: 1773562800000,
    lanesBlocked: 0,
    totalLanes: 2,
    roadClass: 'collector',
    injuriesReported: 0,
    hazardousMaterials: false,
    severity: 'LOW',
    sector: 'West Riverside',
    edgeId: 'EDGE-108-110',
  },
];

/**
 * Build graph structure from nodes and edges
 * Adjacency list representation suitable for Dijkstra and A*.
 * @returns {object} { nodes: Map, edges: Map, adjacency: Map }
 */
export function buildGraph(nodes = DEMO_NODES, edges = DEMO_EDGES) {
  const nodeMap = new Map();
  const edgeMap = new Map();
  const adjacency = new Map();

  for (const node of nodes) {
    nodeMap.set(node.id, { ...node });
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    edgeMap.set(edge.id, { ...edge });
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    // Calculate default travel times
    const freeFlowMinutes = (edge.distanceKm / Math.max(1, edge.freeFlowSpeedKmh)) * 60;
    const currentTravelTimeMinutes = (edge.distanceKm / Math.max(1, edge.currentSpeedKmh)) * 60;

    adjacency.get(edge.from).push({
      ...edge,
      freeFlowMinutes,
      currentTravelTimeMinutes,
    });
  }

  return {
    nodes: nodeMap,
    edges: edgeMap,
    adjacency,
  };
}

export const DEMO_NETWORK = {
  nodes: DEMO_NODES,
  edges: DEMO_EDGES,
  historicalPatterns: DEMO_HISTORICAL_PATTERNS,
  incidents: DEMO_INCIDENTS,
};

