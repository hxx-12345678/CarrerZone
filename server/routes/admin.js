const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const {
  User,
  Company,
  Job,
  JobApplication,
  JobBookmark,
  JobCategory,
  Resume,
  WorkExperience,
  Education,
  CompanyPhoto,
  CompanyReview,
  CompanyFollow,
  Subscription,
  SubscriptionPlan,
  Payment,
  UserActivityLog,
  UserSession,
  Analytics,
  Requirement,
  SystemSetting
} = require('../config');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/adminAuth');

// Test endpoint to verify admin authentication (before middleware)
router.get('/test-auth', async (req, res) => {
  try {
    console.log('🔍 [ADMIN-TEST] Testing admin authentication endpoint');
    res.json({
      success: true,
      message: 'Admin test endpoint accessible',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [ADMIN-TEST] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
});

// Apply admin authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Test endpoint for Job count only
router.get('/jobs/count', async (req, res) => {
  try {
    console.log('🔍 [ADMIN-TEST] Testing Job count query');

    const count = await Job.count();
    res.json({
      success: true,
      message: 'Job count query successful',
      data: { count }
    });
  } catch (error) {
    console.error('❌ [ADMIN-TEST] Job count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Job count query error',
      error: error.message
    });
  }
});

// Test endpoint for minimal Job model
router.get('/jobs/minimal-count', async (req, res) => {
  try {
    console.log('🔍 [ADMIN-TEST] Testing minimal Job count query');

    const JobMinimal = require('../models/JobMinimal');
    const count = await JobMinimal.count();
    res.json({
      success: true,
      message: 'Minimal Job count query successful',
      data: { count }
    });
  } catch (error) {
    console.error('❌ [ADMIN-TEST] Minimal Job count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Minimal Job count query error',
      error: error.message
    });
  }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      userStats,
      companyStats,
      jobStats,
      applicationStats
    ] = await Promise.all([
      // User statistics
      Promise.all([
        User.count(),
        User.count({ where: { user_type: 'jobseeker' } }),
        User.count({ where: { user_type: 'employer' } }),
        User.count({ where: { user_type: 'admin' } }),
        User.count({ where: { is_active: true } }),
        User.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]),
      // Company statistics
      Promise.all([
        Company.count(),
        Company.count({ where: { verificationStatus: 'verified' } }),
        Company.count({ where: { verificationStatus: 'pending' } }),
        Company.count({ where: { isActive: true } }),
        Company.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]),
      // Job statistics
      Promise.all([
        Job.count(),
        Job.count({ where: { status: 'active' } }),
        Job.count({ where: { status: 'inactive' } }),
        Job.count({ where: { region: 'india' } }),
        Job.count({ where: { region: 'gulf' } }),
        Job.count({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]),
      // Application statistics
      JobApplication.count()
    ]);

    const stats = {
      users: {
        total: userStats[0],
        jobseekers: userStats[1],
        employers: userStats[2],
        admins: userStats[3],
        active: userStats[4],
        newLast30Days: userStats[5]
      },
      companies: {
        total: companyStats[0],
        verified: companyStats[1],
        pending: companyStats[2],
        active: companyStats[3],
        newLast30Days: companyStats[4]
      },
      jobs: {
        total: jobStats[0],
        active: jobStats[1],
        inactive: jobStats[2],
        india: jobStats[3],
        gulf: jobStats[4],
        newLast30Days: jobStats[5]
      },
      applications: {
        total: applicationStats
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Get all users with filters
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      status,
      region
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add filters
    if (userType && userType !== 'all') {
      whereClause.user_type = userType;
    }

    if (status && status !== 'all') {
      whereClause.is_active = status === 'active';
    }

    if (region && region !== 'all') {
      whereClause.region = region;
    }

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get users by region
router.get('/users/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { region };

    // Add filters
    if (userType && userType !== 'all') {
      whereClause.user_type = userType;
    }

    if (status && status !== 'all') {
      whereClause.is_active = status === 'active';
    }

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching users by region:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get comprehensive user details for superadmin
router.get('/users/:userId/details', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'email', 'industries', 'sector', 'companySize', 'companyAccountType', 'website', 'phone', 'address', 'city', 'state', 'country', 'region', 'isVerified', 'verificationStatus', 'verificationDocuments', 'isActive', 'description', 'created_at']
        },
        {
          model: JobApplication,
          as: 'jobApplications',
          attributes: ['id', 'status', 'created_at'],
          include: [{
            model: Job,
            as: 'job',
            attributes: ['id', 'title', 'location'],
            include: [{
              model: Company,
              as: 'company',
              attributes: ['id', 'name']
            }]
          }],
          limit: 10,
          order: [['created_at', 'DESC']]
        },
        {
          model: JobBookmark,
          as: 'jobBookmarks',
          attributes: ['id', 'created_at'],
          limit: 10,
          order: [['created_at', 'DESC']]
        },
        {
          model: Resume,
          as: 'resumes',
          attributes: ['id', 'title', 'summary', 'isDefault', 'isPublic', 'views', 'downloads', 'lastUpdated', 'created_at']
        },
        {
          model: WorkExperience,
          as: 'workExperiences',
          attributes: ['id', 'companyName', 'jobTitle', 'startDate', 'endDate', 'description', 'isCurrent']
        },
        {
          model: Education,
          as: 'educations',
          attributes: ['id', 'institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate', 'cgpa', 'percentage', 'description']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional statistics
    const totalApplications = await JobApplication.count({ where: { userId } });
    const totalBookmarks = await JobBookmark.count({ where: { userId } });

    // Get posted jobs for employers/admins/recruiters
    let postedJobs = [];
    let totalJobsPosted = 0;
    if ((user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') && user.company?.id) {
      postedJobs = await Job.findAll({
        where: { companyId: user.company.id },
        attributes: ['id', 'title', 'location', 'status', 'created_at', 'validTill'],
        limit: 20,
        order: [['created_at', 'DESC']],
        include: [{
          model: JobApplication,
          as: 'jobApplications',
          attributes: ['id']
        }]
      });

      // Add application count to each job
      postedJobs = postedJobs.map(job => {
        const jobData = job.toJSON();
        return {
          ...jobData,
          applicationCount: jobData.jobApplications?.length || 0,
          validTill: jobData.validTill || jobData.valid_till || null,
          jobApplications: undefined // Remove the full array, we only need the count
        };
      });

      totalJobsPosted = postedJobs.length;
    }

    // Get pricing/subscription information if available
    const subscription = await Subscription.findOne({
      where: { userId },
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        attributes: ['id', 'name', 'monthlyPrice', 'yearlyPrice', 'currency', 'features', 'planType']
      }],
      order: [['created_at', 'DESC']]
    });

    // Get payment history
    const payments = await Payment.findAll({
      where: { userId },
      attributes: ['id', 'amount', 'currency', 'status', 'paymentMethod', 'created_at', 'description'],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Get user activity logs
    const activityLogs = await UserActivityLog.findAll({
      where: { userId },
      attributes: ['id', 'activityType', 'details', 'timestamp'],
      order: [['timestamp', 'DESC']],
      limit: 20
    });

    // Get user sessions
    const sessions = await UserSession.findAll({
      where: { userId },
      attributes: ['id', 'ipAddress', 'userAgent', 'isActive', 'lastActivityAt', 'created_at'],
      order: [['lastActivityAt', 'DESC']],
      limit: 10
    });

    const userDetails = {
      ...user.toJSON(),
      // Ensure timestamps are properly mapped
      createdAt: user.created_at || user.createdAt,
      updatedAt: user.updated_at || user.updatedAt,
      postedJobs: postedJobs || [],
      statistics: {
        totalApplications,
        totalBookmarks,
        totalJobsPosted,
        totalResumes: user.resumes?.length || 0,
        totalWorkExperiences: user.workExperiences?.length || 0,
        totalEducations: user.educations?.length || 0
      },
      subscription: subscription || null,
      payments: payments || [],
      activityLogs: activityLogs || [],
      sessions: sessions || [],
      resumes: (user.resumes || []).map((resume) => {
        const resumeData = resume.toJSON();
        return {
          ...resumeData,
          createdAt: resumeData.created_at || resumeData.createdAt,
          lastUpdated: resumeData.lastUpdated || resumeData.last_updated || resumeData.updated_at || resumeData.createdAt || resumeData.created_at
        };
      }),
      jobApplications: (user.jobApplications || []).map((app) => {
        const appData = app.toJSON();
        return {
          ...appData,
          createdAt: appData.created_at || appData.createdAt,
          created_at: appData.created_at || appData.createdAt,
          job: appData.job || null
        };
      })
    };

    res.json({
      success: true,
      data: userDetails
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// Serve verification documents for admin/superadmin
router.get('/verification-documents/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    console.log(`🔍 Admin document access request: ${filename} by user: ${user?.email} (${user?.user_type})`);

    // Check if user is admin or superadmin
    if (!['admin', 'superadmin'].includes(user.user_type)) {
      console.log(`❌ Access denied for user: ${user?.email} (${user?.user_type})`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Try multiple possible file paths and patterns
    const possiblePaths = [
      path.join(__dirname, '../uploads/verification-documents', filename),
      // Try with different filename patterns
      path.join(__dirname, '../uploads/verification-documents', filename.replace(/^.*\//, '')), // Remove any path prefix
    ];

    // Also try to find files that start with the same pattern
    const uploadDir = path.join(__dirname, '../uploads/verification-documents');
    if (fs.existsSync(uploadDir)) {
      try {
        const files = fs.readdirSync(uploadDir);
        console.log(`📂 Available files in directory:`, files.slice(0, 10)); // Log first 10 files for debugging
        
        // Try multiple matching strategies
        const matchingFile = files.find(file => {
          // Exact match
          if (file === filename) return true;
          
          // Filename contains the requested filename
          if (file.includes(filename)) return true;
          
          // Requested filename contains the file's random number part (UUID-timestamp-randomNumber pattern)
          const fileRandomPart = file.split('-').slice(0, 4).join('-'); // Extract UUID-timestamp part
          if (filename.includes(fileRandomPart)) return true;
          
          // Extract the last numeric part before extension from both filenames
          const fileNumPart = file.match(/-(\d+)-[^-]*\.pdf$/)?.[1];
          const reqNumPart = filename.match(/-(\d+)-[^-]*\.pdf$/)?.[1];
          if (fileNumPart && reqNumPart && fileNumPart === reqNumPart) return true;
          
          // Match by UUID part if filename contains UUID-like pattern
          const fileUuid = file.match(/^([a-f0-9-]{36})/)?.[1];
          const reqUuid = filename.match(/([a-f0-9-]{36})/)?.[1];
          if (fileUuid && reqUuid && fileUuid === reqUuid) return true;
          
          return false;
        });
        
        if (matchingFile) {
          console.log(`✅ Found matching file: ${matchingFile}`);
          possiblePaths.push(path.join(uploadDir, matchingFile));
        } else {
          console.log(`⚠️ No matching file found for: ${filename}`);
        }
      } catch (error) {
        console.log('⚠️ Could not read upload directory:', error.message);
      }
    }

    console.log(`📁 Looking for file: ${filename}`);
    console.log(`📁 Trying paths:`, possiblePaths);

    let filePath = possiblePaths.find(p => fs.existsSync(p));

    if (!filePath) {
      console.log(`❌ File not found in any of the expected locations`);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Set headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    console.log(`✅ Serving file: ${filePath}`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving verification document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve document',
      error: error.message
    });
  }
});

// Get resume for admin viewing (super-admin can view any user's resume)
router.get('/users/:userId/resumes/:resumeId/view', authenticateToken, async (req, res) => {
  try {
    const { userId, resumeId } = req.params;
    const adminUser = req.user;

    // Check if user is admin or superadmin
    if (!['admin', 'superadmin'].includes(adminUser.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const resume = await Resume.findOne({
      where: {
        id: resumeId,
        userId: userId
      }
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Increment view count
    await resume.update({
      views: (resume.views || 0) + 1
    });

    const metadata = resume.metadata || {};
    const filename = metadata.filename || resume.filePath;

    // Try local storage first
    const fs = require('fs');
    if (filename && metadata.hasLocalFile) {
      // Find resume file using similar logic to user.js
      const possiblePaths = [
        metadata?.absolutePath,
        path.join(__dirname, '../uploads/resumes', filename),
        path.join(process.cwd(), 'server', 'uploads', 'resumes', filename),
        path.join(process.cwd(), 'uploads', 'resumes', filename),
        metadata?.filePath ? metadata.filePath : null
      ].filter(Boolean);

      const filePath = possiblePaths.find(p => fs.existsSync(p));

      if (filePath && fs.existsSync(filePath)) {
        res.setHeader('Content-Type', metadata.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.sendFile(filePath);
        return;
      }
    }

    // Fallback to Cloudinary
    if (metadata.cloudinaryUrl) {
      const https = require('https');

      https.get(metadata.cloudinaryUrl, (response) => {
        res.setHeader('Content-Type', metadata.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        response.pipe(res);
      }).on('error', (err) => {
        console.error('Cloudinary error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch resume from storage'
        });
      });
      return;
    }

    res.status(404).json({
      success: false,
      message: 'Resume file not found'
    });
  } catch (error) {
    console.error('Error serving admin resume view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve resume',
      error: error.message
    });
  }
});

// Download resume for admin (super-admin can download any user's resume)
router.get('/users/:userId/resumes/:resumeId/download', authenticateToken, async (req, res) => {
  try {
    const { userId, resumeId } = req.params;
    const adminUser = req.user;

    // Check if user is admin or superadmin
    if (!['admin', 'superadmin'].includes(adminUser.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const resume = await Resume.findOne({
      where: {
        id: resumeId,
        userId: userId
      }
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Increment download count
    await resume.update({
      downloads: (resume.downloads || 0) + 1
    });

    const metadata = resume.metadata || {};
    const originalName = metadata.originalName || metadata.original_name || `resume-${resume.id}.pdf`;
    const filename = metadata.filename || resume.filePath;

    // Try local storage first
    const fs = require('fs');
    if (filename && metadata.hasLocalFile) {
      // Find resume file using similar logic to user.js
      const possiblePaths = [
        metadata?.absolutePath,
        path.join(__dirname, '../uploads/resumes', filename),
        path.join(process.cwd(), 'server', 'uploads', 'resumes', filename),
        path.join(process.cwd(), 'uploads', 'resumes', filename),
        metadata?.filePath ? metadata.filePath : null
      ].filter(Boolean);

      const filePath = possiblePaths.find(p => fs.existsSync(p));

      if (filePath && fs.existsSync(filePath)) {
        res.setHeader('Content-Type', metadata.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        res.sendFile(filePath);
        return;
      }
    }

    // Fallback to Cloudinary
    if (metadata.cloudinaryUrl) {
      const https = require('https');

      https.get(metadata.cloudinaryUrl, (response) => {
        res.setHeader('Content-Type', metadata.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        response.pipe(res);
      }).on('error', (err) => {
        console.error('Cloudinary error:', err);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch resume from storage'
        });
      });
      return;
    }

    res.status(404).json({
      success: false,
      message: 'Resume file not found'
    });
  } catch (error) {
    console.error('Error serving admin resume download:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve resume',
      error: error.message
    });
  }
});

// Get comprehensive company details for superadmin
router.get('/companies/:companyId/details', async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findByPk(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get company's jobs using raw SQL to avoid column name issues
    const companyJobsRows = await sequelize.query(
      'SELECT id, title, location, salary, job_type, status, created_at, valid_till FROM jobs WHERE company_id = :companyId ORDER BY created_at DESC',
      { replacements: { companyId: companyId }, type: sequelize.QueryTypes.SELECT }
    );

    // Ensure validTill is included in each job
    const companyJobs = (companyJobsRows || []).map((job) => ({
      ...job,
      validTill: job.valid_till || job.validTill || null
    }));

    // Get job applications separately for each job
    const jobIds = companyJobs.map(job => job.id);
    const jobApplications = jobIds.length > 0 ? await JobApplication.findAll({
      where: { jobId: jobIds },
      attributes: ['id', 'jobId', 'status', 'created_at'],
      order: [['created_at', 'DESC']]
    }) : [];

    // Get applicants separately to avoid complex includes
    const applicantIds = jobApplications.map(app => app.userId);
    const applicants = applicantIds.length > 0 ? await User.findAll({
      where: { id: applicantIds },
      attributes: ['id', 'first_name', 'last_name', 'email']
    }) : [];

    // Create a map of applicants by ID
    const applicantsMap = applicants.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    // Add applicants to job applications
    const jobApplicationsWithApplicants = jobApplications.map(app => {
      const appData = app.toJSON();
      return {
        ...appData,
        applicant: applicantsMap[appData.userId] || null
      };
    });

    // Group applications by job ID
    const applicationsByJob = jobApplicationsWithApplicants.reduce((acc, app) => {
      if (!acc[app.jobId]) acc[app.jobId] = [];
      acc[app.jobId].push(app);
      return acc;
    }, {});

    // Add applications to jobs
    const companyJobsWithApplications = companyJobs.map((job) => {
      return {
        ...job,
        jobApplications: applicationsByJob[job.id] || [],
        validTill: job.valid_till || job.validTill || null,
        valid_till: job.valid_till || job.validTill || null
      };
    });

    // Get additional statistics using raw SQL to avoid column name issues
    const [totalJobsResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM jobs WHERE company_id = :companyId',
      { replacements: { companyId: companyId }, type: sequelize.QueryTypes.SELECT }
    );
    const totalJobs = totalJobsResult.count;

    const [activeJobsResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM jobs WHERE company_id = :companyId AND status = :status',
      { replacements: { companyId: companyId, status: 'active' }, type: sequelize.QueryTypes.SELECT }
    );
    const activeJobs = activeJobsResult.count;

    const [totalApplicationsResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM job_applications ja JOIN jobs j ON ja.job_id = j.id WHERE j.company_id = :companyId',
      { replacements: { companyId: companyId }, type: sequelize.QueryTypes.SELECT }
    );
    const totalApplications = totalApplicationsResult.count;
    // Temporarily disable these queries to isolate the issue
    const totalReviews = 0;
    const averageRating = { averageRating: 0 };

    // Get company users first
    const companyUsers = await User.findAll({
      where: { companyId: companyId },
      attributes: ['id', 'first_name', 'last_name', 'email', 'user_type']
    });

    // Get company subscription/pricing information - use first user's ID as a proxy
    const firstUserId = companyUsers.length > 0 ? companyUsers[0].id : null;
    const subscription = firstUserId ? await Subscription.findOne({
      where: {
        userId: firstUserId
      },
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        attributes: ['id', 'name', 'monthlyPrice', 'yearlyPrice', 'currency', 'features', 'planType']
      }],
      order: [['created_at', 'DESC']]
    }) : null;

    // Get payment history - only if company has users
    const payments = firstUserId ? await Payment.findAll({
      where: {
        userId: firstUserId
      },
      attributes: ['id', 'amount', 'currency', 'status', 'paymentMethod', 'created_at', 'description'],
      order: [['created_at', 'DESC']],
      limit: 10
    }) : [];

    // Get company activity logs - only if company has users
    const activityLogs = firstUserId ? await UserActivityLog.findAll({
      where: {
        userId: firstUserId
      },
      attributes: ['id', 'activityType', 'details', 'timestamp'],
      order: [['timestamp', 'DESC']],
      limit: 20
    }) : [];

    // Get company analytics
    const analytics = await Analytics.findAll({
      where: { companyId },
      attributes: ['id', 'eventType', 'metadata', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Process verification documents to include proper URLs
    let processedVerificationDocuments = company.verificationDocuments;
    if (processedVerificationDocuments && processedVerificationDocuments.documents) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      processedVerificationDocuments = {
        ...processedVerificationDocuments,
        documents: processedVerificationDocuments.documents.map(doc => ({
          ...doc,
          url: doc.filename ? `${baseUrl}/api/admin/verification-documents/${doc.filename}` : doc.url
        }))
      };
    }

    const companyDetails = {
      ...company.toJSON(),
      verificationDocuments: processedVerificationDocuments,
      jobs: companyJobsWithApplications || [],
      statistics: {
        totalJobs,
        activeJobs,
        totalApplications,
        totalReviews,
        averageRating: averageRating?.averageRating ? parseFloat(averageRating.averageRating).toFixed(1) : 0,
        totalEmployees: companyUsers?.length || 0,
        totalPhotos: company.photos?.length || 0
      },
      subscription: subscription || null,
      payments: payments || [],
      activityLogs: activityLogs || [],
      analytics: analytics || []
    };

    res.json({
      success: true,
      data: companyDetails
    });
  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company details',
      error: error.message
    });
  }
});

// Get comprehensive job details for superadmin
router.get('/jobs/:jobId/details', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId, {
      attributes: ['id', 'title', 'description', 'location', 'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod', 'jobType', 'status', 'validTill', 'requirements', 'responsibilities', 'industryType', 'department', 'role', 'roleCategory', 'employmentType', 'skills', 'education', 'companyId', 'created_at', 'updated_at'],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'email', 'industries', 'companySize', 'website', 'phone', 'address', 'city', 'state', 'country', 'region', 'isVerified', 'isActive', 'created_at']
        },
        {
          model: User,
          as: 'employer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'user_type']
        },
        {
          model: JobApplication,
          as: 'jobApplications',
          attributes: ['id', 'status', 'coverLetter', 'created_at', 'updated_at'],
          include: [{
            model: User,
            as: 'applicant',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'region'],
            include: [{
              model: Resume,
              as: 'resumes',
              attributes: ['id', 'title', 'summary', 'isDefault'],
              where: { isDefault: true },
              required: false
            }]
          }],
          order: [['created_at', 'DESC']]
        },
        {
          model: JobBookmark,
          as: 'bookmarks',
          attributes: ['id', 'created_at'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }],
          order: [['created_at', 'DESC']]
        },
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get additional statistics
    const totalApplications = await JobApplication.count({ where: { jobId } });
    const totalBookmarks = await JobBookmark.count({ where: { jobId } });
    const applicationsByStatus = await JobApplication.findAll({
      where: { jobId },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get job analytics - use Sequelize Op.in for array query
    const jobAnalytics = await Analytics.findAll({
      where: {
        jobId: jobId,
        eventType: { [Op.in]: ['job_view', 'job_apply', 'job_bookmark'] }
      },
      attributes: ['id', 'eventType', 'metadata', [Sequelize.col('created_at'), 'createdAt']],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    // Get job performance metrics - use eventType (model attribute name)
    const viewCount = await Analytics.count({
      where: { jobId: jobId, eventType: 'job_view' }
    });
    const applyCount = await Analytics.count({
      where: { jobId: jobId, eventType: 'job_apply' }
    });
    const bookmarkCount = await Analytics.count({
      where: { jobId: jobId, eventType: 'job_bookmark' }
    });

    // Calculate conversion rates
    const conversionRate = viewCount > 0 ? ((applyCount / viewCount) * 100).toFixed(2) : 0;
    const bookmarkRate = viewCount > 0 ? ((bookmarkCount / viewCount) * 100).toFixed(2) : 0;

    // Get similar jobs - only from the same company
    let similarJobs = [];
    const jobData = job.toJSON();
    const companyId = jobData.companyId || jobData.company_id || job.companyId || job.company_id;

    console.log(`🔍 Fetching similar jobs for job ${jobId}, companyId: ${companyId}`);

    if (companyId) {
      try {
        similarJobs = await Job.findAll({
          where: {
            id: { [Op.ne]: jobId },
            companyId: companyId // Only show jobs from the same company
          },
          attributes: ['id', 'title', 'location', 'salary', 'salary_min', 'salary_max', 'salary_currency', 'job_type', 'status', 'created_at', 'valid_till'],
          include: [{
            model: Company,
            as: 'company',
            attributes: ['id', 'name', 'industries', 'sector']
          }],
          limit: 5,
          order: [['created_at', 'DESC']]
        });
        console.log(`✅ Found ${similarJobs.length} similar jobs for company ${companyId}`);
      } catch (error) {
        console.error('❌ Error fetching similar jobs:', error);
        similarJobs = [];
      }
    } else {
      console.log('⚠️ No companyId found for job, cannot fetch similar jobs');
    }

    // Get job requirements analysis - parse requirements text if available
    const requirementsText = job.requirements || '';
    const requirementsLines = requirementsText ? requirementsText.split('\n').filter(line => line.trim()).length : 0;
    const requirementsAnalysis = {
      totalRequirements: requirementsLines,
      requiredRequirements: requirementsLines, // For now, all are considered required
      optionalRequirements: 0
    };

    // Ensure timestamps are properly mapped
    const jobDetails = {
      ...jobData,
      createdAt: jobData.created_at || jobData.createdAt,
      updatedAt: jobData.updated_at || jobData.updatedAt,
      statistics: {
        totalApplications,
        totalBookmarks,
        viewCount,
        applyCount,
        bookmarkCount,
        conversionRate: `${conversionRate}%`,
        bookmarkRate: `${bookmarkRate}%`,
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {})
      },
      requirementsAnalysis,
      analytics: (jobAnalytics || []).map(analytic => {
        const analyticData = analytic.toJSON();
        return {
          id: analyticData.id,
          eventType: analyticData.eventType || analyticData.event_type,
          metadata: analyticData.metadata || analyticData.custom_parameters || {},
          createdAt: analyticData.createdAt || analyticData.created_at,
          userId: analyticData.userId || analyticData.user_id,
          jobId: analyticData.jobId || analyticData.job_id,
          companyId: analyticData.companyId || analyticData.company_id
        };
      }),
      similarJobs: (similarJobs || []).map(similarJob => {
        const jobData = similarJob.toJSON();
        return {
          id: jobData.id,
          title: jobData.title,
          location: jobData.location,
          salary: jobData.salary,
          salaryMin: jobData.salary_min || jobData.salaryMin,
          salaryMax: jobData.salary_max || jobData.salaryMax,
          salaryCurrency: jobData.salary_currency || jobData.salaryCurrency,
          jobType: jobData.job_type || jobData.jobType,
          status: jobData.status,
          createdAt: jobData.created_at || jobData.createdAt,
          validTill: jobData.valid_till || jobData.validTill,
          company: jobData.company || null
        };
      })
    };

    res.json({
      success: true,
      data: jobDetails
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
      error: error.message
    });
  }
});

// Portal-based user categorization routes
router.get('/users/portal/:portal', async (req, res) => {
  try {
    const { portal } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = {};

    // Portal-based filtering logic
    switch (portal) {
      case 'normal':
        // Normal dashboard users (India region or null region)
        whereClause = {
          [Op.or]: [
            { region: 'india' },
            { region: null },
            { region: 'other' }
          ]
        };
        break;
      case 'gulf':
        // Gulf dashboard users (Gulf region only)
        whereClause = { region: 'gulf' };
        break;
      case 'both':
        // Users who can access both portals (this would need additional logic)
        // For now, we'll consider users with specific preferences or all regions
        whereClause = {
          [Op.or]: [
            { willing_to_relocate: true },
            { preferred_locations: { [Op.contains]: ['india', 'gulf'] } }
          ]
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid portal type. Use: normal, gulf, or both'
        });
    }

    // Add filters
    if (userType && userType !== 'all') {
      whereClause.user_type = userType;
    }

    if (status && status !== 'all') {
      whereClause.is_active = status === 'active';
    }

    if (search) {
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count,
        portal: portal
      }
    });
  } catch (error) {
    console.error('Error fetching users by portal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users by portal',
      error: error.message
    });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle both isActive (legacy) and status (new) parameters
    let updateData = {};
    let message = '';

    if (status !== undefined) {
      // New status-based suspension system
      const validStatuses = ['active', 'suspended', 'deleted', 'pending_verification', 'rejected', 'inactive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: active, suspended, deleted, pending_verification, rejected, inactive'
        });
      }

      updateData.account_status = status;

      // Also update is_active based on status
      updateData.is_active = status === 'active';

      // Track the status change in activity logs
      const { trackAdminAction } = require('../middlewares/activityTracker');
      await trackAdminAction(req.user.id, req, 'user_status_change', user.id, `${user.first_name} ${user.last_name}`);

      switch (status) {
        case 'active':
          message = 'User activated successfully';
          break;
        case 'suspended':
          message = 'User suspended successfully';
          break;
        case 'deleted':
          message = 'User deleted successfully';
          break;
        case 'pending_verification':
          message = 'User status set to pending verification';
          break;
        case 'rejected':
          message = 'User status set to rejected';
          break;
        case 'inactive':
          message = 'User status set to inactive due to inactivity';
          break;
        default:
          message = 'User status updated successfully';
      }
    } else if (isActive !== undefined) {
      // Legacy isActive system
      updateData.is_active = isActive;
      updateData.account_status = isActive ? 'active' : 'suspended';
      message = `User ${isActive ? 'activated' : 'deactivated'} successfully`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either isActive or status parameter is required'
      });
    }

    await user.update(updateData);

    res.json({
      success: true,
      message,
      data: {
        user: {
          id: user.id,
          is_active: user.is_active,
          account_status: user.account_status
        }
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.user_type === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Export users
router.get('/users/export', async (req, res) => {
  try {
    const { userType, status, region } = req.query;

    const whereClause = {};

    if (userType && userType !== 'all') {
      whereClause.user_type = userType;
    }

    if (status && status !== 'all') {
      whereClause.is_active = status === 'active';
    }

    if (region && region !== 'all') {
      whereClause.region = region;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    // Convert to CSV
    const csvHeader = 'ID,First Name,Last Name,Email,Phone,User Type,Region,Status,Email Verified,Phone Verified,Last Login,Created At\n';
    const csvRows = users.map(user => {
      return [
        user.id,
        user.first_name || '',
        user.last_name || '',
        user.email || '',
        user.phone || '',
        user.user_type || '',
        user.region || '',
        user.is_active ? 'Active' : 'Inactive',
        user.is_email_verified ? 'Yes' : 'No',
        user.is_phone_verified ? 'Yes' : 'No',
        user.last_login_at ? new Date(user.last_login_at).toISOString() : '',
        new Date(user.created_at).toISOString()
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
});

// Get all companies with filters
router.get('/companies', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      region,
      verification
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add filters
    if (status && status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    if (region && region !== 'all') {
      whereClause.region = region;
    }

    if (verification && verification !== 'all') {
      // Support both old isVerified and new verificationStatus
      if (verification === 'verified' || verification === 'approved') {
        whereClause.verificationStatus = 'verified';
      } else if (verification === 'pending') {
        whereClause.verificationStatus = 'pending';
      } else if (verification === 'rejected') {
        whereClause.verificationStatus = 'unverified';
      } else if (verification === 'unverified') {
        whereClause.verificationStatus = 'unverified';
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { sector: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Add statistics for each company
    const companiesWithStats = await Promise.all(companies.map(async (company) => {
      try {
        // Get total jobs posted by this company
        const [totalJobsResult] = await sequelize.query(
          'SELECT COUNT(*) as count FROM jobs WHERE company_id = :companyId',
          { replacements: { companyId: company.id }, type: sequelize.QueryTypes.SELECT }
        );
        const totalJobsPosted = totalJobsResult?.count || 0;

        // Get total applications for all jobs posted by this company
        const [totalApplicationsResult] = await sequelize.query(
          'SELECT COUNT(*) as count FROM job_applications ja JOIN jobs j ON ja.job_id = j.id WHERE j.company_id = :companyId',
          { replacements: { companyId: company.id }, type: sequelize.QueryTypes.SELECT }
        );
        const totalApplications = totalApplicationsResult?.count || 0;

        return {
          ...company.toJSON(),
          totalJobsPosted: parseInt(totalJobsPosted) || 0,
          totalApplications: parseInt(totalApplications) || 0
        };
      } catch (error) {
        console.error(`Error fetching stats for company ${company.id}:`, error);
        return {
          ...company.toJSON(),
          totalJobsPosted: 0,
          totalApplications: 0
        };
      }
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        companies: companiesWithStats,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
});

// Get companies by region
router.get('/companies/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      verification
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { region };

    // Add filters
    if (status && status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    if (verification && verification !== 'all') {
      // Support both old isVerified and new verificationStatus
      if (verification === 'verified' || verification === 'approved') {
        whereClause.verificationStatus = 'verified';
      } else if (verification === 'pending') {
        whereClause.verificationStatus = 'pending';
      } else if (verification === 'rejected') {
        whereClause.verificationStatus = 'unverified';
      } else if (verification === 'unverified') {
        whereClause.verificationStatus = 'unverified';
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { sector: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        companies,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching companies by region:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
});

// Update company status
router.patch('/companies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await company.update({ isActive });

    res.json({
      success: true,
      message: `Company ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { company: { id: company.id, isActive: company.isActive } }
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company status',
      error: error.message
    });
  }
});

// Update company verification
router.patch('/companies/:id/verification', async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await company.update({ verificationStatus });

    res.json({
      success: true,
      message: `Company ${verificationStatus === 'verified' ? 'verified' : 'unverified'} successfully`,
      data: { company: { id: company.id, verificationStatus: company.verificationStatus } }
    });
  } catch (error) {
    console.error('Error updating company verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company verification',
      error: error.message
    });
  }
});

// Delete company
router.delete('/companies/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, { transaction });
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get all company users to get their IDs for related data cleanup
    const companyUsers = await User.findAll({
      where: { company_id: id },
      transaction
    });
    const userIds = companyUsers.map(u => u.id);

    // Delete all related data using raw SQL queries to avoid ORM mapping issues

    // 1. Delete job applications first (they reference jobs and users)
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM job_applications WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 2. Delete job bookmarks
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM job_bookmarks WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 3. Delete jobs (both by companyId and employerId)
    await sequelize.query(
      'DELETE FROM jobs WHERE company_id = :companyId OR employer_id = ANY(:userIds)',
      {
        replacements: { companyId: id, userIds: userIds },
        transaction
      }
    );

    // 4. Delete company follows
    await sequelize.query(
      'DELETE FROM company_follows WHERE company_id = :companyId',
      {
        replacements: { companyId: id },
        transaction
      }
    );

    // 5. Delete company photos
    await sequelize.query(
      'DELETE FROM company_photos WHERE company_id = :companyId',
      {
        replacements: { companyId: id },
        transaction
      }
    );

    // 6. Delete company reviews
    await sequelize.query(
      'DELETE FROM company_reviews WHERE company_id = :companyId',
      {
        replacements: { companyId: id },
        transaction
      }
    );

    // 7. Delete user sessions
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM user_sessions WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 8. Delete user activity logs
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM user_activity_logs WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 9. Delete resumes
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM resumes WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 10. Delete work experiences
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM work_experiences WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 11. Delete educations
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM educations WHERE user_id = ANY(:userIds)',
        {
          replacements: { userIds: userIds },
          transaction
        }
      );
    }

    // 12. Delete notifications
    if (userIds.length > 0) {
      await sequelize.query(
        'DELETE FROM notifications WHERE user_id = ANY(:userIds) OR company_id = :companyId',
        {
          replacements: { userIds: userIds, companyId: id },
          transaction
        }
      );
    }

    // 13. Delete company users (after all related data is deleted)
    await sequelize.query(
      'DELETE FROM users WHERE "company_id" = :companyId',
      {
        replacements: { companyId: id },
        transaction
      }
    );

    // 14. Finally delete the company
    await sequelize.query(
      'DELETE FROM companies WHERE id = :companyId',
      {
        replacements: { companyId: id },
        transaction
      }
    );

    await transaction.commit();

    res.json({
      success: true,
      message: 'Company and all related data deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    });
  }
});

// Export companies
router.get('/companies/export', async (req, res) => {
  try {
    const { status, region, verification } = req.query;

    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    if (region && region !== 'all') {
      whereClause.region = region;
    }

    if (verification && verification !== 'all') {
      // Support both old isVerified and new verificationStatus
      if (verification === 'verified' || verification === 'approved') {
        whereClause.verificationStatus = 'verified';
      } else if (verification === 'pending') {
        whereClause.verificationStatus = 'pending';
      } else if (verification === 'rejected') {
        whereClause.verificationStatus = 'unverified';
      } else if (verification === 'unverified') {
        whereClause.verificationStatus = 'unverified';
      }
    }

    const companies = await Company.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    // Convert to CSV
    const csvHeader = 'ID,Name,Email,Phone,Industry,Sector,Region,Status,Verified,Website,Address,City,State,Country,Total Jobs,Total Applications,Rating,Created At\n';
    const csvRows = companies.map(company => {
      return [
        company.id,
        company.name || '',
        company.email || '',
        company.phone || '',
        (company.industries && company.industries.length > 0 ? company.industries[0] : '') || '',
        company.sector || '',
        company.region || '',
        company.isActive ? 'Active' : 'Inactive',
        company.verificationStatus === 'verified' ? 'Yes' : 'No',
        company.website || '',
        company.address || '',
        company.city || '',
        company.state || '',
        company.country || '',
        company.totalJobsPosted || 0,
        company.totalApplications || 0,
        company.rating || 0,
        new Date(company.created_at).toISOString()
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=companies-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export companies',
      error: error.message
    });
  }
});

// Get all jobs with filters
router.get('/jobs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      region,
      jobType
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add filters
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (region && region !== 'all') {
      whereClause.region = region;
    }

    if (jobType && jobType !== 'all') {
      whereClause.jobType = jobType;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'location', 'status', 'jobType', 'region', 'salary', 'experienceLevel', 'created_at', 'validTill'],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        jobs,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// Get jobs by region
router.get('/jobs/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      jobType
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { region };

    // Add filters
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (jobType && jobType !== 'all') {
      whereClause.jobType = jobType;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'location', 'status', 'jobType', 'region', 'salary', 'experienceLevel', 'created_at', 'validTill'],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        jobs,
        totalPages,
        currentPage: parseInt(page),
        totalCount: count
      }
    });
  } catch (error) {
    console.error('Error fetching jobs by region:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

// Update job status
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await job.update({ status });

    res.json({
      success: true,
      message: `Job ${status} successfully`,
      data: { job: { id: job.id, status: job.status } }
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
  }
});

// Delete job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await job.destroy();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

// Export jobs
router.get('/jobs/export', async (req, res) => {
  try {
    const { status, region, jobType } = req.query;

    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (region && region !== 'all') {
      whereClause.region = region;
    }

    if (jobType && jobType !== 'all') {
      whereClause.jobType = jobType;
    }

    const jobs = await Job.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['name']
        }
      ]
    });

    // Convert to CSV
    const csvHeader = 'ID,Title,Company,Location,Region,Job Type,Status,Experience Level,Salary Min,Salary Max,Currency,Description,Created At\n';
    const csvRows = jobs.map(job => {
      return [
        job.id,
        job.title || '',
        job.company?.name || '',
        job.location || '',
        job.region || '',
        job.jobType || '',
        job.status || '',
        job.experienceLevel || '',
        job.salaryMin || 0,
        job.salaryMax || 0,
        job.salaryCurrency || '',
        (job.description || '').replace(/"/g, '""'),
        new Date(job.created_at).toISOString()
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=jobs-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export jobs',
      error: error.message
    });
  }
});

// ========== SYSTEM SETTINGS MANAGEMENT (Super Admin Only) ==========

/**
 * Get all system settings
 * @route GET /api/admin/settings
 * @access Super Admin
 */
router.get('/settings', async (req, res) => {
  try {
    // Verify super-admin access
    if (req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const settings = await SystemSetting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message
    });
  }
});

/**
 * Get a specific system setting by key
 * @route GET /api/admin/settings/:key
 * @access Super Admin
 */
router.get('/settings/:key', async (req, res) => {
  try {
    // Verify super-admin access
    if (req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { key } = req.params;
    const setting = await SystemSetting.findOne({ where: { key } });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error fetching system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system setting',
      error: error.message
    });
  }
});

/**
 * Create or update a system setting
 * @route PUT /api/admin/settings/:key
 * @access Super Admin
 */
router.put('/settings/:key', async (req, res) => {
  try {
    // Verify super-admin access
    if (req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { key } = req.params;
    const { value, description, category } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    // Get existing setting to determine type
    const existing = await SystemSetting.findOne({ where: { key } });
    const type = existing ? existing.type : 'string';

    // Validate value based on type
    if (type === 'number' && isNaN(parseFloat(value))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number value'
      });
    }

    const [setting, created] = await SystemSetting.upsert({
      key,
      value: String(value),
      type,
      description: description || existing?.description || null,
      category: category || existing?.category || null,
      updatedBy: req.user.id
    }, {
      returning: true
    });

    // Clear cache when settings are updated
    const { clearSettingsCache } = require('../utils/jobExpiryHelper');
    clearSettingsCache();

    res.json({
      success: true,
      message: created ? 'Setting created successfully' : 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system setting',
      error: error.message
    });
  }
});

module.exports = router;