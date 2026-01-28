'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const JobBookmark = require('../models/JobBookmark');
const JobAlert = require('../models/JobAlert');

const {
  getGulfJobs,
  getGulfJobById,
  getSimilarGulfJobs,
  getGulfCompanies,
  getGulfJobApplications,
  getGulfEmployerApplications,
  getGulfJobBookmarks,
  getGulfJobAlerts,
  getGulfDashboardStats
} = require('../controller/GulfJobController');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Public routes (no authentication required)
router.get('/jobs', getGulfJobs);
router.get('/jobs/:id', getGulfJobById);
router.get('/jobs/:id/similar', getSimilarGulfJobs);
router.get('/companies', getGulfCompanies);

// Protected routes (authentication required)
router.get('/dashboard/stats', authenticateToken, getGulfDashboardStats);
router.get('/applications', authenticateToken, getGulfJobApplications);
router.get('/employer/applications', authenticateToken, getGulfEmployerApplications);
router.get('/bookmarks', authenticateToken, getGulfJobBookmarks);
router.get('/alerts', authenticateToken, getGulfJobAlerts);

// Bookmark a Gulf job
router.post('/jobs/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if job exists and is a Gulf job
    const Job = require('../models/Job');
    const job = await Job.findOne({
      where: {
        id,
        [Op.or]: [
          { region: 'gulf' },
          { 
            location: {
              [Op.iLike]: {
                [Op.any]: ['dubai', 'uae', 'qatar', 'saudi', 'kuwait', 'bahrain', 'oman', 'gulf'].map(loc => `%${loc}%`)
              }
            }
          }
        ]
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Gulf job not found'
      });
    }

    // Check if already bookmarked
    const existingBookmark = await JobBookmark.findOne({
      where: { userId, jobId: id },
      attributes: ['id', 'userId', 'jobId']
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'Job already bookmarked'
      });
    }

    // Create bookmark (restrict fields + avoid returning non-existent columns)
    await JobBookmark.create(
      { userId, jobId: id },
      { fields: ['userId', 'jobId'], returning: false }
    );

    // Return minimal payload to avoid selecting optional columns on legacy DB
    res.status(201).json({
      success: true,
      message: 'Job bookmarked successfully',
      data: { userId, jobId: id }
    });
  } catch (error) {
    console.error('Error bookmarking Gulf job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bookmark job',
      error: error.message
    });
  }
});

// Remove bookmark from Gulf job
router.delete('/jobs/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bookmark = await JobBookmark.findOne({
      where: { userId, jobId: id },
      attributes: ['id']
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    await bookmark.destroy();

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing Gulf job bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove bookmark',
      error: error.message
    });
  }
});

// Create Gulf job alert
router.post('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, keywords, location, jobType, experienceLevel, salaryMin, salaryMax, isActive = true } = req.body;

    // Validate that it's Gulf-related
    const gulfLocations = ['dubai', 'uae', 'qatar', 'saudi', 'kuwait', 'bahrain', 'oman', 'gulf'];
    const isGulfRelated = gulfLocations.some(gulfLoc => 
      (keywords && keywords.toLowerCase().includes(gulfLoc)) ||
      (location && location.toLowerCase().includes(gulfLoc))
    );

    if (!isGulfRelated) {
      return res.status(400).json({
        success: false,
        message: 'Job alert must be related to Gulf region'
      });
    }

    const alert = await JobAlert.create({
      userId,
      name: name || `${(location || 'Gulf').toString().trim()} Alert`,
      keywords: Array.isArray(keywords) ? keywords : (keywords ? [String(keywords)] : []),
      locations: Array.isArray(location) ? location : (location ? [String(location)] : []),
      jobType: Array.isArray(jobType) ? jobType : (jobType ? [String(jobType)] : []),
      experienceLevel,
      salaryMin,
      salaryMax,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Gulf job alert created successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error creating Gulf job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job alert',
      error: error.message
    });
  }
});

// Update Gulf job alert
router.put('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const alert = await JobAlert.findOne({
      where: { id, userId }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Job alert not found'
      });
    }

    await alert.update(updateData);

    res.json({
      success: true,
      message: 'Gulf job alert updated successfully',
      data: alert
    });
  } catch (error) {
    console.error('Error updating Gulf job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job alert',
      error: error.message
    });
  }
});

// Delete Gulf job alert
router.delete('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const alert = await JobAlert.findOne({
      where: { id, userId }
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
      message: 'Gulf job alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Gulf job alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job alert',
      error: error.message
    });
  }
});

module.exports = router;
