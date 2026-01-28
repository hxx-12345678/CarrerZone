'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if metadata column already exists
    const tableDescription = await queryInterface.describeTable('requirements');
    
    if (!tableDescription.metadata) {
      await queryInterface.addColumn('requirements', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional metadata for requirement including virtual fields'
      });
      console.log('✅ Added metadata column to requirements table');
    } else {
      console.log('ℹ️  metadata column already exists in requirements table');
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('requirements');
    
    if (tableDescription.metadata) {
      await queryInterface.removeColumn('requirements', 'metadata');
      console.log('✅ Removed metadata column from requirements table');
    } else {
      console.log('ℹ️  metadata column does not exist in requirements table');
    }
  }
};
