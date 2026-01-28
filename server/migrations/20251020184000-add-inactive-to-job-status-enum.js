'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.sequelize.query('ALTER TYPE enum_jobs_status ADD VALUE \'inactive\';');
      console.log('✅ Added inactive to job status enum');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ inactive already exists in job status enum, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down (queryInterface, Sequelize) {
    console.log('⚠️ Cannot remove enum values in PostgreSQL. Manual intervention required if rollback needed.');
  }
};
