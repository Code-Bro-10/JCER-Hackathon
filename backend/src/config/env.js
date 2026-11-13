import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in backend root or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8000,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trafficai',
  jwtSecret: process.env.JWT_SECRET || 'trafficai_super_secret_jwt_key_2026_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  enableSeedOnStartup: process.env.ENABLE_SEED_ON_STARTUP === 'true' || true,
  logLevel: process.env.LOG_LEVEL || 'info',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001',
};

