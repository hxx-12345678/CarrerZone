const cron = require('node-cron');
const { Op } = require('sequelize');
const emailService = require('./emailService');

// Lazy load models to avoid errors if table doesn't exist
let AgencyClientAuthorization, Company, User;
try {
  const models = require('../models');
  AgencyClientAuthorization = models.AgencyClientAuthorization;
  Company = models.Company;
  User = models.User;
} catch (error) {
  console.warn('⚠️ Could not load models for contract expiry service:', error.message);
}

class ContractExpiryService {
  constructor() {
    this.cronJob = null;
  }

  /**
   * Start the contract expiry monitoring cron job
   * Runs daily at midnight to check for expired contracts
   */
  start() {
    // Run every day at midnight (00:00)
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      console.log('🕐 Running contract expiry check...');
      try {
        // Check if table exists before running
        const tableExists = await this.tableExists();
        if (!tableExists) {
          console.log('ℹ️  Skipping contract expiry service: agency_client_authorizations table does not exist');
          return;
        }
        
        await this.checkAndExpireContracts();
        await this.sendExpiryReminders();
      } catch (error) {
        // Only log errors that aren't about missing table
        if (!(error.name === 'SequelizeDatabaseError' && error.original && error.original.code === '42P01')) {
          console.error('❌ Error in contract expiry service:', error);
        } else {
          console.log('ℹ️  Contract expiry service skipped: agency_client_authorizations table does not exist');
        }
      }
    });

    console.log('✅ Contract expiry service started (runs daily at midnight)');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Contract expiry service stopped');
    }
  }

  /**
   * Check if the agency_client_authorizations table exists
   */
  async tableExists() {
    try {
      const { sequelize } = require('../config/sequelize');
      const [results] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'agency_client_authorizations'
        );
      `);
      return results && results[0] && results[0].exists === true;
    } catch (error) {
      console.warn('⚠️ Error checking if agency_client_authorizations table exists:', error.message);
      return false;
    }
  }

  /**
   * Check for expired contracts and update their status
   */
  async checkAndExpireContracts() {
    try {
      // Check if table exists before proceeding
      const tableExists = await this.tableExists();
      if (!tableExists) {
        console.log('ℹ️  Skipping contract expiry check: agency_client_authorizations table does not exist');
        return {
          success: true,
          expiredCount: 0,
          skipped: true,
          reason: 'Table does not exist'
        };
      }

      // Ensure models are loaded
      if (!AgencyClientAuthorization || !Company || !User) {
        console.log('ℹ️  Skipping contract expiry check: Models not available');
        return {
          success: true,
          expiredCount: 0,
          skipped: true,
          reason: 'Models not available'
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day

      // Find all active authorizations with expired contracts
      const expiredAuthorizations = await AgencyClientAuthorization.findAll({
        where: {
          status: 'active',
          contractEndDate: {
            [Op.lt]: today
          }
        },
        include: [
          {
            model: Company,
            as: 'AgencyCompany',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Company,
            as: 'ClientCompany',
            attributes: ['id', 'name']
          }
        ]
      });

      console.log(`📊 Found ${expiredAuthorizations.length} expired contracts`);

      for (const auth of expiredAuthorizations) {
        // Update status to expired
        auth.status = 'expired';
        auth.canPostJobs = false;
        auth.expiredAt = new Date();
        
        await auth.save();

        console.log(`✅ Expired contract: ${auth.ClientCompany?.name} (Agency: ${auth.AgencyCompany?.name})`);

        // Send notification to agency
        try {
          await this.sendContractExpiredNotification(auth);
        } catch (emailError) {
          console.error('⚠️ Failed to send expiry notification:', emailError);
        }
      }

      return {
        success: true,
        expiredCount: expiredAuthorizations.length
      };
    } catch (error) {
      // Handle database errors gracefully
      if (error.name === 'SequelizeDatabaseError' && error.original && error.original.code === '42P01') {
        // Table does not exist
        console.log('ℹ️  Skipping contract expiry check: agency_client_authorizations table does not exist');
        return {
          success: true,
          expiredCount: 0,
          skipped: true,
          reason: 'Table does not exist'
        };
      }
      
      console.error('Error checking expired contracts:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Send reminders for contracts expiring soon (15 days before expiry)
   */
  async sendExpiryReminders() {
    try {
      // Check if table exists before proceeding
      const tableExists = await this.tableExists();
      if (!tableExists) {
        console.log('ℹ️  Skipping expiry reminders: agency_client_authorizations table does not exist');
        return {
          success: true,
          remindersSent: 0,
          skipped: true,
          reason: 'Table does not exist'
        };
      }

      // Ensure models are loaded
      if (!AgencyClientAuthorization || !Company || !User) {
        console.log('ℹ️  Skipping expiry reminders: Models not available');
        return {
          success: true,
          remindersSent: 0,
          skipped: true,
          reason: 'Models not available'
        };
      }

      const today = new Date();
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 15); // 15 days from now

      // Find authorizations expiring within 15 days
      const expiringSoon = await AgencyClientAuthorization.findAll({
        where: {
          status: 'active',
          contractEndDate: {
            [Op.between]: [today, reminderDate]
          },
          // Don't send reminder if already sent recently
          [Op.or]: [
            { lastReminderSentAt: null },
            {
              lastReminderSentAt: {
                [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last reminder was >7 days ago
              }
            }
          ]
        },
        include: [
          {
            model: Company,
            as: 'AgencyCompany',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Company,
            as: 'ClientCompany',
            attributes: ['id', 'name']
          }
        ]
      });

      console.log(`📊 Found ${expiringSoon.length} contracts expiring soon`);

      for (const auth of expiringSoon) {
        try {
          await this.sendContractExpiryReminderNotification(auth);
          
          // Update last reminder sent time
          auth.lastReminderSentAt = new Date();
          await auth.save();
          
          console.log(`✅ Reminder sent: ${auth.ClientCompany?.name} expires on ${auth.contractEndDate}`);
        } catch (emailError) {
          console.error('⚠️ Failed to send reminder:', emailError);
        }
      }

      return {
        success: true,
        remindersSent: expiringSoon.length
      };
    } catch (error) {
      // Handle database errors gracefully
      if (error.name === 'SequelizeDatabaseError' && error.original && error.original.code === '42P01') {
        // Table does not exist
        console.log('ℹ️  Skipping expiry reminders: agency_client_authorizations table does not exist');
        return {
          success: true,
          remindersSent: 0,
          skipped: true,
          reason: 'Table does not exist'
        };
      }
      
      console.error('Error sending expiry reminders:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Send contract expired notification to agency
   */
  async sendContractExpiredNotification(authorization) {
    const { AgencyCompany, ClientCompany } = authorization;
    
    if (!AgencyCompany || !ClientCompany) return;

    // Get agency users to notify
    const agencyUsers = await User.findAll({
      where: {
        companyId: authorization.agencyCompanyId,
        isActive: true
      },
      attributes: ['email', 'firstName', 'lastName']
    });

    for (const user of agencyUsers) {
      await emailService.sendEmail({
        to: user.email,
        subject: `⚠️ Contract Expired: ${ClientCompany.name}`,
        html: `
          <h2>Client Contract Expired</h2>
          <p>Dear ${user.firstName || 'Team'},</p>
          <p>Your contract with <strong>${ClientCompany.name}</strong> has expired on <strong>${new Date(authorization.contractEndDate).toLocaleDateString()}</strong>.</p>
          <h3>What This Means:</h3>
          <ul>
            <li>✅ Existing ${authorization.jobsPosted} job(s) remain active</li>
            <li>❌ You cannot post new jobs for this client</li>
            <li>✅ You can still manage applications for existing jobs</li>
          </ul>
          <h3>Next Steps:</h3>
          <p>To continue posting jobs for ${ClientCompany.name}, please renew the contract:</p>
          <ol>
            <li>Obtain updated authorization letter from client</li>
            <li>Set new contract dates</li>
            <li>Submit for admin approval</li>
          </ol>
          <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/employer-dashboard/manage-clients" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Contract Now</a></p>
          <p>If you have questions, contact our support team.</p>
          <p>Best regards,<br>Job Portal Team</p>
        `,
        text: `Contract Expired: ${ClientCompany.name}

Your contract expired on ${new Date(authorization.contractEndDate).toLocaleDateString()}.

Existing jobs remain active, but you cannot post new jobs.

To renew, visit: ${process.env.APP_URL || 'http://localhost:3000'}/employer-dashboard/manage-clients`
      });
    }
  }

  /**
   * Send contract expiry reminder notification (15 days before expiry)
   */
  async sendContractExpiryReminderNotification(authorization) {
    const { AgencyCompany, ClientCompany } = authorization;
    
    if (!AgencyCompany || !ClientCompany) return;

    const daysUntilExpiry = Math.ceil(
      (new Date(authorization.contractEndDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Get agency users to notify
    const agencyUsers = await User.findAll({
      where: {
        companyId: authorization.agencyCompanyId,
        isActive: true
      },
      attributes: ['email', 'firstName', 'lastName']
    });

    for (const user of agencyUsers) {
      await emailService.sendEmail({
        to: user.email,
        subject: `⚠️ Contract Expiring Soon: ${ClientCompany.name} (${daysUntilExpiry} days)`,
        html: `
          <h2>⚠️ Contract Expiring Soon</h2>
          <p>Dear ${user.firstName || 'Team'},</p>
          <p>Your contract with <strong>${ClientCompany.name}</strong> expires in <strong>${daysUntilExpiry} days</strong> on <strong>${new Date(authorization.contractEndDate).toLocaleDateString()}</strong>.</p>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong>⏰ ACTION REQUIRED:</strong><br>
            Renew the contract before expiry to continue posting jobs.
          </div>
          <h3>Contract Details:</h3>
          <ul>
            <li>Client: ${ClientCompany.name}</li>
            <li>Jobs Posted: ${authorization.jobsPosted}/${authorization.maxActiveJobs || '∞'}</li>
            <li>Expires: ${new Date(authorization.contractEndDate).toLocaleDateString()}</li>
            <li>Auto-Renew: ${authorization.autoRenew ? 'Yes' : 'No'}</li>
          </ul>
          ${authorization.autoRenew 
            ? '<p><strong>Auto-Renew Enabled:</strong> Please ensure client provides updated authorization letter before expiry.</p>' 
            : '<p><strong>Manual Renewal Required:</strong> Contact client to renew the contract.</p>'}
          <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/employer-dashboard/manage-clients" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Contracts</a></p>
          <p>Best regards,<br>Job Portal Team</p>
        `,
        text: `Contract Expiring Soon: ${ClientCompany.name}

Expires in ${daysUntilExpiry} days on ${new Date(authorization.contractEndDate).toLocaleDateString()}.

To renew, visit: ${process.env.APP_URL || 'http://localhost:3000'}/employer-dashboard/manage-clients`
      });
    }
  }

  /**
   * Manual trigger for testing (can be called from admin dashboard)
   */
  async checkNow() {
    console.log('🔍 Manual contract expiry check triggered...');
    const expiredResult = await this.checkAndExpireContracts();
    const remindersResult = await this.sendExpiryReminders();
    
    return {
      success: true,
      expired: expiredResult.expiredCount || 0,
      reminders: remindersResult.remindersSent || 0
    };
  }
}

module.exports = new ContractExpiryService();


