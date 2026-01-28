/**
 * Job Alert Email Service
 * Processes job alerts and sends email notifications with matching jobs
 */

const { Op } = require('sequelize');
const { JobAlert, Job, User, Company } = require('../config/index');
const emailService = require('./emailService');

class JobAlertEmailService {
  /**
   * Process all due job alerts and send emails
   * Called by cron job daily
   */
  static async processAllAlerts() {
    try {
      console.log('📧 Processing job alerts...');
      
      const now = new Date();
      
      // Find all active alerts that are due to be sent
      const dueAlerts = await JobAlert.findAll({
        where: {
          isActive: true,
          emailEnabled: true,
          [Op.or]: [
            { nextSendAt: { [Op.lte]: now } },
            { nextSendAt: null }
          ]
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name', 'region']
        }],
        order: [['next_send_at', 'ASC']]
      });
      
      console.log(`📊 Found ${dueAlerts.length} alerts due for processing`);
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const alert of dueAlerts) {
        try {
          const result = await this.processAlert(alert);
          if (result.success) {
            successCount++;
            console.log(`✅ Alert "${alert.name}" processed successfully (${result.jobCount} jobs found)`);
          } else {
            failureCount++;
            console.error(`❌ Alert "${alert.name}" failed:`, result.error);
          }
        } catch (error) {
          failureCount++;
          console.error(`❌ Error processing alert ${alert.id}:`, error.message);
        }
      }
      
      console.log(`📧 Job alerts processing complete: ${successCount} succeeded, ${failureCount} failed`);
      
      return {
        total: dueAlerts.length,
        success: successCount,
        failed: failureCount
      };
    } catch (error) {
      console.error('❌ Error processing job alerts:', error);
      throw error;
    }
  }
  
  /**
   * Process a single alert and send email if jobs found
   */
  static async processAlert(alert) {
    try {
      // Find matching jobs for this alert
      const matchingJobs = await this.findMatchingJobs(alert);
      
      // Only send email if jobs found
      if (matchingJobs.length === 0) {
        console.log(`ℹ️ No matching jobs found for alert "${alert.name}"`);
        
        // Still update nextSendAt to schedule next check
        await this.updateNextSendAt(alert);
        
        return {
          success: true,
          jobCount: 0,
          emailSent: false,
          reason: 'No matching jobs found'
        };
      }
      
      // Limit to maxResults
      const jobsToSend = matchingJobs.slice(0, alert.maxResults || 10);
      
      // Get user info
      const user = alert.user || await User.findByPk(alert.userId, {
        attributes: ['id', 'email', 'first_name', 'last_name', 'region']
      });
      
      if (!user) {
        throw new Error('User not found for alert');
      }
      
      // Send email
      const emailResult = await this.sendJobAlertEmail(
        user,
        alert,
        jobsToSend,
        matchingJobs.length
      );
      
      // Update alert: set lastSentAt and calculate nextSendAt
      await alert.update({
        lastSentAt: new Date(),
        ...this.calculateNextSendAt(alert.frequency)
      });
      
      return {
        success: true,
        jobCount: jobsToSend.length,
        totalMatches: matchingJobs.length,
        emailSent: emailResult.success,
        messageId: emailResult.messageId
      };
      
    } catch (error) {
      console.error(`❌ Error processing alert ${alert.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Find jobs matching alert criteria
   */
  static async findMatchingJobs(alert) {
    try {
      const whereClause = {
        status: 'active'
      };
      
      // Region filter (match user's region or alert's implicit region)
      const user = alert.user || await User.findByPk(alert.userId);
      if (user && user.region) {
        whereClause.region = user.region;
      }
      
      // Keywords filter
      if (alert.keywords && Array.isArray(alert.keywords) && alert.keywords.length > 0) {
        whereClause[Op.or] = [
          ...whereClause[Op.or] || [],
          {
            title: {
              [Op.iLike]: {
                [Op.any]: alert.keywords.map(kw => `%${kw}%`)
              }
            }
          },
          {
            description: {
              [Op.iLike]: {
                [Op.any]: alert.keywords.map(kw => `%${kw}%`)
              }
            }
          }
        ];
      }
      
      // Location filter
      if (alert.locations && Array.isArray(alert.locations) && alert.locations.length > 0) {
        whereClause.location = {
          [Op.iLike]: {
            [Op.any]: alert.locations.map(loc => `%${loc}%`)
          }
        };
      }
      
      // Job type filter
      if (alert.jobType && Array.isArray(alert.jobType) && alert.jobType.length > 0) {
        whereClause.jobType = {
          [Op.in]: alert.jobType
        };
      }
      
      // Experience level filter
      if (alert.experienceLevel) {
        // Map alert experience to job experience enum values
        // Valid Job enum: 'entry', 'junior', 'mid', 'senior', 'lead', 'executive'
        const experienceMap = {
          'entry': ['entry'],
          'junior': ['junior', 'entry'], // Include entry as fallback
          'mid': ['mid'],
          'senior': ['senior', 'mid'], // Include mid as fallback
          'executive': ['executive', 'lead', 'senior'] // Include lead and senior as fallback
        };
        
        const mappedLevels = experienceMap[alert.experienceLevel] || [alert.experienceLevel];
        // Only use valid enum values
        const validEnumValues = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'];
        const filteredLevels = mappedLevels.filter(level => validEnumValues.includes(level));
        
        if (filteredLevels.length > 0) {
          whereClause.experienceLevel = {
            [Op.in]: filteredLevels
          };
        }
      }
      
      // Salary filter
      if (alert.salaryMin || alert.salaryMax) {
        whereClause[Op.and] = [
          ...whereClause[Op.and] || [],
          {
            [Op.or]: [
              {
                salaryMin: alert.salaryMin ? { [Op.gte]: alert.salaryMin } : undefined
              },
              {
                salaryMax: alert.salaryMax ? { [Op.lte]: alert.salaryMax } : undefined
              }
            ].filter(Boolean)
          }
        ];
      }
      
      // Remote work filter
      if (alert.remoteWork && alert.remoteWork !== 'any') {
        if (Array.isArray(alert.remoteWork)) {
          whereClause.remoteWork = {
            [Op.in]: alert.remoteWork
          };
        } else {
          whereClause.remoteWork = alert.remoteWork;
        }
      }
      
      // Categories filter (if stored in metadata or other fields)
      if (alert.categories && Array.isArray(alert.categories) && alert.categories.length > 0) {
        // This would need to match against job category or industry fields
        // Implementation depends on your job schema
      }
      
      // Fetch matching jobs
      // Note: We'll fetch company data separately to avoid association issues
      const jobs = await Job.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: alert.maxResults ? Math.min(alert.maxResults * 2, 50) : 50 // Get more for filtering
      });
      
      // Fetch company data for each job separately
      if (jobs.length > 0) {
        const companyIds = [...new Set(jobs.map(j => j.companyId).filter(Boolean))];
        const companies = await Company.findAll({
          where: { id: { [Op.in]: companyIds } },
          attributes: ['id', 'name', 'logo', 'industries']
        });
        
        const companyMap = {};
        companies.forEach(c => {
          companyMap[c.id] = {
            id: c.id,
            name: c.name,
            logo: c.logo,
            industries: c.industries
          };
        });
        
        // Attach company data to each job
        jobs.forEach(job => {
          job.company = companyMap[job.companyId] || null;
        });
      }
      
      // Additional client-side filtering for complex criteria
      const filteredJobs = jobs.filter(job => {
        // Additional keyword matching in description/skills
        if (alert.keywords && alert.keywords.length > 0) {
          const jobText = `${job.title} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();
          const hasKeyword = alert.keywords.some(kw => 
            jobText.includes(kw.toLowerCase())
          );
          if (!hasKeyword) return false;
        }
        
        return true;
      });
      
      return filteredJobs;
      
    } catch (error) {
      console.error('Error finding matching jobs:', error);
      return [];
    }
  }
  
  /**
   * Send job alert email to user
   */
  static async sendJobAlertEmail(user, alert, jobs, totalMatches) {
    try {
      const userName = user.first_name || user.firstName || 'Job Seeker';
      const userEmail = user.email;
      
      const subject = `🎯 ${jobs.length} New Job${jobs.length > 1 ? 's' : ''} Matching "${alert.name}"`;
      
      const htmlContent = this.getJobAlertEmailTemplate(userName, alert, jobs, totalMatches);
      const textContent = this.getJobAlertEmailText(userName, alert, jobs, totalMatches);
      
      const mailOptions = {
        from: `"Job Portal Alerts" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@jobportal.com'}>`,
        to: userEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      };
      
      const result = await emailService.sendMail(mailOptions);
      
      console.log(`✅ Job alert email sent to ${userEmail} for alert "${alert.name}"`);
      
      return {
        success: true,
        messageId: result.messageId
      };
      
    } catch (error) {
      console.error(`❌ Error sending job alert email to ${user.email}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate next send date based on frequency
   */
  static calculateNextSendAt(frequency) {
    const nextSendAt = new Date();
    
    switch (frequency) {
      case 'daily':
        nextSendAt.setDate(nextSendAt.getDate() + 1);
        break;
      case 'weekly':
        nextSendAt.setDate(nextSendAt.getDate() + 7);
        break;
      case 'monthly':
        nextSendAt.setMonth(nextSendAt.getMonth() + 1);
        break;
      default:
        nextSendAt.setDate(nextSendAt.getDate() + 7); // Default to weekly
    }
    
    return { nextSendAt };
  }
  
  /**
   * Update nextSendAt for an alert
   */
  static async updateNextSendAt(alert) {
    const nextSendData = this.calculateNextSendAt(alert.frequency);
    await alert.update(nextSendData);
  }
  
  /**
   * Get HTML email template for job alerts
   */
  static getJobAlertEmailTemplate(userName, alert, jobs, totalMatches) {
    const jobsList = jobs.map((job, index) => {
      const companyName = job.company?.name || 'Company';
      const location = job.location || 'Location not specified';
      const salary = job.salary || (job.salaryMin && job.salaryMax 
        ? `${job.salaryCurrency || 'INR'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
        : 'Not specified');
      const jobUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.id}`;
      const postedDate = job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently';
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">
              <a href="${jobUrl}" style="color: #2563eb; text-decoration: none;">${job.title}</a>
            </h3>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
              <strong>${companyName}</strong> • ${location}
            </p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
              💰 ${salary} • 📅 Posted ${postedDate}
            </p>
            ${job.description ? `<p style="margin: 10px 0 0 0; color: #374151; font-size: 14px; line-height: 1.5;">${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}</p>` : ''}
            <a href="${jobUrl}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">View Job</a>
          </td>
        </tr>
      `;
    }).join('');
    
    const alertCriteria = [];
    if (alert.keywords && alert.keywords.length > 0) {
      alertCriteria.push(`<strong>Keywords:</strong> ${alert.keywords.join(', ')}`);
    }
    if (alert.locations && alert.locations.length > 0) {
      alertCriteria.push(`<strong>Locations:</strong> ${alert.locations.join(', ')}`);
    }
    if (alert.jobType && alert.jobType.length > 0) {
      alertCriteria.push(`<strong>Job Types:</strong> ${alert.jobType.join(', ')}`);
    }
    if (alert.experienceLevel) {
      alertCriteria.push(`<strong>Experience:</strong> ${alert.experienceLevel}`);
    }
    if (alert.salaryMin || alert.salaryMax) {
      alertCriteria.push(`<strong>Salary:</strong> ${alert.salaryMin ? `${alert.currency || 'INR'} ${alert.salaryMin.toLocaleString()}` : ''} ${alert.salaryMin && alert.salaryMax ? '-' : ''} ${alert.salaryMax ? `${alert.currency || 'INR'} ${alert.salaryMax.toLocaleString()}` : ''}`);
    }
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Alert: ${alert.name}</title>
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
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 22px;
            margin: 10px 0;
          }
          .alert-info {
            background-color: #eff6ff;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
          }
          .alert-info p {
            margin: 5px 0;
            font-size: 14px;
            color: #374151;
          }
          .jobs-list {
            margin: 20px 0;
          }
          .jobs-table {
            width: 100%;
            border-collapse: collapse;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .cta-button {
            display: inline-block;
            margin: 20px 0;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Job Portal</div>
            <h1 class="title">🎯 Your Job Alert: ${alert.name}</h1>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p>Hello ${userName},</p>
            <p>We found <strong>${jobs.length} new job${jobs.length > 1 ? 's' : ''}</strong> matching your alert criteria. ${totalMatches > jobs.length ? `(Showing ${jobs.length} of ${totalMatches} matches)` : ''}</p>
          </div>
          
          <div class="alert-info">
            <p><strong>Your Alert Criteria:</strong></p>
            ${alertCriteria.length > 0 ? `<p>${alertCriteria.join(' • ')}</p>` : '<p>All jobs matching your preferences</p>'}
            <p><strong>Frequency:</strong> ${alert.frequency} • <strong>Next update:</strong> ${new Date(this.calculateNextSendAt(alert.frequency).nextSendAt).toLocaleDateString()}</p>
          </div>
          
          <div class="jobs-list">
            <table class="jobs-table">
              ${jobsList}
            </table>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs" class="cta-button">Browse All Jobs</a>
            <br>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/job-alerts" style="color: #2563eb; text-decoration: underline; font-size: 14px;">Manage Your Alerts</a>
          </div>
          
          <div class="footer">
            <p>You're receiving this email because you have an active job alert: "${alert.name}"</p>
            <p>To stop receiving these emails, <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/job-alerts">manage your alerts</a> or unsubscribe from this alert.</p>
            <p>© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Get plain text email template
   */
  static getJobAlertEmailText(userName, alert, jobs, totalMatches) {
    const jobsList = jobs.map((job, index) => {
      const companyName = job.company?.name || 'Company';
      const location = job.location || 'Location not specified';
      const salary = job.salary || 'Not specified';
      const jobUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.id}`;
      
      return `
${index + 1}. ${job.title}
   Company: ${companyName}
   Location: ${location}
   Salary: ${salary}
   View: ${jobUrl}
`;
    }).join('\n');
    
    return `
Job Alert: ${alert.name}

Hello ${userName},

We found ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching your alert criteria. ${totalMatches > jobs.length ? `(Showing ${jobs.length} of ${totalMatches} matches)` : ''}

Your Alert Criteria:
${alert.keywords && alert.keywords.length > 0 ? `Keywords: ${alert.keywords.join(', ')}\n` : ''}${alert.locations && alert.locations.length > 0 ? `Locations: ${alert.locations.join(', ')}\n` : ''}${alert.jobType && alert.jobType.length > 0 ? `Job Types: ${alert.jobType.join(', ')}\n` : ''}${alert.experienceLevel ? `Experience: ${alert.experienceLevel}\n` : ''}${alert.salaryMin || alert.salaryMax ? `Salary: ${alert.salaryMin ? `${alert.currency || 'INR'} ${alert.salaryMin.toLocaleString()}` : ''} ${alert.salaryMin && alert.salaryMax ? '-' : ''} ${alert.salaryMax ? `${alert.currency || 'INR'} ${alert.salaryMax.toLocaleString()}` : ''}\n` : ''}
Matching Jobs:
${jobsList}

Browse all jobs: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs
Manage your alerts: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/job-alerts

You're receiving this email because you have an active job alert: "${alert.name}"
To stop receiving these emails, visit your alerts page to unsubscribe.

© ${new Date().getFullYear()} Job Portal. All rights reserved.
    `;
  }
}

module.exports = JobAlertEmailService;

