'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('users')) {
      console.log('ℹ️  Skipping migration (users not created yet)');
      return;
    }


    await queryInterface.addColumn('users', 'session_version', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false
    });
    console.log('✅ Added session_version column to users table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'session_version');
    console.log('✅ Removed session_version column from users table');
  }
};

