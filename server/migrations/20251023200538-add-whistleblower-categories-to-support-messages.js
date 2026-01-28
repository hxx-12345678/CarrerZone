'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update the enum type for category to include whistleblower categories
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_support_messages_category" 
      ADD VALUE IF NOT EXISTS 'fraud';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_support_messages_category" 
      ADD VALUE IF NOT EXISTS 'spam';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_support_messages_category" 
      ADD VALUE IF NOT EXISTS 'misconduct';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_support_messages_category" 
      ADD VALUE IF NOT EXISTS 'whistleblower';
    `);

    // Update the enum type for priority to include urgent
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_support_messages_priority" 
      ADD VALUE IF NOT EXISTS 'urgent';
    `);
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll leave the enum values in place
    console.log('Note: Enum values cannot be easily removed in PostgreSQL');
  }
};