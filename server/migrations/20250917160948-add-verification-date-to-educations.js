'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('educations')) {
      console.log('ℹ️  Skipping migration (educations not created yet)');
      return;
    }

    const table = await queryInterface.describeTable('educations');
    if (!table.verification_date) {
      await queryInterface.addColumn('educations', 'verification_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('educations');
    if (table.verification_date) {
      await queryInterface.removeColumn('educations', 'verification_date');
    }
  }
};
