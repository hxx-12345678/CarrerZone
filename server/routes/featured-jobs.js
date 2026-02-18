const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FeaturedJobController = require('../controller/FeaturedJobController');

const { authenticateToken } = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(checkPermission('featuredJobs'));

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
