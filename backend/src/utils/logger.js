/**
 * Structured Console Logger for TrafficAI Backend
 */

const levels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
};

const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (msg, meta = '') => {
    console.log(`[${formatTimestamp()}] [${levels.info}] ${msg}`, meta ? meta : '');
  },
  warn: (msg, meta = '') => {
    console.warn(`[${formatTimestamp()}] [${levels.warn}] ${msg}`, meta ? meta : '');
  },
  error: (msg, meta = '') => {
    console.error(`[${formatTimestamp()}] [${levels.error}] ${msg}`, meta ? meta : '');
  },
  debug: (msg, meta = '') => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[${formatTimestamp()}] [${levels.debug}] ${msg}`, meta ? meta : '');
    }
  },
};

