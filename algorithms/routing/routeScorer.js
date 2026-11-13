/**
 * TrafficAI Algorithms Suite - Multi-Factor Route Scoring Engine
 * 
 * Evaluates and ranks candidate travel routes using a comprehensive multi-criteria
 * utility framework across 5 core dimensions:
 * 1. Travel Time (ETA)
 * 2. Route Distance
 * 3. Traffic Congestion & Delay Penalty
 * 4. Road Closure Hard Constraints
 * 5. Reliability / Punctuality Confidence
 */

export const SCORING_PROFILES = {
  BALANCED: {
    name: 'balanced',
    weights: { eta: 0.35, distance: 0.20, congestion: 0.25, reliability: 0.20 },
    description: 'Harmonious optimization balancing travel duration, fuel, and predictability.',
  },
  FASTEST: {
    name: 'fastest',
    weights: { eta: 0.60, distance: 0.10, congestion: 0.20, reliability: 0.10 },
    description: 'Prioritizes shortest travel time regardless of slight distance detours.',
  },
  SHORTEST: {
    name: 'shortest',
    weights: { eta: 0.15, distance: 0.65, congestion: 0.10, reliability: 0.10 },
    description: 'Minimizes physical road distance traversed.',
  },
  MOST_RELIABLE: {
    name: 'reliable',
    weights: { eta: 0.20, distance: 0.10, congestion: 0.20, reliability: 0.50 },
    description: 'Favors low-variance corridors with predictable travel times and minimal shockwave volatility.',
  },
  ECO_FRIENDLY: {
    name: 'eco',
    weights: { eta: 0.20, distance: 0.25, congestion: 0.40, reliability: 0.15 },
    description: 'Minimizes stop-and-go idling and high congestion zones to curb CO2 emissions.',
  },
};

/**
 * Score a single candidate route against multi-factor constraints.
 * 
 * @param {object} route - Route candidate object with path, edges, or aggregated metrics
 * @param {object} [options]
 * @param {string|object} [options.profile='balanced'] - Profile name or custom weights object
 * @param {object} [options.benchmarks] - Reference norms for relative normalization
 * @returns {object} Structured JSON score breakdown
 */
export function scoreRoute(route, options = {}) {
  if (!route || typeof route !== 'object') {
    throw new Error('Invalid route parameter: expected object');
  }

  const {
    profile = 'balanced',
    benchmarks = null,
  } = options;

  // Resolve weights
  let weights;
  let profileName;
  if (typeof profile === 'string') {
    const pKey = profile.toUpperCase();
    const resolved = SCORING_PROFILES[pKey] || SCORING_PROFILES.BALANCED;
    weights = resolved.weights;
    profileName = resolved.name;
  } else if (profile && typeof profile === 'object' && profile.weights) {
    weights = profile.weights;
    profileName = profile.name || 'custom';
  } else {
    weights = SCORING_PROFILES.BALANCED.weights;
    profileName = 'balanced';
  }

  // Extract edges or synthesize from properties
  const edges = Array.isArray(route.edges) ? route.edges : [];

  // 1. Distance Metric (km)
  let distanceKm = Number(route.totalDistanceKm || route.distanceKm || 0);
  if (distanceKm === 0 && edges.length > 0) {
    distanceKm = edges.reduce((sum, e) => sum + (Number(e.distanceKm) || 0), 0);
  }
  distanceKm = +distanceKm.toFixed(3);

  // 2. Travel Time Metric (ETA in minutes)
  let etaMinutes = Number(route.estimatedDurationMinutes || route.durationMinutes || route.etaMinutes || 0);
  if (etaMinutes === 0 && edges.length > 0) {
    etaMinutes = edges.reduce((sum, e) => {
      const spd = Math.max(1, Number(e.currentSpeedKmh || e.freeFlowSpeedKmh || 40));
      return sum + ((Number(e.distanceKm) || 0) / spd) * 60;
    }, 0);
  }
  etaMinutes = +etaMinutes.toFixed(2);

  // Free-flow comparison
  let freeFlowMinutes = Number(route.freeFlowMinutes || 0);
  if (freeFlowMinutes === 0 && edges.length > 0) {
    freeFlowMinutes = edges.reduce((sum, e) => {
      const spd = Math.max(1, Number(e.freeFlowSpeedKmh || 50));
      return sum + ((Number(e.distanceKm) || 0) / spd) * 60;
    }, 0);
  }
  freeFlowMinutes = +freeFlowMinutes.toFixed(2);

  // 3. Congestion Index (0 - 100%)
  let congestionIndex = Number(route.congestionIndex);
  if (isNaN(congestionIndex)) {
    if (edges.length > 0) {
      let weightedSpeedRatio = 0;
      let totalDist = 0;
      for (const e of edges) {
        const d = Number(e.distanceKm) || 0.1;
        const curSpd = Math.max(1, Number(e.currentSpeedKmh || e.freeFlowSpeedKmh || 40));
        const ffSpd = Math.max(curSpd, Number(e.freeFlowSpeedKmh || 50));
        const speedRatio = Math.min(1.0, curSpd / ffSpd);
        weightedSpeedRatio += (1.0 - speedRatio) * d;
        totalDist += d;
      }
      congestionIndex = totalDist > 0 ? (weightedSpeedRatio / totalDist) * 100 : 0;
    } else {
      // Approximate from ETA vs FreeFlow if edges unavailable
      if (freeFlowMinutes > 0 && etaMinutes >= freeFlowMinutes) {
        congestionIndex = Math.min(100, ((etaMinutes - freeFlowMinutes) / freeFlowMinutes) * 100);
      } else {
        congestionIndex = 15; // default moderate assumption
      }
    }
  }
  congestionIndex = Math.max(0, Math.min(100, +congestionIndex.toFixed(1)));

  // 4. Road Closure Hard Constraint
  let hasClosure = Boolean(route.isClosed || route.hasClosure);
  let closedEdgeIds = [];
  if (!hasClosure && edges.length > 0) {
    for (const e of edges) {
      if (e.isClosed || (e.currentSpeedKmh !== undefined && e.currentSpeedKmh <= 0)) {
        hasClosure = true;
        closedEdgeIds.push(e.id || `${e.from}->${e.to}`);
      }
    }
  }

  // 5. Reliability Metric (0.0 - 1.0)
  let reliability = Number(route.reliabilityScore !== undefined ? route.reliabilityScore : route.reliability);
  if (isNaN(reliability)) {
    if (edges.length > 0) {
      let relSum = 0;
      let totalD = 0;
      for (const e of edges) {
        const d = Number(e.distanceKm) || 0.1;
        const rel = e.reliabilityScore !== undefined ? Number(e.reliabilityScore) : 0.85;
        relSum += rel * d;
        totalD += d;
      }
      reliability = totalD > 0 ? relSum / totalD : 0.85;
    } else {
      reliability = 0.85;
    }
  }
  reliability = Math.max(0, Math.min(1.0, +reliability.toFixed(3)));

  // Normalization against reference benchmarks (or absolute scaling)
  const refDistance = (benchmarks && benchmarks.distanceKm) ? benchmarks.distanceKm : 10.0;
  const refEta = (benchmarks && benchmarks.etaMinutes) ? benchmarks.etaMinutes : 15.0;

  const normDist = distanceKm / Math.max(1, refDistance);
  const normEta = etaMinutes / Math.max(1, refEta);
  const normCong = congestionIndex / 100.0;
  const normUnreliability = 1.0 - reliability;

  // Closure penalty: Massive 10000 penalty to prevent selection
  const closurePenalty = hasClosure ? 10000 : 0;

  // Composite Multi-Attribute Cost (Lower is better)
  const compositeCost = +(
    weights.eta * normEta +
    weights.distance * normDist +
    weights.congestion * normCong +
    weights.reliability * normUnreliability +
    closurePenalty
  ).toFixed(4);

  // Quality Score (0 to 100, Higher is better)
  // Non-closed routes receive a calibrated 0-100 score
  let qualityScore = 0;
  if (!hasClosure) {
    const rawQuality = 100 - (
      (weights.eta * (etaMinutes * 2)) +
      (weights.distance * (distanceKm * 2.5)) +
      (weights.congestion * congestionIndex * 0.5) +
      (weights.reliability * normUnreliability * 50)
    );
    qualityScore = Math.max(1, Math.min(99, Math.round(rawQuality)));
  }

  return {
    routeId: route.id || route.title || 'route-candidate',
    title: route.title || route.name || 'Candidate Route',
    isViable: !hasClosure,
    qualityScore,
    compositeCost,
    profileApplied: profileName,
    metrics: {
      distanceKm,
      etaMinutes,
      freeFlowMinutes,
      delayMinutes: +(Math.max(0, etaMinutes - freeFlowMinutes)).toFixed(2),
      congestionIndexPct: congestionIndex,
      reliabilityScore: reliability,
      hasRoadClosure: hasClosure,
      closedEdgeIds,
    },
    factorBreakdown: {
      etaContribution: +(weights.eta * normEta).toFixed(4),
      distanceContribution: +(weights.distance * normDist).toFixed(4),
      congestionContribution: +(weights.congestion * normCong).toFixed(4),
      unreliabilityContribution: +(weights.reliability * normUnreliability).toFixed(4),
      closurePenalty,
    },
    weightsUsed: weights,
  };
}

/**
 * Score and rank an array of candidate routes.
 * 
 * @param {Array<object>} routes - List of candidate route objects
 * @param {object} [options]
 * @param {string|object} [options.profile='balanced']
 * @returns {object} Structured JSON with sorted routes, rankings, and badges
 */
export function rankRoutes(routes, options = {}) {
  if (!Array.isArray(routes) || routes.length === 0) {
    return {
      success: false,
      error: 'Expected non-empty array of candidate routes',
      routes: [],
    };
  }

  // Calculate benchmark norms across candidate pool
  const validDistances = routes.map((r) => Number(r.totalDistanceKm || r.distanceKm || 0)).filter((d) => d > 0);
  const validEtas = routes.map((r) => Number(r.estimatedDurationMinutes || r.durationMinutes || 0)).filter((t) => t > 0);

  const benchmarks = {
    distanceKm: validDistances.length > 0 ? Math.min(...validDistances) : 10.0,
    etaMinutes: validEtas.length > 0 ? Math.min(...validEtas) : 15.0,
  };

  const scored = routes.map((route) => {
    const scoreData = scoreRoute(route, { ...options, benchmarks });
    return {
      ...route,
      scoring: scoreData,
    };
  });

  // Sort by composite cost ascending (lower cost = superior route)
  scored.sort((a, b) => a.scoring.compositeCost - b.scoring.compositeCost);

  // Assign badges to top performers
  let recommendedAssigned = false;
  const ranked = scored.map((item, index) => {
    let badge = null;
    let badgeColor = null;

    if (!item.scoring.isViable) {
      badge = 'BLOCKED / CLOSED';
      badgeColor = 'rose';
    } else if (!recommendedAssigned) {
      badge = 'RECOMMENDED';
      badgeColor = 'cyan';
      recommendedAssigned = true;
    } else if (index === 1) {
      badge = 'VIABLE ALTERNATIVE';
      badgeColor = 'amber';
    }

    return {
      rank: index + 1,
      id: item.id || `route-${index + 1}`,
      title: item.title || item.scoring.title,
      badge,
      badgeColor,
      qualityScore: item.scoring.qualityScore,
      compositeCost: item.scoring.compositeCost,
      metrics: item.scoring.metrics,
      factorBreakdown: item.scoring.factorBreakdown,
      path: item.path || [],
    };
  });

  return {
    success: true,
    totalRoutesEvaluated: routes.length,
    activeProfile: options.profile || 'balanced',
    bestRouteId: ranked.length > 0 ? ranked[0].id : null,
    rankedRoutes: ranked,
  };
}

