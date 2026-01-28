'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing enum values used by the application
    // 1) company_status needs 'pending_approval'
    await queryInterface.sequelize.query(
      `DO $$ BEGIN 
         ALTER TYPE "enum_companies_company_status" ADD VALUE IF NOT EXISTS 'pending_approval';
       EXCEPTION WHEN duplicate_object THEN null; END $$`
    );

    // 2) verification_status needs 'premium_verified' (keep existing ones)
    await queryInterface.sequelize.query(
      `DO $$ BEGIN 
         ALTER TYPE "enum_companies_verification_status" ADD VALUE IF NOT EXISTS 'premium_verified';
       EXCEPTION WHEN duplicate_object THEN null; END $$`
    );
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL does not support removing enum values easily.
    // Safe no-op for down migration.
  }
};


