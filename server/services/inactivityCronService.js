/**
 * Cron Job Service for Jobseeker Inactivity Management
 * Runs daily checks and monthly email reminders
 */

const cron = require('node-cron');
const JobseekerInactivityService = require('./jobseekerInactivityService');

class InactivityCronService {
  
  static start() {
    console.log('🕐 Starting Inactivity Management Cron Jobs...');
    
    // Daily check for inactive jobseekers (runs at 2 AM every day)
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🔄 Running daily inactivity check...');
        const result = await JobseekerInactivityService.checkAndMarkInactiveJobseekers();
        console.log(`✅ Daily check completed: ${result.markedInactive} users marked inactive`);
      } catch (error) {
        console.error('❌ Daily inactivity check failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Monthly reminder emails (runs on the 1st of every month at 10 AM)
    cron.schedule('0 10 1 * *', async () => {
      try {
        console.log('📧 Running monthly reminder email campaign...');
        const result = await JobseekerInactivityService.sendInactivityReminderEmails();
        console.log(`✅ Monthly reminders sent: ${result.sent}/${result.total} emails`);
      } catch (error) {
        console.error('❌ Monthly reminder campaign failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Weekly stats report (runs every Monday at 9 AM)
    cron.schedule('0 9 * * 1', async () => {
      try {
        console.log('📊 Generating weekly inactivity stats...');
        const stats = await JobseekerInactivityService.getInactivityStats();
        console.log('📈 Weekly Inactivity Stats:', stats);
      } catch (error) {
        console.error('❌ Weekly stats generation failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    console.log('✅ Inactivity Management Cron Jobs started successfully');
    console.log('   - Daily inactivity check: 2:00 AM IST');
    console.log('   - Monthly reminder emails: 1st of month, 10:00 AM IST');
    console.log('   - Weekly stats report: Mondays, 9:00 AM IST');
  }

  static stop() {
    console.log('🛑 Stopping Inactivity Management Cron Jobs...');
    cron.getTasks().forEach(task => {
      task.destroy();
    });
    console.log('✅ All cron jobs stopped');
  }

  // Manual trigger methods for testing
  static async runDailyCheck() {
    console.log('🔄 Running manual daily check...');
    return await JobseekerInactivityService.checkAndMarkInactiveJobseekers();
  }

  static async runMonthlyReminders() {
    console.log('📧 Running manual monthly reminders...');
    return await JobseekerInactivityService.sendInactivityReminderEmails();
  }

  static async getStats() {
    console.log('📊 Getting inactivity stats...');
    return await JobseekerInactivityService.getInactivityStats();
  }
}

module.exports = InactivityCronService;
