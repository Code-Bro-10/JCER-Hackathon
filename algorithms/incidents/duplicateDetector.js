/**
 * TrafficAI Algorithms Suite - Duplicate Incident Detection Engine
 * 
 * Accurately correlates newly submitted incident reports with existing active
 * incidents using multi-criteria spatial, temporal, and semantic similarity.
 */

import { haversineDistanceMeters, euclideanDistance2D } from '../utils/geoUtils.js';

// Semantic equivalence clusters for incident classification
export const INCIDENT_SEMANTIC_GROUPS = {
  ACCIDENT: ['accident', 'collision', 'crash', 'multi-vehicle', 'rollover', 'pileup', 'hit_and_run'],
  BREAKDOWN: ['breakdown', 'stalled_vehicle', 'disabled_vehicle', 'mechanical_failure', 'flat_tire', 'stalled'],
  HAZARD: ['hazard', 'debris', 'obstacle', 'spill', 'cargo_loss', 'object_on_road'],
  ROADWORK: ['roadwork', 'construction', 'lane_closure', 'repaving', 'maintenance', 'utility_work'],
  WEATHER: ['flooding', 'weather_hazard', 'ice', 'snow_drift', 'fallen_tree', 'waterlogging'],
};

/**
 * Compute token-based Jaccard similarity between two text strings
 */
function computeTextJaccardSimilarity(textA = '', textB = '') {
  if (!textA || !textB) return 0;
  const tokenize = (str) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

/**
 * Determine semantic incident type similarity (0.0 to 1.0)
 */
export function computeTypeSimilarity(typeA = '', typeB = '') {
  const normA = typeA.toLowerCase().trim().replace(/[-\s]/g, '_');
  const normB = typeB.toLowerCase().trim().replace(/[-\s]/g, '_');

  if (normA === normB) return 1.0;

  // Check if both belong to the exact same semantic group
  for (const group of Object.values(INCIDENT_SEMANTIC_GROUPS)) {
    const hasA = group.some((g) => normA.includes(g) || g.includes(normA));
    const hasB = group.some((g) => normB.includes(g) || g.includes(normB));
    if (hasA && hasB) return 0.95;
  }

  // Common cross-report confusion (breakdown vs accident)
  const isAccidentOrBreakdown =
    (normA.includes('accident') || normA.includes('collision')) &&
    (normB.includes('breakdown') || normB.includes('stalled'));
  const isReverseBreakdown =
    (normB.includes('accident') || normB.includes('collision')) &&
    (normA.includes('breakdown') || normA.includes('stalled'));

  if (isAccidentOrBreakdown || isReverseBreakdown) {
    return 0.45;
  }

  return 0.10;
}

/**
 * Calculate spatial similarity between two locations (0.0 to 1.0)
 */
export function computeLocationSimilarity(locA, locB) {
  let distanceMeters = null;

  // 1. Geographic coordinates (lat, lon)
  if (locA?.coordinates?.lat !== undefined && locB?.coordinates?.lat !== undefined) {
    distanceMeters = haversineDistanceMeters(
      locA.coordinates.lat,
      locA.coordinates.lon,
      locB.coordinates.lat,
      locB.coordinates.lon
    );
  }
  // 2. Planar coordinates (x, y)
  else if (locA?.coordinates?.x !== undefined && locB?.coordinates?.x !== undefined) {
    distanceMeters = euclideanDistance2D(
      locA.coordinates.x,
      locA.coordinates.y,
      locB.coordinates.x,
      locB.coordinates.y
    );
  }

  let geoScore = 0.0;
  if (distanceMeters !== null) {
    if (distanceMeters <= 50.0) {
      geoScore = 1.0;
    } else if (distanceMeters > 1500.0) {
      geoScore = 0.0;
    } else {
      // Gaussian spatial decay: sigma = 350 meters
      geoScore = Math.exp(-Math.pow(distanceMeters, 2) / (2 * Math.pow(350, 2)));
    }
  }

  // Textual street matching
  const textScore = computeTextJaccardSimilarity(locA.location || locA.title, locB.location || locB.title);

  if (distanceMeters !== null) {
    return {
      score: +(0.85 * geoScore + 0.15 * textScore).toFixed(4),
      distanceMeters: +distanceMeters.toFixed(1),
      textSimilarity: +textScore.toFixed(3),
    };
  }

  return {
    score: +textScore.toFixed(4),
    distanceMeters: null,
    textSimilarity: +textScore.toFixed(3),
  };
}

/**
 * Calculate temporal similarity between two timestamps (0.0 to 1.0)
 */
export function computeTimeSimilarity(timeA, timeB, maxWindowMinutes = 90) {
  const tA = new Date(timeA).getTime();
  const tB = new Date(timeB).getTime();

  if (isNaN(tA) || isNaN(tB)) {
    return { score: 0.5, timeDifferenceMinutes: 0 };
  }

  const diffMinutes = Math.abs(tA - tB) / 60000.0;
  if (diffMinutes > maxWindowMinutes) {
    return { score: 0.0, timeDifferenceMinutes: +diffMinutes.toFixed(1) };
  }

  // Exponential decay with characteristic time tau = 30 minutes
  const score = Math.exp(-diffMinutes / 30.0);
  return {
    score: +score.toFixed(4),
    timeDifferenceMinutes: +diffMinutes.toFixed(1),
  };
}

/**
 * Detect whether a candidate incident report duplicates an existing incident.
 * 
 * @param {object} candidateIncident
 * @param {Array<object>} existingIncidents
 * @param {object} [options]
 * @param {object} [options.weights={ location: 0.50, type: 0.25, time: 0.25 }]
 * @param {number} [options.duplicateThreshold=0.80]
 * @param {number} [options.potentialThreshold=0.60]
 * @param {number} [options.maxWindowMinutes=90]
 * @returns {object} Structured JSON match analysis
 */
export function detectDuplicateIncident(
  candidateIncident,
  existingIncidents = [],
  options = {}
) {
  if (!candidateIncident || typeof candidateIncident !== 'object') {
    throw new Error('detectDuplicateIncident requires a valid candidateIncident object');
  }

  const {
    weights = { location: 0.5, type: 0.25, time: 0.25 },
    duplicateThreshold = 0.8,
    potentialThreshold = 0.6,
    maxWindowMinutes = 90,
  } = options;

  if (!Array.isArray(existingIncidents) || existingIncidents.length === 0) {
    return {
      isDuplicate: false,
      decision: 'UNIQUE',
      confidence: 1.0,
      matchScore: 0.0,
      matchedIncident: null,
      similarityBreakdown: null,
      recommendation: 'CREATE_NEW',
      message: 'No active incidents currently on record for comparison.',
    };
  }

  let bestMatch = null;
  let highestScore = -1;
  let bestBreakdown = null;

  for (const existing of existingIncidents) {
    // Skip if comparing an incident with its exact self (by id)
    if (candidateIncident.id && existing.id && candidateIncident.id === existing.id) {
      continue;
    }

    const locResult = computeLocationSimilarity(candidateIncident, existing);
    const typeScore = computeTypeSimilarity(candidateIncident.type, existing.type);
    const timeResult = computeTimeSimilarity(
      candidateIncident.reportedAt || candidateIncident.timestamp || Date.now(),
      existing.reportedAt || existing.timestamp || Date.now(),
      maxWindowMinutes
    );

    let compositeScore =
      weights.location * locResult.score +
      weights.type * typeScore +
      weights.time * timeResult.score;

    // High confidence proximity bonus: within 80 meters, within 15 mins, and matching type
    if (
      locResult.distanceMeters !== null &&
      locResult.distanceMeters <= 80 &&
      timeResult.timeDifferenceMinutes <= 15 &&
      typeScore >= 0.9
    ) {
      compositeScore = Math.min(1.0, compositeScore + 0.1);
    }

    compositeScore = +compositeScore.toFixed(4);

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestMatch = existing;
      bestBreakdown = {
        compositeScore,
        locationScore: locResult.score,
        typeScore: +typeScore.toFixed(4),
        timeScore: timeResult.score,
        distanceMeters: locResult.distanceMeters,
        timeDifferenceMinutes: timeResult.timeDifferenceMinutes,
      };
    }
  }

  // Determine final classification
  let decision = 'UNIQUE';
  let recommendation = 'CREATE_NEW';
  let isDuplicate = false;

  if (highestScore >= duplicateThreshold) {
    decision = 'CONFIRMED_DUPLICATE';
    recommendation = 'MERGE_REPORTS';
    isDuplicate = true;
  } else if (highestScore >= potentialThreshold) {
    decision = 'POTENTIAL_DUPLICATE';
    recommendation = 'FLAG_FOR_OPERATOR_REVIEW';
    isDuplicate = false; // Flagged for human review, not auto-merged
  }

  return {
    isDuplicate,
    decision,
    matchScore: Math.max(0, highestScore),
    confidence: isDuplicate ? highestScore : +(1.0 - highestScore).toFixed(4),
    candidateIncidentId: candidateIncident.id || 'CANDIDATE-TEMP',
    matchedIncident: isDuplicate || decision === 'POTENTIAL_DUPLICATE'
      ? {
          id: bestMatch.id,
          title: bestMatch.title,
          type: bestMatch.type,
          location: bestMatch.location,
          severity: bestMatch.severity,
          reportedAt: bestMatch.reportedAt,
        }
      : null,
    similarityBreakdown: bestBreakdown,
    thresholdsUsed: { duplicateThreshold, potentialThreshold },
    recommendation,
  };
}

/**
 * Batch detect duplicates across an entire list of incidents
 */
export function findDuplicatesInList(incidentList = [], options = {}) {
  const duplicates = [];
  for (let i = 0; i < incidentList.length; i++) {
    const prior = incidentList.slice(0, i);
    const result = detectDuplicateIncident(incidentList[i], prior, options);
    if (result.isDuplicate || result.decision === 'POTENTIAL_DUPLICATE') {
      duplicates.push({
        sourceIncidentId: incidentList[i].id,
        ...result,
      });
    }
  }
  return duplicates;
}

