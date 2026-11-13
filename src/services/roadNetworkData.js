/**
 * TrafficAI Road Network & Cartography Data Service
 * 
 * Provides unified access to the urban road network graph,
 * geo-coordinate adapters for Leaflet, local routing execution (Dijkstra / A*),
 * connected road impact analysis, and emergency corridor calculation.
 * 
 * Works 100% offline without requiring paid external APIs.
 * Default location: Bengaluru, Karnataka, India.
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

// Center coordinate for Belagavi (Belgaum), Karnataka, India (Default Area)
export const BELAGAVI_CENTER = [15.8497, 74.4977]

// Bengaluru Metropolitan Center
export const BENGALURU_CENTER = [12.9716, 77.5946]

// Default Map Center: Belagavi (or browser current location if detected)
export const DEFAULT_MAP_CENTER = [15.8497, 74.4977]
export const DEFAULT_MAP_ZOOM = 13

// San Francisco Secondary Demo Center (for backwards compatibility)
export const SF_DEMO_CENTER = [37.778, -122.416]

/**
 * Belagavi Major Intersections & Traffic Control Nodes (PS01 Hackathon Local Host Area)
 */
export const BELAGAVI_NODES = [
  {
    id: 'BGM-101',
    name: 'Rani Chennamma Circle (Central Hub)',
    sector: 'Central Belagavi Grid',
    city: 'Belagavi',
    coordinates: { lat: 15.8596, lon: 74.5098, x: 1000, y: 1000 },
    elevationMeters: 760,
    signalized: true,
    queues: { north: 24, south: 28, east: 32, west: 22 },
  },
  {
    id: 'BGM-102',
    name: 'Belagavi Central Bus Terminus (CBT)',
    sector: 'CBT Transport Hub',
    city: 'Belagavi',
    coordinates: { lat: 15.8530, lon: 74.5055, x: 950, y: 1200 },
    elevationMeters: 758,
    signalized: true,
    queues: { north: 30, south: 25, east: 22, west: 27 },
  },
  {
    id: 'BGM-103',
    name: 'Belagavi Railway Station Junction',
    sector: 'Station Corridor',
    city: 'Belagavi',
    coordinates: { lat: 15.8647, lon: 74.5065, x: 920, y: 800 },
    elevationMeters: 762,
    signalized: true,
    queues: { north: 18, south: 20, east: 16, west: 19 },
  },
  {
    id: 'BGM-104',
    name: 'Bogarves / Congress Road Junction',
    sector: 'South Commercial Grid',
    city: 'Belagavi',
    coordinates: { lat: 15.8540, lon: 74.5120, x: 1100, y: 1250 },
    elevationMeters: 760,
    signalized: true,
    queues: { north: 22, south: 24, east: 26, west: 20 },
  },
  {
    id: 'BGM-105',
    name: 'RPD College Cross (Tilakwadi)',
    sector: 'Tilakwadi Academic/Residential',
    city: 'Belagavi',
    coordinates: { lat: 15.8398, lon: 74.5126, x: 1150, y: 1800 },
    elevationMeters: 765,
    signalized: true,
    queues: { north: 20, south: 18, east: 25, west: 22 },
  },
  {
    id: 'BGM-106',
    name: 'Jain College of Engineering (JCER) Hub',
    sector: 'Machhe / JCER Campus Corridor',
    city: 'Belagavi',
    coordinates: { lat: 15.8340, lon: 74.5360, x: 1900, y: 2100 },
    elevationMeters: 768,
    signalized: true,
    queues: { north: 15, south: 14, east: 18, west: 16 },
  },
  {
    id: 'BGM-107',
    name: 'Udyambag Industrial Hub (Khanapur Road)',
    sector: 'Udyambag Industrial Zone',
    city: 'Belagavi',
    coordinates: { lat: 15.8180, lon: 74.5020, x: 900, y: 2600 },
    elevationMeters: 755,
    signalized: true,
    queues: { north: 28, south: 32, east: 24, west: 26 },
  },
  {
    id: 'BGM-108',
    name: 'Belagavi Fort & Kote Kere Lake',
    sector: 'Heritage Fort Precinct',
    city: 'Belagavi',
    coordinates: { lat: 15.8620, lon: 74.5200, x: 1400, y: 900 },
    elevationMeters: 760,
    signalized: true,
    queues: { north: 12, south: 14, east: 16, west: 15 },
  },
  {
    id: 'BGM-109',
    name: 'KLE Hospital & JNMC Circle (Nehru Nagar)',
    sector: 'North Medical Corridor',
    city: 'Belagavi',
    coordinates: { lat: 15.8860, lon: 74.5170, x: 1300, y: 200 },
    elevationMeters: 765,
    signalized: true,
    queues: { north: 35, south: 30, east: 28, west: 25 },
  },
  {
    id: 'BGM-110',
    name: 'Suvarna Vidhana Soudha Interchange (NH-48)',
    sector: 'National Highway NH-48 Corridor',
    city: 'Belagavi',
    coordinates: { lat: 15.7876, lon: 74.5822, x: 3200, y: 3800 },
    elevationMeters: 770,
    signalized: true,
    queues: { north: 25, south: 22, east: 38, west: 30 },
  },
  {
    id: 'BGM-111',
    name: 'Peeranwadi Cross (Chorla Goa Highway)',
    sector: 'West Gateway Corridor',
    city: 'Belagavi',
    coordinates: { lat: 15.8150, lon: 74.4600, x: 200, y: 2700 },
    elevationMeters: 760,
    signalized: true,
    queues: { north: 16, south: 19, east: 22, west: 20 },
  },
  {
    id: 'BGM-112',
    name: 'Camp Area - Military Cantonment Entrance',
    sector: 'Cantonment Zone',
    city: 'Belagavi',
    coordinates: { lat: 15.8500, lon: 74.5150, x: 1200, y: 1400 },
    elevationMeters: 762,
    signalized: true,
    queues: { north: 10, south: 12, east: 14, west: 11 },
  },
]

/**
 * Belagavi Real-World Directed Road Segments
 */
export const BELAGAVI_EDGES = [
  // Chennamma Circle <-> CBT
  {
    id: 'BGM-E101-102',
    from: 'BGM-101',
    to: 'BGM-102',
    name: 'College Road (CBT Bound)',
    distanceKm: 1.1,
    freeFlowSpeedKmh: 40,
    currentSpeedKmh: 28,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 2100,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.88,
  },
  {
    id: 'BGM-E102-101',
    from: 'BGM-102',
    to: 'BGM-101',
    name: 'College Road (Chennamma Circle Bound)',
    distanceKm: 1.1,
    freeFlowSpeedKmh: 40,
    currentSpeedKmh: 26,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 2300,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.85,
  },

  // Chennamma Circle <-> Belagavi Railway Station
  {
    id: 'BGM-E101-103',
    from: 'BGM-101',
    to: 'BGM-103',
    name: 'Station Road Corridor',
    distanceKm: 1.2,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 35,
    lanes: 4,
    capacityVph: 3000,
    currentVolumeVph: 1800,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.92,
  },
  {
    id: 'BGM-E103-101',
    from: 'BGM-103',
    to: 'BGM-101',
    name: 'Station Road (Circle Bound)',
    distanceKm: 1.2,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 33,
    lanes: 4,
    capacityVph: 3000,
    currentVolumeVph: 1950,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.90,
  },

  // CBT <-> Bogarves Junction
  {
    id: 'BGM-E102-104',
    from: 'BGM-102',
    to: 'BGM-104',
    name: 'Congress Road Link (Southbound)',
    distanceKm: 0.9,
    freeFlowSpeedKmh: 40,
    currentSpeedKmh: 30,
    lanes: 4,
    capacityVph: 3000,
    currentVolumeVph: 1700,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.89,
  },
  {
    id: 'BGM-E104-102',
    from: 'BGM-104',
    to: 'BGM-102',
    name: 'Congress Road Link (Northbound)',
    distanceKm: 0.9,
    freeFlowSpeedKmh: 40,
    currentSpeedKmh: 32,
    lanes: 4,
    capacityVph: 3000,
    currentVolumeVph: 1600,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.91,
  },

  // Bogarves <-> RPD College Cross (Tilakwadi)
  {
    id: 'BGM-E104-105',
    from: 'BGM-104',
    to: 'BGM-105',
    name: 'Congress Road Main Arterial',
    distanceKm: 1.8,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 36,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 2050,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.93,
  },
  {
    id: 'BGM-E105-104',
    from: 'BGM-105',
    to: 'BGM-104',
    name: 'Congress Road (Towards Bogarves)',
    distanceKm: 1.8,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 34,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 2150,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.91,
  },

  // RPD College Cross (Tilakwadi) <-> Jain College of Engineering (JCER)
  {
    id: 'BGM-E105-106',
    from: 'BGM-105',
    to: 'BGM-106',
    name: 'Machhe - JCER Campus Corridor',
    distanceKm: 2.7,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 42,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 1450,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.95,
  },
  {
    id: 'BGM-E106-105',
    from: 'BGM-106',
    to: 'BGM-105',
    name: 'JCER to Tilakwadi Link',
    distanceKm: 2.7,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 44,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 1300,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.96,
  },

  // RPD College Cross <-> Udyambag Industrial Hub
  {
    id: 'BGM-E105-107',
    from: 'BGM-105',
    to: 'BGM-107',
    name: 'Khanapur Road Industrial Arterial',
    distanceKm: 2.6,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 35,
    lanes: 4,
    capacityVph: 3400,
    currentVolumeVph: 2400,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.87,
  },
  {
    id: 'BGM-E107-105',
    from: 'BGM-107',
    to: 'BGM-105',
    name: 'Khanapur Road (Tilakwadi Bound)',
    distanceKm: 2.6,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 38,
    lanes: 4,
    capacityVph: 3400,
    currentVolumeVph: 2200,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.89,
  },

  // Chennamma Circle <-> Belagavi Fort & Lake
  {
    id: 'BGM-E101-108',
    from: 'BGM-101',
    to: 'BGM-108',
    name: 'Fort Lake Promenade Road',
    distanceKm: 1.3,
    freeFlowSpeedKmh: 40,
    currentSpeedKmh: 32,
    lanes: 3,
    capacityVph: 2600,
    currentVolumeVph: 1500,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.94,
  },
  {
    id: 'BGM-E108-101',
    from: 'BGM-108',
    to: 'BGM-101',
    name: 'Fort to Chennamma Circle Link',
    distanceKm: 1.3,
    freeFlowSpeedKmh: 40,
    currentSpeedKmh: 34,
    lanes: 3,
    capacityVph: 2600,
    currentVolumeVph: 1400,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.95,
  },

  // Chennamma Circle <-> KLE Hospital & JNMC (Nehru Nagar)
  {
    id: 'BGM-E101-109',
    from: 'BGM-101',
    to: 'BGM-109',
    name: 'Nehru Nagar Medical Expressway',
    distanceKm: 3.2,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 36,
    lanes: 4,
    capacityVph: 3600,
    currentVolumeVph: 2800,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.88,
  },
  {
    id: 'BGM-E109-101',
    from: 'BGM-109',
    to: 'BGM-101',
    name: 'Nehru Nagar (Southbound to Circle)',
    distanceKm: 3.2,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 38,
    lanes: 4,
    capacityVph: 3600,
    currentVolumeVph: 2600,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.90,
  },

  // JCER Campus <-> Suvarna Vidhana Soudha (NH-48)
  {
    id: 'BGM-E106-110',
    from: 'BGM-106',
    to: 'BGM-110',
    name: 'NH-48 Expressway Link',
    distanceKm: 7.2,
    freeFlowSpeedKmh: 70,
    currentSpeedKmh: 64,
    lanes: 6,
    capacityVph: 5400,
    currentVolumeVph: 3200,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.97,
  },
  {
    id: 'BGM-E110-106',
    from: 'BGM-110',
    to: 'BGM-106',
    name: 'NH-48 to JCER Corridor',
    distanceKm: 7.2,
    freeFlowSpeedKmh: 70,
    currentSpeedKmh: 65,
    lanes: 6,
    capacityVph: 5400,
    currentVolumeVph: 3100,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.97,
  },

  // Udyambag <-> Peeranwadi Cross (Goa Road)
  {
    id: 'BGM-E107-111',
    from: 'BGM-107',
    to: 'BGM-111',
    name: 'Chorla Ghat Goa Highway',
    distanceKm: 4.5,
    freeFlowSpeedKmh: 55,
    currentSpeedKmh: 46,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 1900,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.93,
  },
  {
    id: 'BGM-E111-107',
    from: 'BGM-111',
    to: 'BGM-107',
    name: 'Peeranwadi to Udyambag Link',
    distanceKm: 4.5,
    freeFlowSpeedKmh: 55,
    currentSpeedKmh: 45,
    lanes: 4,
    capacityVph: 3200,
    currentVolumeVph: 2000,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.92,
  },

  // Bogarves <-> Camp Cantonment
  {
    id: 'BGM-E104-112',
    from: 'BGM-104',
    to: 'BGM-112',
    name: 'Cantonment Camp Boulevard',
    distanceKm: 0.8,
    freeFlowSpeedKmh: 35,
    currentSpeedKmh: 28,
    lanes: 2,
    capacityVph: 1800,
    currentVolumeVph: 850,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.96,
  },
  {
    id: 'BGM-E112-104',
    from: 'BGM-112',
    to: 'BGM-104',
    name: 'Camp Area to Bogarves Link',
    distanceKm: 0.8,
    freeFlowSpeedKmh: 35,
    currentSpeedKmh: 30,
    lanes: 2,
    capacityVph: 1800,
    currentVolumeVph: 800,
    roadClass: 'collector',
    isClosed: false,
    reliabilityScore: 0.96,
  },
]

/**
 * Bengaluru Major Intersections & Traffic Control Nodes
 */
export const BENGALURU_NODES = [
  {
    id: 'BLR-101',
    name: 'Majestic - Kempegowda Terminal Hub',
    sector: 'Central CBD Grid',
    city: 'Bengaluru',
    coordinates: { lat: 12.9767, lon: 77.5713, x: 1000, y: 1000 },
    elevationMeters: 920,
    signalized: true,
    queues: { north: 26, south: 22, east: 34, west: 29 },
  },
  {
    id: 'BLR-102',
    name: 'MG Road - Trinity Circle Junction',
    sector: 'East Central Corridor',
    city: 'Bengaluru',
    coordinates: { lat: 12.9733, lon: 77.6117, x: 2200, y: 1100 },
    elevationMeters: 915,
    signalized: true,
    queues: { north: 19, south: 18, east: 24, west: 21 },
  },
  {
    id: 'BLR-103',
    name: 'Indiranagar - 100 Feet Road Intersect',
    sector: 'Indiranagar Tech Hub',
    city: 'Bengaluru',
    coordinates: { lat: 12.9784, lon: 77.6408, x: 3100, y: 1300 },
    elevationMeters: 910,
    signalized: true,
    queues: { north: 14, south: 16, east: 21, west: 18 },
  },
  {
    id: 'BLR-104',
    name: 'Koramangala - Sony World Signal',
    sector: 'South Tech Grid',
    city: 'Bengaluru',
    coordinates: { lat: 12.9352, lon: 77.6245, x: 2500, y: 2200 },
    elevationMeters: 890,
    signalized: true,
    queues: { north: 28, south: 25, east: 31, west: 30 },
  },
  {
    id: 'BLR-105',
    name: 'Silk Board Junction (Critical Choke Point)',
    sector: 'Outer Ring Road Intersect',
    city: 'Bengaluru',
    coordinates: { lat: 12.9176, lon: 77.6238, x: 2450, y: 2900 },
    elevationMeters: 885,
    signalized: true,
    queues: { north: 42, south: 39, east: 48, west: 44 },
  },
  {
    id: 'BLR-106',
    name: 'HSR Layout - 27th Main Ring Road Merge',
    sector: 'HSR Corridor',
    city: 'Bengaluru',
    coordinates: { lat: 12.9121, lon: 77.6446, x: 3200, y: 3100 },
    elevationMeters: 880,
    signalized: true,
    queues: { north: 15, south: 18, east: 20, west: 17 },
  },
  {
    id: 'BLR-107',
    name: 'Electronic City - Toll Plaza Elevated Flyover',
    sector: 'South IT Expressway',
    city: 'Bengaluru',
    coordinates: { lat: 12.8452, lon: 77.6602, x: 3800, y: 4500 },
    elevationMeters: 910,
    signalized: true,
    queues: { north: 12, south: 11, east: 16, west: 14 },
  },
  {
    id: 'BLR-108',
    name: 'Hebbal - Outer Ring Road Flyover Intersect',
    sector: 'North Gateway Corridor',
    city: 'Bengaluru',
    coordinates: { lat: 13.0358, lon: 77.5970, x: 1800, y: 300 },
    elevationMeters: 925,
    signalized: true,
    queues: { north: 35, south: 32, east: 29, west: 27 },
  },
  {
    id: 'BLR-109',
    name: 'Whitefield - ITPL Main Road Corridor',
    sector: 'East IT Tech Zone',
    city: 'Bengaluru',
    coordinates: { lat: 12.9856, lon: 77.7289, x: 5000, y: 1200 },
    elevationMeters: 895,
    signalized: true,
    queues: { north: 22, south: 20, east: 25, west: 24 },
  },
  {
    id: 'BLR-110',
    name: 'KR Puram - Hanging Bridge Interchange',
    sector: 'East Ring Road Junction',
    city: 'Bengaluru',
    coordinates: { lat: 13.0006, lon: 77.6756, x: 4100, y: 800 },
    elevationMeters: 900,
    signalized: true,
    queues: { north: 31, south: 29, east: 36, west: 33 },
  },
  {
    id: 'BLR-111',
    name: 'Vidhana Soudha - Dr. Ambedkar Veedhi',
    sector: 'Government Capitol Zone',
    city: 'Bengaluru',
    coordinates: { lat: 12.9797, lon: 77.5907, x: 1500, y: 900 },
    elevationMeters: 922,
    signalized: true,
    queues: { north: 11, south: 10, east: 15, west: 14 },
  },
  {
    id: 'BLR-112',
    name: 'Jayanagar - 4th Block Central Complex',
    sector: 'South Heritage Grid',
    city: 'Bengaluru',
    coordinates: { lat: 12.9299, lon: 77.5833, x: 1300, y: 2400 },
    elevationMeters: 905,
    signalized: true,
    queues: { north: 16, south: 14, east: 19, west: 17 },
  },
]

/**
 * Bengaluru Real-World Directed Road Segments
 */
export const BENGALURU_EDGES = [
  // Majestic <-> Vidhana Soudha
  {
    id: 'BLR-E101-111',
    from: 'BLR-101',
    to: 'BLR-111',
    name: 'Seshadri Road Corridor',
    distanceKm: 2.1,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 24,
    lanes: 4,
    capacityVph: 3600,
    currentVolumeVph: 2900,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.82,
  },
  {
    id: 'BLR-E111-101',
    from: 'BLR-111',
    to: 'BLR-101',
    name: 'Seshadri Road (Westbound)',
    distanceKm: 2.1,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 36,
    lanes: 4,
    capacityVph: 3600,
    currentVolumeVph: 1950,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.91,
  },

  // Vidhana Soudha <-> MG Road
  {
    id: 'BLR-E111-102',
    from: 'BLR-111',
    to: 'BLR-102',
    name: 'Cubbon Park / MG Road Link',
    distanceKm: 2.4,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 38,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 2100,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.89,
  },
  {
    id: 'BLR-E102-111',
    from: 'BLR-102',
    to: 'BLR-111',
    name: 'MG Road (Westbound)',
    distanceKm: 2.4,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 35,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 2300,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.86,
  },

  // MG Road <-> Indiranagar
  {
    id: 'BLR-E102-103',
    from: 'BLR-102',
    to: 'BLR-103',
    name: 'Old Airport Road / CMH Link',
    distanceKm: 3.5,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 30,
    lanes: 3,
    capacityVph: 2700,
    currentVolumeVph: 2200,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.84,
  },
  {
    id: 'BLR-E103-102',
    from: 'BLR-103',
    to: 'BLR-102',
    name: 'Old Airport Road (Westbound)',
    distanceKm: 3.5,
    freeFlowSpeedKmh: 50,
    currentSpeedKmh: 28,
    lanes: 3,
    capacityVph: 2700,
    currentVolumeVph: 2350,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.81,
  },

  // Indiranagar <-> KR Puram
  {
    id: 'BLR-E103-110',
    from: 'BLR-103',
    to: 'BLR-110',
    name: 'Old Madras Road Corridor',
    distanceKm: 4.8,
    freeFlowSpeedKmh: 60,
    currentSpeedKmh: 22,
    lanes: 4,
    capacityVph: 3800,
    currentVolumeVph: 3600,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.64,
  },
  {
    id: 'BLR-E110-103',
    from: 'BLR-110',
    to: 'BLR-103',
    name: 'Old Madras Road (Inbound)',
    distanceKm: 4.8,
    freeFlowSpeedKmh: 60,
    currentSpeedKmh: 26,
    lanes: 4,
    capacityVph: 3800,
    currentVolumeVph: 3300,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.70,
  },

  // KR Puram <-> Whitefield
  {
    id: 'BLR-E110-109',
    from: 'BLR-110',
    to: 'BLR-109',
    name: 'ITPL Main Road Express',
    distanceKm: 6.2,
    freeFlowSpeedKmh: 55,
    currentSpeedKmh: 32,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 2400,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.75,
  },
  {
    id: 'BLR-E109-110',
    from: 'BLR-109',
    to: 'BLR-110',
    name: 'ITPL Main Road (Westbound)',
    distanceKm: 6.2,
    freeFlowSpeedKmh: 55,
    currentSpeedKmh: 31,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 2450,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.74,
  },

  // Indiranagar <-> Koramangala
  {
    id: 'BLR-E103-104',
    from: 'BLR-103',
    to: 'BLR-104',
    name: 'Inner Ring Road (Intermediate)',
    distanceKm: 4.2,
    freeFlowSpeedKmh: 55,
    currentSpeedKmh: 42,
    lanes: 3,
    capacityVph: 2900,
    currentVolumeVph: 1900,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.88,
  },
  {
    id: 'BLR-E104-103',
    from: 'BLR-104',
    to: 'BLR-103',
    name: 'Inner Ring Road (Northbound)',
    distanceKm: 4.2,
    freeFlowSpeedKmh: 55,
    currentSpeedKmh: 40,
    lanes: 3,
    capacityVph: 2900,
    currentVolumeVph: 2000,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.86,
  },

  // Koramangala <-> Silk Board
  {
    id: 'BLR-E104-105',
    from: 'BLR-104',
    to: 'BLR-105',
    name: 'Sarjapur Main Road Merge',
    distanceKm: 2.6,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 14,
    lanes: 3,
    capacityVph: 2700,
    currentVolumeVph: 2850,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.45,
  },
  {
    id: 'BLR-E105-104',
    from: 'BLR-105',
    to: 'BLR-104',
    name: 'Sarjapur Road (Northbound)',
    distanceKm: 2.6,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 16,
    lanes: 3,
    capacityVph: 2700,
    currentVolumeVph: 2800,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.48,
  },

  // Silk Board <-> HSR Layout
  {
    id: 'BLR-E105-106',
    from: 'BLR-105',
    to: 'BLR-106',
    name: 'Outer Ring Road (Silk Board to HSR)',
    distanceKm: 2.8,
    freeFlowSpeedKmh: 65,
    currentSpeedKmh: 28,
    lanes: 4,
    capacityVph: 4200,
    currentVolumeVph: 3900,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.65,
  },
  {
    id: 'BLR-E106-105',
    from: 'BLR-106',
    to: 'BLR-105',
    name: 'Outer Ring Road (HSR to Silk Board)',
    distanceKm: 2.8,
    freeFlowSpeedKmh: 65,
    currentSpeedKmh: 18,
    lanes: 4,
    capacityVph: 4200,
    currentVolumeVph: 4350,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.50,
  },

  // Silk Board <-> Electronic City
  {
    id: 'BLR-E105-107',
    from: 'BLR-105',
    to: 'BLR-107',
    name: 'Hosur Road Elevated Expressway',
    distanceKm: 9.8,
    freeFlowSpeedKmh: 80,
    currentSpeedKmh: 68,
    lanes: 4,
    capacityVph: 4500,
    currentVolumeVph: 2600,
    roadClass: 'expressway',
    isClosed: false,
    reliabilityScore: 0.94,
  },
  {
    id: 'BLR-E107-105',
    from: 'BLR-107',
    to: 'BLR-105',
    name: 'Hosur Road Elevated (Inbound to Silk Board)',
    distanceKm: 9.8,
    freeFlowSpeedKmh: 80,
    currentSpeedKmh: 54,
    lanes: 4,
    capacityVph: 4500,
    currentVolumeVph: 3400,
    roadClass: 'expressway',
    isClosed: false,
    reliabilityScore: 0.88,
  },

  // Majestic <-> Hebbal
  {
    id: 'BLR-E101-108',
    from: 'BLR-101',
    to: 'BLR-108',
    name: 'Bellary Road / Airport Corridor',
    distanceKm: 7.2,
    freeFlowSpeedKmh: 65,
    currentSpeedKmh: 46,
    lanes: 4,
    capacityVph: 4200,
    currentVolumeVph: 3100,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.85,
  },
  {
    id: 'BLR-E108-101',
    from: 'BLR-108',
    to: 'BLR-101',
    name: 'Bellary Road (City Inbound)',
    distanceKm: 7.2,
    freeFlowSpeedKmh: 65,
    currentSpeedKmh: 41,
    lanes: 4,
    capacityVph: 4200,
    currentVolumeVph: 3400,
    roadClass: 'highway',
    isClosed: false,
    reliabilityScore: 0.80,
  },

  // Majestic <-> Jayanagar
  {
    id: 'BLR-E101-112',
    from: 'BLR-101',
    to: 'BLR-112',
    name: 'Lalbagh Fort Road / South Arterial',
    distanceKm: 5.6,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 34,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 1950,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.87,
  },
  {
    id: 'BLR-E112-101',
    from: 'BLR-112',
    to: 'BLR-101',
    name: 'Lalbagh Road (Northbound)',
    distanceKm: 5.6,
    freeFlowSpeedKmh: 45,
    currentSpeedKmh: 32,
    lanes: 3,
    capacityVph: 2800,
    currentVolumeVph: 2100,
    roadClass: 'arterial',
    isClosed: false,
    reliabilityScore: 0.85,
  },
]

// Curated Belagavi Landmarks list (JCER-Hackathon Host City)
export const BELAGAVI_LANDMARKS = [
  { id: 'BGM-101', name: 'Rani Chennamma Circle', sector: 'Central Grid' },
  { id: 'BGM-106', name: 'Jain College of Engineering (JCER)', sector: 'Machhe Campus Corridor' },
  { id: 'BGM-102', name: 'Central Bus Terminus (CBT)', sector: 'Transport Hub' },
  { id: 'BGM-103', name: 'Belagavi Railway Station', sector: 'Station Corridor' },
  { id: 'BGM-104', name: 'Bogarves Congress Road Junction', sector: 'Commercial Grid' },
  { id: 'BGM-105', name: 'RPD College Cross (Tilakwadi)', sector: 'Tilakwadi Corridor' },
  { id: 'BGM-107', name: 'Udyambag Industrial Hub', sector: 'Industrial Zone' },
  { id: 'BGM-108', name: 'Belagavi Fort & Lake', sector: 'Heritage Precinct' },
  { id: 'BGM-109', name: 'KLE Hospital & JNMC', sector: 'Nehru Nagar Medical' },
  { id: 'BGM-110', name: 'Suvarna Vidhana Soudha', sector: 'NH-48 Corridor' },
  { id: 'BGM-111', name: 'Peeranwadi Cross (Goa Road)', sector: 'West Gateway' },
  { id: 'BGM-112', name: 'Camp Military Cantonment', sector: 'Cantonment Zone' },
]

// Curated Bengaluru Landmarks list
export const BENGALURU_LANDMARKS = [
  { id: 'BLR-101', name: 'Majestic Kempegowda Terminal', sector: 'CBD Grid' },
  { id: 'BLR-102', name: 'MG Road Trinity Circle', sector: 'East Central' },
  { id: 'BLR-103', name: 'Indiranagar 100 Feet Road', sector: 'Indiranagar Corridor' },
  { id: 'BLR-104', name: 'Koramangala Sony World Signal', sector: 'South Tech Hub' },
  { id: 'BLR-105', name: 'Silk Board Junction', sector: 'Outer Ring Road' },
  { id: 'BLR-106', name: 'HSR Layout 27th Main', sector: 'HSR Corridor' },
  { id: 'BLR-107', name: 'Electronic City Toll Plaza', sector: 'South IT Expressway' },
  { id: 'BLR-108', name: 'Hebbal Flyover Junction', sector: 'North Gateway' },
  { id: 'BLR-109', name: 'Whitefield ITPL Main Road', sector: 'East IT Tech Zone' },
  { id: 'BLR-110', name: 'KR Puram Hanging Bridge', sector: 'East Bypass' },
  { id: 'BLR-111', name: 'Vidhana Soudha Capitol', sector: 'Government Core' },
  { id: 'BLR-112', name: 'Jayanagar 4th Block', sector: 'South Heritage Grid' },
]

// Unified Nodes & Edges: includes all Belagavi, Bengaluru and demo nodes for 100% test compatibility
export const ALL_NODES = [...BELAGAVI_NODES, ...BENGALURU_NODES, ...DEMO_NODES]
export const ALL_EDGES = [...BELAGAVI_EDGES, ...BENGALURU_EDGES, ...DEMO_EDGES]

/**
 * Node dictionary keyed by ID for instant O(1) lookup
 */
export const NODES_MAP = new Map(ALL_NODES.map((node) => [node.id, node]))

/**
 * Edge dictionary keyed by ID
 */
export const EDGES_MAP = new Map(ALL_EDGES.map((edge) => [edge.id, edge]))

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
 * @returns {{ level: 'optimal'|'moderate'|'heavy'|'severe'|'closed', color: string, vcRatio: number, speedRatio: number, label: string }}
 */
export function getEdgeCongestionState(edge) {
  if (edge.isClosed) {
    return {
      level: 'closed',
      color: '#f43f5e', // red/rose with hazard
      vcRatio: Infinity,
      speedRatio: 0,
      label: 'ROAD CLOSED',
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
    return { level: 'heavy', color: '#ea580c', vcRatio, speedRatio, label: 'HEAVY TRAFFIC' }
  }
  if (speedRatio < 0.85 || vcRatio >= 0.65) {
    return { level: 'moderate', color: '#d97706', vcRatio, speedRatio, label: 'MODERATE DENSITY' }
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

  // Determine whether this is a Belagavi, Bengaluru, or standard demo node route
  const isBgm = startNodeId.startsWith('BGM-') || endNodeId.startsWith('BGM-')
  const isBlr = startNodeId.startsWith('BLR-') || endNodeId.startsWith('BLR-')
  const nodePool = isBgm ? BELAGAVI_NODES : isBlr ? BENGALURU_NODES : DEMO_NODES
  const edgePool = isBgm ? BELAGAVI_EDGES : isBlr ? BENGALURU_EDGES : DEMO_EDGES

  // Create active graph accounting for temporary road closures
  const activeEdges = edgePool.map((edge) => {
    if (closedEdgeIds.includes(edge.id)) {
      return { ...edge, isClosed: true }
    }
    return edge
  })
  const graph = buildGraph(nodePool, activeEdges)

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

  // 2. Shortest Distance Route (Dijkstra minimizing pure distanceKm)
  const shortestResult = dijkstra({
    graph,
    startNodeId,
    endNodeId,
    options: {
      weightProperty: 'distanceKm',
      avoidClosedRoads: false,
    },
  })

  // 3. Eco-Green / Arterial Bypass Route (free-flow velocity optimization)
  const ecoResult = dijkstra({
    graph,
    startNodeId,
    endNodeId,
    options: {
      weightProperty: 'freeFlowMinutes',
      avoidClosedRoads: true,
    },
  })

  const formatRoute = (id, title, badge, badgeColor, polyColor, result, summaryTag) => {
    if (!result || !result.found) return null

    const pathNodes = result.path || []
    const latLngs = pathNodes.map(getNodeLatLng).filter(Boolean)

    const distanceKm = +(result.totalDistanceKm || (latLngs.length * 1.5)).toFixed(2)
    const baseDuration = +(result.estimatedDurationMinutes || (distanceKm / 40 * 60)).toFixed(1)
    
    let durationMin = baseDuration
    let delayMin = 2
    let co2Kg = +(distanceKm * 0.12).toFixed(2)

    if (id === 'route-shortest') {
      delayMin = Math.round(durationMin * 0.4)
      durationMin = +(durationMin + delayMin).toFixed(1)
      co2Kg = +(co2Kg * 1.45).toFixed(2)
    } else if (id === 'route-eco-green') {
      co2Kg = +(co2Kg * 0.72).toFixed(2)
      delayMin = 1.2
    }

    const steps = (result.directions || []).map((dir, idx) => ({
      step: idx + 1,
      instruction: `Proceed along ${dir.roadName} toward ${NODES_MAP.get(dir.toNode)?.name || dir.toNode}`,
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
    '#06b6d4',
    aStarResult,
    'Fastest path with dynamic congestion bypass & signal coordination'
  )

  const shortestRoute = formatRoute(
    'route-shortest',
    'Shortest Distance Route',
    'SHORTEST PATH',
    'rose',
    '#f43f5e',
    shortestResult,
    'Minimum physical mileage through city central grid'
  )

  const ecoRoute = formatRoute(
    'route-eco-green',
    'Eco-Bypass Corridor',
    'ECO FRIENDLY',
    'emerald',
    '#10b981',
    ecoResult,
    'Smooth momentum bypass minimizing carbon emissions & idle time'
  )

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
  vehicleType = 'ambulance',
  originNodeId = 'BGM-101',
  destinationNodeId = 'BGM-106',
  closedEdgeIds = [],
}) {
  const isBgm = originNodeId.startsWith('BGM-') || destinationNodeId.startsWith('BGM-')
  const isBlr = originNodeId.startsWith('BLR-') || destinationNodeId.startsWith('BLR-')
  const nodePool = isBgm ? BELAGAVI_NODES : isBlr ? BENGALURU_NODES : DEMO_NODES
  const edgePool = isBgm ? BELAGAVI_EDGES : isBlr ? BENGALURU_EDGES : DEMO_EDGES

  const activeEdges = edgePool.map((edge) => {
    if (closedEdgeIds.includes(edge.id)) {
      return { ...edge, isClosed: true }
    }
    return edge
  })
  const graph = buildGraph(nodePool, activeEdges)

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

  // Normal civilian travel time (subject to congestion + red signal wait times)
  const normalAvgSpeedKmh = 32
  const normalSignalDelayMinutes = pathNodes.length * 1.1 // ~66s delay per intersection
  const normalTransitMinutes = (distanceKm / normalAvgSpeedKmh) * 60
  const normalEtaMinutes = +(normalTransitMinutes + normalSignalDelayMinutes).toFixed(1)

  // Emergency Green Wave travel time:
  // - Siren clearance speed ~ 55-65 km/h
  // - 100% downstream green signals: zero red wait time
  const emergencyAvgSpeedKmh = vehicleType === 'fire_engine' ? 52 : 64
  const emergencyEtaMinutes = +((distanceKm / emergencyAvgSpeedKmh) * 60).toFixed(1)

  const timeSavedMinutes = +(normalEtaMinutes - emergencyEtaMinutes).toFixed(1)
  const pctSaved = Math.round((timeSavedMinutes / normalEtaMinutes) * 100)

  // Downstream preemption nodes: all nodes in the path get locked to GREEN
  const preemptedNodeIds = new Set(pathNodes)

  // Cross street conflicting nodes locked to RED
  const conflictingNodeIds = new Set()
  edgePool.forEach((edge) => {
    if (preemptedNodeIds.has(edge.to) && !preemptedNodeIds.has(edge.from)) {
      conflictingNodeIds.add(edge.from)
    }
  })

  const unitMetadata = {
    ambulance: {
      code: 'MED-12 (ALS Unit)',
      name: 'Advanced Cardiac Trauma Ambulance',
      callsign: 'MED-12',
      color: '#f43f5e',
      icon: 'ambulance',
      priorityLevel: 'CODE RED',
    },
    fire_engine: {
      code: 'TRUCK-04 (Heavy Tender)',
      name: 'Rapid Intervention Fire Engine',
      callsign: 'TRUCK-04',
      color: '#ef4444',
      icon: 'flame',
      priorityLevel: 'ALARM 3',
    },
    police: {
      code: 'MP-204 (Intervention)',
      name: 'Traffic Police Rapid Interceptor',
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
