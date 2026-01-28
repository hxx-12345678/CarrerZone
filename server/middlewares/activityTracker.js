/**
 * Activity Tracking Middleware
 * Comprehensive middleware for tracking user activities and sessions
 */

const UserActivityLog = require('../models/UserActivityLog');
const UserSession = require('../models/UserSession');

// Activity types enum
const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  
  // Profile Management
  PROFILE_UPDATE: 'profile_update',
  PROFILE_VIEW: 'profile_view',
  PROFILE_DELETE: 'profile_delete',
  
  // Resume Management
  RESUME_UPLOAD: 'resume_upload',
  RESUME_DOWNLOAD: 'resume_download',
  RESUME_VIEW: 'resume_view',
  RESUME_DELETE: 'resume_delete',
  
  // Job Management
  JOB_SEARCH: 'job_search',
  JOB_APPLICATION: 'job_application',
  JOB_BOOKMARK: 'job_bookmark',
  JOB_UNBOOKMARK: 'job_unbookmark',
  
  // Employer Actions
  JOB_POST: 'job_post',
  JOB_UPDATE: 'job_update',
  JOB_DELETE: 'job_delete',
  CANDIDATE_VIEW: 'candidate_view',
  REQUIREMENT_POST: 'requirement_posted',
  
  // Admin Actions
  ADMIN_LOGIN: 'admin_login',
  USER_MANAGEMENT: 'user_management',
  SYSTEM_MANAGEMENT: 'system_management',
  DASHBOARD_ACCESS: 'dashboard_access',
  
  // General
  PAGE_VIEW: 'page_view',
  API_CALL: 'api_call',
  ERROR: 'error'
};

// Device type detection
function detectDeviceType(userAgent) {
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

// Extract IP address from request
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         '127.0.0.1';
}

// Activity logging middleware
const activityLogger = (activityType, options = {}) => {
  return async (req, res, next) => {
    try {
      // Skip if no user
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceType = detectDeviceType(userAgent);

      // Prepare activity details
      const details = {
        ipAddress,
        userAgent,
        deviceType,
        ...options.details
      };

      // Add request-specific details
      if (req.method) details.method = req.method;
      if (req.originalUrl) details.url = req.originalUrl;
      if (req.body && Object.keys(req.body).length > 0) {
        details.requestBody = req.body;
      }

      // Create activity log
      await UserActivityLog.create({
        userId,
        activityType,
        details,
        timestamp: new Date()
      });

      // Update session activity if user is logged in
      if (req.session && req.session.sessionToken) {
        await UserSession.update(
          { lastActivityAt: new Date() },
          { where: { sessionToken: req.session.sessionToken } }
        );
      }

    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't fail the request if activity logging fails
    }

    next();
  };
};

// Session management middleware
const sessionManager = async (req, res, next) => {
  try {
    if (req.user && req.session) {
      // Update existing session
      if (req.session.sessionToken) {
        await UserSession.update(
          { 
            lastActivityAt: new Date(),
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent'] || 'Unknown'
          },
          { where: { sessionToken: req.session.sessionToken } }
        );
      }
    }
  } catch (error) {
    console.error('Session management error:', error);
  }
  
  next();
};

// Login activity tracker
const trackLogin = async (userId, req, loginMethod = 'email') => {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceType = detectDeviceType(userAgent);

    // Create activity log
    await UserActivityLog.create({
      userId,
      activityType: ACTIVITY_TYPES.LOGIN,
      details: {
        ipAddress,
        userAgent,
        deviceType,
        loginMethod,
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    // Create or update session
    const sessionToken = req.session?.sessionToken || `session_${userId}_${Date.now()}`;
    
    await UserSession.upsert({
      userId,
      sessionToken,
      refreshToken: `refresh_${userId}_${Date.now()}`,
      deviceType,
      deviceInfo: userAgent,
      ipAddress,
      userAgent,
      location: {}, // Can be enhanced with geolocation
      isActive: true,
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      loginMethod
    });

  } catch (error) {
    console.error('Login tracking error:', error);
  }
};

// Logout activity tracker
const trackLogout = async (userId, req) => {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Create activity log
    await UserActivityLog.create({
      userId,
      activityType: ACTIVITY_TYPES.LOGOUT,
      details: {
        ipAddress,
        userAgent,
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    // Deactivate session
    if (req.session?.sessionToken) {
      await UserSession.update(
        { isActive: false },
        { where: { sessionToken: req.session.sessionToken } }
      );
    }

  } catch (error) {
    console.error('Logout tracking error:', error);
  }
};

// Profile update tracker
const trackProfileUpdate = async (userId, req, updatedFields = []) => {
  try {
    await UserActivityLog.create({
      userId,
      activityType: ACTIVITY_TYPES.PROFILE_UPDATE,
      details: {
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'Unknown',
        updatedFields,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Profile update tracking error:', error);
  }
};

// Resume action tracker
const trackResumeAction = async (userId, req, action, resumeId, fileName = null) => {
  try {
    await UserActivityLog.create({
      userId,
      activityType: `resume_${action}`,
      details: {
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'Unknown',
        resumeId,
        fileName,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Resume action tracking error:', error);
  }
};

// Job action tracker
const trackJobAction = async (userId, req, action, jobId, jobTitle = null) => {
  try {
    await UserActivityLog.create({
      userId,
      activityType: `job_${action}`,
      details: {
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'Unknown',
        jobId,
        jobTitle,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Job action tracking error:', error);
  }
};

// Admin action tracker
const trackAdminAction = async (userId, req, action, targetUserId = null, targetUserName = null) => {
  try {
    await UserActivityLog.create({
      userId,
      activityType: action,
      details: {
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'Unknown',
        targetUserId,
        targetUserName,
        timestamp: new Date()
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Admin action tracking error:', error);
  }
};

module.exports = {
  ACTIVITY_TYPES,
  activityLogger,
  sessionManager,
  trackLogin,
  trackLogout,
  trackProfileUpdate,
  trackResumeAction,
  trackJobAction,
  trackAdminAction,
  detectDeviceType,
  getClientIP
};
