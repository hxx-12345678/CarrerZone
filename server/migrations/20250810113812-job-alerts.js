'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('job_alerts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      keywords: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      locations: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      categories: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      experience_level: {
        type: Sequelize.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive'),
        allowNull: true
      },
      salary_min: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      salary_max: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      salary_currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      job_type: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      location_type: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      frequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly'),
        defaultValue: 'daily'
      },
      email_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      push_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sms_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('job_alerts', ['user_id']);
    await queryInterface.addIndex('job_alerts', ['is_active']);
    await queryInterface.addIndex('job_alerts', ['frequency']);
    await queryInterface.addIndex('job_alerts', ['last_sent_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('job_alerts');
  }
};
