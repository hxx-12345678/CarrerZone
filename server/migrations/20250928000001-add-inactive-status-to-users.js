/**
 * Migration: Add 'inactive' status to account_status enum
 * This allows jobseekers to be marked as inactive due to inactivity
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Adding "inactive" status to account_status enum...');
      
      // Add 'inactive' to the existing enum
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_account_status" 
        ADD VALUE IF NOT EXISTS 'inactive'
      `);
      
      console.log('✅ Successfully added "inactive" status to account_status enum');
    } catch (error) {
      console.error('❌ Error adding inactive status:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Removing "inactive" status from account_status enum...');
      
      // Note: PostgreSQL doesn't support removing enum values directly
      // This would require recreating the enum type and updating all references
      // For safety, we'll leave the inactive status in place
      console.log('⚠️  Note: Removing enum values requires manual database intervention');
      console.log('   The "inactive" status will remain in the enum for safety');
    } catch (error) {
      console.error('❌ Error removing inactive status:', error);
      throw error;
    }
  }
};
