/**
 * Traffic Shockwave & What-If Simulation Engine
 * Computes kinetic shockwave propagation from collisions and scenario shock multipliers.
 */

export function runAccidentShockwaveSimulation({
  sector = 'Downtown Grid',
  intersectionId = 'INT-101',
  lanesBlocked = 2,
  totalLanes = 4,
  initialFlowVph = 3200,
  durationMinutes = 45,
}) {
  const lanes = Math.max(1, totalLanes);
  const blocked = Math.min(lanes, Math.max(1, lanesBlocked));
  const remainingLanes = Math.max(0.5, lanes - blocked);

  // Free-flow capacity per lane = 2000 vehicles/hour
  const capacityBefore = lanes * 1900;
  const capacityAfter = remainingLanes * 1700; // Bottleneck capacity

  const demand = Math.min(initialFlowVph, capacityBefore);
  const demandExceedsCapacity = demand > capacityAfter;

  // Lighthill-Whitham-Richards (LWR) Shockwave Speed w = (q2 - q1) / (k2 - k1)
  // Jam density kj ~ 130 veh/km/lane; free flow vf ~ 60 km/h
  const jamDensity = 130 * lanes;
  const queueDensity = 90 * lanes;
  const approachDensity = demand / 50;

  // Backward-forming shockwave speed (km/h)
  const shockwaveSpeedKmh = demandExceedsCapacity
    ? Math.abs((capacityAfter - demand) / Math.max(10, queueDensity - approachDensity))
    : 0;

  // Maximum queue length accumulated over duration (meters)
  const maxQueueMeters = Math.round(
    demandExceedsCapacity ? (shockwaveSpeedKmh * (durationMinutes / 60)) * 1000 : 80
  );

  // Volume-to-capacity surge ratio
  const vcRatioSurge = +(demand / capacityAfter).toFixed(2);

  // Additional corridor delay minutes
  const addedDelayMinutes = Math.round(
    demandExceedsCapacity ? ((demand - capacityAfter) / demand) * durationMinutes * 1.4 : 5
  );

  // Secondary intersections at risk of spillback
  const adjacentIntersectionsAtRisk = [];
  if (maxQueueMeters > 300) {
    adjacentIntersectionsAtRisk.push('Market St & 6th Ave', 'Market St & 8th Ave');
  }
  if (maxQueueMeters > 600) {
    adjacentIntersectionsAtRisk.push('Central Expressway Ramp 3', 'Civic Plaza Junction');
  }

  // Recommended AI actions
  const directives = [
    `Engage dynamic metering upstream: throttle inflow by ${Math.min(40, Math.round((blocked / lanes) * 50))}%.`,
    `Trigger variable message signs 1.5 km ahead to divert traffic to parallel arterials.`,
    `Extend downstream cross-street green phases by +15s to clear exit spillback.`,
  ];

  if (blocked >= 2) {
    directives.unshift('Deploy emergency heavy wreckers and police priority route escort.');
  }

  return {
    simulationId: `SIM-SHOCK-${Date.now()}`,
    sector,
    intersectionId,
    parameters: {
      lanesBlocked: blocked,
      totalLanes: lanes,
      remainingCapacityPct: Math.round((capacityAfter / capacityBefore) * 100),
      demandVehiclesPerHour: demand,
      durationMinutes,
    },
    results: {
      shockwaveSpeedKmh: +shockwaveSpeedKmh.toFixed(1),
      maxQueueLengthMeters: maxQueueMeters,
      volumeToCapacityRatio: vcRatioSurge,
      estimatedDelayIncreaseMin: addedDelayMinutes,
      spillbackRisk: maxQueueMeters > 400 ? 'CRITICAL' : maxQueueMeters > 200 ? 'HIGH' : 'MODERATE',
      adjacentIntersectionsAtRisk,
      aiMitigationDirectives: directives,
    },
  };
}

export function runScenarioSimulation(scenario, baselineCurves) {
  let factor = 1.0;
  if (scenario.weather === 'rain') factor += 0.22;
  if (scenario.weather === 'storm') factor += 0.45;
  if (scenario.event === 'concert') factor += 0.35;
  if (scenario.event === 'sports') factor += 0.40;
  if (scenario.roadClosure) factor += 0.28;
  if (scenario.aiInterventionActive) factor -= 0.18; // AI mitigation discount

  const simulatedCurves = baselineCurves.map((item) => {
    const pFlow = Math.round(item.predicted * factor);
    const aiFlow = Math.round(item.aiOptimized * (factor * 0.85));
    const cong = Math.min(100, Math.round(item.congestion * factor));
    const spd = Math.max(15, Math.round(item.speed / Math.max(1, factor * 0.9)));
    return {
      ...item,
      predicted: pFlow,
      aiOptimized: aiFlow,
      congestion: cong,
      speed: spd,
    };
  });

  return {
    impactFactor: +((factor - 1) * 100).toFixed(1),
    estimatedCityDelayMin: Math.max(0, Math.round((factor - 1) * 45)),
    predictedCongestionPeak: Math.min(100, Math.round(86 * factor)),
    aiSavedMinutes: Math.round(18 * factor),
    recommendations: [
      'Pre-deploy tow units to highway merge choke points.',
      'Reroute commercial freight away from Sector 2.',
      'Engage +15s green wave priority along East-West arterial corridor.',
      ...(scenario.roadClosure ? ['Implement mandatory detour signage at Exit 14A.'] : []),
      ...(scenario.weather === 'storm' ? ['Reduce arterial speed limits dynamically to 40 km/h.'] : []),
    ],
    simulatedCurves,
  };
}

