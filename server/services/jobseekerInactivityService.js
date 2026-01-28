/**
 * Jobseeker Inactivity Management Service
 * Handles automatic marking of jobseekers as inactive after 4 months of inactivity
 * Sends email reminders every 3 months to encourage re-engagement
 */

const { sequelize } = require('../config/sequelize');
const { Op } = require('sequelize');
const User = require('../models/User');
const UserActivityLog = require('../models/UserActivityLog');
const UserSession = require('../models/UserSession');
const emailService = require('./emailService');

class JobseekerInactivityService {
  
  /**
   * Check and mark inactive jobseekers
   * Runs daily to check for jobseekers who haven't been active for 4+ months
   */
  static async checkAndMarkInactiveJobseekers() {
    try {
      console.log('🔍 Checking for inactive jobseekers...');
      
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      
      // Find jobseekers who haven't been active for 4+ months
      const inactiveJobseekers = await User.findAll({
        where: {
          user_type: 'jobseeker',
          account_status: 'active',
          [Op.or]: [
            { last_login_at: { [Op.lt]: fourMonthsAgo } },
            { last_login_at: null }
          ]
        },
        attributes: ['id', 'email', 'first_name', 'last_name', 'last_login_at']
      });

      console.log(`📊 Found ${inactiveJobseekers.length} potentially inactive jobseekers`);

      let markedInactive = 0;
      
      for (const jobseeker of inactiveJobseekers) {
        // Double-check with activity logs for more accurate inactivity detection
        const lastActivity = await UserActivityLog.findOne({
          where: { userId: jobseeker.id },
          order: [['timestamp', 'DESC']],
          attributes: ['timestamp']
        });

        const lastActivityDate = lastActivity?.timestamp || jobseeker.last_login_at;
        
        if (!lastActivityDate || lastActivityDate < fourMonthsAgo) {
          // Mark as inactive
          await jobseeker.update({
            account_status: 'inactive',
            is_active: false
          });

          // Log the inactivity action
          await UserActivityLog.create({
            userId: jobseeker.id,
            activityType: 'account_inactive',
            details: {
              reason: 'inactivity_4_months',
              lastActivityDate: lastActivityDate,
              markedInactiveAt: new Date()
            },
            timestamp: new Date()
          });

          console.log(`✅ Marked jobseeker as inactive: ${jobseeker.email}`);
          markedInactive++;
        }
      }

      console.log(`🎯 Marked ${markedInactive} jobseekers as inactive`);
      return { checked: inactiveJobseekers.length, markedInactive };

    } catch (error) {
      console.error('❌ Error checking inactive jobseekers:', error);
      throw error;
    }
  }

  /**
   * Send inactivity reminder emails to jobseekers
   * Runs every 3 months to send re-engagement emails
   */
  static async sendInactivityReminderEmails() {
    try {
      console.log('📧 Sending inactivity reminder emails...');
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Find jobseekers who haven't been active for 3-6 months (reminder range)
      const jobseekersForReminder = await User.findAll({
        where: {
          user_type: 'jobseeker',
          account_status: 'active',
          [Op.or]: [
            { last_login_at: { [Op.between]: [sixMonthsAgo, threeMonthsAgo] } },
            { last_login_at: { [Op.lt]: threeMonthsAgo } }
          ]
        },
        attributes: ['id', 'email', 'first_name', 'last_name', 'last_login_at']
      });

      console.log(`📊 Found ${jobseekersForReminder.length} jobseekers for reminder emails`);

      let emailsSent = 0;
      
      for (const jobseeker of jobseekersForReminder) {
        try {
          await this.sendInactivityReminderEmail(jobseeker);
          emailsSent++;
          console.log(`✅ Sent reminder email to: ${jobseeker.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${jobseeker.email}:`, emailError);
        }
      }

      console.log(`📧 Sent ${emailsSent} reminder emails`);
      return { total: jobseekersForReminder.length, sent: emailsSent };

    } catch (error) {
      console.error('❌ Error sending reminder emails:', error);
      throw error;
    }
  }

  /**
   * Send a single inactivity reminder email
   */
  static async sendInactivityReminderEmail(jobseeker) {
    const firstName = jobseeker.first_name || 'Job Seeker';
    const lastLogin = jobseeker.last_login_at ? 
      new Date(jobseeker.last_login_at).toLocaleDateString() : 'Never';
    
    const subject = '🚀 Don\'t Miss Out on Your Dream Job - Reactivate Your Account!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reactivate Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .cta-button:hover { background: #218838; }
          .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome Back, ${firstName}!</h1>
            <p>Your dream job is waiting for you</p>
          </div>
          
          <div class="content">
            <h2>Don't Miss Out on Amazing Opportunities!</h2>
            
            <p>Hi ${firstName},</p>
            
            <p>We noticed you haven't visited our job portal since <strong>${lastLogin}</strong>. 
            While you've been away, we've been busy adding thousands of new job opportunities 
            that could be perfect for your career goals!</p>
            
            <div class="highlight">
              <h3>🔥 What You're Missing:</h3>
              <ul>
                <li><strong>5,000+</strong> new job postings in the last 3 months</li>
                <li><strong>500+</strong> companies actively hiring</li>
                <li><strong>AI-powered</strong> job matching technology</li>
                <li><strong>Exclusive</strong> opportunities from top employers</li>
                <li><strong>Career guidance</strong> and resume optimization tools</li>
              </ul>
            </div>
            
            <div class="stats">
              <h3>📈 Your Account Status</h3>
              <p><strong>Last Login:</strong> ${lastLogin}</p>
              <p><strong>Account Status:</strong> <span style="color: #ffc107;">Inactive</span></p>
              <p><strong>Action Required:</strong> Simple login to reactivate</p>
            </div>
            
            <p>It only takes 30 seconds to reactivate your account and start discovering 
            your next career opportunity. Don't let another day pass by!</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="cta-button">
                🚀 Reactivate My Account Now
              </a>
            </div>
            
            <h3>💡 Pro Tips for Job Search Success:</h3>
            <ul>
              <li>Update your profile to attract more recruiters</li>
              <li>Set up job alerts for instant notifications</li>
              <li>Use our AI resume builder for better applications</li>
              <li>Follow companies you're interested in</li>
              <li>Apply within 24 hours of job posting for best results</li>
            </ul>
            
            <p>If you have any questions or need assistance, our support team is here to help!</p>
            
            <p>Best regards,<br>
            The Job Portal Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent because your account has been inactive for 3+ months.</p>
            <p>If you no longer wish to receive these emails, you can update your preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome Back, ${firstName}!
      
      Don't Miss Out on Amazing Opportunities!
      
      Hi ${firstName},
      
      We noticed you haven't visited our job portal since ${lastLogin}. 
      While you've been away, we've been busy adding thousands of new job opportunities 
      that could be perfect for your career goals!
      
      What You're Missing:
      - 5,000+ new job postings in the last 3 months
      - 500+ companies actively hiring
      - AI-powered job matching technology
      - Exclusive opportunities from top employers
      - Career guidance and resume optimization tools
      
      Your Account Status:
      - Last Login: ${lastLogin}
      - Account Status: Inactive
      - Action Required: Simple login to reactivate
      
      It only takes 30 seconds to reactivate your account and start discovering 
      your next career opportunity. Don't let another day pass by!
      
      Reactivate your account: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
      
      Pro Tips for Job Search Success:
      - Update your profile to attract more recruiters
      - Set up job alerts for instant notifications
      - Use our AI resume builder for better applications
      - Follow companies you're interested in
      - Apply within 24 hours of job posting for best results
      
      If you have any questions or need assistance, our support team is here to help!
      
      Best regards,
      The Job Portal Team
    `;

    await emailService.sendEmail({
      to: jobseeker.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    // Log the email sent
    await UserActivityLog.create({
      userId: jobseeker.id,
      activityType: 'inactivity_reminder_sent',
      details: {
        emailType: 'inactivity_reminder',
        lastLoginDate: jobseeker.last_login_at,
        sentAt: new Date()
      },
      timestamp: new Date()
    });
  }

  /**
   * Reactivate a jobseeker account (when they log back in)
   */
  static async reactivateJobseekerAccount(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (user && user.account_status === 'inactive' && user.user_type === 'jobseeker') {
        await user.update({
          account_status: 'active',
          is_active: true
        });

        // Log the reactivation
        await UserActivityLog.create({
          userId: userId,
          activityType: 'account_reactivated',
          details: {
            reason: 'user_login',
            reactivatedAt: new Date()
          },
          timestamp: new Date()
        });

        console.log(`✅ Reactivated jobseeker account: ${user.email}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error reactivating account:', error);
      throw error;
    }
  }

  /**
   * Get inactivity statistics
   */
  static async getInactivityStats() {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      const stats = await sequelize.query(`
        SELECT 
          COUNT(CASE WHEN account_status = 'inactive' AND user_type = 'jobseeker' THEN 1 END) as inactive_jobseekers,
          COUNT(CASE WHEN account_status = 'active' AND user_type = 'jobseeker' AND last_login_at < :fourMonthsAgo THEN 1 END) as potentially_inactive,
          COUNT(CASE WHEN account_status = 'active' AND user_type = 'jobseeker' AND last_login_at < :threeMonthsAgo THEN 1 END) as need_reminder
        FROM users
      `, {
        replacements: { threeMonthsAgo, fourMonthsAgo },
        type: sequelize.QueryTypes.SELECT
      });

      return stats[0];
    } catch (error) {
      console.error('❌ Error getting inactivity stats:', error);
      throw error;
    }
  }
}

module.exports = JobseekerInactivityService;
