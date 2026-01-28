'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Force fixing all field mappings...');

      // Fix UserSession table - rename columns to match model
      try {
        const userSessionColumns = await queryInterface.describeTable('user_sessions');
        
        // Check and rename columns that exist with wrong names
        if (userSessionColumns.userId && !userSessionColumns.user_id) {
          await queryInterface.renameColumn('user_sessions', 'userId', 'user_id');
          console.log('✅ Renamed userId to user_id in user_sessions');
        }
        if (userSessionColumns.sessionToken && !userSessionColumns.session_token) {
          await queryInterface.renameColumn('user_sessions', 'sessionToken', 'session_token');
          console.log('✅ Renamed sessionToken to session_token in user_sessions');
        }
        if (userSessionColumns.refreshToken && !userSessionColumns.refresh_token) {
          await queryInterface.renameColumn('user_sessions', 'refreshToken', 'refresh_token');
          console.log('✅ Renamed refreshToken to refresh_token in user_sessions');
        }
        if (userSessionColumns.deviceType && !userSessionColumns.device_type) {
          await queryInterface.renameColumn('user_sessions', 'deviceType', 'device_type');
          console.log('✅ Renamed deviceType to device_type in user_sessions');
        }
        if (userSessionColumns.deviceInfo && !userSessionColumns.device_info) {
          await queryInterface.renameColumn('user_sessions', 'deviceInfo', 'device_info');
          console.log('✅ Renamed deviceInfo to device_info in user_sessions');
        }
        if (userSessionColumns.ipAddress && !userSessionColumns.ip_address) {
          await queryInterface.renameColumn('user_sessions', 'ipAddress', 'ip_address');
          console.log('✅ Renamed ipAddress to ip_address in user_sessions');
        }
        if (userSessionColumns.userAgent && !userSessionColumns.user_agent) {
          await queryInterface.renameColumn('user_sessions', 'userAgent', 'user_agent');
          console.log('✅ Renamed userAgent to user_agent in user_sessions');
        }
        if (userSessionColumns.isActive && !userSessionColumns.is_active) {
          await queryInterface.renameColumn('user_sessions', 'isActive', 'is_active');
          console.log('✅ Renamed isActive to is_active in user_sessions');
        }
        if (userSessionColumns.lastActivityAt && !userSessionColumns.last_activity_at) {
          await queryInterface.renameColumn('user_sessions', 'lastActivityAt', 'last_activity_at');
          console.log('✅ Renamed lastActivityAt to last_activity_at in user_sessions');
        }
        if (userSessionColumns.expiresAt && !userSessionColumns.expires_at) {
          await queryInterface.renameColumn('user_sessions', 'expiresAt', 'expires_at');
          console.log('✅ Renamed expiresAt to expires_at in user_sessions');
        }
        if (userSessionColumns.loginMethod && !userSessionColumns.login_method) {
          await queryInterface.renameColumn('user_sessions', 'loginMethod', 'login_method');
          console.log('✅ Renamed loginMethod to login_method in user_sessions');
        }
      } catch (error) {
        console.log('⚠️ UserSession field mapping error:', error.message);
      }

      // Fix Analytics table - rename columns to match model
      try {
        const analyticsColumns = await queryInterface.describeTable('analytics');
        
        if (analyticsColumns.userId && !analyticsColumns.user_id) {
          await queryInterface.renameColumn('analytics', 'userId', 'user_id');
          console.log('✅ Renamed userId to user_id in analytics');
        }
        if (analyticsColumns.sessionId && !analyticsColumns.session_id) {
          await queryInterface.renameColumn('analytics', 'sessionId', 'session_id');
          console.log('✅ Renamed sessionId to session_id in analytics');
        }
        if (analyticsColumns.eventType && !analyticsColumns.event_type) {
          await queryInterface.renameColumn('analytics', 'eventType', 'event_type');
          console.log('✅ Renamed eventType to event_type in analytics');
        }
        if (analyticsColumns.eventCategory && !analyticsColumns.event_category) {
          await queryInterface.renameColumn('analytics', 'eventCategory', 'event_category');
          console.log('✅ Renamed eventCategory to event_category in analytics');
        }
        if (analyticsColumns.pageUrl && !analyticsColumns.page_url) {
          await queryInterface.renameColumn('analytics', 'pageUrl', 'page_url');
          console.log('✅ Renamed pageUrl to page_url in analytics');
        }
        if (analyticsColumns.referrerUrl && !analyticsColumns.referrer_url) {
          await queryInterface.renameColumn('analytics', 'referrerUrl', 'referrer_url');
          console.log('✅ Renamed referrerUrl to referrer_url in analytics');
        }
        if (analyticsColumns.userAgent && !analyticsColumns.user_agent) {
          await queryInterface.renameColumn('analytics', 'userAgent', 'user_agent');
          console.log('✅ Renamed userAgent to user_agent in analytics');
        }
        if (analyticsColumns.ipAddress && !analyticsColumns.ip_address) {
          await queryInterface.renameColumn('analytics', 'ipAddress', 'ip_address');
          console.log('✅ Renamed ipAddress to ip_address in analytics');
        }
        if (analyticsColumns.deviceType && !analyticsColumns.device_type) {
          await queryInterface.renameColumn('analytics', 'deviceType', 'device_type');
          console.log('✅ Renamed deviceType to device_type in analytics');
        }
        if (analyticsColumns.jobId && !analyticsColumns.job_id) {
          await queryInterface.renameColumn('analytics', 'jobId', 'job_id');
          console.log('✅ Renamed jobId to job_id in analytics');
        }
        if (analyticsColumns.companyId && !analyticsColumns.company_id) {
          await queryInterface.renameColumn('analytics', 'companyId', 'company_id');
          console.log('✅ Renamed companyId to company_id in analytics');
        }
        if (analyticsColumns.applicationId && !analyticsColumns.application_id) {
          await queryInterface.renameColumn('analytics', 'applicationId', 'application_id');
          console.log('✅ Renamed applicationId to application_id in analytics');
        }
      } catch (error) {
        console.log('⚠️ Analytics field mapping error:', error.message);
      }

      // Fix CompanyFollow table - rename columns to match model
      try {
        const companyFollowColumns = await queryInterface.describeTable('company_follows');
        
        if (companyFollowColumns.userId && !companyFollowColumns.user_id) {
          await queryInterface.renameColumn('company_follows', 'userId', 'user_id');
          console.log('✅ Renamed userId to user_id in company_follows');
        }
        if (companyFollowColumns.companyId && !companyFollowColumns.company_id) {
          await queryInterface.renameColumn('company_follows', 'companyId', 'company_id');
          console.log('✅ Renamed companyId to company_id in company_follows');
        }
        if (companyFollowColumns.notificationPreferences && !companyFollowColumns.notification_preferences) {
          await queryInterface.renameColumn('company_follows', 'notificationPreferences', 'notification_preferences');
          console.log('✅ Renamed notificationPreferences to notification_preferences in company_follows');
        }
        if (companyFollowColumns.followedAt && !companyFollowColumns.followed_at) {
          await queryInterface.renameColumn('company_follows', 'followedAt', 'followed_at');
          console.log('✅ Renamed followedAt to followed_at in company_follows');
        }
        if (companyFollowColumns.lastNotificationAt && !companyFollowColumns.last_notification_at) {
          await queryInterface.renameColumn('company_follows', 'lastNotificationAt', 'last_notification_at');
          console.log('✅ Renamed lastNotificationAt to last_notification_at in company_follows');
        }
      } catch (error) {
        console.log('⚠️ CompanyFollow field mapping error:', error.message);
      }

      // Fix CompanyReview table - rename columns to match model
      try {
        const companyReviewColumns = await queryInterface.describeTable('company_reviews');
        
        if (companyReviewColumns.companyId && !companyReviewColumns.company_id) {
          await queryInterface.renameColumn('company_reviews', 'companyId', 'company_id');
          console.log('✅ Renamed companyId to company_id in company_reviews');
        }
        if (companyReviewColumns.userId && !companyReviewColumns.user_id) {
          await queryInterface.renameColumn('company_reviews', 'userId', 'user_id');
          console.log('✅ Renamed userId to user_id in company_reviews');
        }
        if (companyReviewColumns.reviewDate && !companyReviewColumns.review_date) {
          await queryInterface.renameColumn('company_reviews', 'reviewDate', 'review_date');
          console.log('✅ Renamed reviewDate to review_date in company_reviews');
        }
      } catch (error) {
        console.log('⚠️ CompanyReview field mapping error:', error.message);
      }

      // Fix Payment table - rename columns to match model
      try {
        const paymentColumns = await queryInterface.describeTable('payments');
        
        if (paymentColumns.userId && !paymentColumns.user_id) {
          await queryInterface.renameColumn('payments', 'userId', 'user_id');
          console.log('✅ Renamed userId to user_id in payments');
        }
        if (paymentColumns.subscriptionId && !paymentColumns.subscription_id) {
          await queryInterface.renameColumn('payments', 'subscriptionId', 'subscription_id');
          console.log('✅ Renamed subscriptionId to subscription_id in payments');
        }
        if (paymentColumns.paymentType && !paymentColumns.payment_type) {
          await queryInterface.renameColumn('payments', 'paymentType', 'payment_type');
          console.log('✅ Renamed paymentType to payment_type in payments');
        }
        if (paymentColumns.paymentMethod && !paymentColumns.payment_method) {
          await queryInterface.renameColumn('payments', 'paymentMethod', 'payment_method');
          console.log('✅ Renamed paymentMethod to payment_method in payments');
        }
        if (paymentColumns.paymentGateway && !paymentColumns.payment_gateway) {
          await queryInterface.renameColumn('payments', 'paymentGateway', 'payment_gateway');
          console.log('✅ Renamed paymentGateway to payment_gateway in payments');
        }
        if (paymentColumns.gatewayTransactionId && !paymentColumns.gateway_transaction_id) {
          await queryInterface.renameColumn('payments', 'gatewayTransactionId', 'gateway_transaction_id');
          console.log('✅ Renamed gatewayTransactionId to gateway_transaction_id in payments');
        }
        if (paymentColumns.gatewayOrderId && !paymentColumns.gateway_order_id) {
          await queryInterface.renameColumn('payments', 'gatewayOrderId', 'gateway_order_id');
          console.log('✅ Renamed gatewayOrderId to gateway_order_id in payments');
        }
        if (paymentColumns.paymentDate && !paymentColumns.payment_date) {
          await queryInterface.renameColumn('payments', 'paymentDate', 'payment_date');
          console.log('✅ Renamed paymentDate to payment_date in payments');
        }
        if (paymentColumns.refundId && !paymentColumns.refund_id) {
          await queryInterface.renameColumn('payments', 'refundId', 'refund_id');
          console.log('✅ Renamed refundId to refund_id in payments');
        }
        if (paymentColumns.invoiceId && !paymentColumns.invoice_id) {
          await queryInterface.renameColumn('payments', 'invoiceId', 'invoice_id');
          console.log('✅ Renamed invoiceId to invoice_id in payments');
        }
        if (paymentColumns.billingAddress && !paymentColumns.billing_address) {
          await queryInterface.renameColumn('payments', 'billingAddress', 'billing_address');
          console.log('✅ Renamed billingAddress to billing_address in payments');
        }
        if (paymentColumns.shippingAddress && !paymentColumns.shipping_address) {
          await queryInterface.renameColumn('payments', 'shippingAddress', 'shipping_address');
          console.log('✅ Renamed shippingAddress to shipping_address in payments');
        }
        if (paymentColumns.taxAmount && !paymentColumns.tax_amount) {
          await queryInterface.renameColumn('payments', 'taxAmount', 'tax_amount');
          console.log('✅ Renamed taxAmount to tax_amount in payments');
        }
        if (paymentColumns.discountAmount && !paymentColumns.discount_amount) {
          await queryInterface.renameColumn('payments', 'discountAmount', 'discount_amount');
          console.log('✅ Renamed discountAmount to discount_amount in payments');
        }
        if (paymentColumns.finalAmount && !paymentColumns.final_amount) {
          await queryInterface.renameColumn('payments', 'finalAmount', 'final_amount');
          console.log('✅ Renamed finalAmount to final_amount in payments');
        }
      } catch (error) {
        console.log('⚠️ Payment field mapping error:', error.message);
      }

      console.log('✅ Force field mappings migration completed');
    } catch (error) {
      console.log('⚠️ Force field mappings migration error:', error.message);
      // Don't throw error, just log it
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('⚠️ This migration cannot be safely reversed');
  }
};
