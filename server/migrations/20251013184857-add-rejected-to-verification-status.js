'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'rejected' value to companies verification status enum
    // Handle both naming conventions seen in environments
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_verificationstatus') THEN
          ALTER TYPE "enum_companies_verificationStatus" ADD VALUE IF NOT EXISTS 'rejected';
        ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_verification_status') THEN
          ALTER TYPE "enum_companies_verification_status" ADD VALUE IF NOT EXISTS 'rejected';
        ELSE
          -- If enum does not exist yet, skip; later migrations will create it
          RAISE NOTICE 'companies verification status enum not found, skipping add value';
        END IF;
      END$$;
    `);
    
    console.log('✅ Added "rejected" to verificationStatus ENUM');
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing ENUM values
    // This is a one-way migration for safety
    console.log('Cannot remove ENUM values in PostgreSQL - this is a one-way migration');
  }
};
