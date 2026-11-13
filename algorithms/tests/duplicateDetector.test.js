import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDuplicateIncident,
  findDuplicatesInList,
  computeTypeSimilarity,
  computeLocationSimilarity,
  computeTimeSimilarity,
} from '../incidents/duplicateDetector.js';

describe('Duplicate Incident Detection Engine', () => {
  const existingActiveIncidents = [
    {
      id: 'INC-2026-081',
      title: 'Multi-Vehicle Collision on 7th Street Corridor',
      type: 'accident',
      location: 'Downtown Grid, 7th Ave & Market St',
      coordinates: { lat: 37.7765, lon: -122.4175, x: 1300, y: 1150 },
      reportedAt: 1773561600000,
      severity: 'CRITICAL',
    },
    {
      id: 'INC-2026-082',
      title: 'Heavy Commercial Truck Stalled in Middle Lane',
      type: 'breakdown',
      location: 'East Port Expressway, Port Blvd Ramp',
      coordinates: { lat: 37.7833, lon: -122.4167, x: 2200, y: 1800 },
      reportedAt: 1773562200000,
      severity: 'HIGH',
    },
  ];

  test('should detect confirmed duplicate for proximate report (within 40m, 6 mins apart, same type)', () => {
    const candidate = {
      id: 'INC-NEW-991',
      title: 'Crash reported at 7th and Market',
      type: 'collision', // Semantically synonymous with 'accident'
      location: '7th Avenue and Market Street Downtown',
      coordinates: { lat: 37.7766, lon: -122.4174 }, // ~15 meters away
      reportedAt: 1773561600000 + 6 * 60 * 1000, // 6 mins later
    };

    const result = detectDuplicateIncident(candidate, existingActiveIncidents);

    assert.equal(result.isDuplicate, true);
    assert.equal(result.decision, 'CONFIRMED_DUPLICATE');
    assert.equal(result.recommendation, 'MERGE_REPORTS');
    assert.equal(result.matchedIncident.id, 'INC-2026-081');
    assert.ok(result.matchScore >= 0.8);
    assert.ok(result.similarityBreakdown.distanceMeters <= 50);
  });

  test('should flag potential duplicate for moderate proximity / time offset', () => {
    const candidate = {
      id: 'INC-NEW-992',
      title: 'Broken down vehicle near Port ramp',
      type: 'stalled_vehicle', // Synonymous with 'breakdown'
      location: 'Port Blvd near expressway entrance',
      coordinates: { lat: 37.785, lon: -122.418 }, // ~220 meters away
      reportedAt: 1773562200000 + 20 * 60 * 1000, // 20 mins later
    };

    const result = detectDuplicateIncident(candidate, existingActiveIncidents);

    assert.equal(result.isDuplicate, false); // Not auto-merged
    assert.equal(result.decision, 'POTENTIAL_DUPLICATE');
    assert.equal(result.recommendation, 'FLAG_FOR_OPERATOR_REVIEW');
    assert.ok(result.matchScore >= 0.6 && result.matchScore < 0.8);
    assert.equal(result.matchedIncident.id, 'INC-2026-082');
  });

  test('should classify spatially and temporally distant incident as UNIQUE', () => {
    const candidate = {
      id: 'INC-NEW-993',
      title: 'Pothole on South Ring connector',
      type: 'hazard',
      location: 'South Industrial Park & Cargo Way',
      coordinates: { lat: 37.7615, lon: -122.411 },
      reportedAt: 1773562200000 + 120 * 60 * 1000,
    };

    const result = detectDuplicateIncident(candidate, existingActiveIncidents);

    assert.equal(result.isDuplicate, false);
    assert.equal(result.decision, 'UNIQUE');
    assert.equal(result.recommendation, 'CREATE_NEW');
    assert.equal(result.matchedIncident, null);
  });

  test('should compute semantic equivalence accurately', () => {
    assert.equal(computeTypeSimilarity('accident', 'collision'), 0.95);
    assert.equal(computeTypeSimilarity('breakdown', 'stalled_vehicle'), 0.95);
    assert.equal(computeTypeSimilarity('accident', 'accident'), 1.0);
    assert.ok(computeTypeSimilarity('accident', 'breakdown') < 0.5);
  });

  test('should handle empty existing list without errors', () => {
    const result = detectDuplicateIncident({ id: 'X', type: 'accident' }, []);
    assert.equal(result.decision, 'UNIQUE');
    assert.equal(result.isDuplicate, false);
  });

  test('should detect duplicates across batch list', () => {
    const batchList = [
      existingActiveIncidents[0],
      {
        id: 'INC-DUP-1',
        type: 'accident',
        location: '7th and Market',
        coordinates: { lat: 37.7765, lon: -122.4175 },
        reportedAt: 1773561600000 + 2 * 60000,
      },
      existingActiveIncidents[1],
    ];

    const dupes = findDuplicatesInList(batchList);
    assert.equal(dupes.length, 1);
    assert.equal(dupes[0].sourceIncidentId, 'INC-DUP-1');
  });
});

