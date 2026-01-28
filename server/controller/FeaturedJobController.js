'use strict';

const { Op, Sequelize } = require('sequelize');
const { FeaturedJob, Job, Company, User, Notification, JobApplication, Resume, CoverLetter } = require('../config');

/**
 * Create a new featured job promotion
 */
exports.createFeaturedJob = async (req, res, next) => {
  try {
    console.log('🔥 Creating featured job promotion...');
    console.log('👤 Authenticated user:', req.user.id, req.user.email);

    const {
      jobId,
      promotionType = 'featured',
      startDate,
      endDate,
      budget,
      priority = 1
    } = req.body;

    // Validate required fields
    if (!jobId || !startDate || !endDate || !budget) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, start date, end date, and budget are required'
      });
    }

    // Validate job exists and belongs to employer
    const job = await Job.findOne({
      where: { 
        id: jobId, 
        employerId: req.user.id,
        status: 'active'
      },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not active'
      });
    }

    // Check if job is already featured
    const existingPromotion = await FeaturedJob.findOne({
      where: { 
        jobId,
        isActive: true,
        startDate: { [require('sequelize').Op.lte]: new Date() },
        endDate: { [require('sequelize').Op.gte]: new Date() }
      }
    });

    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'This job already has an active promotion'
      });
    }

    // Calculate pricing based on promotion type and duration
    const pricing = getPromotionPricing(promotionType, startDate, endDate);
    
    if (budget < pricing.minBudget) {
      return res.status(400).json({
        success: false,
        message: `Minimum budget for ${promotionType} promotion is ₹${pricing.minBudget}`
      });
    }

    const featuredJobData = {
      jobId,
      promotionType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: parseFloat(budget),
      priority,
      price: pricing.price,
      currency: 'INR',
      paymentStatus: 'pending',
      status: 'draft', // Start as draft until payment is confirmed
      createdBy: req.user.id // Set the creator to the authenticated user
    };

    const featuredJob = await FeaturedJob.create(featuredJobData);

    console.log('✅ Featured job promotion created successfully:', featuredJob.id);

    // Create notification for the employer
    try {
      await Notification.create({
        userId: req.user.id,
        type: 'featured_job_created',
        title: 'Featured Job Promotion Created',
        message: `Your job "${job.title}" has been set up for ${promotionType} promotion. Complete payment to activate.`,
        data: {
          featuredJobId: featuredJob.id,
          jobId: job.id,
          promotionType
        }
      });
    } catch (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    }

    return res.status(201).json({
      success: true,
      message: 'Featured job promotion created successfully',
      data: {
        featuredJob,
        job: {
          id: job.id,
          title: job.title,
          company: job.company?.name
        },
        pricing
      }
    });

  } catch (error) {
    console.error('❌ Create featured job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create featured job promotion',
      error: error.message
    });
  }
};

/**
 * Get featured jobs for employer
 */
exports.getEmployerFeaturedJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { 
      '$job.posted_by$': req.user.id 
    };

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: featuredJobs } = await FeaturedJob.findAndCountAll({
      where: whereClause,
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title', 'location', 'status', [Sequelize.literal('"job"."created_at"'), 'createdAt']],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }]
      }],
      order: [[Sequelize.col('FeaturedJob.created_at'), 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get application counts for each featured job
    const featuredJobsWithApplications = await Promise.all(
      featuredJobs.map(async (featuredJob) => {
        const applicationCount = await JobApplication.count({
          where: {
            jobId: featuredJob.jobId
          },
          include: [{
            model: Job,
            as: 'job',
            where: {
              '$Job.posted_by$': req.user.id
            },
            attributes: []
          }]
        });

        return {
          ...featuredJob.toJSON(),
          applicationCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Featured jobs retrieved successfully',
      data: {
        featuredJobs: featuredJobsWithApplications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get employer featured jobs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured jobs',
      error: error.message
    });
  }
};

/**
 * Get featured job details
 */
exports.getFeaturedJobDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const featuredJob = await FeaturedJob.findOne({
      where: { 
        id,
        '$Job.employerId$': req.user.id 
      },
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title', 'description', 'location', 'status', 'createdAt'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'website']
        }]
      }]
    });

    if (!featuredJob) {
      return res.status(404).json({
        success: false,
        message: 'Featured job promotion not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Featured job details retrieved successfully',
      data: featuredJob
    });

  } catch (error) {
    console.error('❌ Get featured job details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured job details',
      error: error.message
    });
  }
};

/**
 * Update featured job promotion
 */
exports.updateFeaturedJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, budget, priority, status } = req.body;

    const featuredJob = await FeaturedJob.findOne({
      where: { 
        id,
        '$Job.employerId$': req.user.id 
      },
      include: [{
        model: Job,
        as: 'job'
      }]
    });

    if (!featuredJob) {
      return res.status(404).json({
        success: false,
        message: 'Featured job promotion not found'
      });
    }

    // Only allow updates if not paid yet or if status is draft
    if (featuredJob.paymentStatus === 'paid' && status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify paid promotions. Only pausing is allowed.'
      });
    }

    const updateData = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (budget) updateData.budget = parseFloat(budget);
    if (priority) updateData.priority = parseInt(priority);
    if (status) updateData.status = status;

    await featuredJob.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Featured job promotion updated successfully',
      data: featuredJob
    });

  } catch (error) {
    console.error('❌ Update featured job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update featured job promotion',
      error: error.message
    });
  }
};

/**
 * Delete featured job promotion
 */
exports.deleteFeaturedJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const featuredJob = await FeaturedJob.findOne({
      where: { 
        id,
        '$Job.employerId$': req.user.id 
      },
      include: [{
        model: Job,
        as: 'job'
      }]
    });

    if (!featuredJob) {
      return res.status(404).json({
        success: false,
        message: 'Featured job promotion not found'
      });
    }

    // Only allow deletion if not paid yet
    if (featuredJob.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid promotions. Contact support for refunds.'
      });
    }

    await featuredJob.destroy();

    return res.status(200).json({
      success: true,
      message: 'Featured job promotion deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete featured job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete featured job promotion',
      error: error.message
    });
  }
};

/**
 * Get featured job pricing plans
 */
exports.getPricingPlans = async (req, res, next) => {
  try {
    const pricingPlans = {
      featured: {
        name: 'Featured Listing',
        description: 'Highlight your job in search results',
        basePrice: 500,
        currency: 'INR',
        duration: 'week',
        features: [
          'Enhanced visibility in search results',
          'Featured badge on job listing',
          'Priority placement',
          'Basic analytics'
        ],
        minBudget: 500,
        maxBudget: 2000
      },
      premium: {
        name: 'Premium Promotion',
        description: 'Top placement with enhanced visibility',
        basePrice: 800,
        currency: 'INR',
        duration: 'week',
        features: [
          'Top placement in search results',
          'Premium badge and styling',
          'Enhanced job description display',
          'Advanced analytics',
          'Candidate matching insights'
        ],
        minBudget: 800,
        maxBudget: 3000
      },
      urgent: {
        name: 'Urgent Hiring',
        description: 'Mark as urgent to attract quick applications',
        basePrice: 300,
        currency: 'INR',
        duration: 'week',
        features: [
          'Urgent badge and styling',
          'Priority in urgent job sections',
          'Faster candidate notifications',
          'Basic analytics'
        ],
        minBudget: 300,
        maxBudget: 1500
      },
      sponsored: {
        name: 'Sponsored Content',
        description: 'Custom promotion with targeted audience',
        basePrice: 1000,
        currency: 'INR',
        duration: 'week',
        features: [
          'Custom promotion placement',
          'Targeted audience reach',
          'Advanced analytics dashboard',
          'Direct candidate contact',
          'Custom branding options'
        ],
        minBudget: 1000,
        maxBudget: 5000
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Pricing plans retrieved successfully',
      data: pricingPlans
    });

  } catch (error) {
    console.error('❌ Get pricing plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing plans',
      error: error.message
    });
  }
};

/**
 * Get employer's jobs for promotion selection
 */
exports.getEmployerJobs = async (req, res, next) => {
  try {
    const { status = 'active', limit = 50 } = req.query;

    const jobs = await Job.findAll({
      where: { 
        employerId: req.user.id,
        status: status
      },
      attributes: ['id', 'title', 'location', 'status', [Sequelize.col('Job.created_at'), 'createdAt'], 'views', 'applications'],
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'logo']
      }],
      order: [[Sequelize.col('Job.created_at'), 'DESC']],
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      message: 'Employer jobs retrieved successfully',
      data: jobs
    });

  } catch (error) {
    console.error('❌ Get employer jobs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employer jobs',
      error: error.message
    });
  }
};

/**
 * Process payment for featured job promotion
 */
exports.processPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentId, paymentMethod = 'razorpay' } = req.body;

    const featuredJob = await FeaturedJob.findOne({
      where: { 
        id,
        '$Job.employerId$': req.user.id 
      },
      include: [{
        model: Job,
        as: 'job'
      }]
    });

    if (!featuredJob) {
      return res.status(404).json({
        success: false,
        message: 'Featured job promotion not found'
      });
    }

    if (featuredJob.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed for this promotion'
      });
    }

    // In a real implementation, you would:
    // 1. Verify payment with payment gateway (Razorpay, Stripe, etc.)
    // 2. Process the actual payment
    // 3. Update payment status based on verification result

    // For now, we'll simulate a successful payment
    const paymentResult = {
      success: true,
      paymentId: paymentId || `pay_${Date.now()}`,
      amount: featuredJob.budget,
      currency: 'INR',
      status: 'captured'
    };

    if (paymentResult.success) {
      // Update featured job with payment details
      await featuredJob.update({
        paymentStatus: 'paid',
        paymentId: paymentResult.paymentId,
        paymentDate: new Date(),
        status: 'active' // Activate the promotion
      });

      // Update the job's featured status
      if (featuredJob.job) {
        await featuredJob.job.update({
          isFeatured: true,
          isPremium: featuredJob.promotionType === 'premium' || featuredJob.promotionType === 'sponsored',
          isUrgent: featuredJob.promotionType === 'urgent'
        });
      }

      // Create notification
      try {
        await Notification.create({
          userId: req.user.id,
          type: 'featured_job_activated',
          title: 'Featured Job Promotion Activated',
          message: `Your job "${featuredJob.job?.title}" is now live with ${featuredJob.promotionType} promotion!`,
          data: {
            featuredJobId: featuredJob.id,
            jobId: featuredJob.jobId,
            promotionType: featuredJob.promotionType
          }
        });
      } catch (notificationError) {
        console.error('❌ Failed to create notification:', notificationError);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully. Your promotion is now active!',
        data: {
          featuredJob,
          payment: paymentResult
        }
      });
    } else {
      await featuredJob.update({
        paymentStatus: 'failed'
      });

      return res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        data: paymentResult
      });
    }

  } catch (error) {
    console.error('❌ Process payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Get applications for a featured job
 */
exports.getFeaturedJobApplications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Verify the featured job belongs to the employer
    const featuredJob = await FeaturedJob.findOne({
      where: { id },
      include: [{
        model: Job,
        as: 'job',
        where: { 
          '$Job.posted_by$': req.user.id 
        },
        attributes: ['id', 'title']
      }]
    });

    if (!featuredJob) {
      return res.status(404).json({
        success: false,
        message: 'Featured job promotion not found'
      });
    }

    // Build where clause for applications
    const whereClause = {
      jobId: featuredJob.jobId
    };

    if (status) {
      whereClause.status = status;
    }

    // Get applications with all details
    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: 'job',
          where: {
            '$Job.posted_by$': req.user.id
          },
          attributes: ['id', 'title', 'location', 'status'],
          include: [{
            model: Company,
            as: 'company',
            attributes: ['id', 'name', 'logo']
          }],
          required: true
        },
        {
          model: User,
          as: 'applicant',
          attributes: [
            'id', 'first_name', 'last_name', 'email', 'phone', 'avatar',
            'headline', 'summary', 'skills', 'languages', 'certifications',
            'current_location', 'willing_to_relocate', 'expected_salary',
            'notice_period', 'date_of_birth', 'gender', 'social_links',
            'profile_completion', 'verification_level', 'last_profile_update',
            'experience_years', 'current_company', 'current_role'
          ]
        },
        {
          model: Resume,
          as: 'jobResume',
          attributes: [
            'id', 'title', 'summary', 'objective', 'skills', 'languages',
            'certifications', 'projects', 'achievements', 'isDefault',
            'isPublic', 'views', 'downloads', 'lastUpdated', 'metadata'
          ]
        },
        {
          model: CoverLetter,
          as: 'jobCoverLetter',
          attributes: [
            'id', 'title', 'content', 'summary', 'isDefault',
            'isPublic', 'views', 'downloads', 'lastUpdated', 'metadata'
          ]
        },
      ],
      order: [['appliedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: {
        applications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get featured job applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      error: error.message
    });
  }
};

/**
 * Helper function to calculate promotion pricing
 */
function getPromotionPricing(promotionType, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const durationInWeeks = Math.ceil(durationInDays / 7);

  const basePrices = {
    featured: 500,
    premium: 800,
    urgent: 300,
    sponsored: 1000
  };

  const basePrice = basePrices[promotionType] || 500;
  const totalPrice = basePrice * durationInWeeks;

  return {
    basePrice,
    durationInWeeks,
    totalPrice,
    minBudget: basePrice,
    maxBudget: basePrice * 4 // Max 4 weeks
  };
}

module.exports = exports;
