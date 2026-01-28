'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint to cover_letter_id column in job_applications
    // This runs after cover_letters table is created
    try {
      await queryInterface.addConstraint('job_applications', {
        fields: ['cover_letter_id'],
        type: 'foreign key',
        name: 'job_applications_cover_letter_id_fkey',
        references: {
          table: 'cover_letters',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      // If constraint already exists, ignore the error
      if (error.message.includes('already exists')) {
        console.log('Foreign key constraint already exists, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the foreign key constraint
    try {
      await queryInterface.removeConstraint('job_applications', 'job_applications_cover_letter_id_fkey');
    } catch (error) {
      console.log('Constraint might not exist, skipping removal...');
    }
  }
};
