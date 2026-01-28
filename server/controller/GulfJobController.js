const { Op } = require('sequelize');
const Job = require('../models/Job');
const Company = require('../models/Company');
const JobApplication = require('../models/JobApplication');
const JobBookmark = require('../models/JobBookmark');
const JobAlert = require('../models/JobAlert');
const User = require('../models/User');
const Resume = require('../models/Resume');
const CoverLetter = require('../models/CoverLetter');
const CandidateLike = require('../models/CandidateLike');

// Gulf region countries and cities
const GULF_LOCATIONS = [
  'dubai', 'uae', 'united arab emirates', 'abu dhabi', 'sharjah', 'ajman',
  'doha', 'qatar', 'riyadh', 'saudi arabia', 'jeddah', 'mecca', 'medina',
  'kuwait', 'kuwait city', 'bahrain', 'manama', 'oman', 'muscat',
  'gulf', 'middle east', 'gcc', 'gulf cooperation council'
];

// Helper function to check if location is in Gulf region
const isGulfLocation = (location) => {
  if (!location) return false;
  const locationLower = location.toLowerCase();
  return GULF_LOCATIONS.some(gulfLocation => locationLower.includes(gulfLocation));
};

// Get all Gulf jobs with filtering
const getGulfJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      jobType,
      experienceLevel,
      salaryMin,
      salaryMax,
      companyId,
      experienceRange,
      industry,
      department,
      role,
      skills,
      companyType,
      workMode,
      education,
      companyName,
      recruiterType,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'active' };
    const And = Op.and; const Or = Op.or; const OpLike = Op.iLike; const OpIn = Op.in; const OpGte = Op.gte; const OpLte = Op.lte;
    const andGroups = [];
    andGroups.push({ [Or]: [ { region: 'gulf' }, { location: { [OpLike]: { [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`) } } } ] });

    // Add search filter
    if (search) {
      andGroups.push({ [Or]: [
        { title: { [OpLike]: `%${search}%` } },
        { description: { [OpLike]: `%${search}%` } },
        { requirements: { [OpLike]: `%${search}%` } }
      ]});
    }

    // Add location filter
    if (location) {
      andGroups.push({ [Or]: [
        { location: { [OpLike]: `%${location}%` } },
        { city: { [OpLike]: `%${location}%` } },
        { state: { [OpLike]: `%${location}%` } },
        { country: { [OpLike]: `%${location}%` } }
      ]});
    }

    // Add job type filter
    if (jobType) {
      const types = String(jobType).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
      if (types.length === 1) whereClause.jobType = types[0];
      if (types.length > 1) whereClause.jobType = { [OpIn]: types };
    }

    // Add experience level filter
    if (experienceLevel) whereClause.experienceLevel = experienceLevel;
    if (experienceRange) {
      const ranges = String(experienceRange).split(',').map(s=>s.trim()).filter(Boolean).map(r=>{
        const [minStr,maxStr] = r.replace('+','-100').split('-');
        const min = parseInt(minStr,10); const max = parseInt(maxStr,10);
        if (!isNaN(min) && !isNaN(max)) return { [And]: [{ experienceMin: { [OpGte]: min } }, { experienceMax: { [OpLte]: max } }] };
        if (!isNaN(min) && isNaN(max)) return { experienceMin: { [OpGte]: min } };
        return null;
      }).filter(Boolean);
      if (ranges.length) andGroups.push({ [Or]: ranges });
    }

    // Add salary filters
    if (salaryMin) whereClause.salaryMin = { [OpGte]: parseFloat(salaryMin) };
    if (salaryMax) whereClause.salaryMax = { [OpLte]: parseFloat(salaryMax) };

    // Add company filter
    if (companyId) whereClause.companyId = companyId;
    if (department) whereClause.department = { [OpLike]: `%${department}%` };
    if (role) whereClause.title = { [OpLike]: `%${role}%` };
    if (skills) {
      const skillTerms = String(skills).split(',').map(s=>s.trim()).filter(Boolean)
      if (skillTerms.length) {
        const jsonbLowerContains = skillTerms.map(term =>
          Job.sequelize.where(
            Job.sequelize.fn('LOWER', Job.sequelize.cast(Job.sequelize.col('skills'), 'text')),
            { [Op.like]: `%${term.toLowerCase()}%` }
          )
        );
        andGroups.push({ [Or]: [ { skills: { [Op.contains]: skillTerms } }, ...jsonbLowerContains, { requirements: { [OpLike]: `%${skills}%` } }, { description: { [OpLike]: `%${skills}%` } }, { title: { [OpLike]: `%${skills}%` } } ] });
      }
    }
    if (workMode) {
      const normalized = String(workMode).toLowerCase().includes('home') ? 'remote' : String(workMode).toLowerCase();
      andGroups.push({ [Or]: [ { remoteWork: normalized }, { workMode: { [OpLike]: `%${normalized}%` } }, ...(normalized==='remote'?[{ workMode: { [OpLike]: `%work from home%` } }]:[]) ] });
    }
    if (education) whereClause.education = { [OpLike]: `%${education}%` };

    const include = [
      { model: Company, as: 'company', attributes: ['id','name','logo','industries','region','companyType'], required: Boolean(companyType||companyName)||false,
        where: (()=>{ const w = {}; const OpLike = Op.iLike; if (companyType) w.companyType = String(companyType).toLowerCase(); if (companyName) w.name = { [OpLike]: `%${String(companyName).toLowerCase()}%` }; return w; })() },
      { model: User, as: 'employer', attributes: ['id','first_name','last_name','email','companyId'], required: Boolean(recruiterType)||false }
    ];
    if (recruiterType === 'company') include[1] = { ...include[1], where: { companyId: { [Op.ne]: null } }, required: true };
    else if (recruiterType === 'consultant') include[1] = { ...include[1], where: { companyId: null }, required: true };

    const finalWhere = andGroups.length ? { [And]: [ whereClause, ...andGroups ] } : whereClause;
    const { count, rows: jobs } = await Job.findAndCountAll({ where: finalWhere, include, order: [[sortBy, String(sortOrder||'DESC').toUpperCase()]], limit: parseInt(limit), offset: parseInt(offset) });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf jobs',
      error: error.message
    });
  }
};

// Get Gulf job by ID
const getGulfJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      where: {
        id,
        [Op.or]: [
          { region: 'gulf' },
          { 
            location: {
              [Op.iLike]: {
                [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
              }
            }
          }
        ]
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'description', 'industries', 'region', 'website']
        },
        {
          model: User,
          as: 'employer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Gulf job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching Gulf job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf job',
      error: error.message
    });
  }
};

// Get similar Gulf jobs
const getSimilarGulfJobs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const currentJob = await Job.findByPk(id);
    if (!currentJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const similarJobs = await Job.findAll({
      where: {
        id: { [Op.ne]: id },
        status: 'active',
        [Op.or]: [
          { region: 'gulf' },
          { 
            location: {
              [Op.iLike]: {
                [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
              }
            }
          }
        ],
        [Op.or]: [
          { jobType: currentJob.jobType },
          { experienceLevel: currentJob.experienceLevel },
          { companyId: currentJob.companyId }
        ]
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'industries']
        }
      ],
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: similarJobs
    });
  } catch (error) {
    console.error('Error fetching similar Gulf jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch similar Gulf jobs',
      error: error.message
    });
  }
};

// Get Gulf companies
const getGulfCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      industry,
      companySize,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      region: 'gulf'
    };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        // Industry search removed - would need to search in industries array
      ];
    }

    // Add industry filter
    if (industry) {
      // Note: Industry filtering would need to be updated to work with industries array
      // For now, we'll skip industry filtering in Gulf jobs
    }

    // Add company size filter
    if (companySize) {
      whereClause.companySize = companySize;
    }

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: 'jobs',
          where: { status: 'active' },
          required: false,
          attributes: ['id', 'title', 'location', 'jobType', 'experienceLevel']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf companies',
      error: error.message
    });
  }
};

// Get Gulf job applications for a user
const getGulfJobApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    console.log('🔍 Fetching Gulf job applications for user:', userId);

    const offset = (page - 1) * limit;
    const whereClause = {
      userId: userId
    };

    if (status) {
      whereClause.status = status;
    }

    console.log('🔍 Query parameters:', { userId, page, limit, status, whereClause });

    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: 'job',
          where: {
            [Op.or]: [
              { region: 'gulf' },
              { 
                location: {
                  [Op.iLike]: {
                    [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
                  }
                }
              }
            ]
          },
          required: true, // Use INNER JOIN to ensure we only get applications with Gulf jobs
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'logo', 'industries'],
              required: false // Use LEFT JOIN for company
            }
          ]
        }
      ],
      order: [['appliedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('🔍 Query results:', { count, applicationsCount: applications.length });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf job applications:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf job applications',
      error: error.message
    });
  }
};

// Get Gulf job applications for employers (applications to their Gulf jobs)
const getGulfEmployerApplications = async (req, res) => {
  try {
    const employerId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    console.log('🔍 Fetching Gulf employer applications for employerId:', employerId);

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers and admins can view job applications.'
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      employerId: employerId
    };

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: 'job',
          where: {
            [Op.or]: [
              { region: 'gulf' },
              { 
                location: {
                  [Op.iLike]: {
                    [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
                  }
                }
              }
            ]
          },
          required: true, // Use INNER JOIN to ensure we only get applications with Gulf jobs
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'logo', 'industries'],
              required: false // Use LEFT JOIN for company
            }
          ]
        },
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'avatar', 'headline', 'current_location', 'skills', 'experience_years'],
          required: false // Use LEFT JOIN for applicant
        },
        {
          model: Resume,
          as: 'jobResume',
          attributes: ['id', 'title', 'summary', 'skills', 'lastUpdated', 'metadata'],
          required: false // Use LEFT JOIN for resume
        },
        {
          model: CoverLetter,
          as: 'jobCoverLetter',
          attributes: ['id', 'title', 'summary', 'lastUpdated', 'metadata'],
          required: false // Use LEFT JOIN for cover letter
        }
      ],
      order: [
        // Sort by premium status first (premium users on top)
        [
          { model: User, as: 'applicant' },
          'verification_level',
          'DESC'
        ],
        // Then by application date (newest first)
        ['appliedAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: applications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf employer applications:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      employerId: req.user?.id,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf employer applications',
      error: error.message
    });
  }
};

// Get Gulf job bookmarks for a user
const getGulfJobBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: bookmarks } = await JobBookmark.findAndCountAll({
      where: { userId },
      attributes: ['id', 'userId', 'jobId', 'created_at', 'updated_at'],
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'location', 'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'experienceLevel', 'created_at'],
          where: {
            [Op.or]: [
              { region: 'gulf' },
              { 
                location: {
                  [Op.iLike]: {
                    [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
                  }
                }
              }
            ]
          },
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'logo', 'industries']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        bookmarks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf job bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf job bookmarks',
      error: error.message
    });
  }
};

// Get Gulf job alerts for a user
const getGulfJobAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, isActive } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { userId };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows: alerts } = await JobAlert.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter alerts to only include Gulf-related ones
    const GULF_LOCATIONS = ['dubai', 'uae', 'qatar', 'saudi', 'kuwait', 'bahrain', 'oman', 'gulf'];
    const gulfAlerts = alerts.filter(alert => {
      const kw = Array.isArray(alert.keywords) ? alert.keywords.join(' ') : (alert.keywords || '');
      const locArr = (alert.locations || alert.location);
      const loc = Array.isArray(locArr) ? locArr.join(' ') : (locArr || '');
      const keywords = String(kw).toLowerCase();
      const location = String(loc).toLowerCase();
      return GULF_LOCATIONS.some(gulfLocation =>
        keywords.includes(gulfLocation) || location.includes(gulfLocation)
      );
    });

    res.json({
      success: true,
      data: {
        alerts: gulfAlerts,
        pagination: {
          total: gulfAlerts.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(gulfAlerts.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf job alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf job alerts',
      error: error.message
    });
  }
};

// Get Gulf dashboard stats
const getGulfDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Gulf job applications count
    const gulfApplications = await JobApplication.count({
      include: [
        {
          model: Job,
          as: 'job',
          where: {
            [Op.or]: [
              { region: 'gulf' },
              { 
                location: {
                  [Op.iLike]: {
                    [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
                  }
                }
              }
            ]
          }
        }
      ],
      where: { userId: userId }
    });

    // Get Gulf job bookmarks count
    const gulfBookmarks = await JobBookmark.count({
      include: [
        {
          model: Job,
          as: 'job',
          where: {
            [Op.or]: [
              { region: 'gulf' },
              { 
                location: {
                  [Op.iLike]: {
                    [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
                  }
                }
              }
            ]
          }
        }
      ],
      where: { userId }
    });

    // Get Gulf job alerts count
    const gulfAlerts = await JobAlert.count({
      where: { 
        userId,
        isActive: true
      }
    });

    // Get total Gulf jobs count
    const totalGulfJobs = await Job.count({
      where: {
        status: 'active',
        [Op.or]: [
          { region: 'gulf' },
          { 
            location: {
              [Op.iLike]: {
                [Op.any]: GULF_LOCATIONS.map(loc => `%${loc}%`)
              }
            }
          }
        ]
      }
    });

    // Get profile upvotes (likes) for this jobseeker
    let profileLikes = 0;
    try {
      profileLikes = await CandidateLike.count({ where: { candidateId: userId } });
    } catch (e) {
      console.warn('Unable to count CandidateLike for user', userId, e?.message || e);
      profileLikes = 0;
    }

    res.json({
      success: true,
      data: {
        gulfApplications,
        gulfBookmarks,
        gulfAlerts,
        totalGulfJobs,
        profileLikes,
        stats: {
          totalApplications: gulfApplications,
          totalBookmarks: gulfBookmarks,
          totalAlerts: gulfAlerts,
          totalJobs: totalGulfJobs,
          profileLikes
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Gulf dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Gulf dashboard stats',
      error: error.message
    });
  }
};

module.exports = {
  getGulfJobs,
  getGulfJobById,
  getSimilarGulfJobs,
  getGulfCompanies,
  getGulfJobApplications,
  getGulfEmployerApplications,
  getGulfJobBookmarks,
  getGulfJobAlerts,
  getGulfDashboardStats
};
