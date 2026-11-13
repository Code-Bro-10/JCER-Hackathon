import { MLClient } from '../services/mlClient.js';
import { logger } from '../utils/logger.js';

/**
 * Get ML Service Health & Loaded Models Status
 * GET /api/v1/traffic/ml/status
 */
export async function getMLStatus(req, res, next) {
  try {
    const health = await MLClient.checkHealth();
    const info = await MLClient.getModelInfo();

    res.status(200).json({
      success: true,
      service: 'TrafficAI Machine Learning Integration',
      online: health.online,
      health,
      modelInfo: info,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get ML Model Training & Test Evaluation Metrics
 * GET /api/v1/traffic/ml/metrics
 */
export async function getMLMetrics(req, res, next) {
  try {
    const metrics = await MLClient.getMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Run ML Traffic Speed Prediction (15m & 30m)
 * POST /api/v1/traffic/ml/predict-speed
 */
export async function predictTrafficSpeed(req, res, next) {
  try {
    const { corridorId, currentSpeedKmh, recentSpeedsKmh, freeFlowSpeedKmh } = req.body;

    if (currentSpeedKmh === undefined || isNaN(Number(currentSpeedKmh))) {
      return res.status(400).json({
        success: false,
        error: 'currentSpeedKmh numerical value is required.',
      });
    }

    const prediction = await MLClient.predictSpeed({
      corridorId,
      currentSpeedKmh: Number(currentSpeedKmh),
      recentSpeedsKmh,
      freeFlowSpeedKmh: freeFlowSpeedKmh ? Number(freeFlowSpeedKmh) : 60.0,
    });

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Detect Traffic Anomalies using Isolation Forest
 * POST /api/v1/traffic/ml/detect-anomalies
 */
export async function detectAnomalies(req, res, next) {
  try {
    const { corridors = [] } = req.body;

    if (!Array.isArray(corridors) || corridors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'corridors array is required.',
      });
    }

    const result = await MLClient.detectAnomalies(corridors);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Classify Incident Severity using Random Forest
 * POST /api/v1/traffic/ml/classify-severity
 */
export async function classifySeverity(req, res, next) {
  try {
    const assessment = await MLClient.classifySeverity(req.body);
    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    next(err);
  }
}

