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


    await queryInterface.addColumn('jobs', 'role', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('jobs', 'industrytype', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('jobs', 'rolecategory', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('jobs', 'employmenttype', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('jobs', 'role');
    await queryInterface.removeColumn('jobs', 'industrytype');
    await queryInterface.removeColumn('jobs', 'rolecategory');
    await queryInterface.removeColumn('jobs', 'employmenttype');
  }
};
