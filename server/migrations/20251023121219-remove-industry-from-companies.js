'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove the industry column from companies table
    await queryInterface.removeColumn('companies', 'industry');
  },

  async down (queryInterface, Sequelize) {
    // Add back the industry column if migration needs to be reverted
    await queryInterface.addColumn('companies', 'industry', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Other'
    });
  }
};
