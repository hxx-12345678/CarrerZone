'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add new account status values to the ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_account_status" ADD VALUE IF NOT EXISTS 'pending_verification';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_account_status" ADD VALUE IF NOT EXISTS 'rejected';
    `);
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing ENUM values directly
    // This would require recreating the ENUM type, which is complex
    // For now, we'll leave the new values in place
    console.log('Note: Cannot remove ENUM values in PostgreSQL. New values will remain.');
  }
};
