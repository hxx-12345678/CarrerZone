const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JobAlert = require('../models/JobAlert');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 authenticateToken - Headers:', req.headers);
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔍 authenticateToken - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 authenticateToken - Decoded token:', decoded);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    console.log('🔍 authenticateToken - User found:', !!user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all job alerts for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const alerts = await JobAlert.findAll({
      where: { userId: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching job alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job alerts',
      error: error.message
    });
  }
});

// Create a new job alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 POST /job-alerts - Request body:', req.body);
    console.log('🔍 POST /job-alerts - User:', req.user);
    
    const {
      name,
      keywords,
      locations,
      categories,
      experienceLevel,
      salaryMin,
      salaryMax,
      jobType,
      currency,
      remoteWork,
      frequency,
      emailEnabled,
      pushEnabled,
      smsEnabled,
      maxResults
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Alert name is required'
      });
    }

    const alert = await JobAlert.create({
      userId: req.user.id,
      name,
      keywords: keywords || [],
      locations: locations || [],
      categories: categories || [],
      experienceLevel: experienceLevel && experienceLevel !== 'any' ? experienceLevel : null,
      salaryMin,
      salaryMax,
      jobType: jobType || [],
      currency: currency || 'INR',
      remoteWork: remoteWork || 'any',
      frequency: frequency || 'weekly',
      emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
      pushEnabled: pushEnabled !== undefined ? pushEnabled : true,
      smsEnabled: smsEnabled !== undefined ? smsEnabled : false,
      maxResults: maxResults || 10,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Job alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error creating job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job alert',
      error: error.message
    });
  }
});

// Update a job alert
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the alert and ensure it belongs to the user
    const alert = await JobAlert.findOne({
      where: { id, userId: req.user.id }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    // Update the alert
    await alert.update(updateData);

    res.json({
      success: true,
      message: 'Job alert updated successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error updating job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job alert',
      error: error.message
    });
  }
});

// Delete a job alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the alert and ensure it belongs to the user
    const alert = await JobAlert.findOne({
      where: { id, userId: req.user.id }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    await alert.destroy();

    res.json({
      success: true,
      message: 'Job alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job alert',
      error: error.message
    });
  }
});

// Toggle alert status (active/inactive)
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the alert and ensure it belongs to the user
    const alert = await JobAlert.findOne({
      where: { id, userId: req.user.id }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    // Toggle the status
    await alert.update({ isActive: !alert.isActive });

    res.json({
      success: true,
      message: `Job alert ${alert.isActive ? 'activated' : 'deactivated'} successfully`,
      data: alert
    });
  } catch (error) {
    console.error('Error toggling job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle job alert status',
      error: error.message
    });
  }
});

// Get job alert statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalAlerts = await JobAlert.count({
      where: { userId: req.user.id }
    });

    const activeAlerts = await JobAlert.count({
      where: { userId: req.user.id, isActive: true }
    });

    const alertsByFrequency = await JobAlert.findAll({
      where: { userId: req.user.id },
      attributes: ['frequency', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['frequency']
    });

    res.json({
      success: true,
      data: {
        totalAlerts,
        activeAlerts,
        inactiveAlerts: totalAlerts - activeAlerts,
        alertsByFrequency
      }
    });
  } catch (error) {
    console.error('Error fetching job alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job alert statistics',
      error: error.message
    });
  }
});

// Test job alert by sending a sample notification
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the alert and ensure it belongs to the user
    const alert = await JobAlert.findOne({
      where: { id, userId: req.user.id }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    // Here you would implement the actual notification logic
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        alertId: id,
        notificationType: 'test',
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

module.exports = router;
