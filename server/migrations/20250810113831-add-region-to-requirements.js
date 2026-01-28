'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Adding region field to requirements table...');
      
      await queryInterface.addColumn('requirements', 'region', {
        type: Sequelize.ENUM('india', 'gulf', 'other'),
        allowNull: true,
        defaultValue: 'india'
      });
      
      console.log('✅ Successfully added region field to requirements table');
    } catch (error) {
      console.error('❌ Error adding region field to requirements table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Removing region field from requirements table...');
      
      await queryInterface.removeColumn('requirements', 'region');
      
      console.log('✅ Successfully removed region field from requirements table');
    } catch (error) {
      console.error('❌ Error removing region field from requirements table:', error);
      throw error;
    }
  }
};
