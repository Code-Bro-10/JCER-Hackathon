/**
 * TrafficAI Algorithms Suite - Traffic Congestion Predictor (15–30 Minutes Horizon)
 * 
 * Uses an Autoregressive Historical Reversion (AR-HR) model combining short-term
 * inertia momentum, historical diurnal baselines, and exogenous environmental factors.
 * 
 * IMPORTANT: This module produces transparent, deterministic statistical forecasts
 * calibrated on simulated historical baseline profiles. It does NOT claim to run
 * opaque neural networks or access physical city-wide IoT telemetry.
 */

import { DEMO_HISTORICAL_PATTERNS } from '../data/demoNetwork.js';

export const WEATHER_MULTIPLIERS = {
  clear: 1.0,
  rain: 1.12,
  heavy_rain: 1.25,
  fog: 1.10,
  storm: 1.38,
};

/**
 * Predict traffic congestion levels 15 to 30 minutes ahead.
 * 
 * @param {object} params
 * @param {string} [params.corridorId='Downtown Grid'] - Corridor or Sector identifier
 * @param {number|Date|string} [params.currentTime=Date.now()] - Current timestamp or ISO string
 * @param {number} params.currentCongestion - Active congestion index (0 to 100)
 * @param {Array<{timeMinutesAgo: number, congestion: number}>} [params.recentTrend] - Past readings
 * @param {object} [params.historicalDataset] - Historical hourly baseline dataset
 * @param {object} [params.options]
 * @param {Array<number>} [params.options.horizonsMinutes=[15, 30]] - Prediction intervals
 * @param {number} [params.options.freeFlowSpeedKmh=50.0] - Corridor free-flow speed
 * @param {string} [params.options.weather='clear'] - Weather condition
 * @param {boolean} [params.options.isSpecialEvent=false] - Event surge flag
 * @returns {object} Structured JSON prediction report
 */
export function predictCongestion({
  corridorId = 'Downtown Grid',
  currentTime = Date.now(),
  currentCongestion,
  recentTrend = [],
  historicalDataset = DEMO_HISTORICAL_PATTERNS,
  options = {},
}) {
  // Input Validation
  if (currentCongestion === undefined || currentCongestion === null || isNaN(Number(currentCongestion))) {
    throw new Error('predictCongestion requires a valid numerical currentCongestion parameter (0 - 100).');
  }

  const c0 = Math.max(0, Math.min(100, Number(currentCongestion)));
  const {
    horizonsMinutes = [15, 30],
    freeFlowSpeedKmh = 50.0,
    weather = 'clear',
    isSpecialEvent = false,
  } = options;

  // Resolve current hour and fractional minute deterministically
  let currentHour;
  let currentMinute;
  let timestampIso;

  if (typeof currentTime === 'object' && currentTime !== null && currentTime.hour !== undefined) {
    currentHour = Number(currentTime.hour) || 0;
    currentMinute = Number(currentTime.minute) || 0;
    timestampIso = new Date().toISOString();
  } else {
    const dateObj = new Date(currentTime);
    const isIsoUtc = typeof currentTime === 'string' && currentTime.endsWith('Z');
    currentHour = isIsoUtc ? dateObj.getUTCHours() : dateObj.getHours();
    currentMinute = isIsoUtc ? dateObj.getUTCMinutes() : dateObj.getMinutes();
    timestampIso = dateObj.toISOString();
  }
  const timeOfDayFractionalHours = currentHour + currentMinute / 60.0;

  // Retrieve historical pattern for sector (or fallback to Downtown Grid)
  const patternList = historicalDataset[corridorId] || historicalDataset['Downtown Grid'] || [];

  /**
   * Helper to interpolate historical baseline at fractional hour of day
   */
  function getHistoricalBaseline(fractionalHour) {
    const wrappedHour = (fractionalHour + 24) % 24;
    const baseHour = Math.floor(wrappedHour);
    const nextHour = (baseHour + 1) % 24;
    const fraction = wrappedHour - baseHour;

    const slot1 = patternList.find((p) => p.hour === baseHour) || {
      meanCongestion: 40,
      stdDev: 5.0,
      meanSpeedKmh: 35.0,
    };
    const slot2 = patternList.find((p) => p.hour === nextHour) || slot1;

    const meanCongestion = slot1.meanCongestion + (slot2.meanCongestion - slot1.meanCongestion) * fraction;
    const stdDev = slot1.stdDev + (slot2.stdDev - slot1.stdDev) * fraction;
    const meanSpeed = slot1.meanSpeedKmh + (slot2.meanSpeedKmh - slot1.meanSpeedKmh) * fraction;

    return { meanCongestion, stdDev, meanSpeed };
  }

  // Calculate short-term rate of change (velocity: dC/dt per minute)
  let momentumRatePerMinute = 0;
  if (Array.isArray(recentTrend) && recentTrend.length >= 2) {
    const sorted = [...recentTrend].sort((a, b) => b.timeMinutesAgo - a.timeMinutesAgo);
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const dt = Math.max(1, oldest.timeMinutesAgo - newest.timeMinutesAgo);
    momentumRatePerMinute = (newest.congestion - oldest.congestion) / dt;
  } else {
    // If no recent time-series provided, approximate slope toward current historical slot
    const currentBaseline = getHistoricalBaseline(timeOfDayFractionalHours);
    momentumRatePerMinute = (c0 - currentBaseline.meanCongestion) / 30.0;
  }

  // Clamp extreme short-term spikes
  momentumRatePerMinute = Math.max(-1.5, Math.min(1.5, momentumRatePerMinute));

  const weatherFactor = WEATHER_MULTIPLIERS[weather.toLowerCase()] || 1.0;
  const eventBoost = isSpecialEvent ? 8.0 : 0.0;

  // Generate predictions for requested horizons
  const horizonPredictions = horizonsMinutes.map((horizon) => {
    const targetFractionalHour = timeOfDayFractionalHours + horizon / 60.0;
    const hist = getHistoricalBaseline(targetFractionalHour);

    // Reversion weight alpha(h): Reversion to mean increases with time horizon
    // alpha(15) ~ 0.45; alpha(30) ~ 0.70; alpha(60) ~ 0.91
    const alpha = 1.0 - Math.exp(-horizon / 25.0);

    // Damped momentum projection
    const damping = Math.pow(0.92, horizon / 15.0);
    const projectedMomentumC = c0 + momentumRatePerMinute * horizon * damping;

    // Combined AR-HR prediction
    const basePredicted = (1.0 - alpha) * projectedMomentumC + alpha * hist.meanCongestion;

    // Weather and Event exogenous adjustment
    const adjustedPredicted = basePredicted * weatherFactor + eventBoost;
    const finalPredicted = +Math.max(0, Math.min(100, adjustedPredicted)).toFixed(1);

    // Estimate corridor speed using Greenshields traffic stream model
    // v = v_free * (1 - C / 100)^1.2
    const speedRatio = Math.max(0.1, 1.0 - finalPredicted / 100.0);
    const predictedSpeedKmh = +(freeFlowSpeedKmh * Math.pow(speedRatio, 1.2)).toFixed(1);

    // 95% Confidence Interval (z = 1.96)
    const horizonUncertainty = Math.sqrt(1.0 + horizon / 30.0);
    const marginOfError = +(1.96 * hist.stdDev * horizonUncertainty).toFixed(1);
    const ciLower = +Math.max(0, finalPredicted - marginOfError).toFixed(1);
    const ciUpper = +Math.min(100, finalPredicted + marginOfError).toFixed(1);

    // Risk classification
    let riskLevel = 'LOW';
    if (finalPredicted >= 75) riskLevel = 'SEVERE';
    else if (finalPredicted >= 55) riskLevel = 'HIGH';
    else if (finalPredicted >= 35) riskLevel = 'MODERATE';

    // Trend Direction
    let trendDirection = 'STABLE';
    if (finalPredicted > c0 + 3.0) trendDirection = 'INCREASING';
    else if (finalPredicted < c0 - 3.0) trendDirection = 'DECREASING';

    return {
      horizonMinutes: horizon,
      targetTime: new Date(new Date(timestampIso).getTime() + horizon * 60000).toISOString(),
      predictedCongestionIndex: finalPredicted,
      predictedSpeedKmh,
      confidenceInterval: {
        lower: ciLower,
        upper: ciUpper,
        confidenceLevelPct: 95,
        marginOfError,
      },
      riskLevel,
      trendDirection,
      modelWeights: {
        historicalWeight: +alpha.toFixed(3),
        momentumWeight: +(1.0 - alpha).toFixed(3),
      },
      historicalMeanCongestion: +hist.meanCongestion.toFixed(1),
    };
  });

  return {
    success: true,
    corridorId,
    timestamp: timestampIso,
    currentCongestionIndex: c0,
    momentumRatePerMinute: +momentumRatePerMinute.toFixed(3),
    environmentalFactors: {
      weather,
      weatherMultiplier: weatherFactor,
      isSpecialEvent,
      eventAdjustmentPct: eventBoost,
    },
    predictions: horizonPredictions,
    methodology: {
      modelType: 'Autoregressive Historical Reversion (AR-HR)',
      isSimulated: true,
      calibratedOn: 'MetroGrid Diurnal Profile Baseline',
      disclaimer: 'Predictions are simulated mathematical projections derived from calibrated historical diurnal patterns and autoregressive inertia damping. Not live physical sensor telemetry.',
    },
  };
}

/**
 * Convenience helper to predict across multiple corridors simultaneously.
 */
export function predictCorridors(corridorList, options = {}) {
  return corridorList.map((c) =>
    predictCongestion({
      corridorId: c.id || c.name,
      currentCongestion: c.currentCongestion !== undefined ? c.currentCongestion : 40,
      options,
    })
  );
}
