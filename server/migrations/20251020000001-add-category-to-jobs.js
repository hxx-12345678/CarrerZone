'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if category column exists before adding it
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (!tableDescription.category) {
      await queryInterface.addColumn('jobs', 'category', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Job category for filtering and classification'
      });
      
      console.log('✅ Successfully added category column to jobs table');
    } else {
      console.log('ℹ️ category column already exists in jobs table');
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if column exists before removing it
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (tableDescription.category) {
      await queryInterface.removeColumn('jobs', 'category');
      console.log('✅ Successfully removed category column from jobs table');
    } else {
      console.log('ℹ️ category column does not exist in jobs table');
    }
  }
};

