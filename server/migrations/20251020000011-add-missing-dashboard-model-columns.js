'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check which columns exist and only add missing ones
      
      // ========== NOTIFICATIONS TABLE ==========
      const notificationsTable = await queryInterface.describeTable('notifications');
      
      if (!notificationsTable.short_message) {
        await queryInterface.addColumn('notifications', 'short_message', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Short version of notification message'
        }, { transaction });
        console.log('✅ Added short_message column to notifications');
      }

      if (!notificationsTable.is_email_sent) {
        await queryInterface.addColumn('notifications', 'is_email_sent', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'Whether email notification was sent'
        }, { transaction });
        console.log('✅ Added is_email_sent column to notifications');
      }

      if (!notificationsTable.is_sms_sent) {
        await queryInterface.addColumn('notifications', 'is_sms_sent', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'Whether SMS notification was sent'
        }, { transaction });
        console.log('✅ Added is_sms_sent column to notifications');
      }

      if (!notificationsTable.is_push_sent) {
        await queryInterface.addColumn('notifications', 'is_push_sent', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'Whether push notification was sent'
        }, { transaction });
        console.log('✅ Added is_push_sent column to notifications');
      }

      if (!notificationsTable.action_url) {
        await queryInterface.addColumn('notifications', 'action_url', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'URL for notification action'
        }, { transaction });
        console.log('✅ Added action_url column to notifications');
      }

      if (!notificationsTable.action_text) {
        await queryInterface.addColumn('notifications', 'action_text', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Text for notification action button'
        }, { transaction });
        console.log('✅ Added action_text column to notifications');
      }

      if (!notificationsTable.read_at) {
        await queryInterface.addColumn('notifications', 'read_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When notification was read'
        }, { transaction });
        console.log('✅ Added read_at column to notifications');
      }

      if (!notificationsTable.expires_at) {
        await queryInterface.addColumn('notifications', 'expires_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When notification expires'
        }, { transaction });
        console.log('✅ Added expires_at column to notifications');
      }

      if (!notificationsTable.scheduled_at) {
        await queryInterface.addColumn('notifications', 'scheduled_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When notification is scheduled to be sent'
        }, { transaction });
        console.log('✅ Added scheduled_at column to notifications');
      }

      if (!notificationsTable.sent_at) {
        await queryInterface.addColumn('notifications', 'sent_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When notification was sent'
        }, { transaction });
        console.log('✅ Added sent_at column to notifications');
      }

      // ========== JOB_ALERTS TABLE ==========
      const jobAlertsTable = await queryInterface.describeTable('job_alerts');
      
      if (!jobAlertsTable.next_send_at) {
        await queryInterface.addColumn('job_alerts', 'next_send_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When to send next alert'
        }, { transaction });
        console.log('✅ Added next_send_at column to job_alerts');
      }

      if (!jobAlertsTable.max_results) {
        await queryInterface.addColumn('job_alerts', 'max_results', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 10,
          comment: 'Maximum number of results to include in alert'
        }, { transaction });
        console.log('✅ Added max_results column to job_alerts');
      }

      if (!jobAlertsTable.metadata) {
        await queryInterface.addColumn('job_alerts', 'metadata', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {},
          comment: 'Additional metadata for job alert'
        }, { transaction });
        console.log('✅ Added metadata column to job_alerts');
      }

      // ========== JOB_BOOKMARKS TABLE ==========
      const jobBookmarksTable = await queryInterface.describeTable('job_bookmarks');
      
      if (!jobBookmarksTable.reminder_date) {
        await queryInterface.addColumn('job_bookmarks', 'reminder_date', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Date to remind user about this bookmark'
        }, { transaction });
        console.log('✅ Added reminder_date column to job_bookmarks');
      }

      if (!jobBookmarksTable.notes) {
        await queryInterface.addColumn('job_bookmarks', 'notes', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'User notes for this bookmark'
        }, { transaction });
        console.log('✅ Added notes column to job_bookmarks');
      }

      // ========== RESUMES TABLE ==========
      const resumesTable = await queryInterface.describeTable('resumes');
      
      if (!resumesTable.is_primary) {
        await queryInterface.addColumn('resumes', 'is_primary', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'Whether this is the primary resume'
        }, { transaction });
        console.log('✅ Added is_primary column to resumes');
      }

      if (!resumesTable.is_public) {
        await queryInterface.addColumn('resumes', 'is_public', {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: true,
          comment: 'Whether this resume is public'
        }, { transaction });
        console.log('✅ Added is_public column to resumes');
      }

      if (!resumesTable.view_count) {
        await queryInterface.addColumn('resumes', 'view_count', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
          comment: 'Number of times resume was viewed'
        }, { transaction });
        console.log('✅ Added view_count column to resumes');
      }

      if (!resumesTable.download_count) {
        await queryInterface.addColumn('resumes', 'download_count', {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
          comment: 'Number of times resume was downloaded'
        }, { transaction });
        console.log('✅ Added download_count column to resumes');
      }

      await transaction.commit();
      console.log('✅ Added missing dashboard model columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error adding dashboard model columns:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove the added columns
      
      // Notifications
      await queryInterface.removeColumn('notifications', 'short_message', { transaction });
      await queryInterface.removeColumn('notifications', 'is_email_sent', { transaction });
      await queryInterface.removeColumn('notifications', 'is_sms_sent', { transaction });
      await queryInterface.removeColumn('notifications', 'is_push_sent', { transaction });
      await queryInterface.removeColumn('notifications', 'action_url', { transaction });
      await queryInterface.removeColumn('notifications', 'action_text', { transaction });
      await queryInterface.removeColumn('notifications', 'read_at', { transaction });
      await queryInterface.removeColumn('notifications', 'expires_at', { transaction });
      await queryInterface.removeColumn('notifications', 'scheduled_at', { transaction });
      await queryInterface.removeColumn('notifications', 'sent_at', { transaction });

      // Job Alerts
      await queryInterface.removeColumn('job_alerts', 'next_send_at', { transaction });
      await queryInterface.removeColumn('job_alerts', 'max_results', { transaction });
      await queryInterface.removeColumn('job_alerts', 'metadata', { transaction });

      // Job Bookmarks
      await queryInterface.removeColumn('job_bookmarks', 'reminder_date', { transaction });
      await queryInterface.removeColumn('job_bookmarks', 'notes', { transaction });

      // Resumes
      await queryInterface.removeColumn('resumes', 'is_primary', { transaction });
      await queryInterface.removeColumn('resumes', 'is_public', { transaction });
      await queryInterface.removeColumn('resumes', 'view_count', { transaction });
      await queryInterface.removeColumn('resumes', 'download_count', { transaction });

      await transaction.commit();
      console.log('✅ Removed dashboard model columns successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removing dashboard model columns:', error);
      throw error;
    }
  }
};
