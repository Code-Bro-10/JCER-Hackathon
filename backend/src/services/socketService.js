import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

let io = null;

export function initSocketServer(httpServer, allowedOrigin = '*') {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // Join room channels
    socket.on('join:room', (room) => {
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined channel: ${room}`);
      socket.emit('room:joined', { room, status: 'subscribed' });
    });

    socket.on('leave:room', (room) => {
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left channel: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    logger.warn('Socket.IO accessed before initialization.');
  }
  return io;
}

// Broadcasters for Smart City Real-time Events
export function broadcastIncidentCreated(incident) {
  if (io) {
    io.emit('incident:created', incident);
    io.to('incidents').emit('incident:created', incident);
    logger.info(`Broadcasted incident:created for ID: ${incident.id}`);
  }
}

export function broadcastIncidentUpdated(incident) {
  if (io) {
    io.emit('incident:updated', incident);
    io.to('incidents').emit('incident:updated', incident);
    logger.info(`Broadcasted incident:updated for ID: ${incident.id}`);
  }
}

export function broadcastIncidentDeleted(incidentId) {
  if (io) {
    io.emit('incident:deleted', { id: incidentId });
    io.to('incidents').emit('incident:deleted', { id: incidentId });
    logger.info(`Broadcasted incident:deleted for ID: ${incidentId}`);
  }
}

export function broadcastEmergencyGreenWave(dispatch) {
  if (io) {
    io.emit('emergency:greenwave_activated', dispatch);
    io.to('emergency').emit('emergency:greenwave_activated', dispatch);
    logger.info(`Broadcasted emergency:greenwave_activated for Unit: ${dispatch.unitCode}`);
  }
}

export function broadcastEmergencyCancel(dispatchId) {
  if (io) {
    io.emit('emergency:greenwave_cancelled', { dispatchId });
    io.to('emergency').emit('emergency:greenwave_cancelled', { dispatchId });
    logger.info(`Broadcasted emergency:greenwave_cancelled for Dispatch: ${dispatchId}`);
  }
}

export function broadcastSignalUpdate(intersection) {
  if (io) {
    io.emit('signal:updated', intersection);
    io.to('signals').emit('signal:updated', intersection);
    logger.info(`Broadcasted signal:updated for Node: ${intersection.id}`);
  }
}

export function broadcastAccidentSimulation(simulationData) {
  if (io) {
    io.emit('simulation:accident_occurred', simulationData);
    logger.info('Broadcasted simulation:accident_occurred');
  }
}

export function broadcastCameraAlert(alertData) {
  if (io) {
    io.emit('camera:alert', alertData);
    io.to('cameras').emit('camera:alert', alertData);
    logger.info(`Broadcasted camera:alert for Camera: ${alertData.cameraId || alertData.camera_id || alertData.id}`);
  }
}

export function broadcastCameraUpdated(camera) {
  if (io) {
    io.emit('camera:updated', camera);
    io.to('cameras').emit('camera:updated', camera);
    logger.info(`Broadcasted camera:updated for Camera: ${camera.id}`);
  }
}


