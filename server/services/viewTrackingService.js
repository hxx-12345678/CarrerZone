const { ViewTracking, User, Job } = require('../config/index');
const { Op } = require('sequelize');

class ViewTrackingService {
  /**
   * Track a view (job, profile, or company)
   * @param {Object} params - View tracking parameters
   * @param {string} params.viewerId - ID of the user viewing (null for anonymous)
   * @param {string} params.viewedUserId - ID of the user being viewed
   * @param {string} params.jobId - ID of the job being viewed (optional)
   * @param {string} params.viewType - Type of view ('job_view', 'profile_view', 'company_view')
   * @param {string} params.ipAddress - IP address of the viewer
   * @param {string} params.userAgent - User agent string
   * @param {string} params.sessionId - Session ID for anonymous users
   * @param {string} params.referrer - Referrer URL
   * @param {Object} params.metadata - Additional metadata
   */
  static async trackView({
    viewerId,
    viewedUserId,
    jobId = null,
    viewType,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    referrer = null,
    metadata = {}
  }) {
    try {
      // Don't track views from the same user to their own profile/job
      if (viewerId === viewedUserId) {
        return { success: false, message: 'Cannot track self-views' };
      }

      // Check if this view already exists for this specific requirement (jobId)
      // Allow multiple views if they're from different requirements
      const existingView = await ViewTracking.findOne({
        where: {
          viewerId: viewerId || null,
          viewedUserId,
          viewType,
          jobId: jobId || null
        }
      });

      if (existingView) {
        // View already tracked for this requirement
        return { success: false, message: 'View already tracked for this requirement' };
      }
      
      // Also check if there's a view without jobId (legacy views)
      // If jobId is provided, we want to track it separately
      if (jobId) {
        const existingViewWithoutJobId = await ViewTracking.findOne({
          where: {
            viewerId: viewerId || null,
            viewedUserId,
            viewType,
            jobId: null
          }
        });
        
        // If a view exists without jobId and we're trying to track with jobId,
        // we'll still create a new view (the unique constraint will handle duplicates)
        // But we need to handle the case where the unique constraint prevents it
      }

      // Create the view tracking record
      // Note: If jobId is provided, we want to track views per requirement
      // The unique constraint on (viewer_id, viewed_user_id, view_type) will prevent
      // multiple views of the same candidate by the same viewer, but we need to allow
      // views from different requirements. Since the constraint doesn't include job_id,
      // we'll get a unique constraint error if we try to insert a duplicate.
      // We'll handle this by catching the error and checking if it's a unique constraint violation.
      try {
        // Initialize metadata with requirementIds array if jobId is provided
        const viewMetadata = {
          ...metadata,
          ...(jobId ? {
            requirementId: jobId, // Single value for backward compatibility
            requirementIds: [jobId] // Array for tracking multiple requirements
          } : {})
        };
        
        const view = await ViewTracking.create({
          viewerId,
          viewedUserId,
          jobId,
          viewType,
          ipAddress,
          userAgent,
          sessionId,
          referrer,
          metadata: viewMetadata
        });

        console.log(`✅ View tracked: ${viewType} for user ${viewedUserId} by ${viewerId || 'anonymous'}${jobId ? ` (requirement: ${jobId})` : ''}`);
        
        return { success: true, data: view };
      } catch (createError) {
        // Handle unique constraint violation
        // If the error is a unique constraint violation and jobId is provided,
        // try to update the existing view to include the jobId and metadata
        if (createError.name === 'SequelizeUniqueConstraintError' && jobId) {
          console.log(`⚠️ Unique constraint violation for view, attempting to update existing view with jobId ${jobId}`);
          
          // Try to find and update the existing view
          const existingView = await ViewTracking.findOne({
            where: {
              viewerId: viewerId || null,
              viewedUserId,
              viewType
            }
          });
          
          if (existingView) {
            // Update the existing view to include the jobId in metadata as an array
            // This allows us to track multiple requirements for the same view
            const existingMetadata = existingView.metadata || {};
            const existingRequirementIds = existingMetadata.requirementIds || [];
            const existingRequirementId = existingMetadata.requirementId;
            
            // Build array of requirementIds
            let requirementIds = Array.isArray(existingRequirementIds) ? [...existingRequirementIds] : [];
            if (existingRequirementId && !requirementIds.includes(existingRequirementId)) {
              requirementIds.push(existingRequirementId);
            }
            if (jobId && !requirementIds.includes(jobId)) {
              requirementIds.push(jobId);
            }
            
            // Update with the latest jobId and all requirementIds in metadata
            await existingView.update({
              jobId: jobId, // Update with the latest requirementId (for backward compatibility)
              metadata: {
                ...existingMetadata,
                ...metadata,
                requirementId: jobId, // Latest requirementId (for backward compatibility)
                requirementIds: requirementIds, // Array of all requirementIds
                lastUpdated: new Date().toISOString()
              }
            });
            
            console.log(`✅ Updated existing view with requirementId ${jobId} (total requirements: ${requirementIds.length})`);
            return { success: true, data: existingView, updated: true };
          }
        }
        
        // Re-throw if it's not a unique constraint error or if we couldn't update
        throw createError;
      }
    } catch (error) {
      console.error('Error tracking view:', error);
      // If it's a unique constraint error and we've already handled it, return success
      if (error.name === 'SequelizeUniqueConstraintError') {
        return { success: false, message: 'View already tracked', error: error.message };
      }
      return { success: false, message: 'Failed to track view', error: error.message };
    }
  }

  /**
   * Get view statistics for a user
   * @param {string} userId - User ID to get stats for
   * @param {string} viewType - Type of views to count (optional)
   * @param {number} days - Number of days to look back (default: 30)
   */
  static async getUserViewStats(userId, viewType = null, days = 30) {
    try {
      const whereClause = {
        viewedUserId: userId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      };

      if (viewType) {
        whereClause.viewType = viewType;
      }

      const stats = await ViewTracking.findAll({
        where: whereClause,
        attributes: [
          'viewType',
          [ViewTracking.sequelize.fn('COUNT', ViewTracking.sequelize.col('id')), 'count'],
          [ViewTracking.sequelize.fn('DATE', ViewTracking.sequelize.col('created_at')), 'date']
        ],
        group: ['viewType', ViewTracking.sequelize.fn('DATE', ViewTracking.sequelize.col('created_at'))],
        order: [[ViewTracking.sequelize.fn('DATE', ViewTracking.sequelize.col('created_at')), 'DESC']]
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting view stats:', error);
      return { success: false, message: 'Failed to get view stats', error: error.message };
    }
  }

  /**
   * Get unique viewers count for a user
   * @param {string} userId - User ID
   * @param {string} viewType - Type of views to count (optional)
   * @param {number} days - Number of days to look back (default: 30)
   */
  static async getUniqueViewersCount(userId, viewType = null, days = 30) {
    try {
      const whereClause = {
        viewedUserId: userId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      };

      if (viewType) {
        whereClause.viewType = viewType;
      }

      const count = await ViewTracking.count({
        where: whereClause,
        distinct: true,
        col: 'viewerId'
      });

      return { success: true, data: { uniqueViewers: count } };
    } catch (error) {
      console.error('Error getting unique viewers count:', error);
      return { success: false, message: 'Failed to get unique viewers count', error: error.message };
    }
  }

  /**
   * Get recent views for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent views to return (default: 10)
   */
  static async getRecentViews(userId, limit = 10) {
    try {
      const views = await ViewTracking.findAll({
        where: { viewedUserId: userId },
        include: [
          {
            model: User,
            as: 'viewer',
            attributes: ['id', 'first_name', 'last_name', 'email'],
            required: false
          },
          {
            model: Job,
            as: 'job',
            attributes: ['id', 'title', 'location'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });

      return { success: true, data: views };
    } catch (error) {
      console.error('Error getting recent views:', error);
      return { success: false, message: 'Failed to get recent views', error: error.message };
    }
  }
}

module.exports = ViewTrackingService;
