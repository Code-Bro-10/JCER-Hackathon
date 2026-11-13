import { Incident } from '../models/Incident.js';
import { Sector } from '../models/Sector.js';
import { Camera } from '../models/Camera.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import {
  INITIAL_KPIS,
  SECTOR_STATISTICS,
  CCTV_FEEDS,
  ANALYTICS_DATA,
} from '../config/seedData.js';
import { MLClient } from '../services/mlClient.js';
import { broadcastCameraAlert, broadcastCameraUpdated } from '../services/socketService.js';

// In-memory alert deduplication tracker (5-minute suppression window)
const cameraAlertSuppressionMap = new Map();
const ALERT_SUPPRESSION_WINDOW_MS = 5 * 60 * 1000;

/**
 * Sanitizes camera objects to strictly prevent exposing RTSP credentials or internal URLs
 */
function sanitizeCamera(cam) {
  if (!cam) return null;
  const doc = cam.toObject ? cam.toObject() : { ...cam };
  delete doc.rtspInternalUrl;
  if (doc.streamUrl && typeof doc.streamUrl === 'string' && doc.streamUrl.includes('@')) {
    doc.streamUrl = doc.streamUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }
  return doc;
}

/**
 * Fetch Global Traffic KPIs
 * GET /api/v1/traffic/kpis
 */
export async function getKPIs(req, res, next) {
  try {
    const totalIncidents = await Incident.countDocuments();
    const resolvedIncidents = await Incident.countDocuments({ status: 'Resolved' });

    res.status(200).json({
      success: true,
      data: {
        ...INITIAL_KPIS,
        resolvedIncidents: resolvedIncidents || INITIAL_KPIS.resolvedIncidents,
        totalIncidents: totalIncidents || INITIAL_KPIS.totalIncidents,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch Sector Statistics
 * GET /api/v1/traffic/sectors
 */
export async function getSectors(req, res, next) {
  try {
    let sectors = await Sector.find().sort({ id: 1 });

    if (!sectors || sectors.length === 0) {
      sectors = SECTOR_STATISTICS;
    }

    res.status(200).json({
      success: true,
      data: sectors,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch CCTV Camera Feeds
 * GET /api/v1/traffic/cameras
 */
export async function getCameras(req, res, next) {
  try {
    let cameras = await Camera.find().sort({ id: 1 });

    if (!cameras || cameras.length === 0) {
      cameras = CCTV_FEEDS;
    }

    const sanitized = cameras.map((c) => sanitizeCamera(c));

    res.status(200).json({
      success: true,
      data: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch Single Camera Feed
 * GET /api/v1/traffic/cameras/:id
 */
export async function getCameraById(req, res, next) {
  try {
    const { id } = req.params;
    let camera = await Camera.findOne({ id });

    if (!camera) {
      camera = CCTV_FEEDS.find((c) => c.id === id);
    }

    if (!camera) {
      return res.status(404).json({
        success: false,
        error: `Camera with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeCamera(camera),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Register a New Authorized Camera Node
 * POST /api/v1/traffic/cameras
 */
export async function createCamera(req, res, next) {
  try {
    const {
      id,
      name,
      location,
      latitude,
      longitude,
      sector = 'Central',
      sourceType = 'PUBLIC_HLS',
      streamUrl,
      rtspInternalUrl,
      attribution = 'Public Traffic Authority',
      usagePermissions = 'Authorized Public Feed',
      isEnabled = true,
      fps = 30,
      resolution = '1080p',
    } = req.body;

    if (!name || (!streamUrl && !rtspInternalUrl && sourceType !== 'WEBCAM')) {
      return res.status(400).json({
        success: false,
        error: 'Missing required camera fields: name and stream source URL are required.',
      });
    }

    const cameraId = id || `CAM-${Date.now().toString().slice(-4)}`;

    const newCamera = new Camera({
      id: cameraId,
      name,
      location: location || `${sector} Sector`,
      latitude: Number(latitude) || 15.8497,
      longitude: Number(longitude) || 74.4977,
      sector,
      sourceType,
      streamUrl: streamUrl || '',
      rtspInternalUrl: rtspInternalUrl || '',
      attribution,
      usagePermissions,
      status: 'ONLINE',
      isEnabled: Boolean(isEnabled),
      fps,
      resolution,
      lastChecked: new Date(),
    });

    try {
      await newCamera.save();
    } catch (saveErr) {
      // If DB offline, store in in-memory feed
      CCTV_FEEDS.push(newCamera);
    }

    const sanitized = sanitizeCamera(newCamera);
    broadcastCameraUpdated(sanitized);

    res.status(201).json({
      success: true,
      data: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Camera Node Properties
 * PATCH /api/v1/traffic/cameras/:id
 */
export async function updateCamera(req, res, next) {
  try {
    const { id } = req.params;
    let camera = await Camera.findOne({ id });

    if (!camera) {
      const mockIdx = CCTV_FEEDS.findIndex((c) => c.id === id);
      if (mockIdx === -1) {
        return res.status(404).json({
          success: false,
          error: `Camera with ID ${id} not found`,
        });
      }
      camera = { ...CCTV_FEEDS[mockIdx], ...req.body };
      CCTV_FEEDS[mockIdx] = camera;
    } else {
      Object.assign(camera, req.body);
      await camera.save();
    }

    const sanitized = sanitizeCamera(camera);
    broadcastCameraUpdated(sanitized);

    res.status(200).json({
      success: true,
      data: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete / Decommission a Camera Node
 * DELETE /api/v1/traffic/cameras/:id
 */
export async function deleteCamera(req, res, next) {
  try {
    const { id } = req.params;
    await Camera.deleteOne({ id });

    res.status(200).json({
      success: true,
      message: `Camera ${id} successfully removed from active network`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Perform Live Computer Vision & Roadblock Analysis on Camera Feed
 * POST /api/v1/traffic/cameras/:id/analyze
 */
export async function analyzeCamera(req, res, next) {
  try {
    const { id } = req.params;
    const { frameBase64, simulateRoadblock = false, numVehicles = 6 } = req.body;

    let camera = await Camera.findOne({ id });
    if (!camera) {
      camera = CCTV_FEEDS.find((c) => c.id === id) || {
        id,
        name: `Camera ${id}`,
        location: 'Belagavi Smart Grid',
        latitude: 15.8497,
        longitude: 74.4977,
      };
    }

    // Call ML Computer Vision Engine
    const analysis = await MLClient.analyzeCameraFrame({
      cameraId: id,
      frameBase64,
      simulateRoadblock,
      numVehicles,
    });

    // Update camera telemetry
    const detectedCounts = analysis.detection_counts || {};
    const trafficMetrics = analysis.traffic_metrics || {};

    if (camera.save) {
      camera.detectedObjects = {
        cars: detectedCounts.cars || 0,
        buses: detectedCounts.buses || 0,
        trucks: detectedCounts.trucks || 0,
        motorcycles: detectedCounts.motorcycles || 0,
      };
      camera.trafficDensity = trafficMetrics.density_level || 'NORMAL';
      camera.queueLengthMeters = trafficMetrics.queue_length_meters || 0;
      camera.stationaryVehiclesCount = trafficMetrics.stationary_vehicles_count || 0;
      camera.lastChecked = new Date();
      if (analysis.incident_classification?.detected) {
        camera.recentDetections = camera.recentDetections || [];
        camera.recentDetections.unshift({
          timestamp: new Date(),
          category: analysis.incident_classification.category,
          confidence: analysis.incident_classification.confidence,
          evidenceBase64: analysis.evidence_frame || null,
        });
        if (camera.recentDetections.length > 10) camera.recentDetections.pop();
      }
      await camera.save();
    }

    // Check duplicate suppression window for notifications
    let alertBroadcasted = false;
    let alertSuppressed = false;
    const incident = analysis.incident_classification;

    if (incident && incident.detected) {
      const lastAlert = cameraAlertSuppressionMap.get(id);
      const now = Date.now();

      if (lastAlert && (now - lastAlert.timestamp < ALERT_SUPPRESSION_WINDOW_MS)) {
        alertSuppressed = true;
      } else {
        cameraAlertSuppressionMap.set(id, { timestamp: now, category: incident.category });
        broadcastCameraAlert({
          cameraId: id,
          cameraName: camera.name,
          location: camera.location,
          latitude: camera.latitude,
          longitude: camera.longitude,
          incidentClassification: incident,
          detectionCounts: detectedCounts,
          trafficMetrics,
          evidenceFrame: analysis.evidence_frame,
          timestamp: new Date().toISOString(),
        });
        alertBroadcasted = true;
      }
    }

    res.status(200).json({
      success: true,
      camera: sanitizeCamera(camera),
      analysis,
      alertBroadcasted,
      alertSuppressed,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Computer Vision Engine Status
 * GET /api/v1/traffic/vision/status
 */
export async function getVisionEngineStatus(req, res, next) {
  try {
    const status = await MLClient.getVisionStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch Admin Analytics Dataset
 * GET /api/v1/traffic/analytics
 */
export async function getAnalytics(req, res, next) {
  try {
    const { range = '7d' } = req.query;

    let adjustedData = { ...ANALYTICS_DATA };

    // Range-based adjustment for mock dataset
    if (range === '24h') {
      adjustedData = {
        ...ANALYTICS_DATA,
        dailyVolume: ANALYTICS_DATA.dailyVolume.slice(-3),
      };
    } else if (range === '30d') {
      adjustedData = {
        ...ANALYTICS_DATA,
      };
    }

    res.status(200).json({
      success: true,
      timeRange: range,
      data: adjustedData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch System Audit Logs (Admin)
 * GET /api/v1/admin/audit-logs
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { limit = 50, category } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch all registered users (Admin)
 * GET /api/v1/admin/users
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
}

