import { runAccidentShockwaveSimulation } from '../services/simulationEngine.js';
import { broadcastAccidentSimulation } from '../services/socketService.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Accident Shockwave Simulation API
 * Simulates collision shockwave propagation, queue spillback, and mitigation directives
 * POST /api/v1/traffic/simulate/accident
 */
export async function simulateAccident(req, res, next) {
  try {
    const {
      sector = 'Downtown Grid',
      intersectionId = 'INT-101',
      lanesBlocked = 2,
      totalLanes = 4,
      initialFlowVph = 3200,
      durationMinutes = 45,
    } = req.body;

    const simulation = runAccidentShockwaveSimulation({
      sector,
      intersectionId,
      lanesBlocked,
      totalLanes,
      initialFlowVph,
      durationMinutes,
    });

    // Broadcast simulation event via Socket.IO
    broadcastAccidentSimulation(simulation);

    // Audit log
    await AuditLog.create({
      action: 'ACCIDENT_SIMULATION_EXECUTED',
      category: 'SYSTEM',
      actor: {
        userId: req.user?._id?.toString() || 'OPERATOR',
        email: req.user?.email || 'simulation@trafficai.gov',
        role: req.user?.role || 'operator',
      },
      details: {
        simulationId: simulation.simulationId,
        sector,
        lanesBlocked,
        maxQueueMeters: simulation.results.maxQueueLengthMeters,
      },
    });

    res.status(200).json({
      success: true,
      data: simulation,
    });
  } catch (err) {
    next(err);
  }
}

