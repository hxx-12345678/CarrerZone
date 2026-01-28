'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('jobs')) {
      console.log('ℹ️  Skipping migration (jobs not created yet)');
      return;
    }


    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (!tableDescription.salary) {
      await queryInterface.addColumn('jobs', 'salary', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Salary range as entered by user (e.g., "₹8-15 LPA")'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('jobs', 'salary');
  }
};
