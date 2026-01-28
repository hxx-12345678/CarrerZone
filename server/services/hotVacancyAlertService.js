const { User, Job, Company } = require('../models');
const { Op } = require('sequelize');

class HotVacancyAlertService {
  /**
   * Send proactive alerts to users with matching job preferences for hot vacancies
   * @param {string} jobId - The hot vacancy job ID
   * @param {Object} hotVacancyData - The hot vacancy job data
   */
  static async sendProactiveAlerts(jobId, hotVacancyData) {
    try {
      console.log(`🔥 Sending proactive alerts for hot vacancy job: ${jobId}`);
      
      // Find users with matching job preferences
      const matchingUsers = await this.findMatchingUsers(hotVacancyData);
      
      if (matchingUsers.length === 0) {
        console.log('ℹ️ No matching users found for hot vacancy alerts');
        return { success: true, alertsSent: 0, message: 'No matching users found' };
      }
      
      console.log(`📧 Found ${matchingUsers.length} matching users for hot vacancy alerts`);
      
      // Send alerts to matching users
      const alertResults = await Promise.allSettled(
        matchingUsers.map(user => this.sendAlertToUser(user, hotVacancyData))
      );
      
      const successfulAlerts = alertResults.filter(result => result.status === 'fulfilled').length;
      const failedAlerts = alertResults.filter(result => result.status === 'rejected').length;
      
      console.log(`✅ Hot vacancy alerts sent: ${successfulAlerts} successful, ${failedAlerts} failed`);
      
      return {
        success: true,
        alertsSent: successfulAlerts,
        totalUsers: matchingUsers.length,
        failedAlerts,
        message: `Alerts sent to ${successfulAlerts} users`
      };
      
    } catch (error) {
      console.error('❌ Error sending hot vacancy alerts:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send hot vacancy alerts'
      };
    }
  }
  
  /**
   * Find users with job preferences matching the hot vacancy
   * @param {Object} hotVacancyData - The hot vacancy job data
   * @returns {Array} Array of matching users
   */
  static async findMatchingUsers(hotVacancyData) {
    try {
      const {
        title,
        location,
        experienceLevel,
        skills = [],
        department,
        industryType,
        roleCategory,
        companyName
      } = hotVacancyData;
      
      // Build search criteria for matching users
      const searchCriteria = {
        userType: 'jobseeker',
        isActive: true
      };
      
      // Find users with matching preferences
      const users = await User.findAll({
        where: searchCriteria,
        attributes: ['id', 'email', 'firstName', 'lastName', 'preferences'],
        limit: 100 // Limit to prevent overwhelming the system
      });
      
      // Filter users based on job preferences matching
      const matchingUsers = users.filter(user => {
        const preferences = user.preferences || {};
        
        // Check location match
        const locationMatch = !preferences.preferredLocations || 
          preferences.preferredLocations.length === 0 ||
          preferences.preferredLocations.some(prefLocation => 
            location && location.toLowerCase().includes(prefLocation.toLowerCase())
          );
        
        // Check experience level match
        const experienceMatch = !preferences.experienceLevel ||
          this.isExperienceLevelMatch(experienceLevel, preferences.experienceLevel);
        
        // Check skills match
        const skillsMatch = !preferences.preferredSkills ||
          preferences.preferredSkills.length === 0 ||
          skills.some(skill => 
            preferences.preferredSkills.some(prefSkill =>
              skill.toLowerCase().includes(prefSkill.toLowerCase()) ||
              prefSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
        
        // Check department/industry match
        const departmentMatch = !preferences.preferredDepartments ||
          preferences.preferredDepartments.length === 0 ||
          (department && preferences.preferredDepartments.includes(department)) ||
          (industryType && preferences.preferredDepartments.includes(industryType));
        
        return locationMatch && experienceMatch && (skillsMatch || departmentMatch);
      });
      
      console.log(`🎯 Found ${matchingUsers.length} users matching hot vacancy criteria`);
      return matchingUsers;
      
    } catch (error) {
      console.error('❌ Error finding matching users:', error);
      return [];
    }
  }
  
  /**
   * Send alert to a specific user
   * @param {Object} user - User object
   * @param {Object} hotVacancyData - Hot vacancy job data
   */
  static async sendAlertToUser(user, hotVacancyData) {
    try {
      // In a real implementation, you would send email notifications here
      // For now, we'll just log the alert
      console.log(`📧 Hot vacancy alert for user ${user.email}:`, {
        jobTitle: hotVacancyData.title,
        company: hotVacancyData.companyName,
        location: hotVacancyData.location,
        isUrgent: hotVacancyData.urgentHiring,
        isSuperFeatured: hotVacancyData.superFeatured
      });
      
      // TODO: Implement actual email sending
      // await this.sendEmailNotification(user, hotVacancyData);
      
      return { success: true, userId: user.id };
      
    } catch (error) {
      console.error(`❌ Error sending alert to user ${user.email}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if experience levels match
   * @param {string} jobExperience - Job experience level
   * @param {string} userPreference - User's preferred experience level
   * @returns {boolean} Whether experience levels match
   */
  static isExperienceLevelMatch(jobExperience, userPreference) {
    if (!jobExperience || !userPreference) return true;
    
    const experienceLevels = {
      'fresher': 0,
      '0-1': 0.5,
      '1-2': 1.5,
      '2-3': 2.5,
      '3-5': 4,
      '5-7': 6,
      '7-10': 8.5,
      '10+': 10
    };
    
    const jobLevel = experienceLevels[jobExperience.toLowerCase()] || 0;
    const userLevel = experienceLevels[userPreference.toLowerCase()] || 0;
    
    // Allow some flexibility in experience matching
    return Math.abs(jobLevel - userLevel) <= 2;
  }
  
  /**
   * Send email notification (placeholder for future implementation)
   * @param {Object} user - User object
   * @param {Object} hotVacancyData - Hot vacancy job data
   */
  static async sendEmailNotification(user, hotVacancyData) {
    // TODO: Implement email sending using your preferred email service
    // This could use services like SendGrid, AWS SES, Nodemailer, etc.
    
    const emailData = {
      to: user.email,
      subject: `🔥 Hot Vacancy Alert: ${hotVacancyData.title} at ${hotVacancyData.companyName}`,
      template: 'hot-vacancy-alert',
      data: {
        userName: user.firstName,
        jobTitle: hotVacancyData.title,
        companyName: hotVacancyData.companyName,
        location: hotVacancyData.location,
        isUrgent: hotVacancyData.urgentHiring,
        isSuperFeatured: hotVacancyData.superFeatured,
        whyWorkWithUs: hotVacancyData.whyWorkWithUs,
        companyProfile: hotVacancyData.companyProfile
      }
    };
    
    console.log('📧 Email notification data:', emailData);
    // await emailService.send(emailData);
  }
  
  /**
   * Get hot vacancy statistics
   * @returns {Object} Hot vacancy statistics
   */
  static async getHotVacancyStats() {
    try {
      const totalHotVacancies = await Job.count({
        where: { isHotVacancy: true, status: 'active' }
      });
      
      const urgentHiringJobs = await Job.count({
        where: { 
          isHotVacancy: true, 
          urgentHiring: true, 
          status: 'active' 
        }
      });
      
      const superFeaturedJobs = await Job.count({
        where: { 
          isHotVacancy: true, 
          superFeatured: true, 
          status: 'active' 
        }
      });
      
      const boostedSearchJobs = await Job.count({
        where: { 
          isHotVacancy: true, 
          boostedSearch: true, 
          status: 'active' 
        }
      });
      
      return {
        totalHotVacancies,
        urgentHiringJobs,
        superFeaturedJobs,
        boostedSearchJobs,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error getting hot vacancy stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = HotVacancyAlertService;