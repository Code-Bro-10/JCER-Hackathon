import { Incident } from '../models/Incident.js';
import { calculateOptimizedRoutes } from '../services/routingEngine.js';
import { MLClient } from '../services/mlClient.js';

/**
 * Calculate multi-modal routes with AI dynamic optimization
 * POST /api/v1/traffic/routes/plan
 */
export async function planRoute(req, res, next) {
  try {
    const { origin, destination, vehicleType = 'passenger' } = req.body;

    // Fetch active incidents from database to calculate real-time delay penalties
    const activeIncidents = await Incident.find({
      status: { $ne: 'Resolved' },
    });

    const routePlan = calculateOptimizedRoutes({
      origin: origin || 'Grand Central Terminal',
      destination: destination || 'North Tech Campus',
      vehicleType,
      activeIncidents,
    });

    // Score routes through ML service
    let mlScored = null;
    try {
      const candidates = routePlan.options.map((opt) => ({
        id: opt.id,
        name: opt.title,
        distance_km: opt.distanceKm,
        base_duration_min: opt.durationMin,
        current_speed_kmh: opt.distanceKm / (opt.durationMin / 60.0),
        free_flow_speed_kmh: 60.0,
        active_incidents_count: routePlan.hasActiveIncidentBypass ? 1 : 0,
      }));
      mlScored = await MLClient.scoreRoutes(candidates, vehicleType);
    } catch {
      // Graceful fallback
    }

    const options = routePlan.options.map((opt) => {
      const mlInfo = mlScored?.ranked_routes?.find((r) => r.id === opt.id);
      return {
        ...opt,
        mlPredictedSpeedKmh: mlInfo ? mlInfo.ml_predicted_speed_kmh : null,
        mlEstimatedDurationMin: mlInfo ? mlInfo.ml_estimated_duration_min : opt.durationMin,
        mlScore: mlInfo ? mlInfo.score : 85,
        mlRecommendation: mlInfo ? mlInfo.ml_recommendation : 'OPTIMAL',
      };
    });

    res.status(200).json({
      success: true,
      origin: routePlan.origin,
      destination: routePlan.destination,
      vehicleType: routePlan.vehicleType,
      options,
      metadata: {
        activeIncidentsEvaluated: activeIncidents.length,
        incidentBypassEngaged: routePlan.hasActiveIncidentBypass,
        mlOptimizationActive: Boolean(mlScored),
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

