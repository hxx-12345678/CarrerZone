const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FeaturedJobController = require('../controller/FeaturedJobController');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get pricing plans
router.get('/pricing', FeaturedJobController.getPricingPlans);

// Get employer's jobs for promotion selection
router.get('/employer/jobs', FeaturedJobController.getEmployerJobs);

// Get employer's featured jobs
router.get('/employer', FeaturedJobController.getEmployerFeaturedJobs);

// Get applications for a featured job
router.get('/:id/applications', FeaturedJobController.getFeaturedJobApplications);

// Get featured job details
router.get('/:id', FeaturedJobController.getFeaturedJobDetails);

// Create new featured job promotion
router.post('/', FeaturedJobController.createFeaturedJob);

// Update featured job promotion
router.put('/:id', FeaturedJobController.updateFeaturedJob);

// Delete featured job promotion
router.delete('/:id', FeaturedJobController.deleteFeaturedJob);

// Process payment for featured job promotion
router.post('/:id/payment', FeaturedJobController.processPayment);

module.exports = router;
