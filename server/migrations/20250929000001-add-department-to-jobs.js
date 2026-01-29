'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding department column to jobs table...');
    
    // Check if column exists first
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (!tableDescription.department) {
      await queryInterface.addColumn('jobs', 'department', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Successfully added department column to jobs table');
    } else {
      console.log('ℹ️ Department column already exists in jobs table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing department column from jobs table...');
    
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (tableDescription.department) {
      await queryInterface.removeColumn('jobs', 'department');
      console.log('✅ Successfully removed department column from jobs table');
    } else {
      console.log('ℹ️ Department column does not exist in jobs table');
    }
  }
};

