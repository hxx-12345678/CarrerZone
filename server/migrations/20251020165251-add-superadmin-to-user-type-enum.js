'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add 'superadmin' to the user_type enum if it doesn't exist
    try {
      // First, check if the enum exists
      const enumExists = await queryInterface.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = 'enum_users_user_type';
      `);
      
      if (enumExists[0].length === 0) {
        // Create the enum if it doesn't exist
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_users_user_type" AS ENUM ('jobseeker', 'employer', 'admin', 'superadmin');
        `);
        console.log('✅ Created user_type enum with superadmin');
      } else {
        // Add superadmin if not already present
        await queryInterface.sequelize.query('ALTER TYPE enum_users_user_type ADD VALUE \'superadmin\';');
        console.log('✅ Added superadmin to user_type enum');
      }
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('already contains')) {
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
