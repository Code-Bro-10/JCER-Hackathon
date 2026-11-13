import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketServer } from './services/socketService.js';
import { seedDatabase } from './utils/seedDatabase.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

// Initialize Socket.IO on HTTP server
initSocketServer(server, config.clientOrigin);

async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas / Database
    await connectDB();

    // 2. Auto-seed initial smart city dataset if empty
    if (config.enableSeedOnStartup) {
      await seedDatabase(false);
    }

    // 3. Start HTTP server
    server.listen(config.port, () => {
      logger.info(`================================================================`);
      logger.info(` TrafficAI Smart City Command Center Backend`);
      logger.info(` Server running in [${config.env}] mode on port [${config.port}]`);
      logger.info(` REST API Gateway: http://localhost:${config.port}/api/v1`);
      logger.info(` Socket.IO Server: ws://localhost:${config.port}`);
      logger.info(` Healthcheck:      http://localhost:${config.port}/api/v1/health`);
      logger.info(`================================================================`);
    });
  } catch (err) {
    logger.error('Fatal server startup failure:', err.message);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
async function handleShutdown(signal) {
  logger.info(`Received ${signal}. Gracefully closing HTTP & Socket.IO server...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    logger.info('Database disconnected. Process terminating cleanly.');
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise);
  logger.error('Reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception caught:', err.message);
  logger.error(err.stack);
});

// Start the server if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export { server, app };

