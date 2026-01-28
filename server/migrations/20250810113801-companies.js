'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      banner: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      short_description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      industry: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sector: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company_size: {
        type: Sequelize.ENUM('1-50', '51-200', '201-500', '500-1000', '1000+'),
        allowNull: true
      },
      founded_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
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
      pincode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0
      },
      total_reviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      mission: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vision: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      values: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      work_environment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      perks: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      verification_status: {
        type: Sequelize.ENUM('unverified', 'pending', 'verified', 'rejected'),
        defaultValue: 'unverified'
      },
      total_jobs_posted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      active_jobs_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      meta_title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      company_status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
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
    await queryInterface.addIndex('companies', ['industry']);
    await queryInterface.addIndex('companies', ['city']);
    await queryInterface.addIndex('companies', ['verification_status']);
    await queryInterface.addIndex('companies', ['company_status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('companies');
  }
};
