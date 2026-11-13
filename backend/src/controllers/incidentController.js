import { Incident } from '../models/Incident.js';
import { AuditLog } from '../models/AuditLog.js';
import { MLClient } from '../services/mlClient.js';
import {
  broadcastIncidentCreated,
  broadcastIncidentUpdated,
  broadcastIncidentDeleted,
} from '../services/socketService.js';
import { logger } from '../utils/logger.js';

/**
 * Fetch all incidents with filtering & search
 * GET /api/v1/traffic/incidents
 */
export async function getIncidents(req, res, next) {
  try {
    const { sector, severity, status, search, limit = 100, page = 1 } = req.query;

    const query = {};

    if (sector && sector !== 'All Sectors' && sector !== 'ALL') {
      query.sector = sector;
    }

    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { location: searchRegex },
        { id: searchRegex },
        { description: searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const incidents = await Incident.find(query)
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Incident.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      data: incidents,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch single incident by custom ID or MongoDB ObjectId
 * GET /api/v1/traffic/incidents/:id
 */
export async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;

    const incident = await Incident.findOne({
      $or: [{ id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `Incident with ID '${id}' was not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Report a new traffic incident
 * POST /api/v1/traffic/incidents
 */
export async function createIncident(req, res, next) {
  try {
    const count = await Incident.countDocuments();
    const newId = `INC-2026-${String(count + 86).padStart(3, '0')}`;

    const {
      title,
      type = 'accident',
      typeName = 'Incident',
      severity = 'HIGH',
      sector = 'Downtown Grid',
      location = 'Metropolis Corridor',
      coordinates = { x: 50, y: 50 },
      lanesBlocked = 1,
      totalLanes = 3,
      estimatedDelay = '15 mins',
      impactRadius = '1.5 km',
      assignedUnits = [],
      description = 'Incident logged by operator.',
      actionRequired = 'Dispatch incident management and update signage.',
      cameraFeedId = 'CAM-DOWNTOWN-01',
    } = req.body;

    const initialHistory = [
      { time: 'Just now', event: 'Incident registered in command system' },
    ];

    if (assignedUnits && assignedUnits.length > 0) {
      initialHistory.push({
        time: 'Just now',
        event: `Units dispatched: ${assignedUnits.join(', ')}`,
      });
    }

    const newIncident = await Incident.create({
      id: newId,
      title: title || 'Traffic Incident Reported',
      type,
      typeName,
      severity,
      sector,
      location,
      coordinates,
      reportedAt: Date.now(),
      status: assignedUnits.length > 0 ? 'Dispatched' : 'Reported',
      lanesBlocked: Number(lanesBlocked) || 1,
      totalLanes: Number(totalLanes) || 3,
      estimatedDelay: typeof estimatedDelay === 'number' ? `${estimatedDelay} mins` : estimatedDelay,
      impactRadius: typeof impactRadius === 'number' ? `${impactRadius} km` : impactRadius,
      assignedUnits,
      description,
      actionRequired,
      cameraFeedId,
      history: initialHistory,
    });

    // Broadcast in real-time via Socket.IO
    broadcastIncidentCreated(newIncident);

    // Audit log
    await AuditLog.create({
      action: 'INCIDENT_CREATED',
      category: 'INCIDENT_MUTATION',
      actor: {
        userId: req.user?._id?.toString() || 'DISPATCH',
        email: req.user?.email || 'dispatch@trafficai.gov',
        role: req.user?.role || 'operator',
      },
      details: { incidentId: newId, title: newIncident.title, severity, sector },
    });

    logger.info(`Incident created: ${newId} - ${newIncident.title}`);

    res.status(201).json({
      success: true,
      message: `Incident ${newId} created successfully`,
      data: newIncident,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update incident status, note, or units
 * PATCH /api/v1/traffic/incidents/:id/status
 */
export async function updateIncidentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note, assignedUnits } = req.body;

    const incident = await Incident.findOne({
      $or: [{ id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `Incident with ID '${id}' was not found.`,
      });
    }

    if (status) {
      incident.status = status;
    }

    if (assignedUnits) {
      incident.assignedUnits = assignedUnits;
    }

    incident.history.unshift({
      time: 'Just now',
      event: note || `Status transitioned to ${status}`,
      timestamp: new Date(),
    });

    await incident.save();

    // Broadcast update via Socket.IO
    broadcastIncidentUpdated(incident);

    // Audit log
    await AuditLog.create({
      action: 'INCIDENT_STATUS_UPDATED',
      category: 'INCIDENT_MUTATION',
      actor: {
        userId: req.user?._id?.toString() || 'OPERATOR',
        email: req.user?.email || 'operator@trafficai.gov',
        role: req.user?.role || 'operator',
      },
      details: { incidentId: incident.id, newStatus: status, note },
    });

    logger.info(`Incident status updated: ${incident.id} -> ${status}`);

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Full or partial update of an incident
 * PUT /api/v1/traffic/incidents/:id
 */
export async function updateIncident(req, res, next) {
  try {
    const { id } = req.params;

    const incident = await Incident.findOneAndUpdate(
      { $or: [{ id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])] },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `Incident with ID '${id}' was not found.`,
      });
    }

    broadcastIncidentUpdated(incident);

    res.status(200).json({
      success: true,
      message: `Incident ${id} updated successfully.`,
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete an incident (Admin / Operator)
 * DELETE /api/v1/traffic/incidents/:id
 */
export async function deleteIncident(req, res, next) {
  try {
    const { id } = req.params;

    const incident = await Incident.findOneAndDelete({
      $or: [{ id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: `Incident with ID '${id}' was not found.`,
      });
    }

    broadcastIncidentDeleted(incident.id);

    await AuditLog.create({
      action: 'INCIDENT_DELETED',
      category: 'INCIDENT_MUTATION',
      actor: {
        userId: req.user?._id?.toString() || 'ADMIN',
        email: req.user?.email || 'admin@trafficai.gov',
        role: req.user?.role || 'admin',
      },
      details: { incidentId: incident.id, title: incident.title },
    });

    logger.info(`Incident deleted: ${incident.id}`);

    res.status(200).json({
      success: true,
      message: `Incident ${incident.id} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
}

