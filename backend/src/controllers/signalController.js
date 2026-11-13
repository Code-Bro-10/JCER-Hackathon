import { Intersection } from '../models/Intersection.js';
import { AuditLog } from '../models/AuditLog.js';
import { broadcastSignalUpdate } from '../services/socketService.js';
import { optimizeIntersectionSignal } from '../services/signalEngine.js';
import { SMART_INTERSECTIONS } from '../config/seedData.js';
import { logger } from '../utils/logger.js';

/**
 * Fetch all smart intersections
 * GET /api/v1/traffic/intersections
 */
export async function getIntersections(req, res, next) {
  try {
    let intersections = await Intersection.find().sort({ id: 1 });

    if (!intersections || intersections.length === 0) {
      intersections = SMART_INTERSECTIONS;
    }

    res.status(200).json({
      success: true,
      data: intersections,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Override Signal Phase for an Intersection
 * POST /api/v1/traffic/intersections/:id/signal-override
 */
export async function overrideSignal(req, res, next) {
  try {
    const { id } = req.params;
    const { phase = 'North-South Green', durationSeconds = 45 } = req.body;

    let intersection = await Intersection.findOne({
      $or: [{ id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    const isGreen = phase.toLowerCase().includes('green');
    const isAmber = phase.toLowerCase().includes('amber') || phase.toLowerCase().includes('yellow') || phase.toLowerCase().includes('scramble');
    const color = isGreen ? 'green' : isAmber ? 'amber' : 'red';

    if (!intersection) {
      // If not yet in DB, create from seed or defaults
      intersection = await Intersection.create({
        id,
        name: `Intersection ${id}`,
        sector: 'Downtown Grid',
        currentPhase: phase,
        phaseColor: color,
        secondsRemaining: durationSeconds,
        mode: 'Manual Override',
        lastOptimized: 'Just now by Operator',
      });
    } else {
      intersection.currentPhase = phase;
      intersection.phaseColor = color;
      intersection.secondsRemaining = Number(durationSeconds);
      intersection.mode = 'Manual Override';
      intersection.lastOptimized = 'Just now by Operator';
      await intersection.save();
    }

    // Broadcast signal change via Socket.IO
    broadcastSignalUpdate(intersection);

    // Audit log
    await AuditLog.create({
      action: 'SIGNAL_MANUAL_OVERRIDE',
      category: 'SIGNAL_OVERRIDE',
      actor: {
        userId: req.user?._id?.toString() || 'OPERATOR',
        email: req.user?.email || 'signals@trafficai.gov',
        role: req.user?.role || 'operator',
      },
      details: {
        intersectionId: intersection.id,
        newPhase: phase,
        durationSeconds,
      },
    });

    logger.info(`Intersection ${id} manual override: ${phase} for ${durationSeconds}s`);

    res.status(200).json({
      success: true,
      message: `Intersection ${id} overridden to ${phase} for ${durationSeconds}s`,
      data: intersection,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Trigger AI Signal Optimization for an Intersection
 * POST /api/v1/traffic/intersections/:id/optimize
 */
export async function optimizeIntersection(req, res, next) {
  try {
    const { id } = req.params;

    let intersection = await Intersection.findOne({
      $or: [{ id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!intersection) {
      return res.status(404).json({
        success: false,
        error: `Intersection with ID '${id}' not found.`,
      });
    }

    const optimization = optimizeIntersectionSignal(intersection);

    intersection.currentPhase = optimization.recommendedPhase;
    intersection.phaseColor = 'green';
    intersection.secondsRemaining = optimization.calculatedMetrics.optimalCycleSeconds;
    intersection.mode = 'AI Adaptive';
    intersection.efficiencyScore = Math.min(99, Math.round(intersection.efficiencyScore + 3));
    intersection.lastOptimized = 'Just now by AI Engine';
    intersection.recommendation = optimization.recommendationNote;
    await intersection.save();

    broadcastSignalUpdate(intersection);

    res.status(200).json({
      success: true,
      message: `Intersection ${id} optimized with Webster's adaptive splits.`,
      data: {
        intersection,
        optimization,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Coordinated Green Wave Arterial Corridor Optimization
 * POST /api/v1/traffic/signals/optimize-corridor
 */
export async function optimizeCorridor(req, res, next) {
  try {
    const { sector = 'Downtown Grid', offsetSeconds = 12 } = req.body;

    const intersections = await Intersection.find({ sector });

    const updatedIntersections = [];
    for (let i = 0; i < intersections.length; i++) {
      const node = intersections[i];
      node.mode = 'AI Adaptive';
      node.currentPhase = 'North-South Green';
      node.phaseColor = 'green';
      node.secondsRemaining = 45 - (i * offsetSeconds) % 45;
      node.lastOptimized = `Synchronized Green Wave (Offset ${i * offsetSeconds}s)`;
      await node.save();
      broadcastSignalUpdate(node);
      updatedIntersections.push(node);
    }

    res.status(200).json({
      success: true,
      message: `Corridor ${sector} synchronized with green wave progression.`,
      nodesOptimized: updatedIntersections.length,
      data: updatedIntersections,
    });
  } catch (err) {
    next(err);
  }
}

