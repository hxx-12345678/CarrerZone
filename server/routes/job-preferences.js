const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { JobPreference, User, Job, Company } = require('../models');
const { Op } = require('sequelize');

// Get user's job preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if JobPreference table exists
    try {
      await JobPreference.describe();
    } catch (tableError) {
      console.error('JobPreference table does not exist:', tableError);
      return res.status(500).json({
        success: false,
        message: 'Job preferences table not found. Please run database migration.',
        error: 'TABLE_NOT_FOUND'
      });
    }
    
    let preferences = await JobPreference.findOne({
      where: { userId, isActive: true }
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await JobPreference.create({
        userId,
        region: req.user.region || 'india',
        preferredSalaryCurrency: req.user.region === 'gulf' ? 'AED' : 'INR'
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching job preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job preferences',
      error: error.message
    });
  }
});

// Update user's job preferences
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      preferredJobTitles,
      preferredLocations,
      preferredJobTypes,
      preferredExperienceLevels,
      preferredSalaryMin,
      preferredSalaryMax,
      preferredSalaryCurrency,
      preferredSkills,
      preferredWorkMode,
      preferredShiftTiming,
      willingToRelocate,
      willingToTravel,
      noticePeriod,
      emailAlerts,
      pushNotifications
    } = req.body;

    // Find existing preferences or create new ones
    let preferences = await JobPreference.findOne({
      where: { userId, isActive: true }
    });

    const updateData = {
      preferredJobTitles: preferredJobTitles || [],
      preferredLocations: preferredLocations || [],
      preferredJobTypes: preferredJobTypes || [],
      preferredExperienceLevels: preferredExperienceLevels || [],
      preferredSalaryMin: preferredSalaryMin || null,
      preferredSalaryMax: preferredSalaryMax || null,
      preferredSalaryCurrency: preferredSalaryCurrency || (req.user.region === 'gulf' ? 'AED' : 'INR'),
      preferredSkills: preferredSkills || [],
      preferredWorkMode: preferredWorkMode || [],
      preferredShiftTiming: preferredShiftTiming || [],
      willingToRelocate: willingToRelocate || false,
      willingToTravel: willingToTravel || false,
      noticePeriod: noticePeriod || null,
      emailAlerts: emailAlerts !== undefined ? emailAlerts : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      region: req.user.region || 'india',
      lastUpdated: new Date()
    };

    if (preferences) {
      await preferences.update(updateData);
    } else {
      preferences = await JobPreference.create({
        userId,
        ...updateData
      });
    }

    res.json({
      success: true,
      message: 'Job preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    console.error('Error updating job preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job preferences'
    });
  }
});

// Get jobs matching user's preferences
router.get('/matching-jobs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get user's preferences
    const preferences = await JobPreference.findOne({
      where: { userId, isActive: true }
    });

    if (!preferences) {
      return res.json({
        success: true,
        data: {
          jobs: [],
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    }

    // Build where clause based on preferences
    const whereClause = {
      status: 'active',
      region: preferences.region || req.user.region || 'india'
    };

    // Add job title filters
    if (preferences.preferredJobTitles && preferences.preferredJobTitles.length > 0) {
      whereClause.title = {
        [Op.iLike]: {
          [Op.any]: preferences.preferredJobTitles.map(title => `%${title}%`)
        }
      };
    }

    // Add location filters
    if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
      whereClause.location = {
        [Op.iLike]: {
          [Op.any]: preferences.preferredLocations.map(location => `%${location}%`)
        }
      };
    }

    // Add job type filters
    if (preferences.preferredJobTypes && preferences.preferredJobTypes.length > 0) {
      whereClause.jobType = {
        [Op.in]: preferences.preferredJobTypes
      };
    }

    // Add experience level filters
    if (preferences.preferredExperienceLevels && preferences.preferredExperienceLevels.length > 0) {
      whereClause.experienceLevel = {
        [Op.in]: preferences.preferredExperienceLevels
      };
    }

    // Add work mode filters
    if (preferences.preferredWorkMode && preferences.preferredWorkMode.length > 0) {
      whereClause.remoteWork = {
        [Op.in]: preferences.preferredWorkMode
      };
    }

    // Add salary filters
    if (preferences.preferredSalaryMin || preferences.preferredSalaryMax) {
      whereClause[Op.or] = [
        {
          salaryMin: {
            [Op.gte]: preferences.preferredSalaryMin || 0
          }
        },
        {
          salaryMax: {
            [Op.lte]: preferences.preferredSalaryMax || 999999999
          }
        }
      ];
    }

    // Add company filters
    if (preferences.preferredCompanies && preferences.preferredCompanies.length > 0) {
      whereClause['$company.name$'] = {
        [Op.iLike]: {
          [Op.any]: preferences.preferredCompanies.map(company => `%${company}%`)
        }
      };
    }

    // Get matching jobs
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'website']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Transform jobs to match frontend format
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: {
        id: job.company?.id || 'unknown',
        name: job.company?.name || 'Unknown Company',
        logo: job.company?.logo || '/placeholder-logo.png'
      },
      location: job.location,
      experience: job.experienceLevel || 'Not specified',
      salary: job.salary || (job.salaryMin && job.salaryMax 
        ? `${job.salaryCurrency || 'INR'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
        : 'Not specified'),
      skills: job.skills || [],
      logo: job.company?.logo || '/placeholder-logo.png',
      posted: job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently',
      applicants: job.applications || 0,
      description: job.description,
      type: job.jobType ? job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1) : 'Full-time',
      remote: job.remoteWork === 'remote',
      urgent: job.isUrgent || false,
      featured: job.isFeatured || false,
      companyRating: 4.5,
      category: job.category || 'General',
      region: job.region,
      isPreferred: true // Mark as preferred job
    }));

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching matching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matching jobs'
    });
  }
});

// Delete job preferences
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await JobPreference.update(
      { isActive: false },
      { where: { userId } }
    );

    res.json({
      success: true,
      message: 'Job preferences deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job preferences'
    });
  }
});

module.exports = router;
