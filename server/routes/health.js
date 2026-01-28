const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/sequelize');

// Comprehensive health check endpoint
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Basic system information
    const systemInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
    
    // Memory usage
    const memUsage = process.memoryUsage();
    systemInfo.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) + ' MB'
    };
    
    // CPU usage
    const cpuUsage = process.cpuUsage();
    systemInfo.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };
    
    // Database health check
    let dbHealth = { status: 'unknown', responseTime: 0 };
    try {
      const dbStartTime = Date.now();
      await sequelize.authenticate();
      dbHealth.responseTime = Date.now() - dbStartTime;
      dbHealth.status = 'healthy';
    } catch (error) {
      dbHealth.status = 'error';
      dbHealth.error = error.message;
    }
    
    // Email service health check
    let emailHealth = { status: 'unknown' };
    try {
      const { EmailService } = require('../config/email-config');
      const emailService = new EmailService();
      emailHealth.status = emailService.isAvailable ? 'healthy' : 'unavailable';
    } catch (error) {
      emailHealth.status = 'error';
      emailHealth.error = error.message;
    }
    
    // Environment variables check
    const envCheck = {
      NODE_ENV: !!process.env.NODE_ENV,
      DATABASE_URL: !!(process.env.DATABASE_URL || process.env.DB_URL),
      JWT_SECRET: !!process.env.JWT_SECRET,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      FRONTEND_URL: !!process.env.FRONTEND_URL,
      SMTP_USER: !!process.env.SMTP_USER
    };
    
    // Overall health status
    const overallStatus = (
      dbHealth.status === 'healthy' && 
      emailHealth.status !== 'error' &&
      Object.values(envCheck).every(Boolean)
    ) ? 'healthy' : 'degraded';
    
    const response = {
      ...systemInfo,
      health: {
        status: overallStatus,
        database: dbHealth,
        email: emailHealth,
        environment: envCheck
      },
      responseTime: Date.now() - startTime
    };
    
    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(response);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Simple health check for load balancers
router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Database health check only
router.get('/db', async (req, res) => {
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
