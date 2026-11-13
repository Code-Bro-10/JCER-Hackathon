/**
 * TrafficAI Algorithms Suite - Before-and-After Waiting Time & Delay Comparator
 * 
 * Computes vehicle delay, queue lengths, Level of Service (LOS), fuel consumption,
 * and carbon emissions using Highway Capacity Manual (HCM) and Webster delay equations.
 */

export const LEVEL_OF_SERVICE_THRESHOLDS = [
  { maxDelaySeconds: 10.0, los: 'LOS A', description: 'Optimal free-flow, negligible delay' },
  { maxDelaySeconds: 20.0, los: 'LOS B', description: 'Good progression, short cycle delays' },
  { maxDelaySeconds: 35.0, los: 'LOS C', description: 'Stable flow, acceptable urban delay' },
  { maxDelaySeconds: 55.0, los: 'LOS D', description: 'Approaching capacity, notable queues' },
  { maxDelaySeconds: 80.0, los: 'LOS E', description: 'At capacity, severe stop-and-go delays' },
  { maxDelaySeconds: Infinity, los: 'LOS F', description: 'Oversaturated breakdown, intersection gridlock' },
];

/**
 * Determine Highway Capacity Manual (HCM) Level of Service grade
 * @param {number} delaySeconds
 * @returns {{ los: string, description: string }}
 */
export function getLevelOfService(delaySeconds) {
  const d = Math.max(0, Number(delaySeconds) || 0);
  for (const tier of LEVEL_OF_SERVICE_THRESHOLDS) {
    if (d <= tier.maxDelaySeconds) {
      return { los: tier.los, description: tier.description };
    }
  }
  return { los: 'LOS F', description: 'Extreme breakdown' };
}

/**
 * Calculate Webster's control delay per vehicle for a signalized phase.
 * 
 * Formula:
 * d = d1 + d2
 * d1 = (C * (1 - lambda)^2) / (2 * (1 - lambda * X))
 * d2 = (X^2) / (2 * q * (1 - X))  [with oversaturation clamping]
 * 
 * @param {number} cycleLengthSeconds - C
 * @param {number} greenSeconds - g
 * @param {number} volumeVph - arrival rate q
 * @param {number} capacityVph - phase capacity c = s * (g / C)
 * @returns {number} Average control delay in seconds per vehicle
 */
export function calculateWebsterDelay(cycleLengthSeconds, greenSeconds, volumeVph, capacityVph) {
  const C = Math.max(20, Number(cycleLengthSeconds) || 60);
  const g = Math.max(5, Math.min(C - 4, Number(greenSeconds) || 25));
  const v = Math.max(10, Number(volumeVph) || 500);
  const c = Math.max(20, Number(capacityVph) || 1200);

  const lambda = g / C; // Green ratio
  const X = Math.min(0.98, v / c); // Degree of saturation (clamped to prevent infinite divergence)

  // 1. Uniform Delay d1
  const num1 = C * Math.pow(1.0 - lambda, 2);
  const den1 = 2.0 * (1.0 - Math.min(0.96, lambda * X));
  const d1 = num1 / den1;

  // 2. Incremental Random Delay d2
  const arrivalRateVehPerSec = v / 3600.0;
  const num2 = Math.pow(X, 2);
  const den2 = 2.0 * arrivalRateVehPerSec * Math.max(0.04, 1.0 - X);
  const d2 = Math.min(60.0, num2 / den2);

  const totalDelay = +(d1 + d2).toFixed(2);
  return totalDelay;
}

/**
 * Compare traffic performance before and after signal timing optimization or intervention.
 * 
 * @param {object} params
 * @param {object} params.baseline - Pre-optimization state
 * @param {number} params.baseline.cycleSeconds
 * @param {number} params.baseline.greenNS
 * @param {number} params.baseline.greenEW
 * @param {number} [params.baseline.volumeNS=1200]
 * @param {number} [params.baseline.volumeEW=800]
 * @param {number} [params.baseline.averageQueueVehicles=24]
 * @param {object} params.optimized - Post-optimization state
 * @param {number} params.optimized.cycleSeconds
 * @param {number} params.optimized.greenNS
 * @param {number} params.optimized.greenEW
 * @param {number} [params.optimized.volumeNS=1200]
 * @param {number} [params.optimized.volumeEW=800]
 * @param {number} [params.optimized.averageQueueVehicles=16]
 * @param {object} [params.context] - Additional context parameters
 * @returns {object} Structured JSON comparative analysis
 */
export function compareSignalPerformance({
  baseline,
  optimized,
  context = {},
}) {
  if (!baseline || !optimized) {
    throw new Error('compareSignalPerformance requires both baseline and optimized configuration objects');
  }

  const volNS = Number(baseline.volumeNS || optimized.volumeNS || 1200);
  const volEW = Number(baseline.volumeEW || optimized.volumeEW || 850);
  const totalVolumeVph = volNS + volEW;

  const satFlowRate = Number(context.saturationFlowPerLane || 1800) * 2; // 2 lanes per approach

  // --- Baseline Computation ---
  const baseCycle = Number(baseline.cycleSeconds || 90);
  const baseGreenNS = Number(baseline.greenNS || 40);
  const baseGreenEW = Number(baseline.greenEW || 42);

  const baseCapNS = satFlowRate * (baseGreenNS / baseCycle);
  const baseCapEW = satFlowRate * (baseGreenEW / baseCycle);

  const baseDelayNS = calculateWebsterDelay(baseCycle, baseGreenNS, volNS, baseCapNS);
  const baseDelayEW = calculateWebsterDelay(baseCycle, baseGreenEW, volEW, baseCapEW);
  const baseAverageDelay = +((baseDelayNS * volNS + baseDelayEW * volEW) / totalVolumeVph).toFixed(2);
  const baseLos = getLevelOfService(baseAverageDelay);

  const baseQueue = Number(baseline.averageQueueVehicles || Math.round((baseAverageDelay * totalVolumeVph) / 3600));

  // --- Optimized Computation ---
  const optCycle = Number(optimized.cycleSeconds || 65);
  const optGreenNS = Number(optimized.greenNS || 36);
  const optGreenEW = Number(optimized.greenEW || 21);

  const optCapNS = satFlowRate * (optGreenNS / optCycle);
  const optCapEW = satFlowRate * (optGreenEW / optCycle);

  const optDelayNS = calculateWebsterDelay(optCycle, optGreenNS, volNS, optCapNS);
  const optDelayEW = calculateWebsterDelay(optCycle, optGreenEW, volEW, optCapEW);
  const optAverageDelay = +((optDelayNS * volNS + optDelayEW * volEW) / totalVolumeVph).toFixed(2);
  const optLos = getLevelOfService(optAverageDelay);

  const optQueue = Number(optimized.averageQueueVehicles || Math.round((optAverageDelay * totalVolumeVph) / 3600));

  // --- Comparison & Savings Metrics ---
  const delayDeltaSeconds = +(baseAverageDelay - optAverageDelay).toFixed(2);
  const delayReductionPct = +(Math.max(0, (delayDeltaSeconds / baseAverageDelay) * 100)).toFixed(1);

  const queueDeltaVehicles = Math.max(0, baseQueue - optQueue);
  const queueReductionPct = +(Math.max(0, ((baseQueue - optQueue) / Math.max(1, baseQueue)) * 100)).toFixed(1);

  // Environmental impact calculations (Assuming 14 operational active hours per day)
  const activeHoursPerDay = 14;
  const dailyVehicleVolume = totalVolumeVph * activeHoursPerDay;

  // Daily vehicle-hours of delay saved:
  const dailyHoursSaved = +((dailyVehicleVolume * delayDeltaSeconds) / 3600).toFixed(1);

  // Vehicle idling fuel consumption: ~2.27 liters/hour = 0.00063 L/sec
  const fuelSavedLitersPerDay = +(dailyHoursSaved * 2.27).toFixed(1);

  // CO2 reduction: 2.31 kg CO2 per liter of fuel saved
  const co2ReductionKgPerDay = +(fuelSavedLitersPerDay * 2.31).toFixed(1);
  const annualCo2ReductionTons = +((co2ReductionKgPerDay * 365) / 1000).toFixed(2);

  return {
    success: true,
    intersectionId: context.intersectionId || 'INT-101',
    name: context.name || 'Grand Central Ave & 5th St',
    summary: `Signal optimization reduced average delay from ${baseAverageDelay}s to ${optAverageDelay}s (${delayReductionPct}% decrease), elevating service from ${baseLos.los} to ${optLos.los}.`,
    comparison: {
      baseline: {
        cycleSeconds: baseCycle,
        greenNSSeconds: baseGreenNS,
        greenEWSeconds: baseGreenEW,
        averageDelaySecondsPerVeh: baseAverageDelay,
        phaseDelays: { northSouthSeconds: baseDelayNS, eastWestSeconds: baseDelayEW },
        levelOfService: baseLos.los,
        levelOfServiceDescription: baseLos.description,
        averageQueueVehicles: baseQueue,
        hourlyVehicleDelayHours: +((totalVolumeVph * baseAverageDelay) / 3600).toFixed(1),
      },
      optimized: {
        cycleSeconds: optCycle,
        greenNSSeconds: optGreenNS,
        greenEWSeconds: optGreenEW,
        averageDelaySecondsPerVeh: optAverageDelay,
        phaseDelays: { northSouthSeconds: optDelayNS, eastWestSeconds: optDelayEW },
        levelOfService: optLos.los,
        levelOfServiceDescription: optLos.description,
        averageQueueVehicles: optQueue,
        hourlyVehicleDelayHours: +((totalVolumeVph * optAverageDelay) / 3600).toFixed(1),
      },
    },
    improvements: {
      delayDeltaSeconds,
      delayReductionPct,
      queueReductionVehicles: queueDeltaVehicles,
      queueReductionPct,
      losTransition: `${baseLos.los} -> ${optLos.los}`,
      environmentalSavings: {
        dailyDelayHoursSaved: dailyHoursSaved,
        fuelSavedLitersPerDay,
        co2ReductionKgPerDay,
        annualCo2ReductionMetricTons: annualCo2ReductionTons,
      },
    },
  };
}

