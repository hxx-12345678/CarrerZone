const SearchHistory = require('../models/SearchHistory');
const UserDashboard = require('../models/UserDashboard');
const JobApplication = require('../models/JobApplication');
const JobBookmark = require('../models/JobBookmark');
const JobAlert = require('../models/JobAlert');
const Resume = require('../models/Resume');
const Analytics = require('../models/Analytics');
const CandidateLike = require('../models/CandidateLike');
const { sequelize } = require('../config/sequelize');

class DashboardService {
  /**
   * Get or create user dashboard
   */
  static async getUserDashboard(userId) {
    try {
      let dashboard = await UserDashboard.findOne({
        where: { userId }
      });

      if (!dashboard) {
        dashboard = await UserDashboard.create({
          userId,
          totalApplications: 0,
          totalBookmarks: 0,
          totalSearches: 0,
          totalResumes: 0,
          totalJobAlerts: 0,
          profileViews: 0,
          applicationsUnderReview: 0,
          applicationsShortlisted: 0,
          applicationsRejected: 0,
          applicationsAccepted: 0,
          savedSearches: 0,
          hasDefaultResume: false,
          activeJobAlerts: 0,
          totalLoginCount: 0
        });
      }

      return dashboard;
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      // Create a new dashboard instance if database fails
      return await UserDashboard.create({
        userId,
        totalApplications: 0,
        totalBookmarks: 0,
        totalSearches: 0,
        totalResumes: 0,
        totalJobAlerts: 0,
        profileViews: 0,
        applicationsUnderReview: 0,
        applicationsShortlisted: 0,
        applicationsRejected: 0,
        applicationsAccepted: 0,
        savedSearches: 0,
        hasDefaultResume: false,
        activeJobAlerts: 0,
        totalLoginCount: 0
      });
    }
  }

  /**
   * Update dashboard statistics
   */
  static async updateDashboardStats(userId, updates = {}) {
    // Guard: if userId is missing, skip to avoid null constraint errors
    if (!userId) {
      return null;
    }
    try {
      const dashboard = await this.getUserDashboard(userId);
      
      // Update specific fields
      Object.keys(updates).forEach(key => {
        if (dashboard[key] !== undefined) {
          dashboard[key] = updates[key];
        }
      });

      await dashboard.save();
      return dashboard;
    } catch (error) {
      console.error('Error updating dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Record a new search
   */
  static async recordSearch(searchData) {
    try {
      const { userId, searchQuery, filters, resultsCount, searchType = 'job_search' } = searchData;
      
      // Create search history record
      const searchHistory = await SearchHistory.create({
        userId,
        searchQuery,
        filters,
        resultsCount,
        searchType,
        location: filters.location,
        experienceLevel: filters.experienceLevel,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        remoteWork: filters.remoteWork,
        jobCategory: filters.jobCategory,
        metadata: {
          userAgent: searchData.userAgent,
          ipAddress: searchData.ipAddress,
          timestamp: new Date()
        }
      });

      // Update dashboard search stats
      await this.updateDashboardStats(userId, {
        totalSearches: sequelize.literal('totalSearches + 1'),
        lastSearchDate: new Date()
      });

      return searchHistory;
    } catch (error) {
      console.error('Error recording search:', error);
      throw error;
    }
  }

  /**
   * Get user search history
   */
  static async getSearchHistory(userId, limit = 20) {
    try {
      // Check if the table exists first
      const tableExists = await sequelize.getQueryInterface().showAllTables();
      const searchHistoryTableExists = tableExists.some(table => table === 'search_history');
      
      if (!searchHistoryTableExists) {
        console.log('Search history table does not exist, returning empty array');
        return [];
      }

      const searchHistory = await SearchHistory.findAll({
        where: { userId },
        order: [['created_at', 'DESC']],
        limit
      });

      return searchHistory;
    } catch (error) {
      console.error('Error getting search history:', error);
      // Return empty array instead of throwing error to prevent frontend crashes
      console.log('Returning empty search history due to error');
      return [];
    }
  }

  /**
   * Save a search as favorite
   */
  static async saveSearch(userId, searchId) {
    try {
      const searchHistory = await SearchHistory.findOne({
        where: { id: searchId, userId }
      });

      if (!searchHistory) {
        throw new Error('Search not found');
      }

      searchHistory.isSaved = true;
      await searchHistory.save();

      // Update dashboard saved searches count
      await this.updateDashboardStats(userId, {
        savedSearches: sequelize.literal('savedSearches + 1')
      });

      return searchHistory;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Remove saved search
   */
  static async removeSavedSearch(userId, searchId) {
    try {
      const searchHistory = await SearchHistory.findOne({
        where: { id: searchId, userId }
      });

      if (!searchHistory) {
        throw new Error('Search not found');
      }

      searchHistory.isSaved = false;
      await searchHistory.save();

      // Update dashboard saved searches count
      await this.updateDashboardStats(userId, {
        savedSearches: sequelize.literal('savedSearches - 1')
      });

      return searchHistory;
    } catch (error) {
      console.error('Error removing saved search:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  static async getDashboardData(userId) {
    try {
      const dashboard = await this.getUserDashboard(userId);
      
      // Get recent applications with error handling
      let recentApplications = [];
      try {
        recentApplications = await JobApplication.findAll({
          where: { userId },
          order: [[require('sequelize').col('applied_at'), 'DESC']],
          limit: 5,
          include: [{
            model: require('../models/Job'),
            as: 'job',
            attributes: ['id', 'title', 'location', 'salaryMin', 'salaryMax', 'companyId']
          }]
        });
      } catch (error) {
        console.error('Error fetching recent applications:', error);
        recentApplications = [];
      }

      // Get recent bookmarks with error handling
      let recentBookmarks = [];
      try {
        recentBookmarks = await JobBookmark.findAll({
          where: { userId },
          order: [['created_at', 'DESC']],
          limit: 5,
          include: [{
            model: require('../models/Job'),
            as: 'job',
            attributes: ['id', 'title', 'location', 'salaryMin', 'salaryMax', 'companyId', 'status']
          }]
        });
      } catch (error) {
        console.error('Error fetching recent bookmarks:', error);
        recentBookmarks = [];
      }

      // Get recent searches with error handling
      let recentSearches = [];
      try {
        recentSearches = await this.getSearchHistory(userId, 5);
      } catch (error) {
        console.error('Error fetching recent searches:', error);
        recentSearches = [];
      }

      // Get job alerts with error handling
      let jobAlerts = [];
      try {
        jobAlerts = await JobAlert.findAll({
          where: { userId },
          order: [['created_at', 'DESC']]
        });
      } catch (error) {
        console.error('Error fetching job alerts:', error);
        jobAlerts = [];
      }

      // Get resumes with error handling
      let resumes = [];
      try {
        resumes = await Resume.findAll({
          where: { userId },
          order: [['isDefault', 'DESC'], ['lastUpdated', 'DESC']]
        });
      } catch (error) {
        console.error('Error fetching resumes:', error);
        resumes = [];
      }

      // Get profile analytics with error handling
      let profileViews = 0;
      try {
        profileViews = await Analytics.count({
          where: { 
            userId,
            eventType: 'profile_update'
          }
        });
      } catch (error) {
        console.error('Error fetching profile views:', error);
        profileViews = 0;
      }

      // Get profile like (upvote) count with robust fallback
      let profileLikes = 0;
      try {
        profileLikes = await CandidateLike.count({ where: { candidateId: userId } });
      } catch (error) {
        console.error('Error fetching profile likes via model:', error);
      }
      // Fallback to raw query if model count failed or returned suspicious zero
      if (!profileLikes || Number.isNaN(profileLikes)) {
        try {
          const [rows] = await sequelize.query(
            'SELECT COUNT(*)::int AS cnt FROM candidate_likes WHERE candidate_id = :userId',
            { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
          );
          const cnt = Array.isArray(rows) ? 0 : (rows?.cnt ?? 0);
          profileLikes = parseInt(cnt, 10) || 0;
        } catch (rawErr) {
          console.error('Raw profile likes query failed:', rawErr);
        }
      }

      return {
        dashboard: dashboard.getDashboardSummary ? dashboard.getDashboardSummary() : {
          applications: {
            total: dashboard.totalApplications || 0,
            underReview: dashboard.applicationsUnderReview || 0,
            shortlisted: dashboard.applicationsShortlisted || 0,
            rejected: dashboard.applicationsRejected || 0,
            accepted: dashboard.applicationsAccepted || 0,
            lastDate: dashboard.lastApplicationDate
          },
          bookmarks: {
            total: dashboard.totalBookmarks || 0,
            lastDate: dashboard.lastBookmarkDate
          },
          searches: {
            total: dashboard.totalSearches || 0,
            saved: dashboard.savedSearches || 0,
            lastDate: dashboard.lastSearchDate
          },
          resumes: {
            total: dashboard.totalResumes || 0,
            hasDefault: dashboard.hasDefaultResume || false,
            lastUpdate: dashboard.lastResumeUpdate
          },
          jobAlerts: {
            total: dashboard.totalJobAlerts || 0,
            active: dashboard.activeJobAlerts || 0
          },
          profile: {
            views: dashboard.profileViews || 0,
            lastView: dashboard.lastProfileView
          },
          activity: {
            lastLogin: dashboard.lastLoginDate,
            lastActivity: dashboard.lastActivityDate,
            totalLogins: dashboard.totalLoginCount || 0
          }
        },
        recentApplications,
        recentBookmarks,
        recentSearches,
        jobAlerts,
        resumes,
        profileViews,
        profileLikes,
        stats: {
          totalApplications: dashboard.totalApplications || 0,
          applicationsUnderReview: dashboard.applicationsUnderReview || 0,
          totalBookmarks: dashboard.totalBookmarks || 0,
          totalSearches: dashboard.totalSearches || 0,
          savedSearches: dashboard.savedSearches || 0,
          totalResumes: dashboard.totalResumes || 0,
          hasDefaultResume: dashboard.hasDefaultResume || false,
          totalJobAlerts: dashboard.totalJobAlerts || 0,
          activeJobAlerts: dashboard.activeJobAlerts || 0,
          profileViews,
          profileLikes
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Sync dashboard stats with actual data
   */
  static async syncDashboardStats(userId) {
    try {
      // Count actual applications
      const applicationStats = await JobApplication.findAll({
        where: { userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      // Count actual bookmarks
      const bookmarkCount = await JobBookmark.count({
        where: { userId }
      });

      // Count actual searches
      const searchCount = await SearchHistory.count({
        where: { userId }
      });

      // Count saved searches
      const savedSearchCount = await SearchHistory.count({
        where: { userId, isSaved: true }
      });

      // Count actual resumes
      const resumeCount = await Resume.count({
        where: { userId }
      });

      // Count actual job alerts
      const jobAlertCount = await JobAlert.count({
        where: { userId }
      });

      // Update dashboard with actual counts
      await this.updateDashboardStats(userId, {
        totalApplications: applicationStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
        applicationsUnderReview: applicationStats.find(s => s.status === 'reviewing')?.dataValues.count || 0,
        applicationsShortlisted: applicationStats.find(s => s.status === 'shortlisted')?.dataValues.count || 0,
        applicationsRejected: applicationStats.find(s => s.status === 'rejected')?.dataValues.count || 0,
        applicationsAccepted: applicationStats.find(s => s.status === 'accepted')?.dataValues.count || 0,
        totalBookmarks: bookmarkCount,
        totalSearches: searchCount,
        savedSearches: savedSearchCount,
        totalResumes: resumeCount,
        totalJobAlerts: jobAlertCount
      });

      return true;
    } catch (error) {
      console.error('Error syncing dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Record user activity
   */
  static async recordActivity(userId, activityType, metadata = {}) {
    try {
      // Normalize event types to avoid enum violations
      const allowedEventTypes = new Set([
        'page_view','job_view','job_apply','job_bookmark','company_view',
        'search_performed','filter_applied','login','logout','registration',
        'profile_update','resume_upload','application_submitted','interview_scheduled',
        'message_sent','notification_clicked','subscription_purchased','payment_made','profile_like'
      ])
      let normalizedType = activityType
      if (!allowedEventTypes.has(normalizedType)) {
        // Map common extras to nearest allowed
        const map = {
          resume_update: 'profile_update',
          resume_delete: 'profile_update',
          resume_download: 'profile_update'
        }
        normalizedType = map[activityType] || 'profile_update'
      }
      // Update dashboard activity
      await this.updateDashboardStats(userId, {
        lastActivityDate: new Date()
      });

      // Record analytics event (avoid RETURNING to handle legacy schemas without certain columns)
      await Analytics.create({
        userId,
        eventType: normalizedType,
        eventCategory: this.getEventCategory(normalizedType),
        metadata: {
          ...metadata,
          timestamp: new Date()
        }
      }, { returning: false });

      return true;
    } catch (error) {
      console.error('Error recording activity:', error);
      throw error;
    }
  }

  /**
   * Get event category for analytics
   */
  static getEventCategory(eventType) {
    const categoryMap = {
      'dashboard_view': 'user_engagement',
      'search_performed': 'user_engagement',
      'job_apply': 'application_process',
      'job_bookmark': 'job_interaction',
      'resume_upload': 'user_engagement',
      'profile_update': 'user_engagement',
      'job_alert_create': 'user_engagement'
    };

    return categoryMap[eventType] || 'user_engagement';
  }

  /**
   * Compute employer analytics for the analytics dashboard
   * Returns shape tailored for employer analytics page
   */
  static async getEmployerAnalytics(userId, options = {}) {
    const { range = '30d' } = options;
    // Calculate dateFrom based on range
    const now = new Date();
    let dateFrom = new Date();
    if (range === '7d') {
      dateFrom.setDate(now.getDate() - 7);
    } else if (range === '90d') {
      dateFrom.setDate(now.getDate() - 90);
    } else if (range === '1y') {
      dateFrom.setFullYear(now.getFullYear() - 1);
    } else {
      // default 30d
      dateFrom.setDate(now.getDate() - 30);
    }

    // Helpers for safe queries
    const safeCount = async (fn, fallback = 0) => {
      try { return await fn(); } catch (e) { console.error('Analytics count error:', e?.message || e); return fallback; }
    };
    const safeFindAll = async (fn, fallback = []) => {
      try { return await fn(); } catch (e) { console.error('Analytics findAll error:', e?.message || e); return fallback; }
    };

    // Lazy-require to avoid circular deps at top-level
    const { Op, fn, col, literal } = require('sequelize');
    const SearchHistory = require('../models/SearchHistory');
    const JobApplication = require('../models/JobApplication');
    const User = require('../models/User');
    const Analytics = require('../models/Analytics');
    let ViewTracking;
    try { ViewTracking = require('../models/ViewTracking'); } catch (_) {}
    let Message;
    try { Message = require('../models/Message'); } catch (_) {}

    // Totals
    const totalSearches = await safeCount(() => SearchHistory.count({ where: { userId, createdAt: { [Op.gte]: dateFrom } } }));

    // Distinct candidates interacted with via applications for this employer
    const applications = await safeFindAll(() => JobApplication.findAll({
      where: { employerId: userId, createdAt: { [Op.gte]: dateFrom } },
      attributes: ['userId']
    }));
    const distinctCandidateIds = Array.from(new Set(applications.map(a => a.userId).filter(Boolean)));
    const totalCandidates = distinctCandidateIds.length;

    // Profile views by employer (viewing candidates) - best effort
    let viewedProfiles = 0;
    if (ViewTracking) {
      viewedProfiles = await safeCount(() => ViewTracking.count({ where: { userId, viewType: 'profile_view', created_at: { [Op.gte]: dateFrom } } }));
    } else {
      // Fallback: use Analytics page_view with metadata.page = 'candidate_profile'
      viewedProfiles = await safeCount(() => Analytics.count({ where: { userId, eventType: 'page_view', createdAt: { [Op.gte]: dateFrom } } }));
    }

    // Contacts sent by employer (messages)
    const contactedCandidates = Message
      ? await safeCount(() => Message.count({ where: { senderId: userId, created_at: { [Op.gte]: dateFrom } } }))
      : 0;

    // Downloaded resumes - if tracked in Analytics; else 0
    const downloadedResumes = await safeCount(() => Analytics.count({ where: { userId, eventType: 'resume_download', createdAt: { [Op.gte]: dateFrom } } }), 0);

    const conversionRate = viewedProfiles > 0 ? Number(((contactedCandidates / viewedProfiles) * 100).toFixed(1)) : 0;

    // Search performance: top queries with result counts
    const searchRows = await safeFindAll(() => SearchHistory.findAll({
      where: { userId, createdAt: { [Op.gte]: dateFrom } },
      attributes: ['searchQuery', 'resultsCount', 'createdAt'],
      order: [['created_at', 'DESC']],
      limit: 20
    }));
    const searchPerformance = searchRows.map(r => {
      const query = (r.searchQuery && (r.searchQuery.keyword || r.searchQuery.query || r.searchQuery.title)) || 'Search';
      return {
        search: String(query),
        results: Number(r.resultsCount || 0),
        views: 0,
        contacts: 0,
        conversion: 0
      };
    });

    // Candidate insights from recent applications (skills, experience, locations)
    const recentCandidateIds = distinctCandidateIds.slice(0, 200);
    const candidates = await safeFindAll(() => User.findAll({
      where: { id: { [Op.in]: recentCandidateIds } },
      attributes: ['id', 'skills', 'current_location', 'experience_level']
    }));

    const skillCounts = new Map();
    const expCounts = new Map();
    const locCounts = new Map();
    candidates.forEach(c => {
      const skills = Array.isArray(c.skills) ? c.skills : [];
      skills.forEach(s => skillCounts.set(s, (skillCounts.get(s) || 0) + 1));
      const exp = c.experience_level || 'Unknown';
      expCounts.set(exp, (expCounts.get(exp) || 0) + 1);
      const loc = c.current_location || 'Unknown';
      locCounts.set(loc, (locCounts.get(loc) || 0) + 1);
    });
    const totalSkillCount = Array.from(skillCounts.values()).reduce((a, b) => a + b, 0) || 1;
    const topSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count, percentage: Number(((count / totalSkillCount) * 100).toFixed(1)) }));
    const experienceLevels = Array.from(expCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([level, count]) => ({ level, count, percentage: 0 }));
    const locations = Array.from(locCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count, percentage: 0 }));

    // Trends: per-day counts for searches, views, contacts
    const days = [];
    const trends = [];
    const daysCount = Math.min(7, Math.ceil((now - dateFrom) / (1000 * 60 * 60 * 24)));
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const [daySearches, dayViews, dayContacts] = await Promise.all([
        safeCount(() => SearchHistory.count({ where: { userId, createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } })),
        ViewTracking
          ? safeCount(() => ViewTracking.count({ where: { userId, viewType: 'profile_view', created_at: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } }))
          : safeCount(() => Analytics.count({ where: { userId, eventType: 'page_view', createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } })),
        Message
          ? safeCount(() => Message.count({ where: { senderId: userId, created_at: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } }))
          : 0
      ]);

      trends.push({ date: dayStart.toISOString().slice(0, 10), searches: daySearches, views: dayViews, contacts: dayContacts });
    }

    // Recent Activity: Get recent actions from the last 7 days
    const recentActivity = [];
    
    // Recent searches
    const recentSearches = await safeFindAll(() => SearchHistory.findAll({
      where: { userId, createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      order: [['created_at', 'DESC']],
      limit: 5
    }));
    
    recentSearches.forEach(search => {
      const query = (search.searchQuery && (search.searchQuery.keyword || search.searchQuery.query || search.searchQuery.title)) || 'Search';
      recentActivity.push({
        type: 'search',
        title: `Searched for "${query}"`,
        description: `Found ${search.resultsCount || 0} results`,
        timestamp: search.createdAt,
        icon: 'Search'
      });
    });

    // Recent profile views (if ViewTracking exists)
    if (ViewTracking) {
      const recentViews = await safeFindAll(() => ViewTracking.findAll({
        where: { userId, viewType: 'profile_view', createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        order: [['created_at', 'DESC']],
        limit: 3
      }));
      
      recentViews.forEach(view => {
        recentActivity.push({
          type: 'view',
          title: 'Viewed candidate profile',
          description: `Profile view activity`,
          timestamp: view.createdAt,
          icon: 'Eye'
        });
      });
    }

    // Recent messages/contacts
    if (Message) {
      const recentMessages = await safeFindAll(() => Message.findAll({
        where: { senderId: userId, createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        order: [['created_at', 'DESC']],
        limit: 3
      }));
      
      recentMessages.forEach(message => {
        recentActivity.push({
          type: 'contact',
          title: 'Contacted candidate',
          description: 'Sent message to candidate',
          timestamp: message.createdAt,
          icon: 'Users'
        });
      });
    }

    // Recent resume downloads
    const recentDownloads = await safeFindAll(() => Analytics.findAll({
      where: { userId, eventType: 'resume_download', createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      order: [['created_at', 'DESC']],
      limit: 3
    }));
    
    recentDownloads.forEach(download => {
      recentActivity.push({
        type: 'download',
        title: 'Downloaded resume',
        description: 'Resume download activity',
        timestamp: download.createdAt,
        icon: 'Download'
      });
    });

    // Sort by timestamp and limit to 10 most recent
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedRecentActivity = recentActivity.slice(0, 10);

    return {
      overview: {
        totalSearches,
        totalCandidates,
        viewedProfiles,
        contactedCandidates,
        downloadedResumes,
        conversionRate
      },
      searchPerformance,
      candidateInsights: {
        topSkills,
        experienceLevels,
        locations
      },
      trends,
      recentActivity: limitedRecentActivity
    };
  }

  /**
   * Convert analytics data to CSV format
   */
  static convertAnalyticsToCSV(analytics, range) {
    const lines = [];
    
    // Header
    lines.push('Analytics Report');
    lines.push(`Date Range: ${range}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    
    // Overview section
    lines.push('OVERVIEW');
    lines.push('Metric,Value');
    lines.push(`Total Searches,${analytics.overview.totalSearches}`);
    lines.push(`Total Candidates,${analytics.overview.totalCandidates}`);
    lines.push(`Profile Views,${analytics.overview.viewedProfiles}`);
    lines.push(`Contacted Candidates,${analytics.overview.contactedCandidates}`);
    lines.push(`Downloaded Resumes,${analytics.overview.downloadedResumes}`);
    lines.push(`Conversion Rate,${analytics.overview.conversionRate}%`);
    lines.push('');
    
    // Search Performance section
    lines.push('SEARCH PERFORMANCE');
    lines.push('Search Query,Results,Views,Contacts,Conversion Rate');
    analytics.searchPerformance.forEach(search => {
      lines.push(`"${search.search}",${search.results},${search.views},${search.contacts},${search.conversion}%`);
    });
    lines.push('');
    
    // Top Skills section
    lines.push('TOP SKILLS');
    lines.push('Skill,Count,Percentage');
    analytics.candidateInsights.topSkills.forEach(skill => {
      lines.push(`"${skill.skill}",${skill.count},${skill.percentage}%`);
    });
    lines.push('');
    
    // Experience Levels section
    lines.push('EXPERIENCE LEVELS');
    lines.push('Level,Count');
    analytics.candidateInsights.experienceLevels.forEach(level => {
      lines.push(`"${level.level}",${level.count}`);
    });
    lines.push('');
    
    // Top Locations section
    lines.push('TOP LOCATIONS');
    lines.push('Location,Count');
    analytics.candidateInsights.locations.forEach(location => {
      lines.push(`"${location.location}",${location.count}`);
    });
    lines.push('');
    
    // Trends section
    lines.push('DAILY TRENDS');
    lines.push('Date,Searches,Views,Contacts');
    analytics.trends.forEach(trend => {
      lines.push(`${trend.date},${trend.searches},${trend.views},${trend.contacts}`);
    });
    lines.push('');
    
    // Recent Activity section
    lines.push('RECENT ACTIVITY');
    lines.push('Type,Title,Description,Timestamp');
    analytics.recentActivity.forEach(activity => {
      lines.push(`"${activity.type}","${activity.title}","${activity.description}",${activity.timestamp}`);
    });
    
    return lines.join('\n');
  }

  /**
   * Sync dashboard stats with actual data
   */
  static async syncDashboardStats(userId) {

    try {

      // Count actual applications

      const applicationStats = await JobApplication.findAll({

        where: { userId },

        attributes: [

          'status',

          [sequelize.fn('COUNT', sequelize.col('id')), 'count']

        ],

        group: ['status']

      });



      // Count actual bookmarks

      const bookmarkCount = await JobBookmark.count({

        where: { userId }

      });



      // Count actual searches

      const searchCount = await SearchHistory.count({

        where: { userId }

      });



      // Count saved searches

      const savedSearchCount = await SearchHistory.count({

        where: { userId, isSaved: true }

      });



      // Count actual resumes

      const resumeCount = await Resume.count({

        where: { userId }

      });



      // Count actual job alerts

      const jobAlertCount = await JobAlert.count({

        where: { userId }

      });



      // Update dashboard with actual counts

      await this.updateDashboardStats(userId, {

        totalApplications: applicationStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),

        applicationsUnderReview: applicationStats.find(s => s.status === 'reviewing')?.dataValues.count || 0,

        applicationsShortlisted: applicationStats.find(s => s.status === 'shortlisted')?.dataValues.count || 0,

        applicationsRejected: applicationStats.find(s => s.status === 'rejected')?.dataValues.count || 0,

        applicationsAccepted: applicationStats.find(s => s.status === 'accepted')?.dataValues.count || 0,

        totalBookmarks: bookmarkCount,

        totalSearches: searchCount,

        savedSearches: savedSearchCount,

        totalResumes: resumeCount,

        totalJobAlerts: jobAlertCount

      });



      return true;

    } catch (error) {

      console.error('Error syncing dashboard stats:', error);

      throw error;

    }

  }



  /**

   * Record user activity

   */

  static async recordActivity(userId, activityType, metadata = {}) {

    try {

      // Update dashboard activity

      await this.updateDashboardStats(userId, {

        lastActivityDate: new Date()

      });



      // Record analytics event

      await Analytics.create({

        userId,

        eventType: activityType,

        eventCategory: this.getEventCategory(activityType),

        metadata: {

          ...metadata,

          timestamp: new Date()

        }

      });



      return true;

    } catch (error) {

      console.error('Error recording activity:', error);

      throw error;

    }

  }



  /**

   * Get event category for analytics

   */

  static getEventCategory(eventType) {

    const categoryMap = {

      'dashboard_view': 'user_engagement',

      'search_performed': 'user_engagement',

      'job_apply': 'application_process',

      'job_bookmark': 'job_interaction',

      'resume_upload': 'user_engagement',

      'profile_update': 'user_engagement',

      'job_alert_create': 'user_engagement'

    };



    return categoryMap[eventType] || 'user_engagement';

  }



  /**

   * Compute employer analytics for the analytics dashboard

   * Returns shape tailored for employer analytics page

   */

  static async getEmployerAnalytics(userId, options = {}) {

    const { range = '30d' } = options;

    // Calculate dateFrom based on range

    const now = new Date();

    let dateFrom = new Date();

    if (range === '7d') {

      dateFrom.setDate(now.getDate() - 7);

    } else if (range === '90d') {

      dateFrom.setDate(now.getDate() - 90);

    } else if (range === '1y') {

      dateFrom.setFullYear(now.getFullYear() - 1);

    } else {

      // default 30d

      dateFrom.setDate(now.getDate() - 30);

    }



    // Helpers for safe queries

    const safeCount = async (fn, fallback = 0) => {

      try { return await fn(); } catch (e) { console.error('Analytics count error:', e?.message || e); return fallback; }

    };

    const safeFindAll = async (fn, fallback = []) => {

      try { return await fn(); } catch (e) { console.error('Analytics findAll error:', e?.message || e); return fallback; }

    };



    // Lazy-require to avoid circular deps at top-level

    const { Op, fn, col, literal } = require('sequelize');

    const SearchHistory = require('../models/SearchHistory');

    const JobApplication = require('../models/JobApplication');

    const User = require('../models/User');

    const Analytics = require('../models/Analytics');

    let ViewTracking;

    try { ViewTracking = require('../models/ViewTracking'); } catch (_) {}

    let Message;

    try { Message = require('../models/Message'); } catch (_) {}



    // Totals

    const totalSearches = await safeCount(() => SearchHistory.count({ where: { userId, createdAt: { [Op.gte]: dateFrom } } }));



    // Distinct candidates interacted with via applications for this employer

    const applications = await safeFindAll(() => JobApplication.findAll({

      where: { employerId: userId, createdAt: { [Op.gte]: dateFrom } },

      attributes: ['userId']

    }));

    const distinctCandidateIds = Array.from(new Set(applications.map(a => a.userId).filter(Boolean)));

    const totalCandidates = distinctCandidateIds.length;



    // Profile views by employer (viewing candidates) - best effort

    let viewedProfiles = 0;

    if (ViewTracking) {

      viewedProfiles = await safeCount(() => ViewTracking.count({ where: { userId, viewType: 'profile_view', created_at: { [Op.gte]: dateFrom } } }));

    } else {

      // Fallback: use Analytics page_view with metadata.page = 'candidate_profile'

      viewedProfiles = await safeCount(() => Analytics.count({ where: { userId, eventType: 'page_view', createdAt: { [Op.gte]: dateFrom } } }));

    }



    // Contacts sent by employer (messages)

    const contactedCandidates = Message

      ? await safeCount(() => Message.count({ where: { senderId: userId, created_at: { [Op.gte]: dateFrom } } }))

      : 0;



    // Downloaded resumes - if tracked in Analytics; else 0

    const downloadedResumes = await safeCount(() => Analytics.count({ where: { userId, eventType: 'resume_download', createdAt: { [Op.gte]: dateFrom } } }), 0);



    const conversionRate = viewedProfiles > 0 ? Number(((contactedCandidates / viewedProfiles) * 100).toFixed(1)) : 0;



    // Search performance: top queries with result counts

    const searchRows = await safeFindAll(() => SearchHistory.findAll({

      where: { userId, createdAt: { [Op.gte]: dateFrom } },

      attributes: ['searchQuery', 'resultsCount', 'createdAt'],

      order: [['created_at', 'DESC']],

      limit: 20

    }));

    const searchPerformance = searchRows.map(r => {

      const query = (r.searchQuery && (r.searchQuery.keyword || r.searchQuery.query || r.searchQuery.title)) || 'Search';

      return {

        search: String(query),

        results: Number(r.resultsCount || 0),

        views: 0,

        contacts: 0,

        conversion: 0

      };

    });



    // Candidate insights from recent applications (skills, experience, locations)

    const recentCandidateIds = distinctCandidateIds.slice(0, 200);

    const candidates = await safeFindAll(() => User.findAll({

      where: { id: { [Op.in]: recentCandidateIds } },

      attributes: ['id', 'skills', 'current_location', 'experience_level']

    }));



    const skillCounts = new Map();

    const expCounts = new Map();

    const locCounts = new Map();

    candidates.forEach(c => {

      const skills = Array.isArray(c.skills) ? c.skills : [];

      skills.forEach(s => skillCounts.set(s, (skillCounts.get(s) || 0) + 1));

      const exp = c.experience_level || 'Unknown';

      expCounts.set(exp, (expCounts.get(exp) || 0) + 1);

      const loc = c.current_location || 'Unknown';

      locCounts.set(loc, (locCounts.get(loc) || 0) + 1);

    });

    const totalSkillCount = Array.from(skillCounts.values()).reduce((a, b) => a + b, 0) || 1;

    const topSkills = Array.from(skillCounts.entries())

      .sort((a, b) => b[1] - a[1])

      .slice(0, 5)

      .map(([skill, count]) => ({ skill, count, percentage: Number(((count / totalSkillCount) * 100).toFixed(1)) }));

    const experienceLevels = Array.from(expCounts.entries())

      .sort((a, b) => b[1] - a[1])

      .slice(0, 5)

      .map(([level, count]) => ({ level, count, percentage: 0 }));

    const locations = Array.from(locCounts.entries())

      .sort((a, b) => b[1] - a[1])

      .slice(0, 5)

      .map(([location, count]) => ({ location, count, percentage: 0 }));



    // Trends: per-day counts for searches, views, contacts

    const days = [];

    const trends = [];

    const daysCount = Math.min(7, Math.ceil((now - dateFrom) / (1000 * 60 * 60 * 24)));

    for (let i = daysCount - 1; i >= 0; i--) {

      const d = new Date(now);

      d.setDate(now.getDate() - i);

      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);



      const [daySearches, dayViews, dayContacts] = await Promise.all([

        safeCount(() => SearchHistory.count({ where: { userId, createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } })),

        ViewTracking

          ? safeCount(() => ViewTracking.count({ where: { userId, viewType: 'profile_view', created_at: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } }))

          : safeCount(() => Analytics.count({ where: { userId, eventType: 'page_view', createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } })),

        Message

          ? safeCount(() => Message.count({ where: { senderId: userId, created_at: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } }))

          : 0

      ]);



      trends.push({ date: dayStart.toISOString().slice(0, 10), searches: daySearches, views: dayViews, contacts: dayContacts });

    }



    // Recent Activity: Get recent actions from the last 7 days

    const recentActivity = [];

    

    // Recent searches

    const recentSearches = await safeFindAll(() => SearchHistory.findAll({

      where: { userId, createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },

      order: [['created_at', 'DESC']],

      limit: 5

    }));

    

    recentSearches.forEach(search => {

      const query = (search.searchQuery && (search.searchQuery.keyword || search.searchQuery.query || search.searchQuery.title)) || 'Search';

      recentActivity.push({

        type: 'search',

        title: `Searched for "${query}"`,

        description: `Found ${search.resultsCount || 0} results`,

        timestamp: search.createdAt,

        icon: 'Search'

      });

    });



    // Recent profile views (if ViewTracking exists)

    if (ViewTracking) {

      const recentViews = await safeFindAll(() => ViewTracking.findAll({

        where: { userId, viewType: 'profile_view', createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },

        order: [['created_at', 'DESC']],

        limit: 3

      }));

      

      recentViews.forEach(view => {

        recentActivity.push({

          type: 'view',

          title: 'Viewed candidate profile',

          description: `Profile view activity`,

          timestamp: view.createdAt,

          icon: 'Eye'

        });

      });

    }



    // Recent messages/contacts

    if (Message) {

      const recentMessages = await safeFindAll(() => Message.findAll({

        where: { senderId: userId, createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },

        order: [['created_at', 'DESC']],

        limit: 3

      }));

      

      recentMessages.forEach(message => {

        recentActivity.push({

          type: 'contact',

          title: 'Contacted candidate',

          description: 'Sent message to candidate',

          timestamp: message.createdAt,

          icon: 'Users'

        });

      });

    }



    // Recent resume downloads

    const recentDownloads = await safeFindAll(() => Analytics.findAll({

      where: { userId, eventType: 'resume_download', createdAt: { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },

      order: [['created_at', 'DESC']],

      limit: 3

    }));

    

    recentDownloads.forEach(download => {

      recentActivity.push({

        type: 'download',

        title: 'Downloaded resume',

        description: 'Resume download activity',

        timestamp: download.createdAt,

        icon: 'Download'

      });

    });



    // Sort by timestamp and limit to 10 most recent

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const limitedRecentActivity = recentActivity.slice(0, 10);



    return {

      overview: {

        totalSearches,

        totalCandidates,

        viewedProfiles,

        contactedCandidates,

        downloadedResumes,

        conversionRate

      },

      searchPerformance,

      candidateInsights: {

        topSkills,

        experienceLevels,

        locations

      },

      trends,

      recentActivity: limitedRecentActivity

    };

  }



  /**

   * Convert analytics data to CSV format

   */

  static convertAnalyticsToCSV(analytics, range) {

    const lines = [];

    

    // Header

    lines.push('Analytics Report');

    lines.push(`Date Range: ${range}`);

    lines.push(`Generated: ${new Date().toISOString()}`);

    lines.push('');

    

    // Overview section

    lines.push('OVERVIEW');

    lines.push('Metric,Value');

    lines.push(`Total Searches,${analytics.overview.totalSearches}`);

    lines.push(`Total Candidates,${analytics.overview.totalCandidates}`);

    lines.push(`Profile Views,${analytics.overview.viewedProfiles}`);

    lines.push(`Contacted Candidates,${analytics.overview.contactedCandidates}`);

    lines.push(`Downloaded Resumes,${analytics.overview.downloadedResumes}`);

    lines.push(`Conversion Rate,${analytics.overview.conversionRate}%`);

    lines.push('');

    

    // Search Performance section

    lines.push('SEARCH PERFORMANCE');

    lines.push('Search Query,Results,Views,Contacts,Conversion Rate');

    analytics.searchPerformance.forEach(search => {

      lines.push(`"${search.search}",${search.results},${search.views},${search.contacts},${search.conversion}%`);

    });

    lines.push('');

    

    // Top Skills section

    lines.push('TOP SKILLS');

    lines.push('Skill,Count,Percentage');

    analytics.candidateInsights.topSkills.forEach(skill => {

      lines.push(`"${skill.skill}",${skill.count},${skill.percentage}%`);

    });

    lines.push('');

    

    // Experience Levels section

    lines.push('EXPERIENCE LEVELS');

    lines.push('Level,Count');

    analytics.candidateInsights.experienceLevels.forEach(level => {

      lines.push(`"${level.level}",${level.count}`);

    });

    lines.push('');

    

    // Top Locations section

    lines.push('TOP LOCATIONS');

    lines.push('Location,Count');

    analytics.candidateInsights.locations.forEach(location => {

      lines.push(`"${location.location}",${location.count}`);

    });

    lines.push('');

    

    // Trends section

    lines.push('DAILY TRENDS');

    lines.push('Date,Searches,Views,Contacts');

    analytics.trends.forEach(trend => {

      lines.push(`${trend.date},${trend.searches},${trend.views},${trend.contacts}`);

    });

    lines.push('');

    

    // Recent Activity section

    lines.push('RECENT ACTIVITY');

    lines.push('Type,Title,Description,Timestamp');

    analytics.recentActivity.forEach(activity => {

      lines.push(`"${activity.type}","${activity.title}","${activity.description}",${activity.timestamp}`);

    });

    

    return lines.join('\n');

  }
}

module.exports = DashboardService;
