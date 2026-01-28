const express = require('express');
const jwt = require('jsonwebtoken');
const { Op, fn, col, literal } = require('sequelize');
const EmployerQuota = require('../models/EmployerQuota');
const UserActivityLog = require('../models/UserActivityLog');
const User = require('../models/User');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Company = require('../models/Company');

const router = express.Router();

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
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

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
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Helper function to generate human-readable activity descriptions
function getActivityDescription(activityType, details, logData) {
  const user = logData.user;
  const job = logData.job;
  const applicant = logData.applicant;
  
  const userName = user ? user.name : 'Unknown User';
  const jobTitle = job ? job.title : (details.jobTitle || 'Unknown Job');
  
  // Get company name from job, details, or user's company
  let companyName = 'Unknown Company';
  if (job && job.companyName) {
    companyName = job.companyName;
  } else if (details.companyName) {
    companyName = details.companyName;
  } else if (user && user.companyId) {
    // This will be resolved in the data mapping section
    companyName = 'Company'; // Placeholder, will be replaced
  }
  
  const applicantName = applicant ? applicant.name : (details.candidateName || 'Unknown Applicant');
  
  switch (activityType) {
    case 'job_created':
      return `${userName} created a new job: "${jobTitle}" at ${companyName}`;
    case 'job_post':
      return `${userName} posted a new job: "${jobTitle}" at ${companyName}`;
    case 'job_updated':
      return `${userName} updated job: "${jobTitle}" at ${companyName}`;
    case 'job_published':
      return `${userName} published job: "${jobTitle}" at ${companyName}`;
    case 'job_closed':
      return `${userName} closed job: "${jobTitle}" at ${companyName}`;
    case 'application_received':
      return `${applicantName} applied for "${jobTitle}" at ${companyName}`;
    case 'application_reviewed':
      return `${userName} reviewed application from ${applicantName} for "${jobTitle}"`;
    case 'application_shortlisted':
      return `${userName} shortlisted ${applicantName} for "${jobTitle}" at ${companyName}`;
    case 'application_rejected':
      return `${userName} rejected ${applicantName} for "${jobTitle}" at ${companyName}`;
    case 'candidate_shortlisted':
      return `${userName} shortlisted ${applicantName}${details.requirementTitle ? ` for requirement: "${details.requirementTitle}"` : ''} at ${companyName}`;
    case 'interview_scheduled':
      return `${userName} scheduled ${details.interviewType || 'interview'} with ${applicantName} for "${jobTitle}" at ${companyName}`;
    case 'interview_completed':
      return `${userName} completed interview with ${applicantName} for "${jobTitle}"`;
    case 'candidate_search':
      return `${userName} searched for candidates${details.keywords ? ` using keywords: "${details.keywords}"` : ''}`;
    case 'profile_viewed':
      return `${userName} viewed profile of ${applicantName}`;
    case 'resume_downloaded':
      return `${userName} downloaded resume of ${applicantName}`;
    case 'resume_view':
      return `${userName} viewed resume of ${applicantName}`;
    case 'hot_vacancy_created':
      return `${userName} created hot vacancy: "${jobTitle}" at ${companyName}`;
    case 'hot_vacancy_activated':
      return `${userName} activated hot vacancy: "${jobTitle}" at ${companyName}`;
    case 'requirement_created':
    case 'requirement_posted':
      return `${userName} created new requirement${details.title ? `: "${details.title}"` : ''} at ${companyName}`;
    case 'requirement_shortlist':
      return `${userName} shortlisted ${applicantName} from requirements`;
    case 'login':
      return `${userName} logged in`;
    case 'logout':
      return `${userName} logged out`;
    case 'password_changed':
      return `${userName} changed their password`;
    case 'profile_updated':
      return `${userName} updated their profile`;
    case 'company_updated':
      return `${userName} updated company information for ${companyName}`;
    case 'application_status_changed':
      return `${userName} changed application status from "${details.oldStatus}" to "${details.newStatus}" for ${applicantName}`;
    default:
      return `${userName} performed ${activityType.replace(/_/g, ' ')}${job ? ` on "${jobTitle}"` : ''}${applicant ? ` involving ${applicantName}` : ''}`;
  }
}

// GET /api/usage/summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Usage summary endpoint called by:', {
      userId: req.user.id,
      userEmail: req.user.email,
      userType: req.user.user_type,
      companyId: req.user.company_id
    });
    
    // ✅ Use the authenticated user's company instead of query parameter
    const userCompanyId = req.user.company_id;
    if (!userCompanyId) return res.status(400).json({ success: false, message: 'User is not associated with any company' });

    const recruiters = await User.findAll({
      where: { user_type: { [Op.in]: ['employer', 'admin'] }, company_id: userCompanyId },
      attributes: ['id', 'first_name', 'last_name', 'email']
    });

    const recruiterIds = recruiters.map(r => r.id);
    const quotas = await EmployerQuota.findAll({ where: { userId: { [Op.in]: recruiterIds } } });

    // Initialize default quotas for users who don't have any
    const EmployerQuotaService = require('../services/employerQuotaService');
    const defaultQuotas = [
      { type: 'job_postings', limit: 50 },
      { type: 'resume_views', limit: 100 },
      { type: 'requirements_posted', limit: 30 },
      { type: 'profile_visits', limit: 500 },
      { type: 'resume_search', limit: 200 }
    ];

    for (const recruiterId of recruiterIds) {
      const userQuotas = quotas.filter(q => q.userId === recruiterId);
      if (userQuotas.length === 0) {
        // Create default quotas for this user
        for (const defaultQuota of defaultQuotas) {
          try {
            await EmployerQuotaService.getOrCreateQuota(recruiterId, defaultQuota.type, defaultQuota.limit);
          } catch (error) {
            console.error(`Failed to create quota for user ${recruiterId}:`, error);
          }
        }
      }
    }

    // Fetch quotas again after creating defaults
    const allQuotas = await EmployerQuota.findAll({ where: { userId: { [Op.in]: recruiterIds } } });

    const userIdToQuotas = new Map();
    allQuotas.forEach(q => {
      const arr = userIdToQuotas.get(q.userId) || [];
      arr.push({ quotaType: q.quotaType, used: q.used, limit: q.limit, resetAt: q.resetAt });
      userIdToQuotas.set(q.userId, arr);
    });

    const data = recruiters.map(r => ({
      userId: r.id,
      name: `${r.first_name} ${r.last_name}`,
      email: r.email,
      quotas: userIdToQuotas.get(r.id) || []
    }));

    console.log('📊 Usage summary data being returned:', JSON.stringify(data, null, 2));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Usage summary error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/usage/activities
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const { userId, activityType, from, to, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (activityType) where.activityType = activityType;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp[Op.gte] = new Date(from);
      if (to) where.timestamp[Op.lte] = new Date(to);
    }

    // ✅ Always filter by the authenticated user's company
    const userCompanyId = req.user.company_id;
    console.log('🔍 Debug - Authenticated user:', {
      userId: req.user.id,
      userEmail: req.user.email,
      userType: req.user.user_type,
      companyId: userCompanyId,
      companyIdRaw: req.user.companyId,
      company_idRaw: req.user.company_id
    });
    
    if (userCompanyId) {
      const recruiters = await User.findAll({ 
        where: { 
          user_type: { [Op.in]: ['employer', 'admin'] }, 
          company_id: userCompanyId 
        }, 
        attributes: ['id'] 
      });
      const recruiterIds = recruiters.map(r => r.id);
      if (!recruiterIds || recruiterIds.length === 0) {
        return res.json({ success: true, data: [] });
      }
      // Respect userId filter if provided: intersect with company users
      if (userId) {
        if (!recruiterIds.includes(userId)) {
          // requested user not in this company; return empty
          return res.json({ success: true, data: [] });
        }
        where.userId = userId;
      } else {
        where.userId = { [Op.in]: recruiterIds };
      }
    } else {
      console.log('🔍 Debug - User has no company, showing only their own activities');
      // If user has no company, only show their own activities
      where.userId = req.user.id;
    }

    console.log('🔍 Activities query where clause:', JSON.stringify(where, null, 2));
    
    const logs = await UserActivityLog.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: Math.min(Number(limit) || 50, 200),
      offset: Number(offset) || 0
    });
    
    console.log(`📊 Found ${logs.length} activity logs`);
    
    // Debug: Check total activity logs in database
    const totalLogs = await UserActivityLog.count();
    console.log(`🔍 Debug - Total activity logs in database: ${totalLogs}`);
    
    if (logs.length === 0 && totalLogs > 0) {
      console.log('🔍 Debug - No logs found for this company, but there are logs in database. Checking sample...');
      const sampleLogs = await UserActivityLog.findAll({ 
        limit: 3, 
        order: [['timestamp', 'DESC']],
        attributes: ['id', 'userId', 'activityType', 'timestamp']
      });
      console.log('🔍 Debug - Sample logs:', sampleLogs.map(l => l.toJSON()));
    }

    // Hydrate applicant info for logs that reference an applicationId
    const applicationIds = logs.filter(l => !!l.applicationId).map(l => l.applicationId);
    let applicationIdToUserId = new Map();
    let userIdToUser = new Map();
    let jobIdToJob = new Map();
    let companyIdToCompany = new Map();

    // Hydrate users for userId on the log
    const actorUserIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)));
    if (actorUserIds.length > 0) {
      const users = await User.findAll({ 
        where: { id: { [Op.in]: actorUserIds } }, 
        attributes: ['id', 'first_name', 'last_name', 'email', 'user_type', 'company_id'] 
      });
      users.forEach(u => userIdToUser.set(u.id, u));
    }

    // Hydrate jobs referenced by jobId on the log
    const jobIds = Array.from(new Set(logs.map(l => l.jobId).filter(Boolean)));
    if (jobIds.length > 0) {
      const jobs = await Job.findAll({ 
        where: { id: { [Op.in]: jobIds } }, 
        attributes: ['id', 'title', 'companyId', 'location', 'status'] 
      });
      jobs.forEach(j => jobIdToJob.set(j.id, j));
    }

    // Hydrate companies referenced by jobs and users
    const jobCompanyIds = Array.from(new Set(Array.from(jobIdToJob.values()).map(j => j.companyId).filter(Boolean)));
    const userCompanyIds = Array.from(new Set(Array.from(userIdToUser.values()).map(u => u.company_id).filter(Boolean)));
    const allCompanyIds = Array.from(new Set([...jobCompanyIds, ...userCompanyIds]));
    
    if (allCompanyIds.length > 0) {
      const companies = await Company.findAll({ 
        where: { id: { [Op.in]: allCompanyIds } }, 
        attributes: ['id', 'name', 'industries', 'companySize'] 
      });
      companies.forEach(c => companyIdToCompany.set(c.id, c));
    }

    // Get all candidate IDs from activity log details
    const candidateIds = Array.from(new Set(
      logs
        .map(l => l.details?.candidateId)
        .filter(Boolean)
    ));

    if (applicationIds.length > 0) {
      const applications = await JobApplication.findAll({
        where: { id: { [Op.in]: applicationIds } },
        attributes: ['id', 'userId']
      });
      applicationIdToUserId = new Map(applications.map(a => [a.id, a.userId]));
      const applicantUserIds = Array.from(new Set(applications.map(a => a.userId)));
      if (applicantUserIds.length > 0) {
        const users = await User.findAll({ 
          where: { id: { [Op.in]: applicantUserIds } }, 
          attributes: ['id', 'first_name', 'last_name', 'email'] 
        });
        users.forEach(u => userIdToUser.set(u.id, u));
      }
    }

    // Hydrate candidates directly from candidateId in details
    if (candidateIds.length > 0) {
      const candidateUsers = await User.findAll({ 
        where: { id: { [Op.in]: candidateIds } }, 
        attributes: ['id', 'first_name', 'last_name', 'email'] 
      });
      candidateUsers.forEach(u => userIdToUser.set(u.id, u));
    }

    const data = logs.map(l => {
      const json = l.toJSON();
      
      // Attach actor user with meaningful name
      const actor = userIdToUser.get(json.userId);
      if (actor) {
        const firstName = actor.first_name || '';
        const lastName = actor.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const userCompany = actor.company_id ? companyIdToCompany.get(actor.company_id) : null;
        
        json.user = { 
          id: actor.id, 
          email: actor.email, 
          name: fullName || actor.email, 
          userType: actor.user_type,
          companyId: actor.company_id,
          companyName: userCompany ? userCompany.name : null
        };
      }
      
      // Attach job with company information
      if (json.jobId) {
        const job = jobIdToJob.get(json.jobId);
        if (job) {
          const company = companyIdToCompany.get(job.companyId);
          json.job = { 
            id: job.id, 
            title: job.title, 
            location: job.location,
            status: job.status,
            companyId: job.companyId,
            companyName: company ? company.name : 'Unknown Company',
            companyIndustry: company ? (company.industries && company.industries.length > 0 ? company.industries[0] : 'Other') : null,
            companySize: company ? company.companySize : null
          };
        }
      }
      
      // Attach applicant with meaningful name
      let applicant = undefined;
      
      // First try to get applicant from applicationId
      if (json.applicationId) {
        const applicantUserId = applicationIdToUserId.get(json.applicationId);
        applicant = applicantUserId ? userIdToUser.get(applicantUserId) : undefined;
      }
      
      // If no applicant found via applicationId, try to get from candidateId in details
      if (!applicant && json.details?.candidateId) {
        applicant = userIdToUser.get(json.details.candidateId);
      }
      
      if (applicant) {
        const firstName = applicant.first_name || '';
        const lastName = applicant.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        json.applicant = { 
          id: applicant.id, 
          name: fullName || applicant.email, 
          email: applicant.email 
        };
      }
      
      // Add human-readable activity description
      json.activityDescription = getActivityDescription(json.activityType, json.details, json);
      
      // Update company name in description if we have user company info
      if (json.user?.companyName && json.activityDescription.includes('Company')) {
        json.activityDescription = json.activityDescription.replace('Company', json.user.companyName);
      }
      
      return json;
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Usage activities error:', error && (error.stack || error.message || error));
    return res.status(500).json({ 
      success: false, 
      message: error && (error.message || 'Internal server error'),
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/usage/search-insights
router.get('/search-insights', authenticateToken, async (req, res) => {
  try {
    const { from, to, limit = 20 } = req.query;
    // ✅ Use the authenticated user's company
    const userCompanyId = req.user.company_id;
    if (!userCompanyId) return res.status(400).json({ success: false, message: 'User is not associated with any company' });
    
    const userWhere = { user_type: { [Op.in]: ['employer', 'admin'] }, company_id: userCompanyId };
    const recruiters = await User.findAll({ where: userWhere, attributes: ['id'] });
    const recruiterIds = recruiters.map(r => r.id);

    const where = { userId: { [Op.in]: recruiterIds } };
    where.activityType = { [Op.in]: ['candidate_search', 'SEARCH'] };
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp[Op.gte] = new Date(from);
      if (to) where.timestamp[Op.lte] = new Date(to);
    }

    const logs = await UserActivityLog.findAll({ where, attributes: ['details'], order: [['timestamp', 'DESC']], limit: 1000 });

    const counts = new Map();
    logs.forEach(l => {
      const d = l.details || {};
      const kw = (d.keywords || d.keyword || d.query || '').toString().trim().toLowerCase();
      if (!kw) return;
      counts.set(kw, (counts.get(kw) || 0) + 1);
    });

    const top = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(Number(limit) || 20, 100))
      .map(([keyword, count]) => ({ keyword, count }));

    return res.json({ success: true, data: top });
  } catch (error) {
    console.error('Usage search-insights error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/usage/posting-insights
router.get('/posting-insights', authenticateToken, async (req, res) => {
  try {
    const { from, to } = req.query;
    // ✅ Use the authenticated user's company
    const userCompanyId = req.user.company_id;
    if (!userCompanyId) return res.status(400).json({ success: false, message: 'User is not associated with any company' });
    
    const jobWhere = { companyId: userCompanyId };
    if (from) jobWhere.created_at = { ...(jobWhere.created_at || {}), [Op.gte]: new Date(from) };
    if (to) jobWhere.created_at = { ...(jobWhere.created_at || {}), [Op.lte]: new Date(to) };

    const jobs = await Job.findAll({ where: jobWhere, attributes: ['id', 'employerId', 'title', 'created_at'] });
    const jobIds = jobs.map(j => j.id);

    let applicationCounts = [];
    if (jobIds.length > 0) {
      applicationCounts = await JobApplication.findAll({
        where: { jobId: { [Op.in]: jobIds } },
        attributes: ['jobId', [fn('COUNT', col('id')), 'count']],
        group: ['jobId']
      });
    }

    const jobIdToAppCount = new Map();
    applicationCounts.forEach(row => { jobIdToAppCount.set(row.jobId, parseInt(row.dataValues.count, 10) || 0); });

    // Get recruiter details
    const recruiterIds = [...new Set(jobs.map(j => j.employerId))];
    const recruiters = await User.findAll({ 
      where: { id: { [Op.in]: recruiterIds } }, 
      attributes: ['id', 'email', 'first_name', 'last_name'] 
    });
    const recruiterMap = new Map(recruiters.map(r => [r.id, r]));

    const perRecruiter = new Map();
    jobs.forEach(j => {
      const apps = jobIdToAppCount.get(j.id) || 0;
      const recruiter = recruiterMap.get(j.employerId);
      const entry = perRecruiter.get(j.employerId) || { 
        recruiterId: j.employerId, 
        recruiterEmail: recruiter?.email || j.employerId,
        totalJobs: 0, 
        totalApplications: 0 
      };
      entry.totalJobs += 1;
      entry.totalApplications += apps;
      perRecruiter.set(j.employerId, entry);
    });

    return res.json({ success: true, data: Array.from(perRecruiter.values()) });
  } catch (error) {
    console.error('Usage posting-insights error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/usage/recruiter-performance
router.get('/recruiter-performance', authenticateToken, async (req, res) => {
  try {
    const { from, to, limit = 10 } = req.query;
    // ✅ Use the authenticated user's company
    const userCompanyId = req.user.company_id;
    if (!userCompanyId) return res.status(400).json({ success: false, message: 'User is not associated with any company' });
    
    const userWhere = { user_type: { [Op.in]: ['employer', 'admin'] }, company_id: userCompanyId };
    const recruiters = await User.findAll({ where: userWhere, attributes: ['id', 'first_name', 'last_name', 'email'] });
    const recruiterIds = recruiters.map(r => r.id);

    const where = { userId: { [Op.in]: recruiterIds } };
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp[Op.gte] = new Date(from);
      if (to) where.timestamp[Op.lte] = new Date(to);
    }

    const rows = await UserActivityLog.findAll({
      where,
      attributes: ['userId', [fn('COUNT', col('id')), 'count']],
      group: ['userId'],
      order: [[literal('count'), 'DESC']]
    });

    const countByUser = new Map(rows.map(r => [r.userId, parseInt(r.dataValues.count, 10) || 0]));
    const ranked = recruiters
      .map(r => ({ userId: r.id, name: `${r.first_name} ${r.last_name}`, email: r.email, activityCount: countByUser.get(r.id) || 0 }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, Math.min(Number(limit) || 10, 100));

    return res.json({ success: true, data: ranked });
  } catch (error) {
    console.error('Usage recruiter-performance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/usage/quotas?userId=...
router.get('/quotas', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    const quotas = await EmployerQuota.findAll({ where: { userId } });
    return res.json({ success: true, data: quotas });
  } catch (error) {
    console.error('Usage quotas get error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/usage/quotas { userId, quotaType, limit, resetUsed? }
router.put('/quotas', async (req, res) => {
  try {
    const { userId, quotaType, limit, resetUsed } = req.body || {};
    if (!userId || !quotaType || typeof limit !== 'number') {
      return res.status(400).json({ success: false, message: 'userId, quotaType and numeric limit are required' });
    }
    const [quota, created] = await EmployerQuota.findOrCreate({
      where: { userId, quotaType },
      defaults: { userId, quotaType, used: 0, limit }
    });
    quota.limit = limit;
    if (resetUsed === true) quota.used = 0;
    await quota.save();
    return res.json({ success: true, data: quota, created });
  } catch (error) {
    console.error('Usage quotas update error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Debug endpoint to check activity logs
router.get('/debug-activities', authenticateToken, async (req, res) => {
  try {
    const count = await UserActivityLog.count();
    const sample = await UserActivityLog.findAll({ limit: 5, order: [['timestamp', 'DESC']] });
    
    // Get company users to see what we're working with
    const companyUsers = await User.findAll({ 
      where: { user_type: { [Op.in]: ['employer', 'admin'] } },
      attributes: ['id', 'email', 'user_type', 'company_id'],
      limit: 10
    });
    
    return res.json({ 
      success: true, 
      data: { 
        totalActivityCount: count, 
        sampleActivities: sample.map(s => s.toJSON()),
        companyUsers: companyUsers.map(u => u.toJSON())
      } 
    });
  } catch (error) {
    console.error('Debug activities error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create sample activity logs for testing
router.post('/test-activity', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Creating test activity log for user:', req.user.id);
    
    const testLog = await UserActivityLog.create({
      userId: req.user.id,
      activityType: 'test_activity',
      details: { message: 'This is a test activity log' },
      timestamp: new Date()
    });
    
    console.log('✅ Test activity log created:', testLog.id);
    
    return res.json({ 
      success: true, 
      message: 'Test activity log created successfully',
      data: testLog 
    });
  } catch (error) {
    console.error('❌ Test activity creation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create test activity log',
      error: error.message 
    });
  }
});

// Create sample activity logs for testing
router.post('/create-sample-activities', async (req, res) => {
  try {
    const EmployerActivityService = require('../services/employerActivityService');
    const EmployerQuotaService = require('../services/employerQuotaService');
    
    // Get a company user to create activities for
    const companyUser = await User.findOne({ 
      where: { user_type: { [Op.in]: ['employer', 'admin'] } },
      attributes: ['id', 'email']
    });
    
    if (!companyUser) {
      return res.status(400).json({ success: false, message: 'No company users found' });
    }
    
    // Create some sample activities with quota consumption
    await EmployerActivityService.logLogin(companyUser.id, { source: 'test' });
    
    // Consume some quotas to show usage
    try {
      await EmployerQuotaService.consume(companyUser.id, EmployerQuotaService.QUOTA_TYPES.JOB_POSTINGS, 1, {
        activityType: 'job_post',
        details: { title: 'Test Job Posting' }
      });
    } catch (e) {
      console.log('Quota consumption test:', e.message);
    }
    
    try {
      await EmployerQuotaService.consume(companyUser.id, EmployerQuotaService.QUOTA_TYPES.RESUME_SEARCH, 5, {
        activityType: 'candidate_search',
        details: { keywords: 'developer, javascript' }
      });
    } catch (e) {
      console.log('Resume search quota test:', e.message);
    }
    
    return res.json({ 
      success: true, 
      message: `Created sample activities and consumed quotas for user ${companyUser.email}` 
    });
  } catch (error) {
    console.error('Create sample activities error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


