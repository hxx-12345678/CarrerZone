'use strict';

const { Job, Company, User, JobApplication, Notification } = require('../config');
const JobController = require('./JobController');

/**
 * HOT VACANCY CONTROLLER
 * 
 * ARCHITECTURE NOTE:
 * Hot vacancies are stored in the `jobs` table with isHotVacancy=true flag.
 * This unified approach provides:
 * - Simpler database queries and filtering
 * - Shared relationships (applications, bookmarks, etc.)
 * - Easier maintenance and consistency
 * 
 * The `hot_vacancies` table exists in the database but is NOT USED.
 * All hot vacancy operations delegate to JobController for consistency.
 */

/**
 * Create a new hot vacancy
 * Delegates to JobController.createJob() with isHotVacancy=true
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise} Response with created hot vacancy job
 */
exports.createHotVacancy = async (req, res, next) => {
  console.log('🔥 Creating hot vacancy...');
  
  // Ensure isHotVacancy is set to true
  req.body.isHotVacancy = true;
  
  // Set default values for hot vacancy
  if (req.body.boostedSearch === undefined) {
    req.body.boostedSearch = true; // Default to boosted
  }
  
  if (req.body.tierLevel === undefined) {
    req.body.tierLevel = 'premium'; // Default tier
  }
  
  // Delegate to regular job creation
  // The Job model has all hot vacancy fields
  return JobController.createJob(req, res, next);
};

/**
 * Create a new hot vacancy (legacy endpoint - kept for compatibility)
 */
exports.createHotVacancyLegacy = async (req, res, next) => {
  try {
    console.log('🔥 Creating hot vacancy with data:', req.body);
    console.log('👤 Authenticated user:', req.user.id, req.user.email);

    const {
      title,
      description,
      shortDescription,
      requirements,
      responsibilities,
      location,
      city,
      state,
      country = 'India',
      jobType = 'full-time',
      experienceLevel = 'mid',
      experienceMin = 0,
      experienceMax = 5,
      salaryMin,
      salaryMax,
      salary,
      salaryCurrency = 'INR',
      salaryPeriod = 'yearly',
      isSalaryVisible = true,
      department,
      category,
      skills = [],
      benefits = [],
      remoteWork = 'on-site',
      travelRequired = false,
      shiftTiming = 'day',
      noticePeriod,
      education = [],
      certifications = [],
      languages = [],
      tags = [],
      // Hot vacancy specific fields (CRITICAL PREMIUM FEATURES)
      urgencyLevel = 'high', // high, critical, immediate
      hiringTimeline = 'immediate', // immediate, 1-week, 2-weeks, 1-month
      maxApplications = 50,
      applicationDeadline,
      // Premium pricing
      pricingTier = 'premium', // basic, premium, enterprise, super-premium
      price,
      currency = 'INR',
      // Payment tracking
      paymentId, // Payment gateway transaction ID
      paymentDate, // When payment was completed
      // Premium features (PAID FEATURES)
      priorityListing = true, // Show at top of listings
      featuredBadge = true, // Display featured badge
      unlimitedApplications = false, // No application limit
      advancedAnalytics = true, // Advanced metrics
      candidateMatching = true, // AI matching
      directContact = true, // Direct employer contact
      // SEO optimization
      seoTitle,
      seoDescription,
      keywords = [],
      // Tracking metrics
      impressions = 0, // Hot vacancy specific impressions
      clicks = 0, // Hot vacancy specific clicks
      // Premium Hot Vacancy Features
      urgentHiring = false,
      multipleEmailIds = [],
      boostedSearch = true,
      searchBoostLevel = 'premium',
      citySpecificBoost = [],
      videoBanner,
      whyWorkWithUs,
      companyReviews = [],
      autoRefresh = false,
      refreshDiscount = 0,
      attachmentFiles = [],
      officeImages = [],
      companyProfile,
      proactiveAlerts = true,
      alertRadius = 50,
      alertFrequency = 'immediate',
      featuredKeywords = [],
      customBranding = {},
      superFeatured = false,
      tierLevel = 'premium'
    } = req.body;

    // Validate required fields
    if (!title || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and location are required'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required for hot vacancy'
      });
    }

    // Get company ID from user
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required. Please complete your company profile first.'
      });
    }

    // Sanitize salary fields to prevent numeric overflow
    const MAX_DECIMAL_VALUE = 99999999.99;
    let parsedSalaryMin = salaryMin ? parseFloat(salaryMin) : null;
    let parsedSalaryMax = salaryMax ? parseFloat(salaryMax) : null;

    if (parsedSalaryMin && parsedSalaryMin > MAX_DECIMAL_VALUE) {
      console.warn(`⚠️ salaryMin ${parsedSalaryMin} exceeds max, clamping to ${MAX_DECIMAL_VALUE}`);
      parsedSalaryMin = MAX_DECIMAL_VALUE;
    }
    if (parsedSalaryMax && parsedSalaryMax > MAX_DECIMAL_VALUE) {
      console.warn(`⚠️ salaryMax ${parsedSalaryMax} exceeds max, clamping to ${MAX_DECIMAL_VALUE}`);
      parsedSalaryMax = MAX_DECIMAL_VALUE;
    }

    // If salary is too large, set to null to avoid DB error
    if (parsedSalaryMin > MAX_DECIMAL_VALUE || parsedSalaryMax > MAX_DECIMAL_VALUE) {
      parsedSalaryMin = null;
      parsedSalaryMax = null;
      salary = null;
      console.error('❌ Salary values clamped or nullified due to overflow potential.');
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim() + '-' + Date.now(); // Add timestamp for uniqueness

    // Set validTill to 30 days from now
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + 30);

    const hotVacancyData = {
      // Basic job fields
      title,
      slug,
      description,
      shortDescription,
      requirements,
      responsibilities,
      location,
      city,
      state,
      country,
      companyId,
      employerId: req.user.id,
      jobType,
      experienceLevel,
      experienceMin,
      experienceMax,
      salaryMin: parsedSalaryMin,
      salaryMax: parsedSalaryMax,
      salary,
      salaryCurrency,
      salaryPeriod,
      isSalaryVisible,
      department,
      category,
      skills,
      benefits,
      remoteWork,
      travelRequired,
      shiftTiming,
      noticePeriod,
      education,
      certifications,
      languages,
      tags,
      validTill,
      status: 'draft', // Start as draft until payment is confirmed
      
      // PREMIUM HOT VACANCY FEATURES (PAID)
      urgencyLevel, // high, critical, immediate
      hiringTimeline, // immediate, 1-week, 2-weeks, 1-month
      maxApplications, // Application limit
      applicationDeadline, // When applications close
      pricingTier, // basic, premium, enterprise, super-premium
      price: parseFloat(price),
      currency,
      paymentId, // Payment transaction ID
      paymentDate, // Payment completion date
      priorityListing, // Show at top
      featuredBadge, // Featured badge display
      unlimitedApplications, // No limit on applications
      advancedAnalytics, // Advanced metrics
      candidateMatching, // AI matching
      directContact, // Direct contact feature
      
      // SEO optimization
      seoTitle,
      seoDescription,
      keywords,
      
      // Tracking metrics
      impressions, // Hot vacancy impressions
      clicks, // Hot vacancy clicks
      
      // Additional Premium Features
      urgentHiring,
      multipleEmailIds,
      boostedSearch,
      searchBoostLevel,
      citySpecificBoost,
      videoBanner,
      whyWorkWithUs,
      companyReviews,
      autoRefresh,
      refreshDiscount,
      attachmentFiles,
      officeImages,
      companyProfile,
      proactiveAlerts,
      alertRadius,
      alertFrequency,
      featuredKeywords,
      customBranding,
      superFeatured,
      tierLevel,
      
      // Mark as hot vacancy
      isHotVacancy: true
    };

    const hotVacancy = await Job.create(hotVacancyData);

    console.log('✅ Hot vacancy created successfully:', hotVacancy.id);

    // Send proactive alerts if enabled
    if (proactiveAlerts) {
      try {
        const HotVacancyAlertService = require('../services/hotVacancyAlertService');
        const company = await Company.findByPk(companyId, {
          attributes: ['name']
        });
        
        const hotVacancyData = {
          ...hotVacancy.toJSON(),
          companyName: company?.name || 'Company'
        };
        
        await HotVacancyAlertService.sendProactiveAlerts(hotVacancy.id, hotVacancyData);
        console.log('🔥 Proactive alerts sent for hot vacancy:', hotVacancy.id);
      } catch (alertError) {
        console.error('❌ Error sending proactive alerts:', alertError);
        // Don't fail the main request if alerts fail
      }
    }

    // Consume job posting quota for hot vacancy
    try {
      const EmployerQuotaService = require('../services/employerQuotaService');
      await EmployerQuotaService.checkAndConsume(req.user.id, EmployerQuotaService.QUOTA_TYPES.JOB_POSTINGS, {
        activityType: 'hot_vacancy_created',
        details: { 
          title: hotVacancy.title, 
          status: hotVacancy.status,
          pricingTier: hotVacancy.pricingTier,
          urgencyLevel: hotVacancy.urgencyLevel
        },
        jobId: hotVacancy.id,
        defaultLimit: 50
      });
    } catch (e) {
      console.error('⚠️ Failed to consume job posting quota for hot vacancy:', e?.message || e);
      // Don't fail the hot vacancy creation if quota check fails
    }

    // Log employer activity: hot vacancy posted
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logActivity(req.user.id, 'hot_vacancy_created', {
        jobId: hotVacancy.id,
        details: { 
          title: hotVacancy.title, 
          status: hotVacancy.status,
          pricingTier: hotVacancy.pricingTier,
          urgencyLevel: hotVacancy.urgencyLevel
        }
      });
    } catch (e) {
      console.error('⚠️ Failed to log hot_vacancy_created activity:', e?.message || e);
    }

    // Create notification for the employer about hot vacancy creation
    try {
      await Notification.create({
        userId: req.user.id,
        type: 'system',
        title: 'Hot Vacancy Created as Draft',
        message: `Your hot vacancy "${title}" has been created as a draft. Complete the payment to make it live and featured prominently.`,
        priority: 'medium',
        icon: 'fire',
        metadata: {
          event: 'hot_vacancy_created',
          hotVacancyId: hotVacancy.id,
          hotVacancyTitle: title,
          status: 'draft',
          action: 'Complete Payment'
        }
      });
      console.log('📢 Hot vacancy notification created for employer');
    } catch (notificationError) {
      console.error('❌ Error creating hot vacancy notification:', notificationError);
      // Don't fail the main request if notification creation fails
    }

    return res.status(201).json({
      success: true,
      message: 'Hot vacancy created successfully',
      data: hotVacancy
    });

  } catch (error) {
    console.error('❌ Create hot vacancy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create hot vacancy',
      error: error.message
    });
  }
};

/**
 * Get all hot vacancies for an employer
 */
exports.getHotVacanciesByEmployer = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      employerId: req.user.id,
      isHotVacancy: true // Filter for hot vacancies only
    };

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: hotVacancies } = await Job.findAndCountAll({
      where: whereClause,
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industries', 'companySize', 'website']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Hot vacancies retrieved successfully',
      data: hotVacancies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get hot vacancies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hot vacancies',
      error: error.message
    });
  }
};

/**
 * Get hot vacancy by ID
 */
exports.getHotVacancyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hotVacancy = await Job.findOne({
      where: { 
        id,
        isHotVacancy: true // Only get hot vacancy jobs
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industries', 'companySize', 'website', 'email', 'phone']
        },
        {
          model: User,
          as: 'employer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!hotVacancy) {
      return res.status(404).json({
        success: false,
        message: 'Hot vacancy not found'
      });
    }

    // Check if user has permission to view this hot vacancy
    if (hotVacancy.employerId !== req.user.id && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hot vacancy retrieved successfully',
      data: hotVacancy
    });

  } catch (error) {
    console.error('❌ Get hot vacancy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hot vacancy',
      error: error.message
    });
  }
};

/**
 * Update hot vacancy
 */
exports.updateHotVacancy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const hotVacancy = await Job.findOne({
      where: {
        id,
        isHotVacancy: true
      }
    });

    if (!hotVacancy) {
      return res.status(404).json({
        success: false,
        message: 'Hot vacancy not found'
      });
    }

    // Check if user has permission to update this hot vacancy
    if (hotVacancy.employerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Don't allow updating certain fields after payment
    if (hotVacancy.hotVacancyPaymentStatus === 'paid') {
      const restrictedFields = ['tierLevel', 'hotVacancyPrice', 'hotVacancyCurrency'];
      restrictedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      });
    }

    // Check if status is changing from draft to active
    const wasDraft = hotVacancy.status === 'draft';
    const isBecomingActive = updateData.status === 'active';

    await hotVacancy.update(updateData);

    // Create notification if hot vacancy is being activated
    if (wasDraft && isBecomingActive) {
      try {
        await Notification.create({
          userId: req.user.id,
          type: 'system',
          title: 'Hot Vacancy Now Live!',
          message: `Your hot vacancy "${hotVacancy.title}" is now live and featured prominently to attract top candidates.`,
          priority: 'high',
          icon: 'fire',
          metadata: {
            event: 'hot_vacancy_activated',
            hotVacancyId: hotVacancy.id,
            hotVacancyTitle: hotVacancy.title,
            status: 'active',
            action: 'View Hot Vacancy'
          }
        });
        console.log('📢 Hot vacancy activation notification created for employer');
      } catch (notificationError) {
        console.error('❌ Error creating hot vacancy activation notification:', notificationError);
        // Don't fail the main request if notification creation fails
      }

      // Log employer activity: hot vacancy activated
      try {
        const EmployerActivityService = require('../services/employerActivityService');
        await EmployerActivityService.logActivity(req.user.id, 'hot_vacancy_activated', {
          jobId: hotVacancy.id,
          details: { 
            title: hotVacancy.title, 
            status: 'active',
            pricingTier: hotVacancy.pricingTier,
            urgencyLevel: hotVacancy.urgencyLevel
          }
        });
      } catch (e) {
        console.error('⚠️ Failed to log hot_vacancy_activated activity:', e?.message || e);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Hot vacancy updated successfully',
      data: hotVacancy
    });

  } catch (error) {
    console.error('❌ Update hot vacancy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update hot vacancy',
      error: error.message
    });
  }
};

/**
 * Delete hot vacancy
 */
exports.deleteHotVacancy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hotVacancy = await Job.findOne({
      where: {
        id,
        isHotVacancy: true
      }
    });

    if (!hotVacancy) {
      return res.status(404).json({
        success: false,
        message: 'Hot vacancy not found'
      });
    }

    // Check if user has permission to delete this hot vacancy
    if (hotVacancy.employerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await hotVacancy.destroy();

    return res.status(200).json({
      success: true,
      message: 'Hot vacancy deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete hot vacancy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete hot vacancy',
      error: error.message
    });
  }
};

/**
 * Get public hot vacancies (for jobseekers)
 */
exports.getPublicHotVacancies = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, location, jobType, experienceLevel } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: 'active',
      isHotVacancy: true,
      hotVacancyPaymentStatus: 'paid'
    };

    if (location) {
      whereClause.location = { [require('sequelize').Op.iLike]: `%${location}%` };
    }

    if (jobType) {
      whereClause.jobType = jobType;
    }

    if (experienceLevel) {
      whereClause.experienceLevel = experienceLevel;
    }

    const { count, rows: hotVacancies } = await Job.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industry', 'companySize', 'website', 'logo', 'description']
        }
      ],
      order: [
        // PREMIUM FEATURE PRIORITY SORTING (Most valuable features first)
        ['superFeatured', 'DESC'], // Super featured first
        ['priorityListing', 'DESC'], // Priority listing second
        ['urgentHiring', 'DESC'], // Urgent hiring third
        ['boostedSearch', 'DESC'], // Boosted search fourth
        ['featuredBadge', 'DESC'], // Featured badge fifth
        ['pricingTier', 'DESC'], // Higher tier sixth (super-premium > enterprise > premium > basic)
        ['impressions', 'DESC'], // More impressions = better visibility
        ['applicationDeadline', 'ASC'], // Closer deadline = more urgent
        ['created_at', 'DESC'] // Newer first
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    console.log(`🔥 Found ${count} public hot vacancies with premium feature sorting`);

    return res.status(200).json({
      success: true,
      message: 'Hot vacancies retrieved successfully',
      data: hotVacancies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get public hot vacancies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hot vacancies',
      error: error.message
    });
  }
};

/**
 * Get hot vacancy pricing tiers
 */
exports.getPricingTiers = async (req, res, next) => {
  try {
    const pricingTiers = {
      basic: {
        name: 'Basic Hot Vacancy',
        price: 2999,
        currency: 'INR',
        features: [
          '7 days listing',
          'Up to 25 applications',
          'Basic analytics',
          'Standard visibility',
          'Basic job alerts'
        ],
        duration: 7,
        tierLevel: 'basic'
      },
      premium: {
        name: 'Premium Hot Vacancy',
        price: 5999,
        currency: 'INR',
        features: [
          '14 days listing',
          'Up to 50 applications',
          'Advanced analytics',
          'Priority listing',
          'Featured badge',
          'Candidate matching',
          'Proactive job alerts',
          'Boosted search visibility',
          'Multiple email support',
          'Office images upload'
        ],
        duration: 14,
        tierLevel: 'premium'
      },
      enterprise: {
        name: 'Enterprise Hot Vacancy',
        price: 9999,
        currency: 'INR',
        features: [
          '30 days listing',
          'Unlimited applications',
          'Advanced analytics',
          'Top priority listing',
          'Featured badge',
          'Candidate matching',
          'Direct contact access',
          'Custom branding',
          'Video banner support',
          'Company profile showcase',
          'Why work with us section',
          'Auto-refresh option',
          'City-specific boost',
          'Super featured status'
        ],
        duration: 30,
        tierLevel: 'enterprise'
      },
      'super-premium': {
        name: 'Super Premium Hot Vacancy',
        price: 19999,
        currency: 'INR',
        features: [
          '60 days listing',
          'Unlimited applications',
          'Advanced analytics',
          'Top priority listing',
          'Featured badge',
          'Candidate matching',
          'Direct contact access',
          'Custom branding',
          'Video banner support',
          'Company profile showcase',
          'Why work with us section',
          'Auto-refresh option',
          'City-specific boost',
          'Super featured status',
          'Urgent hiring badge',
          'Company reviews showcase',
          'Attachment files support',
          'Custom alert radius',
          'Featured keywords boost',
          'Refresh discount (20%)'
        ],
        duration: 60,
        tierLevel: 'super-premium'
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Pricing tiers retrieved successfully',
      data: pricingTiers
    });

  } catch (error) {
    console.error('❌ Get pricing tiers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing tiers',
      error: error.message
    });
  }
};
