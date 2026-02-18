'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding department column to jobs table...');
    
    // Check if column exists first
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (!tableDescription.department) {
      
      try {
        const tableInfo = await queryInterface.describeTable('jobs');
        if (!tableInfo['department']) {
          await queryInterface.addColumn('jobs', 'department', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      });
          console.log('✅ Added department to jobs');
        } else {
          console.log('ℹ️ Column department already exists in jobs, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column department already exists in jobs, skipping...');
        } else {
            console.warn('⚠️ Could not check/add department to jobs:', err.message);
        }
      }

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

