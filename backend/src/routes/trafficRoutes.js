import express from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  updateIncident,
  deleteIncident,
} from '../controllers/incidentController.js';
import {
  getPredictions,
  simulateScenario,
  getBottlenecks,
} from '../controllers/predictionController.js';
import { planRoute } from '../controllers/routeController.js';
import { simulateAccident } from '../controllers/simulationController.js';
import {
  getIntersections,
  overrideSignal,
  optimizeIntersection,
  optimizeCorridor,
} from '../controllers/signalController.js';
import {
  getEmergencyData,
  triggerGreenWave,
  cancelGreenWave,
} from '../controllers/emergencyController.js';
import {
  getKPIs,
  getSectors,
  getCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
  analyzeCamera,
  getVisionEngineStatus,
  getAnalytics,
} from '../controllers/analyticsController.js';
import {
  getMLStatus,
  getMLMetrics,
  predictTrafficSpeed,
  detectAnomalies,
  classifySeverity,
} from '../controllers/mlController.js';
import { optionalAuth, authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 1. KPIs & Sectors
router.get('/kpis', getKPIs);
router.get('/sectors', getSectors);

// 2. Smart Intersections & Signal Optimization
router.get('/intersections', getIntersections);
router.post('/intersections/:id/signal-override', optionalAuth, overrideSignal);
router.post('/intersections/:id/optimize', optionalAuth, optimizeIntersection);
router.post('/signals/optimize-corridor', optionalAuth, optimizeCorridor);

// 3. Incident Management & CRUD
router.get('/incidents', getIncidents);
router.get('/incidents/:id', getIncidentById);
router.post('/incidents', optionalAuth, createIncident);
router.patch('/incidents/:id/status', optionalAuth, updateIncidentStatus);
router.put('/incidents/:id', authenticate, authorize('admin', 'operator'), updateIncident);
router.delete('/incidents/:id', authenticate, authorize('admin', 'operator'), deleteIncident);

// 4. Traffic Predictions & Simulations
router.get('/predictions', getPredictions);
router.post('/predictions/simulate', simulateScenario);
router.get('/bottlenecks', getBottlenecks);
router.post('/simulate/accident', optionalAuth, simulateAccident);

// 5. Dynamic Route Optimization
router.post('/routes/plan', planRoute);

// 6. Emergency Green Wave Corridor
router.get('/emergency', getEmergencyData);
router.post('/emergency/trigger-greenwave', optionalAuth, triggerGreenWave);
router.post('/emergency/cancel-greenwave', optionalAuth, cancelGreenWave);

// 7. CCTV Surveillance & Live Camera Intelligence
router.get('/cameras', getCameras);
router.get('/cameras/:id', getCameraById);
router.post('/cameras', optionalAuth, createCamera);
router.patch('/cameras/:id', optionalAuth, updateCamera);
router.delete('/cameras/:id', optionalAuth, deleteCamera);
router.post('/cameras/:id/analyze', analyzeCamera);
router.get('/vision/status', getVisionEngineStatus);
router.get('/analytics', getAnalytics);

// 8. Machine Learning Intelligence
router.get('/ml/status', getMLStatus);
router.get('/ml/metrics', getMLMetrics);
router.post('/ml/predict-speed', predictTrafficSpeed);
router.post('/ml/detect-anomalies', detectAnomalies);
router.post('/ml/classify-severity', classifySeverity);

export default router;

