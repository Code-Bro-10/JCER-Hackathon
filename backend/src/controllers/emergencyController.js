import { EmergencyDispatch } from '../models/EmergencyDispatch.js';
import { Intersection } from '../models/Intersection.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  broadcastEmergencyGreenWave,
  broadcastEmergencyCancel,
  broadcastSignalUpdate,
} from '../services/socketService.js';
import { logger } from '../utils/logger.js';
import { ACTIVE_EMERGENCY_DISPATCHES, SMART_INTERSECTIONS } from '../config/seedData.js';

/**
 * Fetch Emergency Green Wave Dashboard Data
 * GET /api/v1/traffic/emergency
 */
export async function getEmergencyData(req, res, next) {
  try {
    let dispatches = await EmergencyDispatch.find().sort({ createdAt: -1 });
    let intersections = await Intersection.find().sort({ id: 1 });

    if (!dispatches || dispatches.length === 0) {
      dispatches = ACTIVE_EMERGENCY_DISPATCHES;
    }

    if (!intersections || intersections.length === 0) {
      intersections = SMART_INTERSECTIONS;
    }

    res.status(200).json({
      success: true,
      dispatches,
      intersections,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Trigger Emergency Green Wave Corridor
 * POST /api/v1/traffic/emergency/trigger-greenwave
 */
export async function triggerGreenWave(req, res, next) {
  try {
    const {
      unitCode = 'MED-09',
      unitType = 'ALS Trauma Ambulance',
      origin = 'City North Substation',
      destination = 'City Central Trauma Center',
      corridorName = 'Priority Rapid Corridor',
      priorityLevel = 'CODE RED',
    } = req.body;

    const dispatchId = `EMERG-${Math.floor(100 + Math.random() * 899)}`;

    const newDispatch = await EmergencyDispatch.create({
      id: dispatchId,
      unitCode,
      unitType,
      status: 'Active Priority En Route',
      origin,
      destination,
      corridorName,
      currentSpeed: 78,
      distanceRemainingKm: 4.5,
      etaMinutes: 3.8,
      signalsPreempted: 6,
      signalsTotal: 6,
      timeSavedMinutes: 8.2,
      priorityLevel,
      routeWaypoints: ['Boulevard 1', 'Arterial 4', 'Central Overpass', 'Emergency Bay'],
      activeSince: 'Just now',
    });

    // Preempt all downstream intersections to 100% GREEN priority
    await Intersection.updateMany(
      {},
      {
        $set: {
          currentPhase: 'EMERGENCY PREEMPT GREEN',
          phaseColor: 'green',
          secondsRemaining: 90,
          mode: 'Emergency Priority Locked',
          lastOptimized: `Preempted for ${newDispatch.unitCode}`,
        },
      }
    );

    const updatedIntersections = await Intersection.find();
    for (const node of updatedIntersections) {
      broadcastSignalUpdate(node);
    }

    // Broadcast emergency green wave activation via Socket.IO
    broadcastEmergencyGreenWave(newDispatch);

    // Audit log
    await AuditLog.create({
      action: 'EMERGENCY_GREENWAVE_ACTIVATED',
      category: 'EMERGENCY_PREEMPTION',
      actor: {
        userId: req.user?._id?.toString() || 'DISPATCH',
        email: req.user?.email || 'dispatch@trafficai.gov',
        role: req.user?.role || 'operator',
      },
      details: {
        dispatchId,
        unitCode,
        unitType,
        corridorName,
        priorityLevel,
      },
    });

    logger.info(`Emergency Green Wave activated for unit ${unitCode} (Dispatch: ${dispatchId})`);

    res.status(200).json({
      success: true,
      message: `Emergency Green Wave activated for unit ${newDispatch.unitCode}!`,
      data: newDispatch,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Deactivate Emergency Green Wave
 * POST /api/v1/traffic/emergency/cancel-greenwave
 */
export async function cancelGreenWave(req, res, next) {
  try {
    const { dispatchId } = req.body;

    if (dispatchId) {
      await EmergencyDispatch.deleteOne({ id: dispatchId });
    } else {
      // Clear all active priority dispatches
      await EmergencyDispatch.deleteMany({ status: { $regex: /Active/i } });
    }

    // Restore intersections to standard AI Adaptive mode
    await Intersection.updateMany(
      {},
      {
        $set: {
          mode: 'AI Adaptive',
          currentPhase: 'North-South Green',
          phaseColor: 'green',
          secondsRemaining: 45,
          lastOptimized: 'Restored from Emergency Mode',
        },
      }
    );

    const restoredIntersections = await Intersection.find();
    for (const node of restoredIntersections) {
      broadcastSignalUpdate(node);
    }

    // Broadcast cancellation via Socket.IO
    broadcastEmergencyCancel(dispatchId || 'ALL');

    // Audit log
    await AuditLog.create({
      action: 'EMERGENCY_GREENWAVE_CANCELLED',
      category: 'EMERGENCY_PREEMPTION',
      actor: {
        userId: req.user?._id?.toString() || 'DISPATCH',
        email: req.user?.email || 'dispatch@trafficai.gov',
        role: req.user?.role || 'operator',
      },
      details: { dispatchId },
    });

    logger.info(`Emergency corridor restored to standard adaptive operation (Dispatch: ${dispatchId || 'ALL'})`);

    res.status(200).json({
      success: true,
      message: 'Emergency corridor restored to standard adaptive operation.',
    });
  } catch (err) {
    next(err);
  }
}

