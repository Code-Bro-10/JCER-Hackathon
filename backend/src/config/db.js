import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;
let memoryServer = null;

export async function connectDB(overrideUri = null) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = overrideUri || config.mongoUri;

  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    logger.info(`Attempting MongoDB connection to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    await mongoose.connect(uri, mongooseOptions);
    isConnected = true;
    logger.info('MongoDB Atlas / Database connected successfully.');
  } catch (err) {
    logger.warn(`Primary MongoDB connection failed (${err.message}).`);

    // In development or test environments, fallback to MongoMemoryServer if primary fails
    if (config.env === 'test' || config.env === 'development') {
      try {
        logger.info('Initializing in-memory MongoDB fallback instance for isolated local testing/dev...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri);
        isConnected = true;
        logger.info(`In-Memory MongoDB fallback successfully active at ${memUri}`);
      } catch (memErr) {
        logger.error(`Fallback In-Memory MongoDB startup failed: ${memErr.message}`);
        throw err;
      }
    } else {
      throw err;
    }
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB connection lost. Waiting to reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error:', err.message);
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    isConnected = false;
    logger.info('MongoDB disconnected cleanly.');
  } catch (err) {
    logger.error('Error during MongoDB disconnect:', err.message);
  }
}

