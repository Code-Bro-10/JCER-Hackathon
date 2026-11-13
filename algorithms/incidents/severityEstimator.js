/**
 * TrafficAI Algorithms Suite - Incident Severity Estimator
 * 
 * Computes deterministic multi-factor severity scores (0 to 100) and operational
 * response tiers based on traffic engineering impact metrics, corridor classification,
 * blockage ratio, human casualties, and hazardous condition flags.
 */

export const SEVERITY_LEVELS = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

const BASE_TYPE_POINTS = {
  rollover: 30,
  multi_vehicle: 30,
  pileup: 30,
  accident: 22,
  collision: 22,
  crash: 22,
  weather_hazard: 20,
  flooding: 20,
  breakdown: 12,
  stalled: 12,
  hazard: 10,
  debris: 10,
  roadwork: 8,
  maintenance: 8,
};

const ROAD_CLASS_POINTS = {
  highway: 15,
  expressway: 15,
  arterial: 10,
  collector: 5,
  local: 0,
};

/**
 * Estimate incident severity and operational dispatch tier.
 * 
 * @param {object} incidentData
 * @param {string} [incidentData.type='accident']
 * @param {number} [incidentData.lanesBlocked=1]
 * @param {number} [incidentData.totalLanes=3]
 * @param {string} [incidentData.roadClass='arterial']
 * @param {number} [incidentData.injuriesReported=0]
 * @param {boolean} [incidentData.hazardousMaterials=false]
 * @param {boolean} [incidentData.isPeakHour=false]
 * @param {boolean} [incidentData.isIntersectionBlocked=false]
 * @param {string} [incidentData.weather='clear']
 * @returns {object} Structured JSON severity assessment
 */
export function estimateIncidentSeverity(incidentData = {}) {
  const {
    type = 'accident',
    lanesBlocked = 1,
    totalLanes = 3,
    roadClass = 'arterial',
    injuriesReported = 0,
    hazardousMaterials = false,
    isPeakHour = false,
    isIntersectionBlocked = false,
    weather = 'clear',
  } = incidentData;

  const total = Math.max(1, Number(totalLanes) || 3);
  const blocked = Math.max(0, Math.min(total, Number(lanesBlocked) || 0));
  const injuries = Math.max(0, Number(injuriesReported) || 0);

  // 1. Base Type Points
  const normType = (type || 'accident').toLowerCase().trim();
  const basePoints = BASE_TYPE_POINTS[normType] || 15;

  // 2. Lane Blockage Fraction Points (up to 30 pts)
  const blockageRatio = blocked / total;
  let blockagePoints = Math.round(blockageRatio * 30);
  if (blockageRatio >= 1.0) {
    blockagePoints += 10; // Complete corridor shutdown bonus
  }

  // 3. Road Hierarchy Points (0 to 15 pts)
  const normRoad = (roadClass || 'arterial').toLowerCase().trim();
  const roadPoints = ROAD_CLASS_POINTS[normRoad] !== undefined ? ROAD_CLASS_POINTS[normRoad] : 10;

  // 4. Human Casualty Points
  const injuryPoints = Math.min(24, injuries * 12);

  // 5. Hazardous Materials Points
  const hazmatPoints = hazardousMaterials ? 25 : 0;

  // 6. Environmental and Operational Multipliers
  let operationalPoints = 0;
  if (isPeakHour) operationalPoints += 8;
  if (isIntersectionBlocked) operationalPoints += 7;
  if (weather === 'storm' || weather === 'heavy_rain') operationalPoints += 6;

  // Composite raw score
  const rawScore =
    basePoints +
    blockagePoints +
    roadPoints +
    injuryPoints +
    hazmatPoints +
    operationalPoints;

  const severityScore = Math.max(5, Math.min(100, Math.round(rawScore)));

  // Severity Tier Classification
  let severity = SEVERITY_LEVELS.LOW;
  let tier = 4;
  let priorityLabel = 'ROUTINE_TIER_4';

  if (severityScore >= 75) {
    severity = SEVERITY_LEVELS.CRITICAL;
    tier = 1;
    priorityLabel = 'EMERGENCY_TIER_1';
  } else if (severityScore >= 50) {
    severity = SEVERITY_LEVELS.HIGH;
    tier = 2;
    priorityLabel = 'TACTICAL_TIER_2';
  } else if (severityScore >= 25) {
    severity = SEVERITY_LEVELS.MEDIUM;
    tier = 3;
    priorityLabel = 'MONITORED_TIER_3';
  }

  // Derived Engineering & Clearance Estimates
  const estimatedClearanceTimeMinutes = Math.round(
    15 +
      blocked * 14 +
      injuries * 18 +
      (hazardousMaterials ? 45 : 0) +
      (normRoad === 'highway' ? 12 : 0)
  );

  const estimatedQueueAccumulationMeters = Math.round(
    blocked > 0
      ? Math.min(3500, (blocked / total) * (estimatedClearanceTimeMinutes / 60) * 1800 * 7.5)
      : 50
  );

  const impactRadiusMeters = Math.round(
    severityScore >= 75 ? 2000 : severityScore >= 50 ? 1200 : severityScore >= 25 ? 500 : 200
  );

  // Directives
  const recommendedDirectives = [];
  if (severity === SEVERITY_LEVELS.CRITICAL) {
    recommendedDirectives.push('Dispatch Tier-1 Emergency Units (ALS Paramedics, Police Escort, Heavy Recovery).');
    recommendedDirectives.push('Activate upstream dynamic corridor diversion on Variable Message Signs (VMS).');
    recommendedDirectives.push('Engage adaptive green-wave flush on parallel arterial bypass corridors.');
  } else if (severity === SEVERITY_LEVELS.HIGH) {
    recommendedDirectives.push('Deploy highway safety patrol and rapid clearing tow units.');
    recommendedDirectives.push('Throttle upstream on-ramp meters by 35% to prevent queue spillback.');
  } else if (severity === SEVERITY_LEVELS.MEDIUM) {
    recommendedDirectives.push('Issue digital transit traveler advisory on mobile channels.');
    recommendedDirectives.push('Monitor corridor queue via CCTV feed.');
  } else {
    recommendedDirectives.push('Routine clearance monitoring; no diversion required.');
  }

  return {
    success: true,
    severity,
    severityScore,
    tier,
    priorityLabel,
    inputsEvaluated: {
      type: normType,
      lanesBlocked: blocked,
      totalLanes: total,
      blockageRatio: +blockageRatio.toFixed(2),
      roadClass: normRoad,
      injuriesReported: injuries,
      hazardousMaterials,
      isPeakHour,
      isIntersectionBlocked,
      weather,
    },
    factorBreakdown: {
      baseTypePoints: basePoints,
      blockagePoints,
      roadClassPoints: roadPoints,
      injuryPoints,
      hazardousMaterialsPoints: hazmatPoints,
      operationalAndWeatherPoints: operationalPoints,
      totalScore: severityScore,
    },
    operationalImpact: {
      estimatedClearanceTimeMinutes,
      estimatedQueueAccumulationMeters,
      impactRadiusMeters,
      capacityReductionPct: Math.round(blockageRatio * 100),
    },
    recommendedDirectives,
  };
}

