'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      activityType: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'jobs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      applicationId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'job_applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('user_activity_logs', ['userId']);
    await queryInterface.addIndex('user_activity_logs', ['activityType']);
    await queryInterface.addIndex('user_activity_logs', ['timestamp']);
    await queryInterface.addIndex('user_activity_logs', ['jobId']);
    await queryInterface.addIndex('user_activity_logs', ['applicationId']);
    await queryInterface.addIndex('user_activity_logs', ['userId', 'activityType', 'timestamp'], { name: 'user_activity_logs_composite' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activity_logs');
  }
};


