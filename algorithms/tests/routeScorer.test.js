import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scoreRoute, rankRoutes, SCORING_PROFILES } from '../routing/routeScorer.js';

describe('Multi-Factor Route Scoring Engine', () => {
  const sampleClearRoute = {
    id: 'route-bypass',
    title: 'Perimeter Expressway Bypass',
    distanceKm: 8.5,
    estimatedDurationMinutes: 11.2,
    freeFlowMinutes: 9.8,
    congestionIndex: 14,
    reliabilityScore: 0.94,
    isClosed: false,
  };

  const sampleCongestedRoute = {
    id: 'route-arterial',
    title: 'Downtown Direct Arterial',
    distanceKm: 5.2,
    estimatedDurationMinutes: 24.5,
    freeFlowMinutes: 8.0,
    congestionIndex: 78,
    reliabilityScore: 0.45,
    isClosed: false,
  };

  const sampleClosedRoute = {
    id: 'route-tunnel',
    title: 'Tunnel Hill Connector',
    distanceKm: 6.0,
    estimatedDurationMinutes: 15.0,
    isClosed: true,
  };

  test('should score clear route with high qualityScore and viability', () => {
    const scored = scoreRoute(sampleClearRoute, { profile: 'balanced' });

    assert.equal(scored.isViable, true);
    assert.ok(scored.qualityScore > 60);
    assert.ok(scored.compositeCost > 0);
    assert.equal(scored.factorBreakdown.closurePenalty, 0);
    assert.equal(scored.metrics.congestionIndexPct, 14);
    assert.equal(scored.metrics.reliabilityScore, 0.94);
  });

  test('should penalize congested route with higher compositeCost and lower qualityScore', () => {
    const scoredClear = scoreRoute(sampleClearRoute, { profile: 'balanced' });
    const scoredCongested = scoreRoute(sampleCongestedRoute, { profile: 'balanced' });

    assert.ok(scoredClear.qualityScore > scoredCongested.qualityScore);
    assert.ok(scoredClear.compositeCost < scoredCongested.compositeCost);
  });

  test('should disqualify closed routes with massive closure penalty and isViable=false', () => {
    const scoredClosed = scoreRoute(sampleClosedRoute);

    assert.equal(scoredClosed.isViable, false);
    assert.equal(scoredClosed.qualityScore, 0);
    assert.ok(scoredClosed.factorBreakdown.closurePenalty >= 10000);
    assert.ok(scoredClosed.compositeCost >= 10000);
  });

  test('should alter ranking when changing from fastest profile to shortest profile', () => {
    // In fastest profile: sampleClearRoute (11.2 min, 8.5 km) vs sampleCongestedRoute (24.5 min, 5.2 km)
    const fastestRank = rankRoutes([sampleClearRoute, sampleCongestedRoute], { profile: 'fastest' });
    assert.equal(fastestRank.rankedRoutes[0].id, 'route-bypass');

    // In shortest profile: sampleCongestedRoute has distance 5.2 km vs 8.5 km
    const shortestRank = rankRoutes([sampleClearRoute, sampleCongestedRoute], { profile: 'shortest' });
    // In shortest profile, 5.2 km has a big distance advantage
    assert.ok(shortestRank.success);
    assert.equal(shortestRank.totalRoutesEvaluated, 2);
  });

  test('should rank multiple routes and assign RECOMMENDED badge to optimal viable route', () => {
    const candidates = [sampleCongestedRoute, sampleClosedRoute, sampleClearRoute];
    const ranking = rankRoutes(candidates, { profile: 'balanced' });

    assert.equal(ranking.success, true);
    assert.equal(ranking.rankedRoutes.length, 3);
    assert.equal(ranking.bestRouteId, 'route-bypass');
    assert.equal(ranking.rankedRoutes[0].badge, 'RECOMMENDED');

    const closedItem = ranking.rankedRoutes.find((r) => r.id === 'route-tunnel');
    assert.equal(closedItem.badge, 'BLOCKED / CLOSED');
  });
});

