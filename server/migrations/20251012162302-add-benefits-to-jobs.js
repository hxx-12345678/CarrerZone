'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: skip if dependent tables don't exist yet
    const tables = await queryInterface.showAllTables();
    const normalized = Array.isArray(tables)
      ? tables.map((t) => (typeof t === 'string' ? t : t.tableName || t)).map((n) => String(n).toLowerCase())
      : [];
    
    if (!normalized.includes('jobs')) {
      console.log('ℹ️  Skipping migration (jobs not created yet)');
      return;
    }


    const [exists] = await queryInterface.sequelize.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'benefits' LIMIT 1`
    );
    if (!(exists && exists.length > 0)) {
      await queryInterface.addColumn('jobs', 'benefits', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Job benefits and perks'
      });
    } else {
      console.log('ℹ️  jobs.benefits already exists, skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jobs', 'benefits');
  }
};
