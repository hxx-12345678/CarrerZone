/**
 * Cron Job Service for Job Alerts
 * Processes and sends job alert emails on schedule
 */

const cron = require('node-cron');
const JobAlertEmailService = require('./jobAlertEmailService');

class JobAlertCronService {
  static cronJob = null;
  
  /**
   * Start the job alerts cron service
   * Runs every hour to check for due alerts
   */
  static start() {
    console.log('🕐 Starting Job Alerts Cron Service...');
    
    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
    // This ensures daily alerts run at consistent times
    // Weekly alerts will be sent when nextSendAt is reached
    // Monthly alerts will be sent when nextSendAt is reached
    this.cronJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('📧 Running job alerts processing...');
        const result = await JobAlertEmailService.processAllAlerts();
        console.log(`✅ Job alerts processed: ${result.success} succeeded, ${result.failed} failed (${result.total} total)`);
      } catch (error) {
        console.error('❌ Error in job alerts cron job:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });
    
    // Also run immediately on startup to catch any overdue alerts
    console.log('🔄 Running initial job alerts check...');
    setTimeout(async () => {
      try {
        const result = await JobAlertEmailService.processAllAlerts();
        console.log(`✅ Initial job alerts check complete: ${result.success} succeeded, ${result.failed} failed`);
      } catch (error) {
        console.error('❌ Error in initial job alerts check:', error);
      }
    }, 10000); // Wait 10 seconds after server start
    
    console.log('✅ Job Alerts Cron Service started successfully');
    console.log('   - Runs every hour to check for due alerts');
    console.log('   - Processes daily, weekly, and monthly alerts');
    console.log('   - Timezone: Asia/Kolkata (IST)');
  }
  
  /**
   * Stop the cron job
   */
  static stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Job Alerts Cron Service stopped');
    }
  }
  
  /**
   * Manually trigger alert processing (for testing)
   */
  static async triggerNow() {
    console.log('🔄 Manually triggering job alerts processing...');
    try {
      const result = await JobAlertEmailService.processAllAlerts();
      console.log(`✅ Manual trigger complete: ${result.success} succeeded, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error('❌ Error in manual trigger:', error);
      throw error;
    }
  }
}

module.exports = JobAlertCronService;

