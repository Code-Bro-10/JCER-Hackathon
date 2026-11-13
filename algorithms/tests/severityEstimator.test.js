import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { estimateIncidentSeverity, SEVERITY_LEVELS } from '../incidents/severityEstimator.js';

describe('Incident Severity Estimator', () => {
  test('should classify multi-vehicle collision with injuries as CRITICAL (Tier 1)', () => {
    const criticalIncident = {
      type: 'multi_vehicle',
      lanesBlocked: 3,
      totalLanes: 4,
      roadClass: 'arterial',
      injuriesReported: 2,
      hazardousMaterials: false,
      isPeakHour: true,
      isIntersectionBlocked: true,
    };

    const assessment = estimateIncidentSeverity(criticalIncident);

    assert.equal(assessment.success, true);
    assert.equal(assessment.severity, SEVERITY_LEVELS.CRITICAL);
    assert.equal(assessment.tier, 1);
    assert.equal(assessment.priorityLabel, 'EMERGENCY_TIER_1');
    assert.ok(assessment.severityScore >= 75);
    assert.ok(assessment.operationalImpact.estimatedClearanceTimeMinutes >= 45);
    assert.ok(assessment.recommendedDirectives.length >= 2);
  });

  test('should classify minor single-lane stall on collector as MEDIUM or LOW', () => {
    const minorIncident = {
      type: 'breakdown',
      lanesBlocked: 1,
      totalLanes: 3,
      roadClass: 'collector',
      injuriesReported: 0,
      hazardousMaterials: false,
      isPeakHour: false,
    };

    const assessment = estimateIncidentSeverity(minorIncident);

    assert.ok(
      assessment.severity === SEVERITY_LEVELS.MEDIUM || assessment.severity === SEVERITY_LEVELS.LOW
    );
    assert.ok(assessment.tier >= 3);
    assert.ok(assessment.severityScore < 50);
  });

  test('should escalate hazardous materials incident', () => {
    const normalHazard = estimateIncidentSeverity({
      type: 'hazard',
      lanesBlocked: 1,
      totalLanes: 3,
      hazardousMaterials: false,
    });

    const chemicalHazard = estimateIncidentSeverity({
      type: 'hazard',
      lanesBlocked: 1,
      totalLanes: 3,
      hazardousMaterials: true,
    });

    assert.equal(
      chemicalHazard.severityScore - normalHazard.severityScore,
      25,
      'Hazmat should add exactly 25 points'
    );
    assert.ok(chemicalHazard.operationalImpact.estimatedClearanceTimeMinutes > normalHazard.operationalImpact.estimatedClearanceTimeMinutes);
  });

  test('should add complete corridor shutdown bonus if all lanes blocked', () => {
    const partialBlock = estimateIncidentSeverity({
      type: 'accident',
      lanesBlocked: 2,
      totalLanes: 4, // 50%
    });

    const fullBlock = estimateIncidentSeverity({
      type: 'accident',
      lanesBlocked: 4,
      totalLanes: 4, // 100%
    });

    assert.ok(fullBlock.factorBreakdown.blockagePoints > partialBlock.factorBreakdown.blockagePoints);
    assert.equal(fullBlock.operationalImpact.capacityReductionPct, 100);
  });
});

