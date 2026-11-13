/**
 * TrafficAI Algorithms Suite - Adaptive Traffic Signal Timing Optimizer
 * 
 * Computes optimal cycle lengths and phase green allocations using
 * Webster's Minimum Delay Equation and Critical Lane Volume (CLV) methodology.
 * 
 * Complies with Federal Highway Administration (FHWA) and Highway Capacity Manual (HCM)
 * signal timing standards.
 */

export const WEBSTER_CONSTRAINTS = {
  MIN_CYCLE_SECONDS: 45,
  MAX_CYCLE_SECONDS: 140,
  DEFAULT_LOST_TIME_PER_PHASE: 4, // 3s yellow + 1s all-red clearance
  MIN_PEDESTRIAN_GREEN_SECONDS: 10,
  SATURATION_FLOW_PER_LANE: 1800, // vehicles per hour green
};

/**
 * Optimize intersection signal timing based on real-time approach queues and volumes.
 * 
 * @param {object} intersection - Intersection state and approach queues
 * @param {object} [options]
 * @param {number} [options.saturationFlowPerLane=1800]
 * @param {number} [options.lostTimePerPhase=4]
 * @param {number} [options.minGreenSeconds=10]
 * @param {number} [options.minCycleSeconds=45]
 * @param {number} [options.maxCycleSeconds=140]
 * @param {string|null} [options.emergencyPreemptionPhase=null] - Immediate green override
 * @returns {object} Structured JSON signal optimization plan
 */
export function optimizeSignalTiming(intersection, options = {}) {
  if (!intersection || typeof intersection !== 'object') {
    throw new Error('optimizeSignalTiming requires a valid intersection object');
  }

  const {
    saturationFlowPerLane = WEBSTER_CONSTRAINTS.SATURATION_FLOW_PER_LANE,
    lostTimePerPhase = WEBSTER_CONSTRAINTS.DEFAULT_LOST_TIME_PER_PHASE,
    minGreenSeconds = WEBSTER_CONSTRAINTS.MIN_PEDESTRIAN_GREEN_SECONDS,
    minCycleSeconds = WEBSTER_CONSTRAINTS.MIN_CYCLE_SECONDS,
    maxCycleSeconds = WEBSTER_CONSTRAINTS.MAX_CYCLE_SECONDS,
    emergencyPreemptionPhase = null,
  } = options;

  // Extract queues or approach volumes
  let qN = 0, qS = 0, qE = 0, qW = 0;
  let lanesNS = 2, lanesEW = 2;

  if (intersection.approaches) {
    qN = Number(intersection.approaches.north?.queue || 0);
    qS = Number(intersection.approaches.south?.queue || 0);
    qE = Number(intersection.approaches.east?.queue || 0);
    qW = Number(intersection.approaches.west?.queue || 0);
    lanesNS = Math.max(1, Number(intersection.approaches.north?.lanes || 2));
    lanesEW = Math.max(1, Number(intersection.approaches.east?.lanes || 2));
  } else if (intersection.queues) {
    qN = Number(intersection.queues.north || 0);
    qS = Number(intersection.queues.south || 0);
    qE = Number(intersection.queues.east || 0);
    qW = Number(intersection.queues.west || 0);
  } else {
    qN = Number(intersection.queueNorth || 0);
    qS = Number(intersection.queueSouth || 0);
    qE = Number(intersection.queueEast || 0);
    qW = Number(intersection.queueWest || 0);
  }

  // Convert queues into equivalent hourly critical flow demands (vph)
  // Each queued vehicle represents ~35 seconds of discharge demand across 1 hour
  const nsCriticalVolume = Math.max(qN, qS) * 32 + (qN + qS) * 4;
  const ewCriticalVolume = Math.max(qE, qW) * 32 + (qE + qW) * 4;

  const satFlowNS = saturationFlowPerLane * lanesNS;
  const satFlowEW = saturationFlowPerLane * lanesEW;

  // Flow ratios y = q / s
  const yNS = Math.max(0.08, nsCriticalVolume / satFlowNS);
  const yEW = Math.max(0.08, ewCriticalVolume / satFlowEW);
  const sumY = +(yNS + yEW).toFixed(3);

  // Total lost time L = 2 phases * lostTimePerPhase
  const totalPhases = 2;
  const totalLostTime = totalPhases * lostTimePerPhase;

  // Emergency Preemption Override Check
  if (emergencyPreemptionPhase) {
    const isNS = emergencyPreemptionPhase.toUpperCase().includes('NORTH') || emergencyPreemptionPhase.toUpperCase().includes('SOUTH');
    const overrideCycle = 60;
    const overrideGreen = overrideCycle - totalLostTime - minGreenSeconds;

    return {
      success: true,
      intersectionId: intersection.id || 'INT-UNKNOWN',
      name: intersection.name || 'Smart Intersection',
      isPreemptionActive: true,
      preemptionReason: `Emergency Vehicle Priority Corridor Active: ${emergencyPreemptionPhase}`,
      optimalCycleSeconds: overrideCycle,
      totalLostTimeSeconds: totalLostTime,
      phases: [
        {
          phaseId: 'PHASE-NS',
          name: 'North-South Corridor',
          greenSeconds: isNS ? overrideGreen : minGreenSeconds,
          yellowSeconds: 3,
          allRedSeconds: 1,
          isPreempted: isNS,
        },
        {
          phaseId: 'PHASE-EW',
          name: 'East-West Corridor',
          greenSeconds: isNS ? minGreenSeconds : overrideGreen,
          yellowSeconds: 3,
          allRedSeconds: 1,
          isPreempted: !isNS,
        },
      ],
      recommendationNote: 'Green wave preemption locked for approaching emergency vehicle.',
    };
  }

  // Webster's optimal cycle calculation:
  // C_opt = (1.5 * L + 5) / (1 - Y)
  let optimalCycle;
  let isOversaturated = false;

  if (sumY >= 0.90) {
    // Saturated condition: Webster's equation diverges; clamp to maximum safe cycle
    optimalCycle = maxCycleSeconds;
    isOversaturated = true;
  } else {
    const unconstrainedCycle = (1.5 * totalLostTime + 5.0) / (1.0 - sumY);
    optimalCycle = Math.round(Math.min(maxCycleSeconds, Math.max(minCycleSeconds, unconstrainedCycle)));
  }

  // Effective green time to divide between phases
  const effectiveGreen = Math.max(minGreenSeconds * 2, optimalCycle - totalLostTime);

  // Allocate green proportionally to critical flow ratios: g_i = (y_i / Y) * G_eff
  let rawGreenNS = Math.round((yNS / sumY) * effectiveGreen);
  let rawGreenEW = effectiveGreen - rawGreenNS;

  // Enforce minimum pedestrian safety walk constraints
  if (rawGreenNS < minGreenSeconds) {
    rawGreenNS = minGreenSeconds;
    rawGreenEW = effectiveGreen - rawGreenNS;
  } else if (rawGreenEW < minGreenSeconds) {
    rawGreenEW = minGreenSeconds;
    rawGreenNS = effectiveGreen - rawGreenEW;
  }

  // Degree of saturation X = (q * C) / (s * g)
  const degSatNS = +((nsCriticalVolume * optimalCycle) / (satFlowNS * Math.max(1, rawGreenNS))).toFixed(2);
  const degSatEW = +((ewCriticalVolume * optimalCycle) / (satFlowEW * Math.max(1, rawGreenEW))).toFixed(2);

  // Recommendation directive
  let recommendationNote = '';
  if (nsCriticalVolume > ewCriticalVolume * 1.35) {
    recommendationNote = `Surge detected on North-South axis (${qN + qS} veh in queue). Extended NS green to ${rawGreenNS}s.`;
  } else if (ewCriticalVolume > nsCriticalVolume * 1.35) {
    recommendationNote = `Surge detected on East-West axis (${qE + qW} veh in queue). Extended EW green to ${rawGreenEW}s.`;
  } else {
    recommendationNote = 'Balanced demand across approaches; equalizing split ratio.';
  }

  return {
    success: true,
    intersectionId: intersection.id || 'INT-UNKNOWN',
    name: intersection.name || 'Smart Intersection',
    isPreemptionActive: false,
    optimalCycleSeconds: optimalCycle,
    totalLostTimeSeconds: totalLostTime,
    effectiveGreenSeconds: effectiveGreen,
    sumFlowRatioY: sumY,
    saturationStatus: isOversaturated ? 'OVERSATURATED' : sumY > 0.75 ? 'NEAR_CAPACITY' : 'UNDERSATURATED',
    phases: [
      {
        phaseId: 'PHASE-NS',
        name: 'North-South Corridor',
        greenSeconds: rawGreenNS,
        yellowSeconds: 3,
        allRedSeconds: 1,
        totalPhaseSeconds: rawGreenNS + 4,
        criticalVolumeVph: Math.round(nsCriticalVolume),
        flowRatio: +yNS.toFixed(3),
        degreeOfSaturation: degSatNS,
        queues: { north: qN, south: qS },
      },
      {
        phaseId: 'PHASE-EW',
        name: 'East-West Corridor',
        greenSeconds: rawGreenEW,
        yellowSeconds: 3,
        allRedSeconds: 1,
        totalPhaseSeconds: rawGreenEW + 4,
        criticalVolumeVph: Math.round(ewCriticalVolume),
        flowRatio: +yEW.toFixed(3),
        degreeOfSaturation: degSatEW,
        queues: { east: qE, west: qW },
      },
    ],
    recommendationNote,
  };
}
