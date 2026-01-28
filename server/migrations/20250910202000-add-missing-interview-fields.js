'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('interviews');
    
    // Add missing columns to interviews table
    if (!tableDescription.employer_id) {
      await queryInterface.addColumn('interviews', 'employer_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }

    if (!tableDescription.job_id) {
      await queryInterface.addColumn('interviews', 'job_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }

    if (!tableDescription.title) {
      await queryInterface.addColumn('interviews', 'title', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!tableDescription.description) {
      await queryInterface.addColumn('interviews', 'description', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableDescription.timezone) {
      await queryInterface.addColumn('interviews', 'timezone', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'UTC'
      });
    }

    if (!tableDescription.interviewers) {
      await queryInterface.addColumn('interviews', 'interviewers', {
        type: Sequelize.JSONB,
        defaultValue: []
      });
    }

    if (!tableDescription.agenda) {
      await queryInterface.addColumn('interviews', 'agenda', {
        type: Sequelize.JSONB,
        defaultValue: []
      });
    }

    if (!tableDescription.requirements) {
      await queryInterface.addColumn('interviews', 'requirements', {
        type: Sequelize.JSONB,
        defaultValue: {}
      });
    }

    if (!tableDescription.next_round_details) {
      await queryInterface.addColumn('interviews', 'next_round_details', {
        type: Sequelize.JSONB,
        defaultValue: {}
      });
    }

    if (!tableDescription.reminder_sent) {
      await queryInterface.addColumn('interviews', 'reminder_sent', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    if (!tableDescription.reminder_sent_at) {
      await queryInterface.addColumn('interviews', 'reminder_sent_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.cancelled_by) {
      await queryInterface.addColumn('interviews', 'cancelled_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableDescription.cancelled_at) {
      await queryInterface.addColumn('interviews', 'cancelled_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableDescription.cancellation_reason) {
      await queryInterface.addColumn('interviews', 'cancellation_reason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableDescription.metadata) {
      await queryInterface.addColumn('interviews', 'metadata', {
        type: Sequelize.JSONB,
        defaultValue: {}
      });
    }

    // Add indexes for new columns idempotently
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "interviews_employer_id" ON "interviews" ("employer_id")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "interviews_job_id" ON "interviews" ("job_id")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "interviews_reminder_sent" ON "interviews" ("reminder_sent")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "interviews_cancelled_by" ON "interviews" ("cancelled_by")');
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('interviews', ['employer_id']);
    await queryInterface.removeIndex('interviews', ['job_id']);
    await queryInterface.removeIndex('interviews', ['reminder_sent']);
    await queryInterface.removeIndex('interviews', ['cancelled_by']);

    // Remove columns
    await queryInterface.removeColumn('interviews', 'employer_id');
    await queryInterface.removeColumn('interviews', 'job_id');
    await queryInterface.removeColumn('interviews', 'title');
    await queryInterface.removeColumn('interviews', 'description');
    await queryInterface.removeColumn('interviews', 'timezone');
    await queryInterface.removeColumn('interviews', 'interviewers');
    await queryInterface.removeColumn('interviews', 'agenda');
    await queryInterface.removeColumn('interviews', 'requirements');
    await queryInterface.removeColumn('interviews', 'next_round_details');
    await queryInterface.removeColumn('interviews', 'reminder_sent');
    await queryInterface.removeColumn('interviews', 'reminder_sent_at');
    await queryInterface.removeColumn('interviews', 'cancelled_by');
    await queryInterface.removeColumn('interviews', 'cancelled_at');
    await queryInterface.removeColumn('interviews', 'cancellation_reason');
    await queryInterface.removeColumn('interviews', 'metadata');
  }
};
