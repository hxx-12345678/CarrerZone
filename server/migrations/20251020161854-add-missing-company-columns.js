'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add missing columns to companies table
    // Note: These columns were already added manually to fix immediate issues
    // This migration serves as documentation and can be run safely with IF NOT EXISTS
    
    try {
      await queryInterface.addColumn('companies', 'nature_of_business', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of business nature types: SaaS, PaaS, B2B, B2C, D2C, etc.'
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'company_types', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of company types: startup, enterprise, agency, etc.'
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'company_account_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'direct'
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'agency_license', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'agency_specialization', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'agency_documents', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'verified_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await queryInterface.addColumn('companies', 'verification_method', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn('companies', 'nature_of_business');
    await queryInterface.removeColumn('companies', 'company_types');
    await queryInterface.removeColumn('companies', 'company_account_type');
    await queryInterface.removeColumn('companies', 'agency_license');
    await queryInterface.removeColumn('companies', 'agency_specialization');
    await queryInterface.removeColumn('companies', 'agency_documents');
    await queryInterface.removeColumn('companies', 'verified_at');
    await queryInterface.removeColumn('companies', 'verification_method');
  }
};
