const { AdminNotification, User, Company } = require('../models');

class AdminNotificationService {
  
  /**
   * Create notification for new admin/employer registration
   */
  static async notifyNewRegistration(userType, userData, companyData = null) {
    try {
      console.log(`🔔 Creating admin notification for new ${userType} registration:`, {
        userEmail: userData.email,
        userName: `${userData.first_name} ${userData.last_name}`,
        companyName: companyData?.name
      });

      const notification = await AdminNotification.createRegistrationNotification(
        userType, 
        userData, 
        companyData
      );

      console.log(`✅ Admin notification created:`, notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Error creating registration notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for new company registration
   */
  static async notifyNewCompanyRegistration(companyData, userData) {
    try {
      console.log(`🔔 Creating admin notification for new company registration:`, {
        companyName: companyData.name,
        contactEmail: userData.email
      });

      const notification = await AdminNotification.createCompanyRegistrationNotification(
        companyData, 
        userData
      );

      console.log(`✅ Company registration notification created:`, notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Error creating company registration notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for company verification approval/rejection
   */
  static async notifyCompanyVerification(action, companyData, adminData) {
    try {
      console.log(`🔔 Creating admin notification for company verification ${action}:`, {
        companyName: companyData.name,
        adminEmail: adminData.email
      });

      const notification = await AdminNotification.createVerificationNotification(
        action, 
        companyData, 
        adminData
      );

      console.log(`✅ Company verification notification created:`, notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Error creating verification notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for jobseeker milestone
   */
  static async notifyJobseekerMilestone(milestone, count) {
    try {
      console.log(`🔔 Creating admin notification for jobseeker milestone:`, {
        milestone,
        count
      });

      const notification = await AdminNotification.createMilestoneNotification(
        milestone, 
        count
      );

      console.log(`✅ Jobseeker milestone notification created:`, notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Error creating milestone notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for job posting milestone
   */
  static async notifyJobPostingMilestone(milestone, count) {
    try {
      console.log(`🔔 Creating admin notification for job posting milestone:`, {
        milestone,
        count
      });

      const notification = await AdminNotification.create({
        type: `job_posting_milestone_${milestone}`,
        title: `🎉 Job Portal Milestone: ${milestone} Jobs Posted!`,
        message: `Congratulations! The portal has reached a major milestone with ${count} total jobs posted. This shows the growing trust and engagement of employers on our platform.`,
        shortMessage: `Portal now has ${count} jobs posted!`,
        category: 'milestone',
        priority: 'medium',
        metadata: {
          milestone,
          count,
          milestoneType: 'job_posting'
        }
      });

      console.log(`✅ Job posting milestone notification created:`, notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Error creating job posting milestone notification:', error);
      throw error;
    }
  }

  /**
   * Check and create milestone notifications if needed
   */
  static async checkJobseekerMilestones() {
    try {
      const jobseekerCount = await User.count({
        where: { user_type: 'jobseeker' }
      });

      const milestones = [10, 50, 100, 500, 1000, 5000, 10000];
      
      for (const milestone of milestones) {
        if (jobseekerCount >= milestone) {
          // Check if we already have a notification for this milestone
          const existingNotification = await AdminNotification.findOne({
            where: {
              type: `jobseeker_milestone_${milestone}`
            }
          });

          if (!existingNotification) {
            await this.notifyJobseekerMilestone(milestone, jobseekerCount);
            console.log(`🎉 Created milestone notification for ${milestone} jobseekers`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking jobseeker milestones:', error);
    }
  }

  /**
   * Check and create job posting milestone notifications
   */
  static async checkJobPostingMilestones() {
    try {
      const Job = require('../models/Job');
      const totalJobsCount = await Job.count();

      const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
      
      for (const milestone of milestones) {
        if (totalJobsCount >= milestone) {
          // Check if we already have a notification for this milestone
          const existingNotification = await AdminNotification.findOne({
            where: {
              type: `job_posting_milestone_${milestone}`
            }
          });

          if (!existingNotification) {
            await this.notifyJobPostingMilestone(milestone, totalJobsCount);
            console.log(`🎉 Created job posting milestone notification for ${milestone} jobs`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking job posting milestones:', error);
    }
  }

  /**
   * Get all admin notifications with pagination and filtering
   */
  static async getNotifications(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        priority = null,
        isRead = null,
        type = null
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (category) where.category = category;
      if (priority) where.priority = priority;
      if (isRead !== null) where.isRead = isRead;
      if (type) where.type = type;

      const { count, rows: notifications } = await AdminNotification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: User,
            as: 'RelatedUser',
            attributes: ['id', 'email', 'first_name', 'last_name', 'user_type'],
            required: false
          },
          {
            model: Company,
            as: 'RelatedCompany',
            attributes: ['id', 'name', 'industries', 'companySize', 'sector'],
            required: false
          },
          {
            model: User,
            as: 'TriggeredByAdmin',
            attributes: ['id', 'email', 'first_name', 'last_name'],
            required: false
          }
        ]
      });

      // Transform notifications to convert industries array to industry string for frontend compatibility
      const transformedNotifications = notifications.map(notification => {
        const notificationData = notification.toJSON ? notification.toJSON() : notification;
        
        // Transform RelatedCompany if present
        if (notificationData.RelatedCompany) {
          const industries = notificationData.RelatedCompany.industries || [];
          // Get first industry from array, or use sector as fallback
          notificationData.RelatedCompany.industry = Array.isArray(industries) && industries.length > 0 
            ? industries[0] 
            : (notificationData.RelatedCompany.sector || 'Not specified');
          
          // Remove industries array to avoid confusion
          delete notificationData.RelatedCompany.industries;
        }
        
        return notificationData;
      });

      return {
        notifications: transformedNotifications,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching admin notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const notification = await AdminNotification.findByPk(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({ isRead: true });
      return notification;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead() {
    try {
      await AdminNotification.update(
        { isRead: true },
        { where: { isRead: false } }
      );
      
      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats() {
    try {
      const total = await AdminNotification.count();
      const unread = await AdminNotification.count({ where: { isRead: false } });
      
      const byCategory = await AdminNotification.findAll({
        attributes: [
          'category',
          [AdminNotification.sequelize.fn('COUNT', AdminNotification.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        raw: true
      });

      const byPriority = await AdminNotification.findAll({
        attributes: [
          'priority',
          [AdminNotification.sequelize.fn('COUNT', AdminNotification.sequelize.col('id')), 'count']
        ],
        group: ['priority'],
        raw: true
      });

      return {
        total,
        unread,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = parseInt(item.count);
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async cleanupOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await AdminNotification.destroy({
        where: {
          created_at: {
            [AdminNotification.sequelize.Op.lt]: cutoffDate
          },
          isRead: true
        }
      });

      console.log(`🧹 Cleaned up ${deletedCount} old admin notifications`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = AdminNotificationService;

