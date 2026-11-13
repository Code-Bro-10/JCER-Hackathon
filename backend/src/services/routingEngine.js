/**
 * Multi-Modal Route Optimization Engine
 * Calculates dynamic routes factoring in real-time incident blockages, vehicle profiles,
 * and adaptive signal green wave synchronization.
 */

export function calculateOptimizedRoutes({ origin, destination, vehicleType = 'passenger', activeIncidents = [] }) {
  // Check if any active critical or high incident lies along Downtown / arterial paths
  const hasDowntownBlockage = activeIncidents.some(
    (inc) =>
      (inc.severity === 'CRITICAL' || inc.severity === 'HIGH') &&
      inc.status !== 'Resolved' &&
      (inc.sector === 'Downtown Grid' || inc.location.toLowerCase().includes('7th') || inc.location.toLowerCase().includes('market'))
  );

  const blockedLanes = activeIncidents
    .filter((inc) => inc.status !== 'Resolved')
    .reduce((sum, inc) => sum + (inc.lanesBlocked || 0), 0);

  // Dynamic penalty factors based on real-time incident state
  const incidentDelayMinutes = hasDowntownBlockage ? 18 + Math.min(15, blockedLanes * 4) : 6;

  // Vehicle profile adjustments
  let vehicleMultiplier = 1.0;
  let co2Multiplier = 1.0;
  let fuelRate = 3.4;

  switch (vehicleType) {
    case 'ev':
      vehicleMultiplier = 0.95;
      co2Multiplier = 0.15; // 85% lower emissions
      fuelRate = 1.2;
      break;
    case 'truck':
      vehicleMultiplier = 1.35;
      co2Multiplier = 2.4;
      fuelRate = 6.8;
      break;
    case 'emergency':
      vehicleMultiplier = 0.65; // High speed with green wave preemption
      co2Multiplier = 1.1;
      fuelRate = 4.0;
      break;
    case 'passenger':
    default:
      vehicleMultiplier = 1.0;
      co2Multiplier = 1.0;
      fuelRate = 3.4;
      break;
  }

  // 1. AI Smart Dynamic Route (Adaptive bypass around active incidents)
  const aiRouteDuration = Math.round(22 * vehicleMultiplier);
  const aiRouteDistance = 15.6;
  const aiRouteCo2 = +(2.1 * co2Multiplier).toFixed(1);

  // 2. Shortest Distance Route (Direct through downtown, heavily impacted by collisions)
  const shortestBaseDuration = 16;
  const shortestDuration = Math.round((shortestBaseDuration + incidentDelayMinutes) * vehicleMultiplier);
  const shortestDistance = 13.2;
  const shortestCo2 = +(4.8 * co2Multiplier).toFixed(1);

  // 3. Eco-Green Corridor (Smooth momentum, arterial bypass, minimum idling)
  const ecoRouteDuration = Math.round(25 * vehicleMultiplier);
  const ecoRouteDistance = 16.4;
  const ecoRouteCo2 = +(1.6 * co2Multiplier).toFixed(1);

  return {
    origin: origin || 'City Hall Plaza',
    destination: destination || 'North Tech Campus',
    vehicleType,
    incidentPenaltyMinutes: incidentDelayMinutes,
    hasActiveIncidentBypass: hasDowntownBlockage,
    options: [
      {
        id: 'route-ai-smart',
        title: 'AI Smart Dynamic Route',
        badge: 'RECOMMENDED',
        badgeColor: 'cyan',
        distanceKm: aiRouteDistance,
        durationMin: aiRouteDuration,
        freeFlowMin: Math.round(18 * vehicleMultiplier),
        delayMin: Math.max(2, Math.round(4 * vehicleMultiplier)),
        co2Kg: aiRouteCo2,
        fuelCost: `$${(fuelRate * 1.0).toFixed(2)}`,
        tollLanes: 1,
        congestionRisk: 'Low (18%)',
        highlights: [
          hasDowntownBlockage ? 'Dynamically bypasses 7th Ave incident corridor' : 'Corridor free-flow synchronized',
          '94% green wave progression',
          'Real-time dynamic VMS coordinated',
        ],
        steps: [
          { instruction: `Start from ${origin || 'origin'} heading North on Boulevard`, distance: '1.2 km', duration: '2 min', traffic: 'clear' },
          { instruction: 'Merge onto East Port Expressway via Ramp 4B', distance: '6.4 km', duration: '8 min', traffic: 'optimal' },
          { instruction: 'Take Exit 12 toward Silicon Parkway (Green Wave sync)', distance: '4.8 km', duration: '6 min', traffic: 'clear' },
          { instruction: 'Turn right onto Central Ring Connector', distance: '2.4 km', duration: '4 min', traffic: 'light' },
          { instruction: `Arrive safely at ${destination || 'destination'} on right`, distance: '0.8 km', duration: '2 min', traffic: 'clear' },
        ],
      },
      {
        id: 'route-shortest',
        title: 'Shortest Distance Route',
        badge: hasDowntownBlockage ? 'HEAVY DELAY' : 'MODERATE FLOW',
        badgeColor: hasDowntownBlockage ? 'rose' : 'amber',
        distanceKm: shortestDistance,
        durationMin: shortestDuration,
        freeFlowMin: Math.round(16 * vehicleMultiplier),
        delayMin: Math.round(incidentDelayMinutes * vehicleMultiplier),
        co2Kg: shortestCo2,
        fuelCost: `$${(fuelRate * 1.45).toFixed(2)}`,
        tollLanes: 0,
        congestionRisk: hasDowntownBlockage ? 'Critical (82%)' : 'Moderate (48%)',
        highlights: [
          hasDowntownBlockage ? 'Passes through active Downtown collision scene' : 'Direct grid traversal',
          `Average speed ${hasDowntownBlockage ? '18' : '32'} km/h`,
          'Elevated idle emissions at congested junctions',
        ],
        steps: [
          { instruction: 'Head East directly into Downtown Grid', distance: '2.0 km', duration: '4 min', traffic: 'moderate' },
          {
            instruction: 'Continue on 7th Ave (Approaching collision scene)',
            distance: '3.5 km',
            duration: `${Math.round(incidentDelayMinutes)} min`,
            traffic: hasDowntownBlockage ? 'severe' : 'moderate',
          },
          { instruction: 'Creep through Market Street signal queue', distance: '2.8 km', duration: '8 min', traffic: 'heavy' },
          { instruction: 'Proceed through local avenues toward destination', distance: '4.9 km', duration: '5 min', traffic: 'moderate' },
        ],
      },
      {
        id: 'route-eco-green',
        title: 'Eco-Green Corridor',
        badge: 'MINIMUM EMISSIONS',
        badgeColor: 'emerald',
        distanceKm: ecoRouteDistance,
        durationMin: ecoRouteDuration,
        freeFlowMin: Math.round(21 * vehicleMultiplier),
        delayMin: Math.max(1, Math.round(4 * vehicleMultiplier)),
        co2Kg: ecoRouteCo2,
        fuelCost: `$${(fuelRate * 0.82).toFixed(2)}`,
        tollLanes: 0,
        congestionRisk: 'Low (14%)',
        highlights: [
          'Optimal regenerative braking profile',
          'Smooth continuous cruising at 52 km/h',
          'Clean air zone compatible',
        ],
        steps: [
          { instruction: 'Follow Riverside Boulevard scenic bypass', distance: '5.2 km', duration: '7 min', traffic: 'clear' },
          { instruction: 'Take South Ring arterial bypass', distance: '7.8 km', duration: '12 min', traffic: 'free' },
          { instruction: 'Approach destination via Tech Corridor south gate', distance: '3.4 km', duration: '6 min', traffic: 'clear' },
        ],
      },
    ],
  };
}

