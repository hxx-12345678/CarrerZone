'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add metadata column to resumes table
    
      try {
        const tableInfo = await queryInterface.describeTable('resumes');
        if (!tableInfo['metadata']) {
          await queryInterface.addColumn('resumes', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });
          console.log('✅ Added metadata to resumes');
        } else {
          console.log('ℹ️ Column metadata already exists in resumes, skipping...');
        }
      } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('ℹ️ Column metadata already exists in resumes, skipping...');
        } else {
            console.warn('⚠️ Could not check/add metadata to resumes:', err.message);
        }
      }

  },

  down: async (queryInterface, Sequelize) => {
    // Remove metadata column from resumes table
    await queryInterface.removeColumn('resumes', 'metadata');
  }
};
