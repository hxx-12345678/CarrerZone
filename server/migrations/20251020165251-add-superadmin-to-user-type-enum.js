'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add 'superadmin' to the user_type enum if it doesn't exist
    try {
      await queryInterface.sequelize.query('ALTER TYPE enum_users_user_type ADD VALUE \'superadmin\';');
      console.log('✅ Added superadmin to user_type enum');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ superadmin already exists in user_type enum, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type and updating all references
    // For safety, we'll leave this as a no-op
    console.log('⚠️ Cannot remove enum values in PostgreSQL. Manual intervention required if rollback needed.');
  }
};
