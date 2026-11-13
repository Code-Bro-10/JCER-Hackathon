import { PredictionDataset } from '../models/Prediction.js';
import { runScenarioSimulation } from '../services/simulationEngine.js';
import { PREDICTION_HOURLY_DATA, BOTTLENECK_MATRIX } from '../config/seedData.js';

/**
 * Fetch 24-hour predictive traffic flow curves and bottleneck risks
 * GET /api/v1/traffic/predictions
 */
export async function getPredictions(req, res, next) {
  try {
    const { horizon = '24h' } = req.query;

    let dataset = await PredictionDataset.findOne({ horizon });

    if (!dataset) {
      dataset = {
        hourlyCurves: PREDICTION_HOURLY_DATA,
        bottlenecks: BOTTLENECK_MATRIX,
        modelMetadata: {
          name: 'UrbanSpatialGraph-v4 (LSTM + GNN)',
          confidence: 96.4,
          dataPointsTrained: '48.2M sensor hours',
          latencyMs: 14,
          lastInferenceTime: new Date().toLocaleTimeString(),
        },
      };
    }

    res.status(200).json({
      success: true,
      data: {
        hourlyCurves: dataset.hourlyCurves,
        bottlenecks: dataset.bottlenecks,
        modelMetadata: {
          ...dataset.modelMetadata,
          lastInferenceTime: new Date().toLocaleTimeString(),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Run What-If Prediction Simulation
 * POST /api/v1/traffic/predictions/simulate
 */
export async function simulateScenario(req, res, next) {
  try {
    const {
      weather = 'clear',
      event = 'none',
      roadClosure = false,
      aiInterventionActive = true,
    } = req.body;

    let dataset = await PredictionDataset.findOne();
    const baselineCurves = dataset ? dataset.hourlyCurves : PREDICTION_HOURLY_DATA;

    const simulationResult = runScenarioSimulation(
      { weather, event, roadClosure, aiInterventionActive },
      baselineCurves
    );

    res.status(200).json({
      success: true,
      data: simulationResult,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch Bottleneck Risk Matrix
 * GET /api/v1/traffic/bottlenecks
 */
export async function getBottlenecks(req, res, next) {
  try {
    const dataset = await PredictionDataset.findOne();
    const bottlenecks = dataset ? dataset.bottlenecks : BOTTLENECK_MATRIX;

    res.status(200).json({
      success: true,
      data: bottlenecks,
    });
  } catch (err) {
    next(err);
  }
}

