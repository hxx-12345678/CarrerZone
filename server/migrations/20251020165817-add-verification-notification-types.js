'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add missing notification type enum values
    const enumValues = ['verification_request', 'verification_approved', 'verification_rejected'];
    
    for (const enumValue of enumValues) {
      try {
        await queryInterface.sequelize.query(`ALTER TYPE enum_notifications_type ADD VALUE '${enumValue}';`);
        console.log(`✅ Added ${enumValue} to notification type enum`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ ${enumValue} already exists in notification type enum, skipping...`);
        } else {
          throw error;
        }
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
