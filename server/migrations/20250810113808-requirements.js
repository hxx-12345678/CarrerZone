'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('requirements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      posted_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      job_category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'job_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      required_skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      preferred_skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      experience_min: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      experience_max: {
        type: Sequelize.INTEGER,
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
      location_type: {
        type: Sequelize.ENUM('remote', 'on-site', 'hybrid'),
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'India'
      },
      urgency_level: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'paused', 'closed', 'filled'),
        defaultValue: 'draft'
      },
      application_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      published_at: {
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
    await queryInterface.addIndex('requirements', ['company_id']);
    await queryInterface.addIndex('requirements', ['posted_by']);
    await queryInterface.addIndex('requirements', ['job_category_id']);
    await queryInterface.addIndex('requirements', ['location_type']);
    await queryInterface.addIndex('requirements', ['city']);
    await queryInterface.addIndex('requirements', ['urgency_level']);
    await queryInterface.addIndex('requirements', ['status']);
    await queryInterface.addIndex('requirements', ['published_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('requirements');
  }
};
