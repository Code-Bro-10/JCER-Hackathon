/**
 * TrafficAI Algorithms Suite - Geospatial and Geometric Utilities
 * Provides deterministic distance, angle, and coordinate calculations.
 */

const EARTH_RADIUS_KM = 6371.0;
const EARTH_RADIUS_METERS = 6371000.0;

/**
 * Convert degrees to radians
 * @param {number} deg
 * @returns {number}
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180.0;
}

/**
 * Convert radians to degrees
 * @param {number} rad
 * @returns {number}
 */
export function radToDeg(rad) {
  return (rad * 180.0) / Math.PI;
}

/**
 * Calculate great-circle distance between two geographic coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Great-circle distance in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0.0;

  const phi1 = degToRad(lat1);
  const phi2 = degToRad(lat2);
  const deltaPhi = degToRad(lat2 - lat1);
  const deltaLambda = degToRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate great-circle distance in meters between two geographic coordinates.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000.0;
}

/**
 * Calculate Euclidean straight-line distance in planar 2D coordinates.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} Distance in planar coordinate units
 */
export function euclideanDistance2D(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Manhattan distance (L1 norm) in planar 2D coordinates.
 * Admissible heuristic for strict grid-based street topologies.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} Distance in planar coordinate units
 */
export function manhattanDistance2D(x1, y1, x2, y2) {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Calculate travel time in minutes given distance and speed.
 * @param {number} distanceKm
 * @param {number} speedKmh
 * @returns {number} Travel time in minutes
 */
export function travelTimeMinutes(distanceKm, speedKmh) {
  const speed = Math.max(1.0, speedKmh);
  return (distanceKm / speed) * 60.0;
}

