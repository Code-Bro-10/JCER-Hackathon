import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from './logger.js';
import { User } from '../models/User.js';
import { Incident } from '../models/Incident.js';
import { Intersection } from '../models/Intersection.js';
import { Sector } from '../models/Sector.js';
import { Camera } from '../models/Camera.js';
import { EmergencyDispatch } from '../models/EmergencyDispatch.js';
import { PredictionDataset } from '../models/Prediction.js';
import {
  DEFAULT_USERS,
  INITIAL_INCIDENTS,
  SMART_INTERSECTIONS,
  SECTOR_STATISTICS,
  CCTV_FEEDS,
  ACTIVE_EMERGENCY_DISPATCHES,
  PREDICTION_HOURLY_DATA,
  BOTTLENECK_MATRIX,
} from '../config/seedData.js';

export async function seedDatabase(force = false) {
  try {
    const userCount = await User.countDocuments();
    if (!force && userCount > 0) {
      logger.info('Database already contains data; skipping initial seed.');
      return;
    }

    logger.info('Seeding database with default TrafficAI datasets...');

    // 1. Seed Users (passwords hashed via pre-save hook)
    await User.deleteMany({});
    for (const u of DEFAULT_USERS) {
      await User.create(u);
    }
    logger.info(`Seeded ${DEFAULT_USERS.length} default users (Admin, Operator, Civilian).`);

    // 2. Seed Incidents
    await Incident.deleteMany({});
    await Incident.insertMany(INITIAL_INCIDENTS);
    logger.info(`Seeded ${INITIAL_INCIDENTS.length} initial traffic incidents.`);

    // 3. Seed Smart Intersections
    await Intersection.deleteMany({});
    await Intersection.insertMany(SMART_INTERSECTIONS);
    logger.info(`Seeded ${SMART_INTERSECTIONS.length} smart intersection nodes.`);

    // 4. Seed Sectors
    await Sector.deleteMany({});
    await Sector.insertMany(SECTOR_STATISTICS);
    logger.info(`Seeded ${SECTOR_STATISTICS.length} urban sectors.`);

    // 5. Seed CCTV Cameras
    await Camera.deleteMany({});
    await Camera.insertMany(CCTV_FEEDS);
    logger.info(`Seeded ${CCTV_FEEDS.length} CCTV surveillance nodes.`);

    // 6. Seed Active Emergency Dispatches
    await EmergencyDispatch.deleteMany({});
    await EmergencyDispatch.insertMany(ACTIVE_EMERGENCY_DISPATCHES);
    logger.info(`Seeded ${ACTIVE_EMERGENCY_DISPATCHES.length} active emergency dispatches.`);

    // 7. Seed Prediction Dataset
    await PredictionDataset.deleteMany({});
    await PredictionDataset.create({
      horizon: '24h',
      hourlyCurves: PREDICTION_HOURLY_DATA,
      bottlenecks: BOTTLENECK_MATRIX,
      modelMetadata: {
        name: 'UrbanSpatialGraph-v4 (LSTM + GNN)',
        confidence: 96.4,
        dataPointsTrained: '48.2M sensor hours',
        latencyMs: 14,
      },
    });
    logger.info('Seeded 24h predictive flow curves and bottleneck matrix.');

    logger.info('All collections seeded successfully.');
  } catch (err) {
    logger.error('Error during database seed:', err.message);
    throw err;
  }
}

// Support running directly: node src/utils/seedDatabase.js
if (process.argv[1] && process.argv[1].endsWith('seedDatabase.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase(true);
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      logger.error('Seed execution aborted:', err);
      process.exit(1);
    }
  })();
}

