const { Notification, User, Company, Job, Requirement } = require('../config/index');
const emailService = require('./emailService');

class NotificationService {
  /**
   * Send shortlisting notification to candidate
   * @param {string} candidateId - ID of the candidate being shortlisted
   * @param {string} employerId - ID of the employer who shortlisted
   * @param {string} jobId - ID of the job (optional)
   * @param {string} requirementId - ID of the requirement (optional)
   * @param {object} context - Additional context data
   */
  static async sendShortlistingNotification(candidateId, employerId, jobId = null, requirementId = null, context = {}) {
    try {
      // Get candidate details
      const candidate = await User.findByPk(candidateId, {
        attributes: ['id', 'first_name', 'last_name', 'email', 'user_type']
      });

      if (!candidate) {
        console.error('❌ Candidate not found for shortlisting notification:', candidateId);
        return { success: false, message: 'Candidate not found' };
      }

      // Get employer details
      const employer = await User.findByPk(employerId, {
        attributes: ['id', 'first_name', 'last_name', 'email', 'companyId'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }]
      });

      if (!employer) {
        console.error('❌ Employer not found for shortlisting notification:', employerId);
        return { success: false, message: 'Employer not found' };
      }

      // Get job or requirement details
      let jobTitle = 'a position';
      let jobDetails = null;
      let applicationUrl = '/applications';

      if (jobId) {
        const job = await Job.findByPk(jobId, {
          attributes: ['id', 'title', 'companyId'],
          include: [{
            model: Company,
            as: 'company',
            attributes: ['id', 'name']
          }]
        });
        if (job) {
          jobTitle = job.title;
          jobDetails = job;
          applicationUrl = `/applications?jobId=${jobId}`;
        }
      } else if (requirementId) {
        const requirement = await Requirement.findByPk(requirementId, {
          attributes: ['id', 'title', 'companyId'],
          include: [{
            model: Company,
            as: 'company',
            attributes: ['id', 'name']
          }]
        });
        if (requirement) {
          jobTitle = requirement.title;
          jobDetails = requirement;
          applicationUrl = `/applications?requirementId=${requirementId}`;
        }
      }

      const companyName = employer.company?.name || 'Unknown Company';
      const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();

      // Create notification data
      const notificationData = {
        userId: candidateId,
        type: 'candidate_shortlisted',
        title: `Congratulations! You've been shortlisted`,
        message: `Great news! You've been shortlisted for ${jobTitle} at ${companyName}. The employer is interested in your profile and may contact you soon.`,
        shortMessage: `Shortlisted for ${jobTitle} at ${companyName}`,
        priority: 'high',
        actionUrl: applicationUrl,
        actionText: 'View Application',
        icon: 'user-check',
        metadata: {
          employerId,
          jobId,
          requirementId,
          companyName,
          jobTitle,
          shortlistedAt: new Date().toISOString(),
          ...context
        }
      };

      // Create notification in database with graceful fallback
      let notification;
      try {
        notification = await Notification.create(notificationData);
        console.log(`✅ Shortlisting notification created for candidate ${candidateId}`);
      } catch (createErr) {
        console.error('❌ Failed to create candidate_shortlisted notification, attempting fallback:', createErr?.message || createErr);
        // Fallback to a generic application_status notification so the user still sees an alert
        const fallbackData = {
          userId: candidateId,
          type: 'application_status',
          title: `Application Status Update: Shortlisted`,
          message: `You have been shortlisted for ${jobTitle} at ${companyName}.`,
          shortMessage: `Shortlisted for ${jobTitle} at ${companyName}`,
          priority: 'high',
          actionUrl: applicationUrl,
          actionText: 'View Application',
          icon: 'user-check',
          metadata: {
            employerId,
            jobId,
            requirementId,
            companyName,
            jobTitle,
            shortlistedAt: new Date().toISOString(),
            fallback: true,
            originalType: 'candidate_shortlisted',
            ...context
          }
        };
        notification = await Notification.create(fallbackData);
        console.log(`✅ Fallback shortlisting notification created for candidate ${candidateId}`);
      }

      // Send email notification
      try {
        await this.sendShortlistingEmail(candidate, employer, jobTitle, companyName, applicationUrl, context);
        console.log(`✅ Shortlisting email sent to ${candidate.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send shortlisting email:', emailError.message);
        // Don't fail the notification if email fails
      }

      return {
        success: true,
        notificationId: notification.id,
        message: 'Shortlisting notification sent successfully'
      };

    } catch (error) {
      console.error('❌ Error sending shortlisting notification:', error);
      return {
        success: false,
        message: 'Failed to send shortlisting notification',
        error: error.message
      };
    }
  }

  /**
   * Send shortlisting email to candidate
   */
  static async sendShortlistingEmail(candidate, employer, jobTitle, companyName, applicationUrl, context = {}) {
    const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fullApplicationUrl = `${frontendUrl}${applicationUrl}`;

    const subject = `🎉 Congratulations! You've been shortlisted for ${jobTitle}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've been shortlisted!</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #f0f9ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .company-info {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Job Portal</div>
            <h1 class="title">🎉 Congratulations!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${candidateName},</p>
            
            <div class="highlight">
              <strong>Great news! You've been shortlisted for a position!</strong>
            </div>
            
            <p>We're excited to inform you that your application has caught the attention of employers and you've been shortlisted for:</p>
            
            <div class="company-info">
              <strong>Position:</strong> ${jobTitle}<br>
              <strong>Company:</strong> ${companyName}
            </div>
            
            <p>This means the employer is interested in your profile and may contact you soon for the next steps in the hiring process.</p>
            
            <div style="text-align: center;">
              <a href="${fullApplicationUrl}" class="button">View Your Application</a>
            </div>
            
            <h3>What happens next?</h3>
            <ul>
              <li>The employer may contact you directly</li>
              <li>You might be invited for an interview</li>
              <li>Keep your profile updated and resume ready</li>
              <li>Check your notifications regularly for updates</li>
            </ul>
            
            <p><strong>Pro tip:</strong> Make sure your contact information is up-to-date and your resume is current to maximize your chances of getting hired!</p>
            
            <p>Best of luck with your application!</p>
            
            <p>Best regards,<br>The Job Portal Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Job Portal. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Congratulations! You've been shortlisted!

Hello ${candidateName},

Great news! You've been shortlisted for ${jobTitle} at ${companyName}.

This means the employer is interested in your profile and may contact you soon for the next steps in the hiring process.

What happens next?
- The employer may contact you directly
- You might be invited for an interview
- Keep your profile updated and resume ready
- Check your notifications regularly for updates

View your application: ${fullApplicationUrl}

Best of luck with your application!

Best regards,
The Job Portal Team

© 2024 Job Portal. All rights reserved.
This is an automated notification. Please do not reply to this email.
    `;

    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_FROM || 'noreply@jobportal.com'}>`,
      to: candidate.email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    return await emailService.sendMail(mailOptions);
  }

  /**
   * Remove shortlisting notification when candidate is unshortlisted
   * @param {string} candidateId - ID of the candidate being unshortlisted
   * @param {string} employerId - ID of the employer who unshortlisted
   * @param {string} jobId - ID of the job (optional)
   * @param {string} requirementId - ID of the requirement (optional)
   * @param {object} context - Additional context data
   */
  static async removeShortlistingNotification(candidateId, employerId, jobId = null, requirementId = null, context = {}) {
    try {
      console.log(`🔔 Removing shortlisting notification for candidate ${candidateId} by employer ${employerId}`);
      
      // Find and remove shortlisting notifications
      const notificationType = jobId ? 'application_shortlisted' : 'candidate_shortlisted';
      
      const notifications = await Notification.findAll({
        where: {
          userId: candidateId,
          type: notificationType,
          isRead: false // Only remove unread notifications
        }
      });

      let removedCount = 0;
      for (const notification of notifications) {
        // Check if the notification is for the same employer and job/requirement
        if (notification.metadata) {
          const metadata = typeof notification.metadata === 'string' 
            ? JSON.parse(notification.metadata) 
            : notification.metadata;
          
          const isMatchingEmployer = metadata.employerId === employerId;
          const isMatchingJob = jobId ? metadata.jobId === jobId : true;
          const isMatchingRequirement = requirementId ? metadata.requirementId === requirementId : true;
          const isMatchingApplication = context?.applicationId ? metadata.applicationId === context.applicationId : true;
          
          if (isMatchingEmployer && isMatchingJob && isMatchingRequirement && isMatchingApplication) {
            await notification.destroy();
            removedCount++;
            console.log(`✅ Removed shortlisting notification ${notification.id} for candidate ${candidateId}`);
          }
        }
      }

      console.log(`✅ Removed ${removedCount} shortlisting notifications for candidate ${candidateId}`);
      return { success: true, removedCount };

    } catch (error) {
      console.error(`❌ Error removing shortlisting notification for candidate ${candidateId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application status change notification
   */
  static async sendApplicationStatusNotification(candidateId, employerId, applicationId, oldStatus, newStatus, context = {}) {
    try {
      // Get candidate details
      const candidate = await User.findByPk(candidateId, {
        attributes: ['id', 'first_name', 'last_name', 'email']
      });

      if (!candidate) {
        console.error('❌ Candidate not found for status notification:', candidateId);
        return { success: false, message: 'Candidate not found' };
      }

      // Get employer details
      const employer = await User.findByPk(employerId, {
        attributes: ['id', 'first_name', 'last_name', 'companyId'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }]
      });

      if (!employer) {
        console.error('❌ Employer not found for status notification:', employerId);
        return { success: false, message: 'Employer not found' };
      }

      const companyName = employer.company?.name || 'Unknown Company';
      const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();

      // Create notification based on status with de-duplication for shortlist
      let notificationData = {};
      
      if (newStatus === 'shortlisted') {
        // Get job title for better notification
        let jobTitle = 'a position';
        if (context.jobId) {
          try {
            const job = await Job.findByPk(context.jobId, {
              attributes: ['title']
            });
            if (job) {
              jobTitle = job.title;
            }
          } catch (jobError) {
            console.error('Error fetching job title:', jobError);
          }
        }

        notificationData = {
          userId: candidateId,
          type: 'application_shortlisted',
          title: `🎉 Congratulations! You've been shortlisted!`,
          message: `Great news! You've been shortlisted for ${jobTitle} at ${companyName}. The employer is interested in your profile and may contact you soon.`,
          shortMessage: `Shortlisted for ${jobTitle} at ${companyName}`,
          priority: 'high',
          actionUrl: '/applications',
          actionText: 'View Applications',
          icon: 'user-check',
          metadata: {
            employerId,
            applicationId,
            oldStatus,
            newStatus,
            companyName,
            jobTitle,
            updatedAt: new Date().toISOString(),
            ...context
          }
        };

        // De-duplicate existing unread shortlist notification for same employer+application
        try {
          const existing = await Notification.findOne({
            where: {
              userId: candidateId,
              type: 'application_shortlisted',
              isRead: false
            },
            order: [['createdAt', 'DESC']]
          });
          if (existing) {
            const meta = typeof existing.metadata === 'string' ? JSON.parse(existing.metadata) : existing.metadata;
            if (meta?.employerId === employerId && meta?.applicationId === applicationId) {
              await existing.update({
                title: notificationData.title,
                message: notificationData.message,
                shortMessage: notificationData.shortMessage,
                priority: notificationData.priority,
                actionUrl: notificationData.actionUrl,
                actionText: notificationData.actionText,
                icon: notificationData.icon,
                metadata: { ...meta, ...notificationData.metadata },
                updatedAt: new Date()
              });
              console.log('ℹ️ Updated existing shortlist notification instead of creating duplicate');
              return { success: true, notificationId: existing.id, message: 'Shortlist notification updated' };
            }
          }
        } catch (dedupeErr) {
          console.warn('Shortlist notification de-duplication check failed:', dedupeErr?.message || dedupeErr);
        }
      } else {
        notificationData = {
          userId: candidateId,
          type: 'application_status',
          title: `Application Status Update`,
          message: `Your application status has been updated to "${newStatus}" for a position at ${companyName}.`,
          shortMessage: `Application status: ${newStatus} at ${companyName}`,
          priority: 'medium',
          actionUrl: '/applications',
          actionText: 'View Applications',
          icon: 'check-circle',
          metadata: {
            employerId,
            applicationId,
            oldStatus,
            newStatus,
            companyName,
            updatedAt: new Date().toISOString(),
            ...context
          }
        };
      }

      // Create notification in database with fallback for enum issues
      let notification;
      try {
        notification = await Notification.create(notificationData);
      } catch (createErr) {
        console.error('❌ Failed to create application_shortlisted notification, attempting fallback:', createErr?.message || createErr);
        const fallbackData = {
          userId: candidateId,
          type: 'application_status',
          title: `Application Status Update: Shortlisted`,
          message: `You have been shortlisted for ${jobTitle} at ${companyName}.`,
          shortMessage: `Shortlisted for ${jobTitle} at ${companyName}`,
          priority: 'high',
          actionUrl: '/applications',
          actionText: 'View Applications',
          icon: 'user-check',
          metadata: {
            employerId,
            applicationId,
            oldStatus,
            newStatus,
            companyName,
            jobTitle,
            updatedAt: new Date().toISOString(),
            fallback: true,
            originalType: 'application_shortlisted',
            ...context
          }
        };
        notification = await Notification.create(fallbackData);
      }

      console.log(`✅ Application status notification created for candidate ${candidateId}`);
      console.log(`📋 Notification details:`, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        userId: notification.userId,
        priority: notification.priority
      });

      // Send email notification for shortlisting
      if (newStatus === 'shortlisted') {
        try {
          // Get job details for email
          const job = await Job.findByPk(context.jobId, {
            attributes: ['id', 'title', 'companyId'],
            include: [{
              model: Company,
              as: 'company',
              attributes: ['id', 'name']
            }]
          });

          if (job) {
            await this.sendShortlistingEmail(
              candidate,
              employer,
              job.title,
              companyName,
              '/applications',
              {
                applicationId,
                jobId: context.jobId,
                ...context
              }
            );
            console.log(`✅ Shortlisting email sent to ${candidate.email}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send shortlisting email:', emailError.message);
          // Don't fail the notification if email fails
        }
      }

      return {
        success: true,
        notificationId: notification.id,
        message: 'Application status notification sent successfully'
      };

    } catch (error) {
      console.error('❌ Error sending application status notification:', error);
      return {
        success: false,
        message: 'Failed to send application status notification',
        error: error.message
      };
    }
  }

  /**
   * Send preferred job notification to jobseekers
   * @param {string} jobId - ID of the newly posted job
   * @param {object} jobData - Job data including title, company, location, etc.
   * @param {array} matchingUserIds - Array of user IDs who have matching preferences
   */
  static async sendPreferredJobNotification(jobId, jobData, matchingUserIds) {
    try {
      if (!matchingUserIds || matchingUserIds.length === 0) {
        console.log('📝 No matching users found for job preferences');
        return { success: true, message: 'No matching users found' };
      }

      console.log(`🔔 Sending preferred job notifications for job ${jobId} to ${matchingUserIds.length} users`);

      // Create notification data for each matching user
      const notifications = matchingUserIds.map(userId => ({
        userId,
        type: 'preferred_job_posted',
        title: `🎯 New Job Matching Your Preferences!`,
        message: `A new job "${jobData.title}" at ${jobData.companyName} in ${jobData.location} has been posted that matches your job preferences. Don't miss this opportunity!`,
        shortMessage: `New job: ${jobData.title} at ${jobData.companyName}`,
        priority: 'high',
        actionUrl: `/jobs/${jobId}`,
        actionText: 'View Job',
        icon: 'star',
        metadata: {
          jobId,
          jobTitle: jobData.title,
          companyName: jobData.companyName,
          location: jobData.location,
          salary: jobData.salary,
          jobType: jobData.jobType,
          experienceLevel: jobData.experienceLevel,
          postedAt: new Date().toISOString(),
          isPreferred: true
        }
      }));

      // Send bulk notifications
      const result = await this.sendBulkNotifications(notifications);

      console.log(`✅ Preferred job notifications sent: ${result.successful} successful, ${result.failed} failed`);

      return {
        success: true,
        notificationsSent: result.successful,
        notificationsFailed: result.failed,
        totalUsers: matchingUserIds.length
      };

    } catch (error) {
      console.error('❌ Error sending preferred job notifications:', error);
      return {
        success: false,
        message: 'Failed to send preferred job notifications',
        error: error.message
      };
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(notifications) {
    try {
      const results = await Promise.allSettled(
        notifications.map(notification => Notification.create(notification))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`✅ Bulk notifications: ${successful} successful, ${failed} failed`);

      return {
        success: true,
        successful,
        failed,
        total: notifications.length
      };
    } catch (error) {
      console.error('❌ Error sending bulk notifications:', error);
      return {
        success: false,
        message: 'Failed to send bulk notifications',
        error: error.message
      };
    }
  }
}

module.exports = NotificationService;
