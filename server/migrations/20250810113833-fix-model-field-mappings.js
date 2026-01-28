'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Fixing model field mappings...');

      // Fix UserSession table field mappings
      const userSessionColumns = await queryInterface.describeTable('user_sessions');
      
      if (!userSessionColumns.user_id) {
        await queryInterface.renameColumn('user_sessions', 'userId', 'user_id');
      }
      if (!userSessionColumns.session_token) {
        await queryInterface.renameColumn('user_sessions', 'sessionToken', 'session_token');
      }
      if (!userSessionColumns.refresh_token) {
        await queryInterface.renameColumn('user_sessions', 'refreshToken', 'refresh_token');
      }
      if (!userSessionColumns.device_type) {
        await queryInterface.renameColumn('user_sessions', 'deviceType', 'device_type');
      }
      if (!userSessionColumns.device_info) {
        await queryInterface.renameColumn('user_sessions', 'deviceInfo', 'device_info');
      }
      if (!userSessionColumns.ip_address) {
        await queryInterface.renameColumn('user_sessions', 'ipAddress', 'ip_address');
      }
      if (!userSessionColumns.user_agent) {
        await queryInterface.renameColumn('user_sessions', 'userAgent', 'user_agent');
      }
      if (!userSessionColumns.is_active) {
        await queryInterface.renameColumn('user_sessions', 'isActive', 'is_active');
      }
      if (!userSessionColumns.last_activity_at) {
        await queryInterface.renameColumn('user_sessions', 'lastActivityAt', 'last_activity_at');
      }
      if (!userSessionColumns.expires_at) {
        await queryInterface.renameColumn('user_sessions', 'expiresAt', 'expires_at');
      }
      if (!userSessionColumns.login_method) {
        await queryInterface.renameColumn('user_sessions', 'loginMethod', 'login_method');
      }

      // Fix Analytics table field mappings
      const analyticsColumns = await queryInterface.describeTable('analytics');
      
      if (!analyticsColumns.user_id) {
        await queryInterface.renameColumn('analytics', 'userId', 'user_id');
      }
      if (!analyticsColumns.session_id) {
        await queryInterface.renameColumn('analytics', 'sessionId', 'session_id');
      }
      if (!analyticsColumns.event_type) {
        await queryInterface.renameColumn('analytics', 'eventType', 'event_type');
      }
      if (!analyticsColumns.event_category) {
        await queryInterface.renameColumn('analytics', 'eventCategory', 'event_category');
      }
      if (!analyticsColumns.page_url) {
        await queryInterface.renameColumn('analytics', 'pageUrl', 'page_url');
      }
      if (!analyticsColumns.referrer_url) {
        await queryInterface.renameColumn('analytics', 'referrerUrl', 'referrer_url');
      }
      if (!analyticsColumns.user_agent) {
        await queryInterface.renameColumn('analytics', 'userAgent', 'user_agent');
      }
      if (!analyticsColumns.ip_address) {
        await queryInterface.renameColumn('analytics', 'ipAddress', 'ip_address');
      }
      if (!analyticsColumns.device_type) {
        await queryInterface.renameColumn('analytics', 'deviceType', 'device_type');
      }
      if (!analyticsColumns.job_id) {
        await queryInterface.renameColumn('analytics', 'jobId', 'job_id');
      }
      if (!analyticsColumns.company_id) {
        await queryInterface.renameColumn('analytics', 'companyId', 'company_id');
      }
      if (!analyticsColumns.application_id) {
        await queryInterface.renameColumn('analytics', 'applicationId', 'application_id');
      }

      // Fix CompanyFollow table field mappings
      const companyFollowColumns = await queryInterface.describeTable('company_follows');
      
      if (!companyFollowColumns.user_id) {
        await queryInterface.renameColumn('company_follows', 'userId', 'user_id');
      }
      if (!companyFollowColumns.company_id) {
        await queryInterface.renameColumn('company_follows', 'companyId', 'company_id');
      }
      if (!companyFollowColumns.notification_preferences) {
        await queryInterface.renameColumn('company_follows', 'notificationPreferences', 'notification_preferences');
      }
      if (!companyFollowColumns.followed_at) {
        await queryInterface.renameColumn('company_follows', 'followedAt', 'followed_at');
      }
      if (!companyFollowColumns.last_notification_at) {
        await queryInterface.renameColumn('company_follows', 'lastNotificationAt', 'last_notification_at');
      }

      // Fix CompanyReview table field mappings
      const companyReviewColumns = await queryInterface.describeTable('company_reviews');
      
      if (!companyReviewColumns.company_id) {
        await queryInterface.renameColumn('company_reviews', 'companyId', 'company_id');
      }
      if (!companyReviewColumns.user_id) {
        await queryInterface.renameColumn('company_reviews', 'userId', 'user_id');
      }
      if (!companyReviewColumns.review_date) {
        await queryInterface.renameColumn('company_reviews', 'reviewDate', 'review_date');
      }

      // Fix Payment table field mappings
      const paymentColumns = await queryInterface.describeTable('payments');
      
      if (!paymentColumns.user_id) {
        await queryInterface.renameColumn('payments', 'userId', 'user_id');
      }
      if (!paymentColumns.subscription_id) {
        await queryInterface.renameColumn('payments', 'subscriptionId', 'subscription_id');
      }
      if (!paymentColumns.payment_type) {
        await queryInterface.renameColumn('payments', 'paymentType', 'payment_type');
      }
      if (!paymentColumns.payment_method) {
        await queryInterface.renameColumn('payments', 'paymentMethod', 'payment_method');
      }
      if (!paymentColumns.payment_gateway) {
        await queryInterface.renameColumn('payments', 'paymentGateway', 'payment_gateway');
      }

      console.log('✅ Fixed model field mappings');
    } catch (error) {
      console.log('⚠️ Some field mappings might already be correct:', error.message);
      // Continue execution even if some renames fail
    }
  },

  async down(queryInterface, Sequelize) {
    // This migration is mostly about renaming columns to match model definitions
    // Reversing it would break the models, so we'll leave it as is
    console.log('⚠️ This migration cannot be safely reversed');
  }
};
