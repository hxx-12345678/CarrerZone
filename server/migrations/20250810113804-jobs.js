'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responsibilities: {
        type: Sequelize.TEXT,
        allowNull: true
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
      job_type: {
        type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
        allowNull: false
      },
      experience_level: {
        type: Sequelize.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive'),
        allowNull: false
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
      salary_type: {
        type: Sequelize.ENUM('per-year', 'per-month', 'per-hour'),
        defaultValue: 'per-year'
      },
      benefits: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      perks: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      skills_required: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      skills_preferred: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      location_type: {
        type: Sequelize.ENUM('remote', 'on-site', 'hybrid'),
        allowNull: false
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
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      application_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'paused', 'closed', 'expired'),
        defaultValue: 'draft'
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_urgent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      application_deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      meta_title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meta_description: {
        type: Sequelize.TEXT,
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

    // Add indexes (slug index is automatically created by unique constraint)
    await queryInterface.addIndex('jobs', ['company_id']);
    await queryInterface.addIndex('jobs', ['posted_by']);
    await queryInterface.addIndex('jobs', ['job_category_id']);
    await queryInterface.addIndex('jobs', ['job_type']);
    await queryInterface.addIndex('jobs', ['experience_level']);
    await queryInterface.addIndex('jobs', ['location_type']);
    await queryInterface.addIndex('jobs', ['city']);
    await queryInterface.addIndex('jobs', ['status']);
    await queryInterface.addIndex('jobs', ['is_featured']);
    await queryInterface.addIndex('jobs', ['published_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('jobs');
  }
};
