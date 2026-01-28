'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add metadata column to resumes table
    await queryInterface.addColumn('resumes', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove metadata column from resumes table
    await queryInterface.removeColumn('resumes', 'metadata');
  }
};
