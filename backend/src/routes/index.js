import express from 'express';
import authRoutes from './authRoutes.js';
import trafficRoutes from './trafficRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TrafficAI Smart City Command Center Backend',
    version: '1.0.0',
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/traffic', trafficRoutes);
router.use('/admin', adminRoutes);

export default router;

