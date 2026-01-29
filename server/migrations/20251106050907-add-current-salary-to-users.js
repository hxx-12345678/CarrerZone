'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('users');

    if (!tableDescription.current_salary) {
      await queryInterface.addColumn('users', 'current_salary', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
      console.log('✅ Added current_salary column to users table');
    } else {
      console.log('ℹ️  current_salary column already exists in users table');
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if column exists before removing
    const tableDescription = await queryInterface.describeTable('users');

    if (tableDescription.current_salary) {
      await queryInterface.removeColumn('users', 'current_salary');
      console.log('✅ Removed current_salary column from users table');
    }
  }
};


